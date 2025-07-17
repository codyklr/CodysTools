# CodysTools Installation Guide

## Prerequisites

- Google Chrome browser (version 88 or later)
- Developer mode enabled in Chrome extensions

## Installation Steps

### 1. Download the Extension

Clone or download this repository to your local machine:

```bash
git clone https://github.com/codyklr/CodysTools.git
```

Or download as ZIP and extract to a folder.

### 2. Enable Developer Mode

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" in the top-right corner

### 3. Load the Extension

1. Click "Load unpacked" button
2. Select the CodysTools directory
3. The extension will appear in your extensions list

### 4. Verify Installation

1. Look for the CodysTools icon in your browser toolbar
2. Click the icon to open the popup
3. You should see the "Example Mod" listed

### 5. Test the Extension

1. Open the included `test.html` file in your browser
2. Enable the "Example Mod" in the CodysTools popup
3. Refresh the test page
4. You should see a banner appear in the top-right corner

## Troubleshooting

### Extension Not Loading

- Ensure all files are present in the directory
- Check that `manifest.json` is valid
- Look for errors in the Chrome extensions page

### Popup Not Opening

- Check if the extension is enabled
- Look for JavaScript errors in the browser console
- Try reloading the extension

### Mods Not Working

- Ensure the mod is enabled in the popup
- Check the browser console for errors
- Verify the mod targets the current site

### GitHub API Rate Limits

If you encounter rate limits when installing mods:

1. Go to CodysTools settings (gear icon in popup)
2. Navigate to the "Advanced" tab
3. Add a GitHub Personal Access Token
4. This increases your API rate limit from 60 to 5000 requests per hour

## Creating a GitHub Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Select "public_repo" scope
4. Copy the token and paste it in CodysTools settings

## Next Steps

- Explore the settings page for configuration options
- Try installing mods from GitHub repositories
- Create your own mods using the documentation in README.md
- Join the community and share your mods

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the troubleshooting section above
3. Create an issue on the GitHub repository
4. Include your Chrome version and error details

## Uninstallation

To remove CodysTools:

1. Go to `chrome://extensions/`
2. Find CodysTools in the list
3. Click "Remove"
4. Confirm the removal

All extension data will be removed from your browser.
