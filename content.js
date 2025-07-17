// Content script for CodysTools
// This script runs on all pages and handles mod injection coordination

class CodysToolsContent {
  constructor() {
    this.injectedMods = new Set();
    this.initialize();
  }

  async initialize() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Notify background that page is ready for mod injection
    this.notifyPageReady();
  }

  notifyPageReady() {
    chrome.runtime.sendMessage({
      action: 'pageReady',
      url: window.location.href
    });
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'injectMod':
        this.injectMod(request.mod);
        sendResponse({ success: true });
        break;
      
      case 'removeMod':
        this.removeMod(request.modId);
        sendResponse({ success: true });
        break;
    }
  }

  injectMod(mod) {
    if (this.injectedMods.has(mod.id)) {
      return; // Already injected
    }

    try {
      // Inject CSS
      if (mod.css) {
        this.injectCSS(mod.id, mod.css);
      }

      // Inject JavaScript
      if (mod.js) {
        this.injectJS(mod.id, mod.js, mod);
      }

      this.injectedMods.add(mod.id);
      console.log(`CodysTools: Injected mod ${mod.name}`);
    } catch (error) {
      console.error(`CodysTools: Failed to inject mod ${mod.name}:`, error);
    }
  }

  injectCSS(modId, css) {
    const styleId = `codystools-mod-${modId}`;
    
    // Remove existing style if present
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject new style
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  injectJS(modId, js, modConfig) {
    try {
      // Create isolated execution context
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          const mod = {
            id: '${modId}',
            config: ${JSON.stringify(modConfig)},
            storage: {
              get: async (key) => {
                return new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    action: 'getStorage',
                    key: key
                  }, resolve);
                });
              },
              set: async (data) => {
                return new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    action: 'setStorage',
                    data: data
                  }, resolve);
                });
              }
            },
            utils: {
              waitForElement: (selector, timeout = 5000) => {
                return new Promise((resolve, reject) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    resolve(element);
                    return;
                  }

                  const observer = new MutationObserver((mutations, obs) => {
                    const element = document.querySelector(selector);
                    if (element) {
                      obs.disconnect();
                      resolve(element);
                    }
                  });

                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });

                  setTimeout(() => {
                    observer.disconnect();
                    reject(new Error('Element not found within timeout'));
                  }, timeout);
                });
              },
              addGlobalStyle: (css) => {
                const style = document.createElement('style');
                style.textContent = css;
                document.head.appendChild(style);
                return style;
              }
            }
          };

          try {
            ${js}
          } catch (error) {
            console.error('CodysTools mod execution error:', error);
          }
        })();
      `;
      
      document.head.appendChild(script);
      script.remove(); // Clean up
    } catch (error) {
      console.error(`Failed to inject JavaScript for mod ${modId}:`, error);
    }
  }

  removeMod(modId) {
    // Remove CSS
    const styleElement = document.getElementById(`codystools-mod-${modId}`);
    if (styleElement) {
      styleElement.remove();
    }

    // Note: JavaScript cannot be easily "removed" once executed
    // Mods should implement their own cleanup if needed
    
    this.injectedMods.delete(modId);
    console.log(`CodysTools: Removed mod ${modId}`);
  }
}

// Initialize content script
new CodysToolsContent();
