// Example Mod JavaScript
(async function() {
  'use strict';
  
  // Get mod settings
  const settings = await mod.storage.get(`mod_${mod.id}_settings`) || {};
  const enableFeature = settings.enableFeature !== false;
  const customText = settings.customText || 'Hello from CodysTools!';
  const animationSpeed = settings.animationSpeed || 300;
  const theme = settings.theme || 'light';
  
  // Only run if feature is enabled
  if (!enableFeature) {
    console.log('CodysTools Example Mod: Feature disabled');
    return;
  }
  
  console.log('CodysTools Example Mod: Initializing...');
  
  // Set CSS custom property for animation speed
  document.documentElement.style.setProperty('--animation-speed', `${animationSpeed}ms`);
  
  // Create the banner element
  function createBanner() {
    const banner = document.createElement('div');
    banner.className = `codystools-example-banner theme-${theme} codystools-fade-in`;
    banner.id = 'codystools-example-banner';
    
    banner.innerHTML = `
      <div class="codystools-example-content">
        <div class="codystools-example-title">CodysTools Example Mod</div>
        <div class="codystools-example-text">${escapeHtml(customText)}</div>
      </div>
      <button class="close-btn" title="Close">&times;</button>
    `;
    
    return banner;
  }
  
  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Show banner
  function showBanner() {
    // Remove existing banner if present
    const existing = document.getElementById('codystools-example-banner');
    if (existing) {
      existing.remove();
    }
    
    const banner = createBanner();
    document.body.appendChild(banner);
    
    // Add event listeners
    const closeBtn = banner.querySelector('.close-btn');
    closeBtn.addEventListener('click', hideBanner);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (document.getElementById('codystools-example-banner')) {
        hideBanner();
      }
    }, 5000);
    
    console.log('CodysTools Example Mod: Banner displayed');
  }
  
  // Hide banner with animation
  function hideBanner() {
    const banner = document.getElementById('codystools-example-banner');
    if (banner) {
      banner.classList.remove('codystools-fade-in');
      banner.classList.add('codystools-fade-out');
      
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, animationSpeed);
    }
  }
  
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    // Page already loaded
    setTimeout(showBanner, 1000);
  }
  
  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      const settingsKey = `mod_${mod.id}_settings`;
      if (changes[settingsKey]) {
        console.log('CodysTools Example Mod: Settings changed, reloading...');
        // In a real implementation, you might want to update the banner
        // without reloading the entire page
        location.reload();
      }
    }
  });
  
  // Utility functions available to the mod
  const utils = {
    // Create a notification
    notify: function(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10001;
        animation: codystools-fadeIn ${animationSpeed}ms ease;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = `codystools-fadeOut ${animationSpeed}ms ease`;
        setTimeout(() => notification.remove(), animationSpeed);
      }, 3000);
    },
    
    // Wait for an element to appear
    waitForElement: async function(selector, timeout = 5000) {
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
    
    // Add global CSS
    addGlobalStyle: function(css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      return style;
    }
  };
  
  // Make utils available globally for this mod
  window.CodysToolsExampleUtils = utils;
  
  console.log('CodysTools Example Mod: Initialized successfully');
  
})();
