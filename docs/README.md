# 📚 AeroFTP Documentation

Welcome to the AeroFTP documentation folder. This contains all technical documentation, release plans, and guides.

---

## 📋 Table of Contents

| Document | Description | Purpose |
|-----------|-------------|-----------|
| **[CHANGELOG-OPENCODE.md](./CHANGELOG-OPENCODE.md)** | Session changelog from OpenCode (Cesare) | All features, fixes, and changes from current session |
| **[MACOS_RELEASE_PLAN.md](./MACOS_RELEASE_PLAN.md)** | Complete macOS release plan | Step-by-step guide for macOS distribution (App Store, GitHub, direct) |
| **[MACOS_QUICKSTART.md](./MACOS_QUICKSTART.md)** | Quick start guide for macOS | Immediate actions and testing checklist |
| **[entitlements.plist](./entitlements.plist)** | macOS entitlements configuration | App sandbox and security permissions for macOS |
| **[FLATHUB_SUBMISSION.md](./FLATHUB_SUBMISSION.md)** | Flathub submission guide | Linux Flatpak packaging and distribution |
| **[logo.png](./logo.png)** | AeroFTP official logo | Brand assets for documentation/marketing |

---

## 🚀 Quick Links

### For Release Process
1. Start with **[MACOS_QUICKSTART.md](./MACOS_QUICKSTART.md)** - Immediate actions
2. Follow **[MACOS_RELEASE_PLAN.md](./MACOS_RELEASE_PLAN.md)** - Complete process
3. Reference **[CHANGELOG-OPENCODE.md](./CHANGELOG-OPENCODE.md)** - Recent changes

### For Platform Specific
- **macOS**: [MACOS_RELEASE_PLAN.md](./MACOS_RELEASE_PLAN.md), [MACOS_QUICKSTART.md](./MACOS_QUICKSTART.md)
- **Linux**: [FLATHUB_SUBMISSION.md](./FLATHUB_SUBMISSION.md)
- **Windows**: See [README.md](../README.md) for current status

---

## 📝 Document Structure

### Release Documentation
- Plans and guides for distributing AeroFTP on different platforms
- Build configurations
- Signing and notarization procedures
- Store submission processes

### Changelogs
- **[CHANGELOG.md](../CHANGELOG.md)** - Official project changelog
- **[CHANGELOG-OPENCODE.md](./CHANGELOG-OPENCODE.md)** - Session-specific changelog (OpenCode)

### Configuration Files
- **[entitlements.plist](./entitlements.plist)** - macOS app permissions
- Tauri configs in `src-tauri/tauri.conf.json`
- Cargo.toml and package.json in project root

---

## 🎯 Recommended Workflow

When working on a new release:

```
1. Read docs/MACOS_QUICKSTART.md
   ↓
2. Update version numbers (3 files)
   ↓
3. Update CHANGELOG.md
   ↓
4. Test on target platform
   ↓
5. Follow docs/MACOS_RELEASE_PLAN.md
   ↓
6. Create git tag and release
   ↓
7. Update README.md with download links
```

---

## 📖 Additional Resources

### Tauri Documentation
- [Tauri v2 Guide](https://v2.tauri.app/)
- [macOS Signing](https://v2.tauri.app/distribute/sign-macos/)
- [macOS Notarization](https://v2.tauri.app/distribute/notarize/)
- [Mac App Store](https://v2.tauri.app/distribute/mac-app-store/)

### Apple Documentation
- [Notary Tool](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## 📝 Contributing to Documentation

If you make changes to the codebase:

1. Update relevant documentation files
2. Add session notes to CHANGELOG-OPENCODE.md
3. Update version-specific guides
4. Test instructions before committing

---

## 📅 Last Updated

- **CHANGELOG-OPENCODE.md**: 2025-12-24 (Session: OpenCode)
- **MACOS_RELEASE_PLAN.md**: 2025-12-24
- **MACOS_QUICKSTART.md**: 2025-12-24
- **entitlements.plist**: 2025-12-24

---

**Maintainer**: axpdev
**Documentation Version**: 0.1.0
**Project**: AeroFTP v0.7.0 (planned)
