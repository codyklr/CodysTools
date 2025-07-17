export class ModManager {
    constructor() {
        this.mods = {};
        this.loadMods();
    }

    async initialize() {
        await this.loadMods();
        await this.injectEnabledMods();
    }

    async loadMods() {
        try {
            const result = await chrome.storage.local.get(['mods']);
            this.mods = result.mods || {};
        } catch (error) {
            console.error('Failed to load mods:', error);
            this.mods = {};
        }
    }

    async saveMods() {
        try {
            await chrome.storage.local.set({ mods: this.mods });
        } catch (error) {
            console.error('Failed to save mods:', error);
        }
    }

    async installModFromGitHub(owner, repo, branch = 'main') {
        try {
            // Fetch mod.json from GitHub
            const modUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/mod.json`;
            const response = await fetch(modUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch mod.json: ${response.statusText}`);
            }

            const modConfig = await response.json();
            
            // Validate mod configuration
            if (!this.validateModConfig(modConfig)) {
                throw new Error('Invalid mod configuration');
            }

            // Generate unique mod ID
            const modId = `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            const mod = {
                id: modId,
                name: modConfig.name,
                description: modConfig.description,
                category: modConfig.category || 'uncategorized',
                version: modConfig.version,
                enabled: false,
                github: { owner, repo, branch },
                installedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            // Download mod files
            await this.downloadModFiles(mod, owner, repo, branch);
            
            this.mods[modId] = mod;
            await this.saveMods();
            
            return { success: true, mod };
        } catch (error) {
            console.error('Failed to install mod:', error);
            return { success: false, error: error.message };
        }
    }

    async installModFromConfig(modConfig) {
        const modId = modConfig.id;
        this.mods[modId] = modConfig;
        await this.saveMods();
        return { success: true, mod: modConfig };
    }

    async updateMod(modId) {
        try {
            const mod = this.mods[modId];
            if (!mod) {
                throw new Error('Mod not found');
            }

            const { owner, repo, branch } = mod.github;
            
            // Fetch latest mod.json
            const modUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/mod.json`;
            const response = await fetch(modUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch updated mod.json: ${response.statusText}`);
            }

            const updatedConfig = await response.json();
            
            // Update mod files
            await this.downloadModFiles(mod, owner, repo, branch);
            
            // Update mod metadata
            this.mods[modId] = {
                ...this.mods[modId],
                ...updatedConfig,
                lastUpdated: new Date().toISOString()
            };
            
            await this.saveMods();
            
            // Re-inject if enabled
            if (this.mods[modId].enabled) {
                await this.injectMod(this.mods[modId]);
            }
            
            return { success: true, mod: this.mods[modId] };
        } catch (error) {
            console.error('Failed to update mod:', error);
            return { success: false, error: error.message };
        }
    }

    async downloadModFiles(mod, owner, repo, branch) {
        const files = ['content.js', 'content.css', 'settings.html', 'settings.js'];
        
        for (const file of files) {
            try {
                const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
                const response = await fetch(fileUrl);
                
                if (response.ok) {
                    const content = await response.text();
                    
                    // Store file content in storage
                    const fileKey = `mod_${mod.id}_${file}`;
                    await chrome.storage.local.set({ [fileKey]: content });
                }
            } catch (error) {
                console.warn(`Failed to download ${file} for mod ${mod.id}:`, error);
            }
        }
    }

    validateModConfig(config) {
        return (
            config &&
            typeof config.name === 'string' &&
            typeof config.version === 'string' &&
            Array.isArray(config.matches) &&
            typeof config.contentScript === 'string'
        );
    }

    async toggleMod(modId, enabled) {
        const mod = this.mods[modId];
        if (!mod) return;

        mod.enabled = enabled;
        await this.saveMods();

        if (enabled) {
            await this.injectMod(mod);
        } else {
            await this.removeMod(mod);
        }
    }

    async injectEnabledMods() {
        for (const mod of Object.values(this.mods)) {
            if (mod.enabled) {
                await this.injectMod(mod);
            }
        }
    }

    async injectMod(mod) {
        try {
            // Get mod files from storage
            const contentKey = `mod_${mod.id}_content.js`;
            const cssKey = `mod_${mod.id}_content.css`;
            
            const result = await chrome.storage.local.get([contentKey, cssKey]);
            
            if (result[contentKey]) {
                // Register content script
                await chrome.scripting.registerContentScript({
                    id: `mod_${mod.id}`,
                    matches: mod.matches || ['<all_urls>'],
                    js: [{ file: `data:text/javascript,${encodeURIComponent(result[contentKey])}` }],
                    css: result[cssKey] ? [{ file: `data:text/css,${encodeURIComponent(result[cssKey])}` }] : [],
                    runAt: 'document_end'
                });
            }
        } catch (error) {
            console.error(`Failed to inject mod ${mod.id}:`, error);
        }
    }

    async removeMod(mod) {
        try {
            await chrome.scripting.unregisterContentScript(`mod_${mod.id}`);
        } catch (error) {
            console.error(`Failed to remove mod ${mod.id}:`, error);
        }
    }

    getMod(modId) {
        return this.mods[modId];
    }

    getAllMods() {
        return Object.values(this.mods);
    }

    getEnabledMods() {
        return Object.values(this.mods).filter(mod => mod.enabled);
    }
}
