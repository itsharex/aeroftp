# 📚 AeroFTP Documentation

Welcome to the AeroFTP documentation folder. This contains all technical documentation, release plans, and guides.

---

## 📋 Table of Contents

| Document                                             | Description                                                |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| **[TRANSLATIONS.md](./TRANSLATIONS.md)**             | Internationalization (i18n) guide for adding new languages |
| **[MACOS_RELEASE_PLAN.md](./MACOS_RELEASE_PLAN.md)** | Complete macOS release and distribution guide              |
| **[MACOS_QUICKSTART.md](./MACOS_QUICKSTART.md)**     | Quick start guide for macOS builds                         |
| **[FLATHUB_SUBMISSION.md](./FLATHUB_SUBMISSION.md)** | Linux Flatpak packaging and distribution                   |
| **[entitlements.plist](./entitlements.plist)**       | macOS entitlements configuration                           |
| **[logo.png](./logo.png)**                           | AeroFTP official logo                                      |

---

## 🚀 Quick Links

### For Release Process
1. Update version in `package.json`, `src-tauri/tauri.conf.json`, `snap/snapcraft.yaml`
2. Update `CHANGELOG.md` in project root
3. Follow platform-specific guides below

### Platform Guides
- **Linux**: [FLATHUB_SUBMISSION.md](./FLATHUB_SUBMISSION.md) | Snap: `snap/snapcraft.yaml`
- **macOS**: [MACOS_RELEASE_PLAN.md](./MACOS_RELEASE_PLAN.md)
- **Windows**: Automatic via GitHub Actions

---

## 📝 Version Files

When releasing, update version in these 3 files:

1. `package.json` → `"version": "x.x.x"`
2. `src-tauri/tauri.conf.json` → `"version": "x.x.x"`
3. `snap/snapcraft.yaml` → `version: 'x.x.x'`

---

## 🌍 Translations

AeroFTP supports multiple languages. See [TRANSLATIONS.md](./TRANSLATIONS.md) for:
- Adding a new language
- Translation file structure
- Contributing translations

Currently supported: **English** (base), **Italian**

---

## 🆕 What's New in v0.9.6

### Activity Log Panel
FileZilla-style activity log with dual themes:
- **Professional Theme**: Tokio Night-inspired elegant dark theme (default)
- **Cyber Theme**: Neon glow effects with CRT scanlines
- Typewriter animation for new entries
- Humanized messages in 5 languages (EN, IT, FR, ES, ZH)
- Badge counter in StatusBar

### Operations Tracked
| Operation | Icon | Description |
|-----------|------|-------------|
| CONNECT | 🔗 | Server connections with timestamp |
| DISCONNECT | ⚡ | Session disconnections |
| UPLOAD | ⬆️ | File uploads with size and duration |
| DOWNLOAD | ⬇️ | File downloads with size and duration |
| DELETE | 🗑️ | File and bulk deletions |
| NAVIGATE | 📁 | Directory navigation (remote/local) |
| MKDIR | 📂 | New folder creation |
| RENAME | ✏️ | File/folder renaming |
| SYNC | ☁️ | AeroCloud sync events |

---

## 📅 Last Updated

- **Documentation Version**: 0.9.7
- **Last Update**: 2026-01-17

---

**Maintainer**: axpnet  
**Project**: [github.com/axpnet/aeroftp](https://github.com/axpnet/aeroftp)
