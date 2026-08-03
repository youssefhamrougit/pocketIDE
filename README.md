<div align="center">

# PocketIDE

> **A mobile-first code editor that runs entirely offline — create files, import code, and edit anywhere.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Server](https://img.shields.io/badge/backend-none-brightgreen.svg?style=flat-square)](index.html)

**Code anywhere. Build anything. Nothing leaves your device.**

</div>

---

## What is this?

PocketIDE is a **standalone code editor + file manager** that runs in any browser (and as an Android APK). There is **no server, no backend, no account** — every file you create or import is stored locally on your device.

It's intentionally simple:

- **Create files** — any name, any extension. `main.py`, `index.cpp`, `script.js`, `style.css`… all work.
- **Import files** — pull files (or an entire folder) from your device into the project.
- **Edit** — a lightweight editor with syntax highlighting for many languages, line numbers, tabs, and dark/light themes.

## ✨ Features

| Category | Details |
|----------|---------|
| 📄 File manager | Create, rename, duplicate, delete, copy/cut/paste files & folders |
| ⬇️ Import | Import single files or whole folders from the device |
| 📝 Editor | Syntax highlighting, auto-indent, pinch-to-zoom font size (mobile) |
| 📑 Tabs | Multi-tab editing with dirty indicators & keyboard shortcuts |
| 🌙 Themes | Dark & light themes |
| 📱 Mobile-first | Touch-friendly targets, edge-swipe sidebar, bottom-sheet menu, safe-area support |
| 🔌 Offline | 100% local — works with no internet connection at all |

### Supported languages

<<<<<<< HEAD
JavaScript, TypeScript, JSX/TSX, Python, HTML, CSS/SCSS, JSON, Markdown, C, C++, C#, Go, Rust, Java, Ruby, PHP, Swift, Kotlin, Dart, Shell, YAML, TOML, XML, SVG, SQL, Lua, Vue, and more — unknown extensions open as plain text, so **any** file type works.
=======
| Layer | Technology |
|-------|-----------|
| **Frontend (Standalone)** | Vanilla HTML + CSS + JavaScript |
| **Frontend (Server)** | CodeMirror 6 (via esbuild) + Vanilla JS |
| **Backend** | Node.js + Express 5 (REST API) |
| **Auth** | bcryptjs + JWT |
| **Storage (Standalone)** | localStorage |
| **Storage (Server)** | Filesystem-based JSON store |
| **Build** | None (standalone) / esbuild (editor) |

### Languages Used

- **JavaScript** (ES2022) — 100% of application code
- **HTML** — UI markup
- **CSS** — Styling

## 🏗️ Project Structure

```
pocketide/
├── index.html              # Standalone edition entry point
├── app.js                  # Standalone edition core logic
├── styles.css              # Standalone edition styles
│
├── editor/                 # CodeMirror 6 edition
│   ├── src/
│   │   ├── editor.js       # Editor initialization & lifecycle
│   │   ├── file-tree.js    # File explorer component
│   │   ├── tabs.js         # Tab management
│   │   ├── themes.js       # Theme system
│   │   ├── languages.js    # Language definitions
│   │   ├── bridge.js       # WebView bridge (for mobile embedding)
│   │   ├── api-client.js   # Backend API client
│   │   ├── plugin-api.js   # Plugin system API
│   │   └── index.html      # Editor page
│   └── build.mjs           # esbuild configuration
│
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── server.js       # Express server entry
│   │   ├── config.js       # Configuration
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error middleware
│   │   ├── services/       # Business logic
│   │   └── storage/        # File-based JSON store
│   └── package.json
│
├── plugins/                # Community plugins directory
└── docs/                   # Documentation
```

## 🚧 Project Status

⚠️ **Active development**

### Current Status

- ✅ **Standalone edition** — Fully functional (file explorer, editor, tabs, themes)
- ✅ **Server backend** — Authentication, project CRUD, file operations
- ✅ **CodeMirror 6 editor** — Syntax highlighting for multiple languages
- ✅ **Plugin API** — Extensible plugin system
- ✅ **Git integration**
- ⬜ **Integrated terminal**
- ⬜ **AI assistant**
- ⬜ **Cloud workspaces**
>>>>>>> 15e4e84b432ad9c9cf26176802aba8cd2fee4f2a

## 🚀 Quick Start

### Web

Open `index.html` in any modern browser. That's it — no build step, no dependencies.

### Android (APK)

An Android build lives in the `mobileideapk` folder:

- `PocketIDE.apk` — the installable app (WebView wrapper + this app, fully offline)
- `index.html` — a welcome page with the README and an **Install APK** button

1. Copy `PocketIDE.apk` to your Android phone (or serve it from the welcome page).
2. Open it — allow "Install unknown apps" when prompted.
3. Done. Files are stored in the app's local storage.

> The APK is **unsigned for distribution** — it's signed with a local debug-style key so it can be sideloaded. To publish on the Play Store you'd sign with your own key.

## ⌨️ Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+S` | Save |
| `Ctrl+W` | Close tab |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+O` | Open folder (desktop) |
| `F2` | Rename |
| `Tab` / `Shift+Tab` | Indent / un-indent |

On mobile, tap the **☰ menu** for the action sheet, or swipe from the left edge to open the file explorer.

## 📁 Project Structure

```
pocketide/
├── index.html    # Single-page app markup + SVG icon set
├── app.js        # Editor, file tree, tabs, storage, import — all logic
├── styles.css    # Mobile-first styling
└── brand/        # Logo source (SVG) and generated PNG icons
```

## 🔧 Rebuilding the APK

The build is a plain WebView wrapper around the same three files. To rebuild it yourself, follow the steps in `mobileideapk/BUILD.md` (it only needs a JDK and Android build-tools — no Gradle/Android Studio required).

## 🤝 Community

| Resource | Link |
|----------|------|
| 📖 **Contributing Guide** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| 🐛 **Report a Bug** | [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) |
| ✨ **Request a Feature** | [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) |
| 🛡️ **Security Policy** | [SECURITY.md](SECURITY.md) |
| 📜 **Code of Conduct** | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
Built with ❤️ — no servers were harmed.
</div>
