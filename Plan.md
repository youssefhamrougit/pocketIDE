# 🚀 PocketIDE

A powerful browser-based development environment that lets you code from anywhere — no setup required.

---

# 🧠 Project Vision

PocketIDE is a dual-edition IDE:

1. **Standalone Edition** — A fully offline, zero-dependency IDE that runs from a single HTML file. Perfect for quick edits, learning, or environments without a backend.
2. **Server Edition** — A full-stack IDE with a CodeMirror 6 editor, Node.js backend, authentication, and on-disk project storage. Ideal for development teams and power users.

---

# 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Standalone Edition                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ File     │  │ Custom   │  │ Multi-   │  │ Theme     │  │
│  │ Explorer │  │ Editor   │  │ Tab      │  │ System    │  │
│  │          │  │ (Regex   │  │ Manager  │  │ (Dark/    │  │
│  │          │  │  HL)     │  │          │  │  Light)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                        ↕                                    │
│                  localStorage                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Server Edition                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ File     │  │ CodeMirror 6 │  │ Plugin System        │  │
│  │ Explorer │  │  Editor      │  │ (API + Registry)     │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                        ↕                                    │
│              ┌──────────────────────┐                       │
│              │  API Client (fetch)  │                       │
│              └──────────┬───────────┘                       │
│                         ↕                                   │
├─────────────────────────────────────────────────────────────┤
│                     Backend (Node.js)                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth     │  │ Project CRUD │  │ File Operations      │  │
│  │ (JWT)    │  │              │  │ (Read/Write/Delete)   │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                        ↕                                    │
│                Filesystem JSON Store                        │
└─────────────────────────────────────────────────────────────┘
```

---

# 📱 Development Plan

## Phase 1 — Foundation ✅

### Goal:
Create a working code editor in the browser.

Features:
- ✅ Standalone edition (no backend needed)
- ✅ Custom syntax highlighting (regex-based)
- ✅ File explorer
- ✅ Create/edit/delete files
- ✅ Multi-tab editing
- ✅ Dark/light themes
- ✅ localStorage persistence
- ✅ CodeMirror 6 editor (server edition)
- ✅ Plugin API system
- ✅ User authentication (server edition)
- ✅ Backend project management

---

## Phase 2 — Developer Tools

### Goal:
Transform the editor into a real IDE.

Features:
- ⬜ Integrated terminal
- ⬜ Run JavaScript projects
- ⬜ Package installation
- ⬜ Git integration (isomorphic-git)
- ⬜ Project templates
- ⬜ Error detection & linting
- ⬜ Code formatting

---

## Phase 3 — Cloud Development

### Goal:
Allow powerful development from anywhere.

Features:
- ⬜ Cloud workspaces
- ⬜ Remote project storage
- ⬜ Docker-based execution
- ⬜ Build systems
- ⬜ Deploy applications
- ⬜ Collaboration tools

---

## Phase 4 — AI Development Assistant

### Goal:
Make coding faster and easier.

Features:
- ⬜ AI code generation
- ⬜ AI debugging
- ⬜ Explain code
- ⬜ Refactoring suggestions
- ⬜ Generate projects from prompts
- ⬜ Automatic error fixing

---

# 🗂️ Project Structure

```
pocketide/
├── index.html              # Standalone edition entry point
├── app.js                  # Standalone core logic (editor, explorer, tabs)
├── styles.css              # Standalone styling
│
├── editor/                 # CodeMirror 6 server edition
│   ├── src/
│   │   ├── editor.js       # Editor initialization & lifecycle
│   │   ├── file-tree.js    # File explorer component
│   │   ├── tabs.js         # Tab management
│   │   ├── themes.js       # Theme system (dark/light)
│   │   ├── languages.js    # Language definitions
│   │   ├── bridge.js       # Mobile WebView bridge
│   │   ├── api-client.js   # Backend REST client
│   │   ├── plugin-api.js   # Plugin system
│   │   └── index.html      # Editor page
│   └── build.mjs           # esbuild config
│
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── server.js       # Express server
│   │   ├── config.js       # Configuration
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & error handling
│   │   ├── services/       # Business logic
│   │   └── storage/        # JSON file store
│   └── package.json
│
├── plugins/                # Community plugins
├── docs/                   # Documentation
├── README.md
└── Plan.md
```

---

# 🛠️ Technology

## Frontend (Standalone)
- **Vanilla HTML5 + CSS3 + JavaScript (ES2022)**
- Custom regex-based syntax highlighter
- No build step — open and code
- localStorage for persistence

## Frontend (Server)
- **CodeMirror 6** (via npm + esbuild)
- **Vanilla JavaScript** — no framework dependencies
- Plugin API for extensions

## Backend
- **Node.js** runtime
- **Express 5** REST API
- **bcryptjs + JWT** for authentication
- **Filesystem-based JSON store** (no database needed)

## Build Tools
- **esbuild** — fast bundler for the CodeMirror editor

---

# 🗓️ Milestones

## Version 0.1 — Basic Editor ✅
- Open projects
- Edit files with syntax highlighting
- Save changes (localStorage or backend)

## Version 0.5 — Developer Environment
- Terminal
- Git integration
- Run projects

## Version 1.0 — Full PocketIDE
- AI assistant
- Cloud execution
- Collaboration

---

# 🌟 Long-Term Goals

- Support multiple programming languages
- Real-time collaboration
- Native mobile app (WebView wrapper)
- Plugin marketplace
- Desktop version (Electron/Tauri)

---

# 👥 Team

Built by developers who wanted a better way to code anywhere.
