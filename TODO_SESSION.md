# AeroFTP - Session TODO

> Aggiornato: 20 gennaio 2026
> Versione Corrente: **v1.2.2**
> Sprint Corrente: **Sprint 2 - OAuth2 Cloud Providers** ✅ COMPLETATO

---

## 📊 AeroCloud 2.0 Roadmap Status

| Sprint | Feature | Versione | Stato |
|--------|---------|----------|-------|
| **Sprint 1** | Multi-Protocol (WebDAV, S3) | v1.1.0 | ✅ Rilasciato |
| **Sprint 2** | OAuth2 Cloud Providers | v1.2.2 | ✅ Completato |
| **Sprint 3** | End-to-End Encryption | v1.3.0 | ⏳ Prossimo |
| **Sprint 4** | Collaborative Sharing | v1.4.0 | 📋 Pianificato |
| **Sprint 5** | Progressive Web App | v1.5.0 | 📋 Pianificato |

---

## ✅ Sprint 2 - Completato (v1.2.2)

### Backend Rust (Providers)
- [x] oauth2.rs - Core OAuth2 con PKCE, token management, keyring
- [x] google_drive.rs - Google Drive API v3 + Share Link
- [x] dropbox.rs - Dropbox API v2 + Share Link
- [x] onedrive.rs - Microsoft Graph API + Share Link
- [x] Tauri commands OAuth2 registrati
- [x] OAuth callback page con logo ufficiale AeroFTP
- [x] `provider_create_share_link` - Comando per creare share link nativi

### Frontend React
- [x] useOAuth2.ts - Hook per OAuth flow
- [x] OAuthConnect.tsx - Componente UI OAuth
- [x] ProtocolSelector.tsx - Aggiunto OAuth providers
- [x] types.ts - Aggiunto googledrive | dropbox | onedrive
- [x] Context menu con "Create Share Link" per OAuth providers
- [x] Context menu con "Copy Share Link" per AeroCloud

### Settings & UX
- [x] Tab "Cloud Providers" in Settings per OAuth credentials
- [x] Finestra più grande (1440x900)
- [x] Toast notifications disabilitate di default
- [x] Toggle "Show Toast Notifications" nei Settings
- [x] notify wrapper per ActivityLog + Toast condizionale
- [x] Custom AeroCloud tab name setting

### Bug Fixes v1.2.1
- [x] Tab switching: aggiornamento file remoti al cambio server
- [x] OAuth → FTP switch: mostra connection screen correttamente
- [x] AeroCloud: passaggio parametro protocol per evitare errori
- [x] New tab (+): mostra connection screen invece di tab vuota

### Features v1.2.2
- [x] Share Link nativo per Google Drive, Dropbox, OneDrive
- [x] Share Link per AeroCloud con public_url_base
- [x] OAuth folder download ricorsivo
- [x] FTP dopo OAuth corretto

---

## 📋 Sprint 3 - Encryption (Prossimo)

### Obiettivi
- [ ] Encryption at-rest per file sincronizzati
- [ ] Client-side encryption con chiave utente
- [ ] Zero-knowledge design
- [ ] Gestione chiavi sicura

---

## 🔧 Quick Commands

\`\`\`bash
# Build frontend
cd /var/www/html/FTP_CLIENT_GUI && npm run build

# Check Rust
cd src-tauri && cargo check

# Build Tauri app
npm run tauri build

# Dev mode
npm run tauri dev

# Create release tag
git tag v1.2.0 && git push origin v1.2.0
\`\`\`

---

## 📝 Note Tecniche

### OAuth2 Callback Server
- Porta: 17548
- Redirect URI: http://localhost:17548/callback
- Da configurare nelle console developer di ogni provider

### Provider Developer Consoles
- **Google**: https://console.cloud.google.com/apis/credentials
- **Dropbox**: https://www.dropbox.com/developers/apps
- **OneDrive**: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps

### Token Storage
- Keyring integration (cross-platform)
- Service: aeroftp
- Username: {provider}_tokens (es: googledrive_tokens)
