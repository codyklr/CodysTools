# CodysTools Mod Template

This template helps you create your own mods for CodysTools. You can create a new GitHub repository with this structure to host your mods.

## Repository Structure

```
your-mod-repo/
├── mod.json          # Required: Mod configuration
├── README.md         # Optional: Documentation for your mod
├── script.js         # Optional: JavaScript code (if not inline)
├── style.css         # Optional: CSS styles (if not inline)
└── assets/           # Optional: Additional assets
```

## Example mod.json

```json
{
  "id": "your-mod-id",
  "name": "Your Mod Name",
  "description": "A brief description of what your mod does",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "Utility",
  "targetSites": ["*"],
  "css": "/* Your CSS here */",
  "js": "// Your JavaScript here",
  "settings": [
    {
      "key": "exampleSetting",
      "label": "Example Setting",
      "type": "boolean",
      "default": true
    }
  ]
}
```

## Creating Your Mod Repository

1. **Create a new GitHub repository** (e.g., `codyklr/my-awesome-mod`)

2. **Add a mod.json file** with your mod configuration

3. **Choose your code structure**:
   - **Inline**: Put CSS and JS directly in mod.json
   - **External**: Reference separate files (not yet supported, use inline for now)

4. **Test your mod** by installing it in CodysTools:
   - Open CodysTools popup
   - Click the + button
   - Enter your repository: `username/repository`
   - Click Install

## Example Mod Ideas

### 1. Dark Mode Toggle
```json
{
  "id": "dark-mode-toggle",
  "name": "Dark Mode Toggle",
  "description": "Adds a dark mode toggle to any website",
  "version": "1.0.0",
  "author": "YourName",
  "category": "Theme",
  "targetSites": ["*"],
  "css": "/* Dark mode styles */",
  "js": "// Dark mode toggle logic"
}
```

### 2. Site-Specific Tools
```json
{
  "id": "github-enhancer",
  "name": "GitHub Enhancer",
  "description": "Adds useful features to GitHub",
  "version": "1.0.0",
  "author": "YourName",
  "category": "Productivity",
  "targetSites": ["github.com", "*.github.com"],
  "css": "/* GitHub-specific styles */",
  "js": "// GitHub enhancement features"
}
```

### 3. Custom Shortcuts
```json
{
  "id": "keyboard-shortcuts",
  "name": "Custom Keyboard Shortcuts",
  "description": "Adds custom keyboard shortcuts to websites",
  "version": "1.0.0",
  "author": "YourName",
  "category": "Productivity",
  "targetSites": ["*"],
  "js": "// Keyboard shortcut handler",
  "settings": [
    {
      "key": "shortcuts",
      "label": "Shortcut Configuration",
      "type": "text",
      "default": "{}"
    }
  ]
}
```

## Publishing Your Mod

1. **Make your repository public** (CodysTools only supports public repos)
2. **Share your repository URL** with others
3. **Users can install it** by entering: `username/repository`

## Best Practices

1. **Use semantic versioning** (e.g., 1.0.0, 1.1.0, 2.0.0)
2. **Write clear descriptions** so users know what your mod does
3. **Choose appropriate categories** to help users find your mod
4. **Target specific sites** when possible to avoid conflicts
5. **Test thoroughly** before publishing
6. **Document any settings** in your README
7. **Handle errors gracefully** in your JavaScript code

## Categories

Common categories include:
- Productivity
- Theme
- Utility
- Developer
- Social
- Entertainment
- Education
- Privacy
- Accessibility

You can also create custom categories for your specific use case.
