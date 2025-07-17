# CodysTools - Modular Chrome Extension

A modern, modular Chrome extension that allows users to install and manage "mods" (modifications) from GitHub repositories. Features a clean, minimal interface with automatic update checking and content injection capabilities.

## Features

- **Modular Design**: Install mods from any public GitHub repository
- **Auto Updates**: Daily checks for mod updates with one-click installation
- **Category System**: Organize mods by categories (Productivity, Social, etc.)
- **Content Injection**: Dynamic CSS and JavaScript injection
- **Conflict Resolution**: Smart handling of mod conflicts
- **Settings Management**: Per-mod configuration options
- **Modern UI**: Clean, responsive interface with dark/light mode support

## Installation

1. **Load as Unpacked Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `CodysTools` folder

2. **Initial Setup**:
   - The extension will automatically install default mods
   - Click the extension icon to open the popup interface

## Usage

### Installing Mods
1. Click the extension icon
2. Click "+ Add Mod"
3. Enter a GitHub repository URL (e.g., `https://github.com/user/mod-repo`)
4. Optionally specify a branch (defaults to `main`)
5. Click "Install Mod"

### Managing Mods
- **Enable/Disable**: Toggle the switch next to each mod
- **Update**: Click "Update" when available (only shows when updates exist)
- **View Details**: Click on any mod to expand and see description
- **Filter**: Use categories or search to find specific mods

### Creating Mods

Create a new GitHub repository with this structure:

```
your-mod/
├── mod.json          # Required: Mod configuration
├── content.js        # Required: Main content script
├── content.css       # Optional: CSS styles
├── settings.html     # Optional: Settings page
└── settings.js       # Optional: Settings logic
```

#### mod.json Format
```json
{
  "name": "Your Mod Name",
  "description": "Brief description of what your mod does",
  "version": "1.0.0",
  "category": "productivity",
  "matches": ["<all_urls>"],
  "contentScript": "content.js",
  "cssFile": "content.css",
  "settings": {
    "customOption": "value"
  }
}
```

#### content.js Template
```javascript
(function(mod) {
    'use strict';
    
    // Your mod code here
    console.log('Mod loaded:', mod.name);
    
    // Access settings via mod.settings
    if (mod.settings.customOption) {
        // Use custom settings
    }
})(window.modConfig || {});
```

## Default Mods

### Dark Mode Toggle
- **Category**: Productivity
- **Description**: Adds a floating dark mode toggle to all websites
- **Features**: 
  - Persistent preference storage
  - Smooth transitions
  - Whitelist support

### Simple Ad Blocker
- **Category**: Productivity
- **Description**: Blocks common ad elements and trackers
- **Features**:
  - Dynamic ad detection
  - Whitelist support
  - Minimal performance impact

## Development

### Project Structure
```
CodysTools/
├── manifest.json              # Extension manifest
├── popup/                     # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/                # Service worker
│   ├── service-worker.js
│   ├── mod-manager.js
│   └── update-checker.js
├── content/                   # Content scripts
│   └── content-loader.js
├── mods/                      # Default mods
│   └── default-mods/
└── README.md
```

### Key Components

- **ModManager**: Handles mod installation, updates, and lifecycle
- **UpdateChecker**: Manages version checking and update notifications
- **ContentLoader**: Dynamically injects mod content into pages
- **PopupManager**: User interface for mod management

### Testing

1. **Load Extension**: Load as unpacked extension in Chrome
2. **Test Mods**: Install test mods from GitHub
3. **Check Updates**: Verify update checking works
4. **Content Injection**: Test on various websites

## Security

- Only supports public GitHub repositories
- Content Security Policy compliant
- Sandboxed content script execution
- No sensitive permissions required

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.
