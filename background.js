// Background service worker for CodysTools
class ModManager {
  constructor() {
    this.initializeExtension();
  }

  async initializeExtension() {
    // Always check and merge default mods
    await this.mergeDefaultMods();

    // Check for mod updates periodically
    this.scheduleUpdateChecks();
  }

  async mergeDefaultMods() {
    const defaultMods = this.getDefaultMods();
    const { mods = [] } = await chrome.storage.local.get('mods');
    
    let modsUpdated = false;
    
    // Add any new default mods that don't exist
    for (const defaultMod of defaultMods) {
      const existingMod = mods.find(m => m.id === defaultMod.id);
      if (!existingMod) {
        mods.push(defaultMod);
        modsUpdated = true;
      } else if (existingMod.isDefault) {
        // Update existing default mods with new code/version but preserve enabled state
        const index = mods.findIndex(m => m.id === defaultMod.id);
        mods[index] = {
          ...defaultMod,
          enabled: existingMod.enabled
        };
        modsUpdated = true;
      }
    }
    
    if (modsUpdated) {
      await chrome.storage.local.set({ mods });
    }
  }

  getDefaultMods() {
    return [];
  }

  async loadDefaultMods() {
    const defaultMods = this.getDefaultMods();
    await chrome.storage.local.set({ mods: defaultMods });
  }

  async scheduleUpdateChecks() {
    // Check for updates every 24 hours
    setInterval(() => {
      this.checkForUpdates();
    }, 24 * 60 * 60 * 1000);

    // Also check on startup
    this.checkForUpdates();
  }

  async checkForUpdates() {
    const { mods } = await chrome.storage.local.get('mods');
    if (!mods) return;

    for (const mod of mods) {
      try {
        const latestVersion = await this.getLatestModVersion(mod);
        if (latestVersion && latestVersion !== mod.version) {
          mod.updateAvailable = latestVersion;
        }
      } catch (error) {
        console.error(`Failed to check updates for mod ${mod.id}:`, error);
      }
    }

    await chrome.storage.local.set({ mods });
  }

  async getLatestModVersion(mod) {
    const apiUrl = `https://api.github.com/repos/${mod.repository}/contents/mod.json?ref=${mod.branch}`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) return null;
      
      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      return content.version;
    } catch (error) {
      console.error('Error fetching mod version:', error);
      return null;
    }
  }

  async installModFromGitHub(repository, branch = 'main') {
    try {
      const modData = await this.fetchModData(repository, branch);
      if (!modData) throw new Error('Failed to fetch mod data');

      const { mods = [] } = await chrome.storage.local.get('mods');
      
      // Check if mod already exists
      const existingIndex = mods.findIndex(m => m.id === modData.id);
      if (existingIndex !== -1) {
        mods[existingIndex] = { ...modData, enabled: mods[existingIndex].enabled };
      } else {
        mods.push({ ...modData, enabled: false });
      }

      await chrome.storage.local.set({ mods });
      return modData;
    } catch (error) {
      console.error('Error installing mod:', error);
      throw error;
    }
  }

  async fetchModData(repository, branch) {
    const apiUrl = `https://api.github.com/repos/${repository}/contents/mod.json?ref=${branch}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Mod configuration not found');
    
    const data = await response.json();
    const modConfig = JSON.parse(atob(data.content));
    
    return {
      ...modConfig,
      repository,
      branch,
      isDefault: false,
      lastUpdated: Date.now()
    };
  }

  async updateMod(modId) {
    const { mods } = await chrome.storage.local.get('mods');
    const mod = mods.find(m => m.id === modId);
    
    if (!mod) throw new Error('Mod not found');

    const updatedMod = await this.fetchModData(mod.repository, mod.branch);
    const modIndex = mods.findIndex(m => m.id === modId);
    
    mods[modIndex] = {
      ...updatedMod,
      enabled: mod.enabled,
      repository: mod.repository,
      branch: mod.branch,
      isDefault: mod.isDefault
    };

    await chrome.storage.local.set({ mods });
    return mods[modIndex];
  }

  async deleteMod(modId) {
    const { mods } = await chrome.storage.local.get('mods');
    
    // Don't allow deletion of default mods
    const mod = mods.find(m => m.id === modId);
    if (!mod) throw new Error('Mod not found');
    if (mod.isDefault) throw new Error('Cannot delete default mods');
    
    // Remove the mod from the list
    const updatedMods = mods.filter(m => m.id !== modId);
    
    await chrome.storage.local.set({ mods: updatedMods });
    
    // Also remove any stored settings for this mod
    await chrome.storage.local.remove(`mod_${modId}_settings`);
    
    return { success: true };
  }
}

// Initialize mod manager
const modManager = new ModManager();

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'installMod':
      modManager.installModFromGitHub(request.repository, request.branch)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'updateMod':
      modManager.updateMod(request.modId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'checkUpdates':
      modManager.checkForUpdates()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'deleteMod':
      modManager.deleteMod(request.modId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'resetDefaultMods':
      modManager.loadDefaultMods()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'mergeDefaultMods':
      modManager.mergeDefaultMods()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});

// Handle tab updates to inject mods
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await injectActiveMods(tabId, tab.url);
  }
});

async function injectActiveMods(tabId, url) {
  // Skip injection for chrome:// and chrome-extension:// URLs
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return;
  }

  const { mods = [] } = await chrome.storage.local.get('mods');
  const activeMods = mods.filter(mod => mod.enabled && shouldInjectMod(mod, url));

  for (const mod of activeMods) {
    try {
      await injectMod(tabId, mod);
    } catch (error) {
      console.error(`Failed to inject mod ${mod.id}:`, error);
    }
  }
}

function shouldInjectMod(mod, url) {
  if (!mod.targetSites || mod.targetSites.includes('*')) return true;
  
  return mod.targetSites.some(pattern => {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    }
    return url.includes(pattern);
  });
}

async function injectMod(tabId, mod) {
  // Inject CSS if available
  if (mod.css) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: mod.css
    });
  }

  // Inject JavaScript if available
  if (mod.js) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (modJs, modConfig) => {
        try {
          // Create isolated scope for mod execution
          const modScope = {
            config: modConfig,
            storage: {
              get: (key) => chrome.storage.local.get(key),
              set: (data) => chrome.storage.local.set(data)
            }
          };
          
          // Execute mod JavaScript
          eval(`(function(mod) { ${modJs} })`)(modScope);
        } catch (error) {
          console.error('Mod execution error:', error);
        }
      },
      args: [mod.js, mod]
    });
  }
}
