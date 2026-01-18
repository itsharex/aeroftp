# 🚀 AeroFTP

<p align="center">
  <img src="docs/logo.png" alt="AeroFTP Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Fast. Beautiful. Reliable.</strong>
</p>

<p align="center">
  A modern, cross-platform FTP client built with Rust and React.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-blue" alt="Platform">
  <img src="https://img.shields.io/badge/Built%20with-Tauri%20%2B%20React-purple" alt="Built with">
  <img src="https://img.shields.io/badge/License-GPL--3.0-green" alt="License">
</p>

<p align="center">
  <a href="https://snapcraft.io/aeroftp"><img src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" alt="Get it from the Snap Store"></a>
</p>

---

## ✨ Features

### Core
- 🚀 **Lightning Fast** - Built with Rust for optimal performance
- 🎨 **Beautiful UI** - Modern design with glass morphism effects
- 🌙 **Dark Mode** - Full dark mode support with smooth transitions
- 📁 **Dual Panel** - Remote and local file browsing side by side
- 🔄 **File Sync** - Compare and synchronize local/remote directories
- 🔒 **Secure** - Supports FTPS (FTP over TLS)
- ⚡ **Async** - Non-blocking file transfers with progress tracking
- 💾 **Profiles** - Save your favorite server connections
- 🔗 **Sync Navigation** - Keep remote/local directories in sync
- ☁️ **AeroCloud** - Cloud file synchronization with conflict detection

### Activity Log Panel 📋
FileZilla-style real-time activity log with dual themes:

| Theme          | Description                                    |
| -------------- | ---------------------------------------------- |
| **Professional** | Tokyo Night-inspired elegant dark theme (default) |
| **Cyber**        | Neon glow effects with CRT scanlines overlay    |

- **Typewriter effect** for new log entries
- **Humanized messages** in 5 languages (EN, IT, FR, ES, ZH)
- **Badge counter** in StatusBar (0 → 99+)
- Tracks: connections, uploads, downloads, navigation, deletes, AeroCloud sync

### DevTools Panel 🛠️
AeroFTP includes an integrated DevTools panel (like Chrome DevTools) for web developers:

| Tab          | Feature                                     | Status   |
| ------------ | ------------------------------------------- | -------- |
| **Preview**  | Syntax-highlighted file preview             | ✅ Active |
| **Editor**   | Monaco Editor (VS Code) with inline editing | ✅ Active |
| **Terminal** | Local PTY Terminal                          | ✅ Active |

#### Editor Features
- Full **Monaco Editor** (same as VS Code)
- **Syntax highlighting** for 20+ languages
- **Tokyo Night** 🌃 theme
- **Save** directly to server (auto-upload on save)
- **Reset** to undo changes
- Minimap, line numbers, folding, bracket colorization

### Multi-Session Tabs
- Open multiple server connections as tabs
- Instant tab switching with cached file lists
- Background reconnection

### 🤖 AI Assistant (AeroAgent)
Integrated AI-powered assistant for intelligent FTP operations:

| Feature            | Description                                           |
| ------------------ | ----------------------------------------------------- |
| **Multi-Provider** | Google Gemini, OpenAI, Anthropic, Ollama (local)      |
| **Auto-Routing**   | Automatic model selection based on task type          |
| **FTP Tools**      | List, read, compare, sync files via natural language  |
| **Smart Context**  | Insert current paths with `@` mention or `+` menu     |
| **Markdown Chat**  | Code blocks, syntax highlighting, formatted responses |

#### Advanced Settings
- **Conversation Style**: Precise / Balanced / Creative
- **Temperature**: Control response randomness (0.0 - 2.0)
- **Max Tokens**: Limit response length (256 - 32768)

### 🎵 Media Features
- **Image Preview** - View images directly in the app
- **Audio/Video Player** - Play media files with playback controls
- **File Thumbnails** - Visual thumbnails for image files

### 🌍 Internationalization
- **5 Languages**: English, Italian, French, Spanish, Chinese
- **Easy switching** from settings panel

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/screenshot-1.png" alt="AeroFTP Screenshot 1" width="800">
</p>

<p align="center">
  <img src="docs/screenshots/screenshot-2.png" alt="AeroFTP Screenshot 2" width="800">
</p>

## 🛠️ Installation

### Snap Store (Linux)

```bash
sudo snap install aeroftp
```

> ⚠️ **Note**: The Snap version has limited filesystem access due to strict confinement. For full access, use the `.deb` or `.AppImage` versions.

### Flathub (Coming Soon)

AeroFTP is currently under review for Flathub. Stay tuned!

### From Releases

Download the latest release for your platform:
- **Linux**: `.deb`, `.rpm`, `.AppImage`, or `.snap`
- **Windows**: `.msi` installer or `.exe`
- **macOS**: `.dmg` disk image

📥 [Download from GitHub Releases](https://github.com/axpnet/aeroftp/releases)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/axpnet/aeroftp.git
cd aeroftp

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Prerequisites

- **Node.js** 18+ 
- **Rust** 1.77+
- **Tauri CLI** (`cargo install tauri-cli`)

## 🚀 Usage

1. **Launch AeroFTP**
2. **Enter server details**:
   - Server: `ftp.example.com:21`
   - Username: `your-username`
   - Password: `your-password`
3. **Click Connect**
4. **Browse and transfer files!**

### Using DevTools

1. **Right-click** on any file → "Preview"
2. DevTools panel opens at the bottom
3. Switch to **Editor** tab for inline editing
4. Edit code with Monaco Editor
5. Click **Save** to upload changes

### Keyboard Shortcuts

| Key         | Action            |
| ----------- | ----------------- |
| `Ctrl+R`    | Refresh file list |
| `Ctrl+U`    | Upload file       |
| `Ctrl+D`    | Download file     |
| `Ctrl+N`    | New folder        |
| `Delete`    | Delete selected   |
| `F2`        | Rename            |
| `Backspace` | Go up directory   |

## 🏗️ Tech Stack

- **Backend**: Rust + Tauri 2.0
- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **FTP**: suppaftp crate
- **Editor**: Monaco Editor
- **Icons**: Lucide React

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 📝 License

GPL-3.0 License - see [LICENSE](LICENSE) for details.

## 👥 Credits

> **🤖 AI-Assisted Development Project**
>
> - **Lead Developer**: [axpdev](https://github.com/axpnet)
> - **AI Assistant**: Claude Opus 4.5

---

<p align="center">
  Made with ❤️ and ☕
</p>
