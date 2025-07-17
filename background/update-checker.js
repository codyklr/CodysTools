export class UpdateChecker {
    constructor() {
        this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    }

    async checkAllUpdates() {
        try {
            const result = await chrome.storage.local.get(['mods']);
            const mods = result.mods || {};
            
            const updates = [];
            
            for (const [modId, mod] of Object.entries(mods)) {
                if (mod.github) {
                    const hasUpdate = await this.checkModUpdate(mod);
                    if (hasUpdate.updateAvailable) {
                        mods[modId].hasUpdate = true;
                        updates.push({
                            modId,
                            name: mod.name,
                            currentVersion: mod.version,
                            newVersion: hasUpdate.latestVersion
                        });
                    }
                }
            }

            await chrome.storage.local.set({ mods });
            return updates;
        } catch (error) {
            console.error('Failed to check updates:', error);
            return [];
        }
    }

    async checkModUpdate(mod) {
        try {
            const { owner, repo, branch } = mod.github;
            const modUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/mod.json`;
            
            const response = await fetch(modUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch mod.json: ${response.statusText}`);
            }

            const latestConfig = await response.json();
            
            return {
                updateAvailable: this.compareVersions(latestConfig.version, mod.version) > 0,
                latestVersion: latestConfig.version
            };
        } catch (error) {
            console.error(`Failed to check update for mod ${mod.id}:`, error);
            return { updateAvailable: false };
        }
    }

    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }

    async getUpdateNotification() {
        const updates = await this.checkAllUpdates();
        if (updates.length > 0) {
            return {
                title: 'Mod Updates Available',
                message: `${updates.length} mod${updates.length > 1 ? 's' : ''} have updates available`
            };
        }
        return null;
    }
}
