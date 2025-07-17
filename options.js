// CodysTools Options Page JavaScript
class CodysToolsOptions {
  constructor() {
    this.settings = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSettings();
    await this.loadStats();
    this.updateUI();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Settings inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.id && input.id !== 'importFile') {
        input.addEventListener('change', () => this.handleSettingChange(input));
      }
    });

    // Action buttons
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
    document.getElementById('checkUpdatesNow').addEventListener('click', () => this.checkUpdatesNow());
    document.getElementById('updateAllMods').addEventListener('click', () => this.updateAllMods());
    document.getElementById('exportMods').addEventListener('click', () => this.exportMods());
    document.getElementById('importMods').addEventListener('click', () => this.importMods());
    document.getElementById('importFile').addEventListener('change', (e) => this.handleImportFile(e));
    document.getElementById('clearModData').addEventListener('click', () => this.clearModData());
    document.getElementById('openDevTools').addEventListener('click', () => this.openDevTools());
    document.getElementById('exportLogs').addEventListener('click', () => this.exportLogs());
    document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());
    document.getElementById('showAbout').addEventListener('click', () => this.showAbout());

    // Modal close
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      'settings',
      'enableExtension',
      'enableNotifications',
      'enableDebugMode',
      'maxConcurrentMods',
      'modLoadTimeout',
      'autoEnableNewMods',
      'enableModConflictDetection',
      'defaultModCategory',
      'autoCheckUpdates',
      'updateCheckInterval',
      'autoUpdateMods',
      'updateNotifications',
      'githubApiToken',
      'customModSources',
      'allowUnsafeMods'
    ]);

    // Set default values
    this.settings = {
      enableExtension: result.enableExtension !== false,
      enableNotifications: result.enableNotifications !== false,
      enableDebugMode: result.enableDebugMode || false,
      maxConcurrentMods: result.maxConcurrentMods || 10,
      modLoadTimeout: result.modLoadTimeout || 10,
      autoEnableNewMods: result.autoEnableNewMods || false,
      enableModConflictDetection: result.enableModConflictDetection !== false,
      defaultModCategory: result.defaultModCategory || 'Uncategorized',
      autoCheckUpdates: result.autoCheckUpdates !== false,
      updateCheckInterval: result.updateCheckInterval || 24,
      autoUpdateMods: result.autoUpdateMods || false,
      updateNotifications: result.updateNotifications !== false,
      githubApiToken: result.githubApiToken || '',
      customModSources: result.customModSources || '',
      allowUnsafeMods: result.allowUnsafeMods || false,
      ...result.settings
    };
  }

  async loadStats() {
    const result = await chrome.storage.local.get(['mods', 'lastUpdateCheck']);
    const mods = result.mods || [];
    
    // Update mod counts
    document.getElementById('totalModsCount').textContent = mods.length;
    document.getElementById('enabledModsCount').textContent = mods.filter(mod => mod.enabled).length;
    
    // Calculate storage usage
    const storageSize = JSON.stringify(result).length;
    const sizeKB = Math.round(storageSize / 1024 * 100) / 100;
    document.getElementById('storageUsed').textContent = `${sizeKB} KB`;
    
    // Update last check time
    if (result.lastUpdateCheck) {
      const lastCheck = new Date(result.lastUpdateCheck);
      document.getElementById('lastUpdateCheck').textContent = 
        `Last checked: ${lastCheck.toLocaleString()}`;
    }
  }

  updateUI() {
    // Update all form inputs with current settings
    Object.keys(this.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = this.settings[key];
        } else {
          element.value = this.settings[key];
        }
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabName);
    });
  }

  handleSettingChange(input) {
    const key = input.id;
    let value = input.value;

    if (input.type === 'checkbox') {
      value = input.checked;
    } else if (input.type === 'number') {
      value = parseInt(value, 10);
    }

    this.settings[key] = value;
    this.markAsUnsaved();
  }

  markAsUnsaved() {
    const saveBtn = document.getElementById('saveSettings');
    saveBtn.textContent = 'Save Settings*';
    saveBtn.classList.add('btn-warning');
    saveBtn.classList.remove('btn-primary');
  }

  markAsSaved() {
    const saveBtn = document.getElementById('saveSettings');
    saveBtn.textContent = 'Save Settings';
    saveBtn.classList.add('btn-primary');
    saveBtn.classList.remove('btn-warning');
  }

  async saveSettings() {
    const saveBtn = document.getElementById('saveSettings');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      // Save individual settings for backward compatibility
      const settingsToSave = {};
      Object.keys(this.settings).forEach(key => {
        settingsToSave[key] = this.settings[key];
      });

      await chrome.storage.local.set(settingsToSave);
      this.markAsSaved();
      this.showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings', 'error');
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  async checkUpdatesNow() {
    const btn = document.getElementById('checkUpdatesNow');
    const originalText = btn.textContent;
    btn.textContent = 'Checking...';
    btn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkUpdates' });
      if (response.error) {
        throw new Error(response.error);
      }

      await this.loadStats();
      this.showNotification('Update check completed', 'success');
    } catch (error) {
      console.error('Failed to check updates:', error);
      this.showNotification('Failed to check for updates', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  async updateAllMods() {
    const btn = document.getElementById('updateAllMods');
    const originalText = btn.textContent;
    btn.textContent = 'Updating...';
    btn.disabled = true;

    try {
      const result = await chrome.storage.local.get('mods');
      const mods = result.mods || [];
      const modsToUpdate = mods.filter(mod => mod.updateAvailable);

      if (modsToUpdate.length === 0) {
        this.showNotification('No updates available', 'info');
        return;
      }

      let updatedCount = 0;
      for (const mod of modsToUpdate) {
        try {
          await chrome.runtime.sendMessage({
            action: 'updateMod',
            modId: mod.id
          });
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update mod ${mod.id}:`, error);
        }
      }

      await this.loadStats();
      this.showNotification(`Updated ${updatedCount} of ${modsToUpdate.length} mods`, 'success');
    } catch (error) {
      console.error('Failed to update mods:', error);
      this.showNotification('Failed to update mods', 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  async exportMods() {
    try {
      const result = await chrome.storage.local.get(['mods', 'settings']);
      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        mods: result.mods || [],
        settings: this.settings
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codystools-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('Mods exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export mods:', error);
      this.showNotification('Failed to export mods', 'error');
    }
  }

  importMods() {
    document.getElementById('importFile').click();
  }

  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.mods || !Array.isArray(importData.mods)) {
        throw new Error('Invalid backup file format');
      }

      const confirmed = confirm(
        `This will replace your current ${importData.mods.length} mods. Continue?`
      );

      if (!confirmed) return;

      await chrome.storage.local.set({
        mods: importData.mods,
        settings: importData.settings || {}
      });

      if (importData.settings) {
        this.settings = { ...this.settings, ...importData.settings };
        this.updateUI();
      }

      await this.loadStats();
      this.showNotification('Mods imported successfully', 'success');
    } catch (error) {
      console.error('Failed to import mods:', error);
      this.showNotification('Failed to import mods: ' + error.message, 'error');
    }

    // Reset file input
    event.target.value = '';
  }

  async clearModData() {
    const confirmed = confirm(
      'This will permanently delete all mods and their settings. This action cannot be undone. Continue?'
    );

    if (!confirmed) return;

    const doubleConfirmed = confirm(
      'Are you absolutely sure? This will remove everything!'
    );

    if (!doubleConfirmed) return;

    try {
      await chrome.storage.local.clear();
      await this.loadStats();
      this.showNotification('All mod data cleared', 'success');
    } catch (error) {
      console.error('Failed to clear mod data:', error);
      this.showNotification('Failed to clear mod data', 'error');
    }
  }

  openDevTools() {
    // This will open the extension's background page in dev tools
    chrome.runtime.getBackgroundPage((backgroundPage) => {
      if (backgroundPage) {
        backgroundPage.console.log('CodysTools Developer Tools opened');
      }
    });
    
    this.showNotification('Check the browser console for extension logs', 'info');
  }

  async exportLogs() {
    try {
      // Get logs from storage if available
      const result = await chrome.storage.local.get('debugLogs');
      const logs = result.debugLogs || ['No debug logs available'];

      const logData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        logs: logs
      };

      const blob = new Blob([JSON.stringify(logData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codystools-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('Debug logs exported', 'success');
    } catch (error) {
      console.error('Failed to export logs:', error);
      this.showNotification('Failed to export logs', 'error');
    }
  }

  async resetSettings() {
    const confirmed = confirm(
      'This will reset all settings to their default values. Continue?'
    );

    if (!confirmed) return;

    try {
      // Reset to default settings
      this.settings = {
        enableExtension: true,
        enableNotifications: true,
        enableDebugMode: false,
        maxConcurrentMods: 10,
        modLoadTimeout: 10,
        autoEnableNewMods: false,
        enableModConflictDetection: true,
        defaultModCategory: 'Uncategorized',
        autoCheckUpdates: true,
        updateCheckInterval: 24,
        autoUpdateMods: false,
        updateNotifications: true,
        githubApiToken: '',
        customModSources: '',
        allowUnsafeMods: false
      };

      this.updateUI();
      this.markAsUnsaved();
      this.showNotification('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      this.showNotification('Failed to reset settings', 'error');
    }
  }

  showAbout() {
    document.getElementById('aboutModal').classList.add('show');
  }

  closeModal(modal) {
    modal.classList.remove('show');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CodysToolsOptions();
});
