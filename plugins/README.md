# 🔌 Plugin Development Guide

Mobile IDE is designed to be extensible. Anyone can build plugins to add languages, themes, tools, and more.

---

## 📋 Table of Contents

- [How Plugins Work](#how-plugins-work)
- [Creating a Plugin](#creating-a-plugin)
- [Plugin Manifest](#plugin-manifest)
- [Extension Points](#extension-points)
- [Plugin Examples](#plugin-examples)
- [Submitting Your Plugin](#submitting-your-plugin)
- [Plugin Registry](#plugin-registry)

---

## How Plugins Work

Plugins are self-contained packages that extend Mobile IDE's capabilities. They are loaded at startup from the `plugins/` directory.

Each plugin is a directory containing:

```
my-plugin/
├── plugin.json          # Plugin manifest (required)
├── main.js              # Entry point (required)
├── README.md            # Documentation (recommended)
├── assets/              # Static assets (optional)
│   ├── icon.png
│   └── themes/
│       └── my-theme.css
└── languages/           # Language definitions (optional)
    └── my-lang.json
```

---

## Plugin Manifest

The `plugin.json` manifest tells Mobile IDE what your plugin does.

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "maxAppVersion": "*",
  "description": "A brief description of your plugin",
  "author": "Your Name",
  "repository": "https://github.com/yourname/my-plugin",
  "license": "MIT",
  "icon": "assets/icon.png",
  "main": "main.js",
  "contributes": {
    "commands": [
      {
        "id": "my-plugin.hello",
        "title": "Say Hello",
        "keybindings": ["ctrl+alt+h"]
      }
    ],
    "keybindings": [
      {
        "command": "my-plugin.hello",
        "key": "ctrl+alt+h",
        "when": "editorFocus"
      }
    ],
    "themes": [
      {
        "id": "my-plugin.dark-theme",
        "label": "My Dark Theme",
        "type": "dark",
        "path": "assets/themes/my-theme.css"
      }
    ],
    "languages": [
      {
        "id": "my-lang",
        "aliases": ["MyLang", "ml"],
        "extensions": [".ml"],
        "configuration": "languages/my-lang.json"
      }
    ],
    "menus": [
      {
        "menu": "editor/context",
        "items": [
          {
            "command": "my-plugin.hello",
            "group": "1_modification"
          }
        ]
      }
    ]
  },
  "activationEvents": [
    "onLanguage:my-lang",
    "onCommand:my-plugin.hello"
  ]
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique plugin identifier (kebab-case) |
| `version` | string | ✅ | Semantic version (semver) |
| `minAppVersion` | string | ✅ | Minimum Mobile IDE version |
| `maxAppVersion` | string | ❌ | Maximum Mobile IDE version |
| `description` | string | ✅ | Short description |
| `author` | string | ✅ | Author name or handle |
| `repository` | string | ❌ | Link to source code |
| `license` | string | ❌ | SPDX license identifier |
| `icon` | string | ❌ | Path to plugin icon |
| `main` | string | ✅ | Entry point (relative path) |
| `contributes` | object | ✅ | What the plugin adds |
| `activationEvents` | string[] | ❌ | When the plugin activates |

### Contributes

| Contribution | Description |
|--------------|-------------|
| `commands` | Custom commands that can be triggered |
| `keybindings` | Keyboard shortcuts for commands |
| `themes` | Color themes (light/dark) |
| `languages` | Language definitions (syntax, grammar, auto-complete) |
| `snippets` | Code snippets |
| `menus` | Context menu contributions |
| `views` | Custom panels and views |
| `completions` | Auto-completion providers |
| `diagnostics` | Linters and error checkers |

---

## Extension Points

These are the APIs your plugin can hook into:

| API | Description | Status |
|-----|-------------|--------|
| `editor.setText(text)` | Replace editor content | ✅ |
| `editor.getText()` | Get editor content | ✅ |
| `editor.setCursor(line, col)` | Move cursor | ✅ |
| `editor.getCursor()` | Get cursor position | ✅ |
| `editor.setSelection(start, end)` | Select text range | ⬜ |
| `editor.format()` | Format document | ⬜ |
| `commands.register(id, handler)` | Register a command | ✅ |
| `commands.execute(id, args)` | Run a command | ✅ |
| `workspace.getFiles()` | List project files | ✅ |
| `workspace.readFile(path)` | Read file content | ✅ |
| `workspace.writeFile(path, content)` | Write file content | ✅ |
| `window.showMessage(msg)` | Show notification | ✅ |
| `window.showInput(prompt)` | Show input dialog | ⬜ |
| `window.showQuickPick(items)` | Show quick pick list | ⬜ |
| `terminal.create(name)` | Create terminal | ⬜ |
| `events.onDidChangeText(cb)` | Text change event | ✅ |
| `events.onDidOpenFile(cb)` | File open event | ✅ |
| `events.onDidSaveFile(cb)` | File save event | ✅ |

### API Usage (from `main.js`)

```javascript
// main.js — plugin entry point
// Plugins use the global window pattern (ES modules aren't supported in the WebView)
window.activate = function(context) {
  // Called when your plugin activates

  const disposable = context.commands.register('my-plugin.hello', () => {
    context.window.showMessage('Hello from My Plugin! 👋');
  });

  // Clean up when plugin deactivates
  context.subscriptions.push(disposable);
};

window.deactivate = function() {
  // Called when your plugin deactivates
  console.log('My Plugin deactivated');
};
```

> 💡 **Note:** Plugins run in the CodeMirror 6 WebView context. The global `window.activate` / `window.deactivate` pattern is used because ES module `export` syntax is not available without a bundler. If you prefer to write your plugin as an ES module, bundle it with [esbuild](https://esbuild.github.io/) or [webpack](https://webpack.js.org/) before submitting.

---

## Plugin Examples

### Theme Plugin

```json
// plugin.json
{
  "name": "synthwave-theme",
  "version": "1.0.0",
  "description": "Synthwave '84 inspired theme",
  "author": "coolcoder",
  "main": "main.js",
  "contributes": {
    "themes": [
      {
        "id": "synthwave.dark",
        "label": "Synthwave '84",
        "type": "dark",
        "path": "theme.css"
      }
    ]
  }
}
```

### Language Plugin

```json
// plugin.json
{
  "name": "lang-rust",
  "version": "1.0.0",
  "description": "Rust language support",
  "author": "rustacean",
  "main": "main.js",
  "contributes": {
    "languages": [
      {
        "id": "rust",
        "aliases": ["Rust", "rust"],
        "extensions": [".rs"],
        "configuration": "rust-config.json"
      }
    ]
  }
}
```

---

## Submitting Your Plugin

### Method 1: Submit via GitHub (Community Registry)

1. Fork this repository
2. Create a directory in `plugins/` with your plugin name:
   ```
   plugins/your-plugin-name/
   ├── plugin.json
   ├── main.js
   └── README.md
   ```
3. [Open a Plugin Submission issue](https://github.com/mobile-ide/mobile-ide/issues/new?template=plugin_submission.md)
4. Submit a Pull Request adding your plugin to the `plugins/` directory
5. A maintainer will review and merge

### Method 2: Self-Host

You can host plugins on your own repository. Users install them by providing the repository URL in the Mobile IDE plugin browser.

### Review Criteria

Plugins are reviewed for:

- ✅ Functionality — does it work as described?
- ✅ Safety — does it access only necessary APIs?
- ✅ Quality — is the code well-structured?
- ✅ Documentation — is there a README with usage instructions?

---

## Plugin Registry

The community plugin registry lives right here in this repo. Browse the `plugins/` directory to discover available plugins.

**Coming soon:** An in-app plugin browser with one-tap installation.

---

## Need Help?

- Open a [Discussion](https://github.com/mobile-ide/mobile-ide/discussions) with the `plugins` tag
- Check existing plugins in the `plugins/` directory for reference
- Ask in [GitHub Issues](https://github.com/mobile-ide/mobile-ide/issues)

Happy building! 🔌🚀
