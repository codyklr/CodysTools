class PopupManager {
    constructor() {
        this.mods = [];
        this.filteredMods = [];
        this.currentCategory = 'all';
        this.init();
    }

    async init() {
        await this.loadMods();
        this.setupEventListeners();
        this.renderMods();
    }

    async loadMods() {
        try {
            const result = await chrome.storage.local.get(['mods', 'modMetadata']);
            this.mods = Object.values(result.mods || {});
            this.filteredMods = [...this.mods];
        } catch (error) {
            console.error('Failed to load mods:', error);
            this.mods = [];
            this.filteredMods = [];
        }
    }

    setupEventListeners() {
        // Add mod button
        document.getElementById('add-mod-btn').addEventListener('click', () => {
            document.getElementById('add-mod-modal').classList.remove('hidden');
        });

        // Close modal
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('add-mod-modal').classList.add('hidden');
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterMods(e.target.value);
        });

        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.filterMods();
            });
        });

        // Add mod form
        document.getElementById('add-mod-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.installMod();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('add-mod-modal');
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    filterMods(searchTerm = '') {
        this.filteredMods = this.mods.filter(mod => {
            const matchesSearch = !searchTerm || 
                mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mod.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = this.currentCategory === 'all' || 
                mod.category === this.currentCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderMods();
    }

    renderMods() {
        const container = document.getElementById('mods-list');
        container.innerHTML = '';

        if (this.filteredMods.length === 0) {
            container.innerHTML = '<div class="no-mods">No mods found</div>';
            return;
        }

        this.filteredMods.forEach(mod => {
            const modElement = this.createModElement(mod);
            container.appendChild(modElement);
        });
    }

    createModElement(mod) {
        const div = document.createElement('div');
        div.className = 'mod-item';
        div.innerHTML = `
            <div class="mod-header" data-mod-id="${mod.id}">
                <div class="mod-info">
                    <div class="mod-name">${mod.name}</div>
                    <span class="mod-category">${mod.category || 'Uncategorized'}</span>
                </div>
                <div class="mod-actions">
                    ${mod.hasUpdate ? '<button class="update-btn" data-mod-id="' + mod.id + '">Update</button>' : ''}
                    <label class="toggle-switch">
                        <input type="checkbox" ${mod.enabled ? 'checked' : ''} data-mod-id="${mod.id}">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <div class="mod-details">
                <div class="mod-description">${mod.description || 'No description available'}</div>
                <div class="mod-version">v${mod.version}</div>
            </div>
        `;

        // Toggle expansion
        div.querySelector('.mod-header').addEventListener('click', (e) => {
            if (!e.target.classList.contains('toggle-switch') && 
                !e.target.classList.contains('update-btn')) {
                const details = div.querySelector('.mod-details');
                details.classList.toggle('expanded');
            }
        });

        // Toggle enable/disable
        div.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
            const modId = e.target.dataset.modId;
            await this.toggleMod(modId, e.target.checked);
        });

        // Update button
        const updateBtn = div.querySelector('.update-btn');
        if (updateBtn) {
            updateBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.updateMod(mod.id);
            });
        }

        return div;
    }

    async toggleMod(modId, enabled) {
        try {
            const result = await chrome.storage.local.get(['mods']);
            const mods = result.mods || {};
            
            if (mods[modId]) {
                mods[modId].enabled = enabled;
                await chrome.storage.local.set({ mods });
                
                // Notify background script
                chrome.runtime.sendMessage({
                    action: 'toggleMod',
                    modId,
                    enabled
                });
            }
        } catch (error) {
            console.error('Failed to toggle mod:', error);
        }
    }

    async installMod() {
        const form = document.getElementById('add-mod-form');
        const repoUrl = document.getElementById('repo-url').value;
        const branch = document.getElementById('branch-name').value || 'main';
        const statusDiv = document.getElementById('install-status');

        try {
            statusDiv.textContent = 'Installing...';
            form.classList.add('loading');

            // Parse GitHub URL
            const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                throw new Error('Invalid GitHub URL');
            }

            const [, owner, repo] = match;
            const repoName = repo.replace(/\.git$/, '');

            // Send install request to background script
            const response = await chrome.runtime.sendMessage({
                action: 'installMod',
                owner,
                repo: repoName,
                branch
            });

            if (response.success) {
                statusDiv.textContent = 'Mod installed successfully!';
                setTimeout(() => {
                    document.getElementById('add-mod-modal').classList.add('hidden');
                    form.reset();
                    statusDiv.textContent = '';
                    form.classList.remove('loading');
                    this.loadMods();
                    this.renderMods();
                }, 1500);
            } else {
                throw new Error(response.error || 'Installation failed');
            }
        } catch (error) {
            statusDiv.textContent = `Error: ${error.message}`;
            form.classList.remove('loading');
        }
    }

    async updateMod(modId) {
        try {
            const result = await chrome.storage.local.get(['mods']);
            const mod = result.mods?.[modId];
            
            if (mod) {
                const response = await chrome.runtime.sendMessage({
                    action: 'updateMod',
                    modId
                });

                if (response.success) {
                    await this.loadMods();
                    this.renderMods();
                }
            }
        } catch (error) {
            console.error('Failed to update mod:', error);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
