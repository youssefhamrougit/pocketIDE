---
name: 🔌 Plugin Submission
about: Submit a plugin/extension for the PocketIDE ecosystem
title: '[Plugin] '
labels: plugin
assignees: ''
---

## Plugin Information

- **Plugin Name:**
- **Version:**
- **Author:**
- **Repository URL:**
- **License:**

## Description

Describe what your plugin does in 2–3 sentences.

## Features

List the key features your plugin provides:

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

## Compatibility

- **PocketIDE Version:** [e.g. >= 0.1.0]
- **Platforms tested on:**
  - [ ] iOS
  - [ ] Android

## Manifest

Paste your `plugin.json` manifest below:

```json
{
  "name": "...",
  "version": "...",
  "minAppVersion": "...",
  "description": "...",
  "author": "...",
  "repository": "...",
  "main": "...",
  "contributes": {
    "commands": [],
    "keybindings": [],
    "themes": [],
    "languages": []
  }
}
```

## Checklist

- [ ] My plugin works as described
- [ ] I have included a README with installation and usage instructions
- [ ] My plugin follows the [Plugin Development Guide](../plugins/README.md)
- [ ] I have tested my plugin on both iOS and Android (or noted limitations)
