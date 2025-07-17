# CodysTools Mod Development Guide

This guide explains how to create mods for the CodysTools Chrome Extension. It is designed to be LLM-friendly with clear structure and examples.

## Table of Contents
1. [Mod Structure Overview](#mod-structure-overview)
2. [Required Files](#required-files)
3. [mod.json Configuration](#modjson-configuration)
4. [CSS Injection](#css-injection)
5. [JavaScript Injection](#javascript-injection)
6. [Settings System](#settings-system)
7. [Target Sites](#target-sites)
8. [Publishing Your Mod](#publishing-your-mod)
9. [Complete Examples](#complete-examples)
10. [Best Practices](#best-practices)

## Mod Structure Overview

A CodysTools mod consists of a `mod.json` configuration file that defines metadata, settings, and code to inject. The mod can include inline CSS/JS or reference external files.

### Basic Mod Structure
```
your-mod-repository/
├── mod.json          # Required: Mod configuration
├── style.css         # Optional: External CSS file
├── script.js         # Optional: External JavaScript file
└── README.md         # Optional: Documentation
```

## Required Files

### mod.json
The only required file. Must be in the root of your repository.

## mod.json Configuration

### Minimal mod.json
```json
{
  "id": "my-mod",
  "name": "My Mod",
  "description": "A simple mod",
  "version": "1.0.0",
  "author": "Your Name"
}
```

### Complete mod.json with All Options
```json
{
  "id": "unique-mod-id",
  "name": "Display Name",
  "description": "Brief description of what the mod does",
  "version": "1.0.0",
  "author": "Author Name",
  "category": "Productivity",
  "targetSites": ["*"],
  "css": "/* Inline CSS */\nbody { background: #f0f0f0; }",
  "js": "// Inline JavaScript\nconsole.log('Mod loaded!');",
  "settings": [
    {
      "key": "setting-key",
      "label": "Setting Label",
      "type": "text",
      "default": "default value"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the mod (lowercase, hyphens) |
| `name` | string | Yes | Display name shown in the extension |
| `description` | string | Yes | Brief description of the mod's functionality |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `author` | string | Yes | Mod author's name |
| `category` | string | No | Category for organization (defaults to "Uncategorized") |
| `targetSites` | array | No | URL patterns where mod should run (defaults to ["*"]) |
| `css` | string | No | Inline CSS code to inject |
| `js` | string | No | Inline JavaScript code to inject |
| `settings` | array | No | Configurable settings for the mod |

## CSS Injection

### Inline CSS
```json
{
  "css": "/* Your CSS */\n.my-class { color: red; }\n#my-id { display: none; }"
}
```

### External CSS File
If you prefer external files, include the CSS content in the `css` field:
```json
{
  "css": "/* Contents of style.css */"
}
```

### CSS Best Practices
- Use unique class names to avoid conflicts
- Prefix classes with your mod ID: `.my-mod-button`
- Use `!important` sparingly
- Consider CSS custom properties for theming

## JavaScript Injection

### Inline JavaScript
```json
{
  "js": "// Your JavaScript\n(function() {\n  'use strict';\n  console.log('Mod initialized');\n})();"
}
```

### JavaScript Environment
Your JavaScript runs in the context of the web page with access to:
- DOM APIs
- `window` object
- Page's JavaScript context

### Accessing Mod Configuration
```javascript
// The mod object is available in the execution context
console.log('Mod ID:', mod.config.id);
console.log('Mod Version:', mod.config.version);
```

### Storage Access
```javascript
// Read storage
mod.storage.get('key').then(result => {
  console.log('Stored value:', result.key);
});

// Write storage
mod.storage.set({ key: 'value' }).then(() => {
  console.log('Value saved');
});
```

## Settings System

### Setting Types

#### Text Setting
```json
{
  "key": "username",
  "label": "Username",
  "type": "text",
  "default": ""
}
```

#### Number Setting
```json
{
  "key": "delay",
  "label": "Delay (ms)",
  "type": "number",
  "default": 1000,
  "min": 0,
  "max": 10000
}
```

#### Boolean Setting
```json
{
  "key": "enabled",
  "label": "Enable Feature",
  "type": "boolean",
  "default": true
}
```

#### Select Setting
```json
{
  "key": "theme",
  "label": "Theme",
  "type": "select",
  "default": "light",
  "options": [
    { "value": "light", "label": "Light Theme" },
    { "value": "dark", "label": "Dark Theme" },
    { "value": "auto", "label": "Auto" }
  ]
}
```

### Accessing Settings in JavaScript
```javascript
// Settings are automatically loaded and available
async function loadSettings() {
  const result = await mod.storage.get(`mod_${mod.config.id}_settings`);
  const settings = result[`mod_${mod.config.id}_settings`] || {};
  
  // Use settings with defaults
  const username = settings.username || 'Guest';
  const delay = settings.delay || 1000;
  const enabled = settings.enabled !== undefined ? settings.enabled : true;
}
```

## Target Sites

### Pattern Examples

#### All Sites
```json
"targetSites": ["*"]
```

#### Specific Domain
```json
"targetSites": ["github.com"]
```

#### Multiple Domains
```json
"targetSites": ["github.com", "gitlab.com", "bitbucket.org"]
```

#### Subdomain Wildcards
```json
"targetSites": ["*.google.com", "*.github.com"]
```

#### Path Patterns
```json
"targetSites": ["github.com/*/issues", "reddit.com/r/*"]
```

## Publishing Your Mod

### 1. Create GitHub Repository
- Repository must be public
- Place `mod.json` in the root directory
- Use descriptive repository name

### 2. Repository Structure
```
your-username/your-mod-name/
├── mod.json          # Required
├── README.md         # Recommended
├── LICENSE           # Recommended
└── screenshots/      # Optional
    └── demo.png
```

### 3. Installation URL
Users install your mod using:
```
Repository: your-username/your-mod-name
Branch: main (or specify custom branch)
```

## Complete Examples

### Example 1: Dark Mode Mod
```json
{
  "id": "dark-mode",
  "name": "Universal Dark Mode",
  "description": "Applies dark mode to any website",
  "version": "1.0.0",
  "author": "John Doe",
  "category": "Themes",
  "targetSites": ["*"],
  "css": ":root { filter: invert(1) hue-rotate(180deg); }\nimg, video { filter: invert(1) hue-rotate(180deg); }",
  "settings": [
    {
      "key": "intensity",
      "label": "Dark Mode Intensity",
      "type": "number",
      "default": 100,
      "min": 0,
      "max": 100
    }
  ]
}
```

### Example 2: Auto-Clicker Mod
```json
{
  "id": "auto-clicker",
  "name": "Auto Clicker",
  "description": "Automatically clicks buttons based on selector",
  "version": "2.0.0",
  "author": "Jane Smith",
  "category": "Automation",
  "targetSites": ["*"],
  "js": "(function() {\n  'use strict';\n  \n  async function init() {\n    const settings = await getSettings();\n    if (!settings.enabled) return;\n    \n    setInterval(() => {\n      const button = document.querySelector(settings.selector);\n      if (button) button.click();\n    }, settings.interval);\n  }\n  \n  async function getSettings() {\n    const result = await mod.storage.get(`mod_${mod.config.id}_settings`);\n    const settings = result[`mod_${mod.config.id}_settings`] || {};\n    return {\n      enabled: settings.enabled !== undefined ? settings.enabled : false,\n      selector: settings.selector || 'button.submit',\n      interval: settings.interval || 5000\n    };\n  }\n  \n  init();\n})();",
  "settings": [
    {
      "key": "enabled",
      "label": "Enable Auto-Clicker",
      "type": "boolean",
      "default": false
    },
    {
      "key": "selector",
      "label": "Button Selector",
      "type": "text",
      "default": "button.submit"
    },
    {
      "key": "interval",
      "label": "Click Interval (ms)",
      "type": "number",
      "default": 5000,
      "min": 1000,
      "max": 60000
    }
  ]
}
```

### Example 3: GitHub Enhancement Mod
```json
{
  "id": "github-enhancer",
  "name": "GitHub Enhancer",
  "description": "Adds useful features to GitHub",
  "version": "1.2.0",
  "author": "Dev Team",
  "category": "Productivity",
  "targetSites": ["github.com", "*.github.com"],
  "css": ".enhancement-badge { background: #0366d6; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; }",
  "js": "(function() {\n  'use strict';\n  \n  // Add copy button to code blocks\n  document.querySelectorAll('pre').forEach(pre => {\n    const button = document.createElement('button');\n    button.textContent = 'Copy';\n    button.className = 'enhancement-badge';\n    button.style.position = 'absolute';\n    button.style.top = '5px';\n    button.style.right = '5px';\n    button.onclick = () => {\n      navigator.clipboard.writeText(pre.textContent);\n      button.textContent = 'Copied!';\n      setTimeout(() => button.textContent = 'Copy', 2000);\n    };\n    pre.style.position = 'relative';\n    pre.appendChild(button);\n  });\n})();",
  "settings": [
    {
      "key": "showCopyButton",
      "label": "Show Copy Button on Code Blocks",
      "type": "boolean",
      "default": true
    }
  ]
}
```

## Best Practices

### 1. Naming Conventions
- **ID**: Use lowercase with hyphens (e.g., `my-awesome-mod`)
- **Settings Keys**: Use camelCase (e.g., `backgroundColor`)
- **CSS Classes**: Prefix with mod ID (e.g., `.my-mod-container`)

### 2. Version Management
- Follow semantic versioning: MAJOR.MINOR.PATCH
- Increment PATCH for bug fixes
- Increment MINOR for new features
- Increment MAJOR for breaking changes

### 3. Performance
- Minimize DOM queries
- Use event delegation for dynamic content
- Avoid polling when possible
- Clean up event listeners when appropriate

### 4. Error Handling
```javascript
(function() {
  'use strict';
  
  try {
    // Your mod code
  } catch (error) {
    console.error(`[${mod.config.id}] Error:`, error);
  }
})();
```

### 5. Compatibility
- Test on multiple websites
- Handle missing elements gracefully
- Check for conflicting mods
- Use feature detection

### 6. Documentation
- Include clear README in repository
- Document all settings
- Provide usage examples
- List known limitations

### 7. Security
- Never inject user input directly into DOM
- Sanitize any external data
- Use Content Security Policy compliant code
- Avoid eval() and inline event handlers

## Testing Your Mod

1. Create local mod.json file
2. Test CSS/JS in browser console first
3. Install via "Add Mod" in CodysTools
4. Check browser console for errors
5. Test all settings combinations
6. Verify target site patterns

## Troubleshooting

### Common Issues

1. **Mod not loading**
   - Check mod.json syntax (valid JSON)
   - Verify target sites match current URL
   - Ensure mod is enabled in extension

2. **Settings not working**
   - Check setting key matches in mod.json and JS
   - Verify storage access in JavaScript
   - Look for console errors

3. **CSS not applying**
   - Check specificity conflicts
   - Use browser DevTools to inspect
   - Try adding !important temporarily

4. **JavaScript errors**
   - Check browser console
   - Verify DOM elements exist
   - Handle async operations properly

## Support

For questions or issues:
1. Check existing mods for examples
2. Review browser console for errors
3. Test in isolation first
4. Create minimal reproducible example

Remember: Keep mods focused, well-documented, and user-friendly!
