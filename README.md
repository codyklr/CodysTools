# CodysTools

A modular Chrome extension that allows you to install and manage custom mods to enhance your browsing experience.

## Features

- **Modular Architecture**: Install mods from GitHub repositories
- **Automatic Updates**: Check for and install mod updates automatically
- **Site-Specific Targeting**: Mods can target specific websites or run globally
- **CSS & JavaScript Injection**: Full support for custom styling and functionality
- **Settings Management**: Each mod can have its own configurable settings
- **Conflict Detection**: Warns when mods might conflict with each other
- **Import/Export**: Backup and restore your mod configuration

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the CodysTools directory
5. The extension will appear in your extensions list

## Usage

### Managing Mods

1. Click the CodysTools icon in your browser toolbar
2. Use the "+" button to add new mods from GitHub repositories
3. Toggle mods on/off using the switches
4. Click on a mod to expand and view its settings
5. Use the refresh button to check for updates

### Installing Mods

1. Click the "Add Mod" button in the popup
2. Enter a GitHub repository in the format `username/repository`
3. Optionally specify a branch (defaults to `main`)
4. Click "Install Mod"

### Settings

Access the settings page by clicking the gear icon in the popup, or right-click the extension icon and select "Options".

## Mod Structure

Mods are defined by a `mod.json` file in the repository root with the following structure:

```json
{
  "id": "unique-mod-id",
  "name": "Mod Name",
  "description": "Description of what the mod does",
  "version": "1.0.0",
  "author": "Author Name",
  "category": "Utility",
  "targetSites": ["*"],
  "permissions": ["storage"],
  "settings": [
    {
      "key": "settingKey",
      "type": "boolean|text|number|select",
      "label": "Setting Label",
      "description": "Setting description",
      "default": "default value"
    }
  ],
  "files": {
    "css": "style.css",
    "js": "script.js"
  }
}
```

### Mod Configuration

- **id**: Unique identifier for the mod
- **name**: Display name
- **description**: Brief description of functionality
- **version**: Semantic version number
- **author**: Mod author name
- **category**: Category for organization (Utility, Enhancement, Productivity, etc.)
- **targetSites**: Array of site patterns where the mod should run (`*` for all sites)
- **permissions**: Array of required permissions
- **settings**: Array of configurable settings
- **files**: Object mapping file types to filenames

### Setting Types

- **boolean**: Checkbox input
- **text**: Text input field
- **number**: Number input with optional min/max
- **select**: Dropdown with predefined options

### Target Sites

Target sites can be specified as:
- `*` - All sites
- `example.com` - Specific domain
- `*.example.com` - Wildcard patterns
- `https://example.com/*` - URL patterns

## Mod Development

### JavaScript API

Mods have access to a `mod` object with the following properties:

```javascript
mod.id          // Mod ID
mod.config      // Mod configuration
mod.storage     // Storage API
mod.utils       // Utility functions
```

### Storage API

```javascript
// Get setting value
const value = await mod.storage.get('settingKey');

// Set setting value
await mod.storage.set({ settingKey: 'value' });
```

### Utility Functions

```javascript
// Wait for element to appear
const element = await mod.utils.waitForElement('.selector');

// Add global CSS
const style = mod.utils.addGlobalStyle('body { background: red; }');
```

### Example Mod

See the `mods/example-mod/` directory for a complete example mod that demonstrates:
- Configuration settings
- CSS injection
- JavaScript functionality
- Theme support
- Animations

## Default Mods

The extension comes with default mods in the `mods/` directory:

- **example-mod**: Demonstrates basic functionality with a customizable banner

## Security

- Only public GitHub repositories are supported
- Mods run in isolated contexts to prevent conflicts
- Settings are validated and sanitized
- XSS protection is built-in

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, bug reports, or feature requests, please visit our [GitHub repository](https://github.com/codyklr/CodysTools).

## Changelog

### v1.0.0
- Initial release
- Basic mod management
- GitHub integration
- Settings system
- Example mod included
