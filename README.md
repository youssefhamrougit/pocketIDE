<div align="center">

# PocketIDE

> **A mobile-first code editor that runs entirely in your browser — create files, import code, commit with Git, and edit anywhere.**

[![Live Demo](https://img.shields.io/badge/demo-live-007acc?logo=vercel&style=flat-square)](https://pocket-ide.vercel.app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Server](https://img.shields.io/badge/backend-none-brightgreen.svg?style=flat-square)](index.html)

**Code anywhere. Build anything. Nothing leaves your device.**

[🚀 Try the live demo](https://pocket-ide.vercel.app/) · [📱 Install the APK](PocketIDE.apk)

</div>

---

## What is this?

PocketIDE is a **standalone code editor + file manager** that runs in any browser (and as an Android APK). There is **no server, no backend, no account** — every file you create or import is stored locally on your device.

It's intentionally simple:

- **Create files** — any name, any extension. `main.py`, `index.cpp`, `script.js`, `style.css`… all work.
- **Import files** — pull files (or an entire folder) from your device into the project.
- **Edit** — a lightweight editor with syntax highlighting for many languages, line numbers, tabs, and dark/light themes.
- **Get feedback** — live problems detection catches syntax errors as you type.
- **Version it** — initialize a Git repo and commit right from your pocket. Fully offline.

## ✨ Features

| Category | Details |
|----------|---------|
| 📄 File manager | Create, rename, duplicate, delete, cut/copy/paste files & folders, copy paths |
| ⬇️ Import | Import single files or whole folders from the device |
| 📝 Editor | Syntax highlighting, auto-indent, multi-tab editing, pinch-to-zoom font size (mobile) |
| ✨ Autocomplete | File-type-aware suggestions that appear as you type |
| 🚨 Problems panel | Real-time syntax/error detection for JS/TS, Python, JSON, HTML/XML/SVG/Vue & more |
| 🌿 Git (offline) | `git init`, stage, commit & history — fully local via bundled isomorphic-git, no account needed |
| 👁️ Quick preview | Preview files without opening them, right from the file tree |
| 📑 Tabs | Multi-tab editing with dirty indicators & keyboard shortcuts |
| 🌙 Themes | Dark & light themes |
| 📱 Mobile-first | Touch-friendly targets, edge-swipe sidebar, bottom-sheet menu, mobile action bar, safe-area support |
| 🔌 Offline | 100% local — works with no internet connection at all |
| 🤖 Android APK | Installable WebView build — same app, fully offline, no Play Store required |

### Supported languages

JavaScript, TypeScript, JSX/TSX, Python, HTML, CSS/SCSS/Sass, JSON, Markdown, C, C++, C#, Go, Rust, Java, Ruby, PHP, Swift, Kotlin, Dart, Shell, YAML, TOML, XML, SVG, SQL, Lua, Vue, and more — unknown extensions open as plain text, so **any** file type works.

## 🚀 Quick Start

### Live demo

Open **[https://pocket-ide.vercel.app/](https://pocket-ide.vercel.app/)** in any browser — try it right now, no install.

### Locally (web)

Open `index.html` in any modern browser. That's it — no build step, no dependencies.

### Android (APK)

Grab [PocketIDE.apk](PocketIDE.apk) from the repo root — it's a WebView wrapper around this same app, fully offline.

1. Copy `PocketIDE.apk` to your Android phone (or download it directly on the phone).
2. Open it — allow "Install unknown apps" when prompted.
3. Done. Files are stored in the app's local storage.

> The APK is **unsigned for distribution** — it's signed with a local debug-style key so it can be sideloaded. To publish on the Play Store you'd sign with your own key.

## 🗺️ Project Status

⚠️ **Active development** — the current release ships a complete, offline-first editor.

### ✅ Shipped

- File explorer + file manager (create / rename / duplicate / delete / cut / copy / paste)
- Regex-based syntax highlighting (30+ languages)
- Autocomplete suggestions
- Live problems detection (JS/TS, Python, JSON, HTML/XML/SVG/Vue)
- Offline Git (init, stage, commit, history)
- Multi-tab editing, dark/light themes, quick preview
- Android APK build (`android/build.sh`, no Gradle required)
- Live deployment on Vercel

### ⬜ On the roadmap

- Integrated terminal
- AI assistant
- Cloud workspaces & collaboration
- Git remote sync (push/pull)

## ⌨️ Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+S` | Save |
| `Ctrl+W` | Close tab |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+O` | Open folder (desktop) |
| `Ctrl+X` / `Ctrl+C` / `Ctrl+V` | Cut / copy / paste in the file tree |
| `F2` | Rename |
| `Del` | Delete |
| `Tab` / `Shift+Tab` | Indent / un-indent |

On mobile, tap the **☰ menu** for the action sheet, use the bottom action bar, or swipe from the left edge to open the file explorer.

## 📁 Project Structure

```
pocketide/
├── index.html    # Single-page app markup + SVG icon set
├── app.js        # Editor, highlighting, autocomplete, problems, Git, storage — all logic
├── styles.css    # Mobile-first styling
├── vendor/       # Offline dependencies
│   ├── isomorphic-git.min.js  # Bundled Git implementation (works offline)
│   └── buffer-polyfill.js     # Minimal Buffer polyfill for isomorphic-git
├── android/      # APK build (plain JDK + build-tools — no Gradle/Android Studio)
│   ├── build.sh  # One-shot build script (downloads its own toolchain)
│   ├── AndroidManifest.xml
│   ├── MainActivity.java
│   └── res/      # Launcher icons & styles
├── PocketIDE.apk # Pre-built installable app
└── .github/      # Issue templates & CI
```

## 🛠️ Technology

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5 + CSS3 + JavaScript (ES2022) — no frameworks, no build step |
| **Editor** | Custom textarea + syntax-highlight layer (regex tokenizer) |
| **Git** | [isomorphic-git](https://isomorphic-git.org/) (vendored, runs fully in-browser) |
| **Storage** | localStorage |
| **Android** | WebView wrapper (Java) built with plain Android build-tools |
| **Hosting** | Vercel (static, zero-config) |

## 🔧 Rebuilding the APK

The Android build is a plain WebView wrapper around the same three files — no Gradle or Android Studio required:

```bash
bash android/build.sh ./dist
```

The script downloads its own toolchain (JDK 17, build-tools 34, platform 33) into `dist/.build` on first run and reuses it afterwards. Run it in Git Bash on Windows or any Linux/macOS shell. The output `PocketIDE.apk` lands in the folder you pass.

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
