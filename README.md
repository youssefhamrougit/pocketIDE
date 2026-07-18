<div align="center">

# 🚀 PocketIDE

> **A modern, mobile-first IDE for the browser.**

[![Contributors](https://img.shields.io/badge/contributors-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Discussions](https://img.shields.io/badge/discussions-join-8B5CF6?style=flat-square)](CONTRIBUTING.md)

**Code anywhere. Build anything.**

</div>

---

## 📖 About

PocketIDE is a powerful browser-based development environment. It comes in **two editions**:

1. **Standalone Edition** — A fully self-contained IDE that runs entirely in the browser with no backend. Features a custom regex-based syntax highlighter, file explorer, multi-tab editing, and localStorage persistence.
2. **Server Edition** — A full-stack version with a **CodeMirror 6** editor, Node.js/Express backend, user authentication, project management, and file storage on disk.

Our goal is to create the PocketIDE we've always wanted to use.

## ✨ Features

| Category | Features |
|----------|----------|
| 📁 Project Management | File explorer, project creation, multi-tab editing |
| 📝 Code Editor | Syntax highlighting, auto-indent, bracket matching |
| 🔌 Extensions | Plugin API system, custom themes |
| 🌙 Themes | Dark & light themes, customizable |
| 👤 Authentication | User registration & login (server edition) |

## 🛠️ Tech Stack

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
- ⬜ **Integrated terminal**
- ⬜ **Git integration**
- ⬜ **AI assistant**
- ⬜ **Cloud workspaces**

## 🚀 Quick Start

### Standalone Edition

Just open `index.html` in your browser — no setup required!

### Server Edition

```bash
# Install backend dependencies
cd backend
npm install

# Start the server
npm start

# Build the CodeMirror 6 editor
cd ../editor
npm install
npm run build
```

## 🤝 Community

This project is built **by developers, for developers**. We welcome everyone.

| Resource | Link |
|----------|------|
| 📖 **Contributing Guide** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| 🔌 **Plugin Development** | [plugins/README.md](plugins/README.md) |
| 🐛 **Report a Bug** | [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) |
| ✨ **Request a Feature** | [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) |
| 🔑 **Submit a Plugin** | [Plugin Submission](.github/ISSUE_TEMPLATE/plugin_submission.md) |
| 💬 **Start a Discussion** | [GitHub Discussions](https://github.com/youssefhamrougit/pocketIDE/discussions) |
| 🛡️ **Security Policy** | [SECURITY.md](SECURITY.md) |
| 📜 **Code of Conduct** | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |
| ❓ **Getting Help** | [SUPPORT.md](SUPPORT.md) |

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ by the community.
</div>
