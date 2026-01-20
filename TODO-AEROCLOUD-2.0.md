# AeroCloud 2.0 - Multi-Provider Cloud Storage Roadmap

> Created: 20 January 2026
> Version: AeroFTP 1.0.0 → 1.1.0
> Status: Sprint 1 In Progress

---

## 🎯 Vision

Transform AeroFTP from a pure FTP client into a **Universal Cloud Storage Browser** while maintaining the simplicity and elegance of the current design.

**Target Audience:**
- **Sprint 1-2**: Pro users, developers, sysadmins (WebDAV, S3)
- **Sprint 3+**: End users, consumers (Google Drive, Dropbox, OneDrive)

---

## 🏗️ Architecture Overview

### Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    AeroFTP Frontend                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   FTP   │ │ WebDAV  │ │   S3    │ │  Cloud  │ ← Tabs    │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼───────────┼───────────┼───────────┼─────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│              Rust Backend - Provider Layer                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     trait StorageProvider (async)                    │   │
│  │   ├── connect()     ├── list()     ├── mkdir()      │   │
│  │   ├── disconnect()  ├── download() ├── delete()     │   │
│  │   ├── upload()      ├── rename()   ├── get_info()   │   │
│  └─────────────────────────────────────────────────────┘   │
│           │              │              │                   │
│           ▼              ▼              ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ FtpProvider │  │WebDavProvider│ │  S3Provider │         │
│  │ (suppaftp)  │  │  (reqwest)  │  │ (aws-sdk)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Sprint 1: WebDAV + S3 Support (v1.1.0)

### Goals
- [x] Create unified `StorageProvider` trait
- [x] Refactor FTP to implement `StorageProvider`
- [x] Implement WebDAV provider
- [x] Implement S3-compatible provider
- [x] Update frontend for protocol selection

### Tasks

#### 1. Backend - Provider Abstraction (`src-tauri/src/providers/`)
- [x] Create `providers/mod.rs` with `StorageProvider` trait
- [x] Create `providers/types.rs` with shared types (`RemoteEntry`, `ProviderConfig`)
- [x] Create `providers/ftp.rs` - FTP provider implementation
- [x] Create `providers/webdav.rs` - WebDAV implementation
- [x] Create `providers/s3.rs` - S3 implementation with SigV4 signing

#### 2. Frontend - Protocol Selection
- [x] Add `ProviderType` to types.ts
- [x] Create `ProtocolSelector.tsx` component
- [x] Update ConnectionScreen with protocol dropdown
- [x] Add S3-specific fields (bucket, region, endpoint)
- [x] Add WebDAV hints and documentation

#### 3. Backend - Integration (TODO)
- [ ] Add Tauri commands for protocol-specific connection
- [ ] Update `connect_ftp` command to use provider factory
- [ ] Route file operations through provider abstraction
- [ ] Update AeroCloud sync to work with any provider

#### 4. Testing & Documentation (TODO)
- [ ] Test with Nextcloud (WebDAV)
- [ ] Test with MinIO (S3-compatible)
- [ ] Test with AWS S3
- [ ] Update README with new features

#### 2. Backend - Integration
- [ ] Update `lib.rs` to use provider abstraction
- [ ] Add Tauri commands for protocol selection
- [ ] Update AeroCloud sync to work with any provider

#### 3. Frontend - Protocol Selection
- [ ] Add protocol dropdown in connection dialog
- [ ] Update connection form for protocol-specific fields
- [ ] Add provider icons (FTP, WebDAV, S3, etc.)

#### 4. Testing & Documentation
- [ ] Test with Nextcloud (WebDAV)
- [ ] Test with MinIO (S3-compatible)
- [ ] Test with AWS S3
- [ ] Update README with new features

### Dependencies to Add (Cargo.toml)
```toml
# S3 Support
aws-sdk-s3 = "1"
aws-config = "1"

# Already have reqwest for WebDAV
```

---

## 📋 Sprint 2: Encryption & Multi-Cloud (v1.2.0)

### Goals
- [ ] Cryptomator-compatible client-side encryption
- [ ] Multi-cloud unified view
- [ ] Cross-cloud file operations

### Tasks
- [ ] Implement Cryptomator vault format
- [ ] AES-256-GCM encryption layer
- [ ] Filename encryption/obfuscation
- [ ] Multi-tab cloud browser
- [ ] Drag & drop between clouds

---

## 📋 Sprint 3: OAuth2 Cloud Providers (v1.3.0)

### Goals
- [ ] Google Drive integration
- [ ] Dropbox integration
- [ ] OneDrive integration

### Tasks
- [ ] OAuth2 flow with system browser
- [ ] Secure token storage (keyring)
- [ ] Google Drive API v3
- [ ] Dropbox API v2
- [ ] Microsoft Graph API

---

## 📋 Sprint 4: Advanced Features (v1.4.0)

### Goals
- [ ] CDN integration (CloudFront)
- [ ] Share links generation
- [ ] File versioning support
- [ ] Bandwidth throttling

---

## 🔧 Technical Notes

### WebDAV Implementation
- Use `reqwest` with custom headers for WebDAV methods (PROPFIND, MKCOL, MOVE, COPY)
- Parse XML responses with `quick-xml`
- Support both HTTP and HTTPS
- Handle Nextcloud/ownCloud specific extensions

### S3 Implementation
- Use official `aws-sdk-s3` for maximum compatibility
- Support custom endpoints for MinIO, Backblaze B2, R2, etc.
- Handle large file uploads with multipart
- Support presigned URLs for sharing

### Cross-Platform Considerations
- All providers must work on Linux, macOS, Windows
- Avoid platform-specific APIs
- Test on all platforms before release
- Snap/Flatpak compatibility (no direct filesystem access for OAuth tokens - use XDG portal)

---

## 📁 File Structure After Sprint 1

```
src-tauri/src/
├── lib.rs                 # Main Tauri commands
├── main.rs                # Entry point
├── providers/             # NEW: Storage providers
│   ├── mod.rs             # Provider trait + registry
│   ├── types.rs           # Shared types
│   ├── ftp.rs             # FTP provider
│   ├── webdav.rs          # WebDAV provider
│   └── s3.rs              # S3 provider
├── cloud_config.rs        # AeroCloud configuration
├── cloud_service.rs       # AeroCloud sync (updated for providers)
├── sync.rs                # File comparison logic
├── watcher.rs             # File system watcher
├── ai.rs                  # AI features
└── pty.rs                 # Terminal (Unix only)
```

---

## 🔗 References

- [Cyberduck](https://cyberduck.io/) - Feature inspiration
- [AWS S3 SDK for Rust](https://docs.aws.amazon.com/sdk-for-rust/)
- [WebDAV RFC 4918](https://datatracker.ietf.org/doc/html/rfc4918)
- [Cryptomator Vault Format](https://docs.cryptomator.org/en/latest/security/vault/)

---

## 📊 Compatibility Matrix (Target)

| Provider     | Browse | Upload | Download | Sync | Share |
| ------------ | ------ | ------ | -------- | ---- | ----- |
| FTP/FTPS     | ✅      | ✅      | ✅        | ✅    | ❌     |
| SFTP         | ✅      | ✅      | ✅        | ✅    | ❌     |
| WebDAV       | 🔄      | 🔄      | 🔄        | 🔄    | 🔄     |
| S3           | 🔄      | 🔄      | 🔄        | 🔄    | 🔄     |
| Google Drive | 📋      | 📋      | 📋        | 📋    | 📋     |
| Dropbox      | 📋      | 📋      | 📋        | 📋    | 📋     |
| OneDrive     | 📋      | 📋      | 📋        | 📋    | 📋     |

Legend: ✅ Done | 🔄 In Progress | 📋 Planned | ❌ Not Applicable
