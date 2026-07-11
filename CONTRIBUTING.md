# Contributing to Mobile IDE

First off, thank you for considering contributing! 🎉 We're building a mobile development environment for everyone, and every contribution makes a difference.

This guide will help you understand how to contribute effectively.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Plugin Development](#plugin-development)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Community](#community)

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to follow it — be respectful, inclusive, and constructive.

---

## Ways to Contribute

Not all contributions are code! Here's how you can help:

### 🐛 Report Bugs
Found a bug? [Open an issue](https://github.com/mobile-ide/mobile-ide/issues/new?template=bug_report.md). Be as detailed as possible — device, OS version, steps to reproduce.

### ✨ Suggest Features
Have an idea? [Submit a feature request](https://github.com/mobile-ide/mobile-ide/issues/new?template=feature_request.md). Tell us what problem you're solving.

### 📝 Improve Documentation
Good documentation is just as important as good code. Fix typos, clarify explanations, or write new guides.

### 🔌 Build Plugins
Extend Mobile IDE with plugins! See the [Plugin Development Guide](plugins/README.md).

### 💻 Write Code
Pick up an issue from the backlog, fix a bug, or implement a feature.

### 🌍 Translate
Help make Mobile IDE accessible in more languages.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mobile-ide.git
   cd mobile-ide
   ```
3. **Set up the dev environment** (see below)
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (version 3.x+)
- [Dart SDK](https://dart.dev/get-dart) (comes with Flutter)
- iOS: Xcode (macOS only)
- Android: Android Studio or Android SDK

### Getting Started

1. Install dependencies:
   ```bash
   flutter pub get
   ```

2. Run the app:
   ```bash
   # For iOS (macOS only)
   flutter run -d ios

   # For Android
   flutter run -d android
   ```

3. Run tests:
   ```bash
   flutter test
   ```

4. Analyze code:
   ```bash
   flutter analyze
   ```

---

## Project Structure

```
mobile-ide/
├── lib/                        # Main application code
│   ├── main.dart               # App entry point
│   ├── app.dart                # App widget & routing
│   ├── screens/                # Screen widgets
│   ├── components/             # Reusable UI components
│   ├── editor/                 # Code editor logic
│   ├── terminal/               # Terminal logic
│   └── navigation/             # Navigation and routing
├── assets/                     # Static assets
│   └── editor/                 # Editor WebView assets (CodeMirror, themes)
├── plugins/                    # Community plugin submissions
├── test/                       # Tests
├── android/                    # Android platform
├── ios/                        # iOS platform
├── docs/                       # Documentation
└── .github/                    # GitHub templates & workflows
```

---

## Coding Standards

### Dart / Flutter

- Follow [Effective Dart](https://dart.dev/effective-dart) guidelines
- Use `flutter analyze` — no warnings allowed
- Format with `dart format` before committing
- Use meaningful variable and function names
- Prefer `const` constructors where possible
- Use `// TODO: ` comments for incomplete work

### Code Style

| Rule | Standard |
|------|----------|
| Indentation | 2 spaces |
| Line length | 80 characters |
| Naming | `camelCase` for variables/functions, `PascalCase` for classes |
| Ordering | `dart:`, package imports, local imports (grouped with blank lines) |
| Comments | Document public APIs with `///` doc comments |

### State Management

We use [Provider](https://pub.dev/packages/provider) for state management. Use `ChangeNotifier` for mutable state.

### File Organization

- One class per file, except for small private helper classes
- Group related files in subdirectories
- Barrel exports (`export 'file.dart'`) for public APIs

---

## Plugin Development

We welcome plugin contributions! See the [Plugin Development Guide](plugins/README.md) for:

- Plugin manifest (`plugin.json`) specification
- Available extension points
- API documentation
- Publishing process

---

## Pull Request Process

1. **Ensure your PR addresses an issue** — if no issue exists, open one first
2. **Keep PRs focused** — one feature/bugfix per PR
3. **Update documentation** if your changes affect public APIs
4. **Add tests** for new functionality
5. **Ensure all checks pass**:
   - `flutter analyze` — no warnings
   - `flutter test` — all tests pass
   - Formatting — `dart format --dry-run` shows no changes
6. **Request review** from a maintainer
7. **Address feedback** — update your PR as requested

### PR Checklist

Before submitting, ask yourself:

- [ ] Does my code follow the coding standards?
- [ ] Have I tested on both iOS and Android?
- [ ] Are there new warnings or errors?
- [ ] Have I updated the docs?
- [ ] Have I added tests?
- [ ] Does my PR description clearly explain what it does and why?

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type     | Usage                          |
|----------|--------------------------------|
| `feat`   | A new feature                   |
| `fix`    | A bug fix                       |
| `docs`   | Documentation changes           |
| `style`  | Code formatting, no logic change|
| `refactor` | Code change that isn't a fix or feature |
| `test`   | Adding or fixing tests          |
| `chore`  | Build, CI, dependencies         || `plugin` | Plugin submission or update |

### Examples

```
feat(editor): add syntax highlighting for Dart
fix(terminal): handle resize on keyboard open
docs(readme): update installation instructions
plugin(lang-rust): add Rust language support
```

---

## Testing

- **Unit Tests** — Test models, services, and utilities in `test/`
- **Widget Tests** — Test individual widgets in `test/widgets/`
- **Integration Tests** — Test full flows (coming soon)

Run all tests:
```bash
flutter test
```

Run with coverage:
```bash
flutter test --coverage
```

---

## Community

- **Discussions** — [GitHub Discussions](https://github.com/mobile-ide/mobile-ide/discussions)
- **Issues** — [GitHub Issues](https://github.com/mobile-ide/mobile-ide/issues)
- **Plugin Registry** — Browse community plugins in the `plugins/` directory

### Recognition

We maintain a CONTRIBUTORS file to recognize everyone who contributes. If you've made a significant contribution and want to be listed, let us know!

---

## Getting Help

- Check the [SUPPORT.md](SUPPORT.md) guide
- Ask in [GitHub Discussions](https://github.com/mobile-ide/mobile-ide/discussions)
- Open an issue for bugs

---

Thank you for being part of this journey. Let's build the best mobile IDE together. 🚀
