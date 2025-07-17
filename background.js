// Background service worker for CodysTools
class ModManager {
  constructor() {
    this.initializeExtension();
  }

  async initializeExtension() {
    // Initialize default mods on first install
    const { initialized } = await chrome.storage.local.get('initialized');
    if (!initialized) {
      await this.loadDefaultMods();
      await chrome.storage.local.set({ initialized: true });
    }

    // Check for mod updates periodically
    this.scheduleUpdateChecks();
  }

  async loadDefaultMods() {
    const defaultMods = [
      {
        id: 'example-mod',
        name: 'Example Mod',
        description: 'A sample mod to demonstrate functionality',
        version: '1.0.0',
        category: 'Utility',
        enabled: false,
        isDefault: true,
        targetSites: ['*'],
        author: 'CodysTools',
        repository: 'codyklr/CodysTools',
        branch: 'main',
        lastUpdated: Date.now(),
        css: `/* Example Mod CSS */
.codystools-example-banner {
  position: fixed;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 300px;
}

.codystools-example-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.codystools-example-banner .close-btn {
  float: right;
  margin-left: 10px;
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.codystools-example-banner .close-btn:hover {
  opacity: 1;
}

.codystools-example-content {
  margin-right: 20px;
}

.codystools-example-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.codystools-example-text {
  opacity: 0.9;
  font-size: 12px;
}

@keyframes codystools-fadeIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes codystools-fadeOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
}

.codystools-fade-in { animation: codystools-fadeIn 300ms ease; }
.codystools-fade-out { animation: codystools-fadeOut 300ms ease; }`,
        js: `// Example Mod JavaScript
(async function() {
  'use strict';
  
  console.log('CodysTools Example Mod: Initializing...');
  
  function createBanner() {
    const banner = document.createElement('div');
    banner.className = 'codystools-example-banner codystools-fade-in';
    banner.id = 'codystools-example-banner';
    
    banner.innerHTML = \`
      <div class="codystools-example-content">
        <div class="codystools-example-title">CodysTools Example Mod</div>
        <div class="codystools-example-text">Hello from CodysTools!</div>
      </div>
      <button class="close-btn" title="Close">&times;</button>
    \`;
    
    return banner;
  }
  
  function showBanner() {
    const existing = document.getElementById('codystools-example-banner');
    if (existing) existing.remove();
    
    const banner = createBanner();
    document.body.appendChild(banner);
    
    banner.querySelector('.close-btn').addEventListener('click', () => {
      banner.classList.add('codystools-fade-out');
      setTimeout(() => banner.remove(), 300);
    });
    
    setTimeout(() => {
      if (document.getElementById('codystools-example-banner')) {
        banner.classList.add('codystools-fade-out');
        setTimeout(() => banner.remove(), 300);
      }
    }, 5000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    setTimeout(showBanner, 1000);
  }
  
})();`
      }
    ];

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
  }
});

// Handle tab updates to inject mods
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await injectActiveMods(tabId, tab.url);
  }
});

async function injectActiveMods(tabId, url) {
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
