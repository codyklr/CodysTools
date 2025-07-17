// CodysTools Popup JavaScript
class CodysToolsPopup {
  constructor() {
    this.mods = [];
    this.filteredMods = [];
    this.categories = new Set();
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadMods();
    this.renderMods();
    this.updateStats();
  }

  setupEventListeners() {
    // Header buttons
    document.getElementById('addModBtn').addEventListener('click', () => this.showAddModModal());
    document.getElementById('refreshBtn').addEventListener('click', () => this.checkForUpdates());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', (e) => this.filterMods());
    document.getElementById('categoryFilter').addEventListener('change', () => this.filterMods());
    document.getElementById('statusFilter').addEventListener('change', () => this.filterMods());

    // Add mod modal
    document.getElementById('addModForm').addEventListener('submit', (e) => this.handleAddMod(e));
    document.getElementById('cancelAddMod').addEventListener('click', () => this.hideAddModModal());

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  async loadMods() {
    try {
      const result = await chrome.storage.local.get('mods');
      this.mods = result.mods || [];
      this.updateCategories();
      this.filteredMods = [...this.mods];
    } catch (error) {
      console.error('Failed to load mods:', error);
      this.showError('Failed to load mods');
    }
  }

  updateCategories() {
    this.categories.clear();
    this.mods.forEach(mod => {
      const category = mod.category || 'Uncategorized';
      this.categories.add(category);
    });

    const categoryFilter = document.getElementById('categoryFilter');
    const currentValue = categoryFilter.value;
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Add category options
    Array.from(this.categories).sort().forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    // Restore previous selection
    categoryFilter.value = currentValue;
  }

  filterMods() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    this.filteredMods = this.mods.filter(mod => {
      // Search filter
      const matchesSearch = !searchTerm || 
        mod.name.toLowerCase().includes(searchTerm) ||
        mod.description.toLowerCase().includes(searchTerm) ||
        mod.author.toLowerCase().includes(searchTerm);

      // Category filter
      const modCategory = mod.category || 'Uncategorized';
      const matchesCategory = !categoryFilter || modCategory === categoryFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'enabled') {
        matchesStatus = mod.enabled;
      } else if (statusFilter === 'disabled') {
        matchesStatus = !mod.enabled;
      } else if (statusFilter === 'updates') {
        matchesStatus = !!mod.updateAvailable;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.renderMods();
    this.updateStats();
  }

  renderMods() {
    const modsList = document.getElementById('modsList');
    
    if (this.filteredMods.length === 0) {
      modsList.innerHTML = this.getEmptyState();
      return;
    }

    modsList.innerHTML = this.filteredMods.map(mod => this.createModElement(mod)).join('');
    this.attachModEventListeners();
  }

  createModElement(mod) {
    const category = mod.category || 'Uncategorized';
    const updateBadge = mod.updateAvailable ? 
      `<span class="update-badge">Update Available</span>` : '';

    return `
      <div class="mod-item" data-mod-id="${mod.id}">
        <div class="mod-header">
          <div class="mod-info">
            <div class="mod-name">${this.escapeHtml(mod.name)}${updateBadge}</div>
            <div class="mod-description">${this.escapeHtml(mod.description)}</div>
            <div class="mod-meta">
              <span class="mod-category">${this.escapeHtml(category)}</span>
              <span class="mod-version">v${this.escapeHtml(mod.version)}</span>
              ${mod.isDefault ? '<span class="mod-version">• Default</span>' : ''}
            </div>
          </div>
          <div class="mod-actions">
            ${mod.updateAvailable ? 
              `<button class="btn btn-warning btn-sm update-btn" data-mod-id="${mod.id}">Update</button>` : 
              ''
            }
            <div class="toggle-switch ${mod.enabled ? 'active' : ''}" data-mod-id="${mod.id}"></div>
          </div>
        </div>
        <div class="mod-details" id="details-${mod.id}">
          <div class="mod-details-content">
            ${this.createModDetailsContent(mod)}
          </div>
        </div>
      </div>
    `;
  }

  createModDetailsContent(mod) {
    let content = `
      <div class="mod-setting">
        <label>Description</label>
        <p>${this.escapeHtml(mod.description)}</p>
      </div>
      <div class="mod-setting">
        <label>Author</label>
        <p>${this.escapeHtml(mod.author)}</p>
      </div>
      <div class="mod-setting">
        <label>Version</label>
        <p>${this.escapeHtml(mod.version)}</p>
      </div>
      <div class="mod-setting">
        <label>Repository</label>
        <p>${this.escapeHtml(mod.repository)}</p>
      </div>
    `;

    // Add target sites
    if (mod.targetSites && mod.targetSites.length > 0) {
      content += `
        <div class="mod-setting">
          <label>Target Sites</label>
          <p>${mod.targetSites.map(site => this.escapeHtml(site)).join(', ')}</p>
        </div>
      `;
    }

    // Add custom settings if available
    if (mod.settings && mod.settings.length > 0) {
      content += '<div class="mod-setting"><label>Settings</label></div>';
      mod.settings.forEach(setting => {
        content += this.createSettingElement(mod.id, setting);
      });
    }

    return content;
  }

  createSettingElement(modId, setting) {
    const settingId = `${modId}-${setting.key}`;
    const value = this.getModSetting(modId, setting.key, setting.default);

    switch (setting.type) {
      case 'text':
        return `
          <div class="mod-setting">
            <label for="${settingId}">${this.escapeHtml(setting.label)}</label>
            <input type="text" id="${settingId}" value="${this.escapeHtml(value)}" 
                   data-mod-id="${modId}" data-setting-key="${setting.key}">
          </div>
        `;
      case 'number':
        return `
          <div class="mod-setting">
            <label for="${settingId}">${this.escapeHtml(setting.label)}</label>
            <input type="number" id="${settingId}" value="${value}" 
                   data-mod-id="${modId}" data-setting-key="${setting.key}"
                   ${setting.min !== undefined ? `min="${setting.min}"` : ''}
                   ${setting.max !== undefined ? `max="${setting.max}"` : ''}>
          </div>
        `;
      case 'boolean':
        return `
          <div class="mod-setting">
            <label>
              <input type="checkbox" id="${settingId}" ${value ? 'checked' : ''}
                     data-mod-id="${modId}" data-setting-key="${setting.key}">
              ${this.escapeHtml(setting.label)}
            </label>
          </div>
        `;
      case 'select':
        const options = setting.options.map(opt => 
          `<option value="${this.escapeHtml(opt.value)}" ${opt.value === value ? 'selected' : ''}>
            ${this.escapeHtml(opt.label)}
          </option>`
        ).join('');
        return `
          <div class="mod-setting">
            <label for="${settingId}">${this.escapeHtml(setting.label)}</label>
            <select id="${settingId}" data-mod-id="${modId}" data-setting-key="${setting.key}">
              ${options}
            </select>
          </div>
        `;
      default:
        return '';
    }
  }

  attachModEventListeners() {
    // Toggle switches
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const modId = toggle.dataset.modId;
        this.toggleMod(modId);
      });
    });

    // Update buttons
    document.querySelectorAll('.update-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modId = btn.dataset.modId;
        this.updateMod(modId);
      });
    });

    // Mod headers (expand/collapse)
    document.querySelectorAll('.mod-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.mod-actions')) return;
        const modItem = header.closest('.mod-item');
        const modId = modItem.dataset.modId;
        this.toggleModDetails(modId);
      });
    });

    // Setting inputs
    document.querySelectorAll('[data-setting-key]').forEach(input => {
      input.addEventListener('change', (e) => {
        const modId = input.dataset.modId;
        const settingKey = input.dataset.settingKey;
        let value = input.value;
        
        if (input.type === 'checkbox') {
          value = input.checked;
        } else if (input.type === 'number') {
          value = parseFloat(value);
        }
        
        this.saveModSetting(modId, settingKey, value);
      });
    });
  }

  getEmptyState() {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="m12 1 1.68 3.36L17 6.64l-1.32 3.68L19 12l-3.32 1.68L14.36 17l-3.68-1.32L12 19l-1.68-3.32L7 14.36l1.32-3.68L5 12l3.32-1.68L9.64 7l3.68 1.32L12 1z"></path>
        </svg>
        <h3>No mods found</h3>
        <p>Try adjusting your search or filters, or add a new mod to get started.</p>
        <button class="btn btn-primary" onclick="document.getElementById('addModBtn').click()">
          Add Your First Mod
        </button>
      </div>
    `;
  }

  async toggleMod(modId) {
    const mod = this.mods.find(m => m.id === modId);
    if (!mod) return;

    mod.enabled = !mod.enabled;
    await this.saveMods();
    
    // Update UI
    const toggle = document.querySelector(`.toggle-switch[data-mod-id="${modId}"]`);
    toggle.classList.toggle('active', mod.enabled);
    
    this.updateStats();
  }

  async updateMod(modId) {
    const btn = document.querySelector(`.update-btn[data-mod-id="${modId}"]`);
    const originalText = btn.textContent;
    btn.textContent = 'Updating...';
    btn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'updateMod',
        modId: modId
      });

      if (response.error) {
        throw new Error(response.error);
      }

      await this.loadMods();
      this.renderMods();
      this.showSuccess('Mod updated successfully');
    } catch (error) {
      console.error('Failed to update mod:', error);
      this.showError('Failed to update mod: ' + error.message);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  toggleModDetails(modId) {
    const details = document.getElementById(`details-${modId}`);
    details.classList.toggle('expanded');
  }

  async checkForUpdates() {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;

    try {
      await chrome.runtime.sendMessage({ action: 'checkUpdates' });
      await this.loadMods();
      this.renderMods();
      this.showSuccess('Update check completed');
    } catch (error) {
      console.error('Failed to check for updates:', error);
      this.showError('Failed to check for updates');
    } finally {
      btn.disabled = false;
    }
  }

  showAddModModal() {
    document.getElementById('addModModal').classList.add('show');
  }

  hideAddModModal() {
    document.getElementById('addModModal').classList.remove('show');
    document.getElementById('addModForm').reset();
  }

  async handleAddMod(e) {
    e.preventDefault();
    
    const repository = document.getElementById('repositoryInput').value.trim();
    const branch = document.getElementById('branchInput').value.trim() || 'main';
    
    if (!repository) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Installing...';
    submitBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'installMod',
        repository: repository,
        branch: branch
      });

      if (response.error) {
        throw new Error(response.error);
      }

      await this.loadMods();
      this.renderMods();
      this.updateStats();
      this.hideAddModModal();
      this.showSuccess('Mod installed successfully');
    } catch (error) {
      console.error('Failed to install mod:', error);
      this.showError('Failed to install mod: ' + error.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  closeModal(modal) {
    modal.classList.remove('show');
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  async saveMods() {
    await chrome.storage.local.set({ mods: this.mods });
  }

  async getModSetting(modId, key, defaultValue) {
    const result = await chrome.storage.local.get(`mod_${modId}_settings`);
    const settings = result[`mod_${modId}_settings`] || {};
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  async saveModSetting(modId, key, value) {
    const storageKey = `mod_${modId}_settings`;
    const result = await chrome.storage.local.get(storageKey);
    const settings = result[storageKey] || {};
    settings[key] = value;
    await chrome.storage.local.set({ [storageKey]: settings });
  }

  updateStats() {
    const totalMods = this.mods.length;
    const enabledMods = this.mods.filter(mod => mod.enabled).length;
    
    document.getElementById('modsCount').textContent = `${totalMods} mod${totalMods !== 1 ? 's' : ''}`;
    document.getElementById('enabledCount').textContent = `${enabledMods} enabled`;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Simple notification system - could be enhanced
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // You could implement a toast notification system here
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CodysToolsPopup();
});
