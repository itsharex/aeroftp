# 🍎 AeroFTP macOS Release Plan

**Version Target**: 0.7.0
**Date**: 2025-01-XX
**Author**: OpenCode (GLM-4.7) - Cesare

---

## 📋 Prerequisiti

### ✅ Mac Hardware
- Mac con Apple Silicon (M1/M2/M3) o Intel
- macOS 13.0 (Ventura) o superiore

### ✅ Apple Developer Account
**Opzione A - Mac App Store (Recommended)**
- Account Apple Developer ($99/anno)
- Team ID per certificati
- Accesso a Mac App Store Connect

**Opzione B - Distribuzione Diretta (Free)**
- Apple ID gratuito
- Creazione certificati self-signed
- Distribuzione via GitHub/Sito

### ✅ Software Necessario
- Xcode Command Line Tools: `xcode-select --install`
- macOS SDK più recente
- (Opzionale) Xcode app completo per notarization

---

## 🔧 Configurazione Tauri per macOS

### File: `src-tauri/tauri.conf.json`

Attualmente mancano le sezioni specifiche macOS. Aggiungere:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "macOS": {
      "entitlements": "entitlements.plist",
      "providerShortName": null,
      "signingIdentity": null
    },
    ...
  }
}
```

### File: `entitlements.plist` (Nuovo - da creare)

**Per App Store:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

**Per Distribuzione Diretta (non-sandboxed):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
```

---

## 📦 Processo di Build

### Step 1: Generazione Certificati

#### Opzione A - Mac App Store (Production)
```bash
# Accesso a Apple Developer
# Dashboard: https://developer.apple.com/account/

# Creare:
# 1. "Certificates, Identifiers & Profiles"
# 2. "Certificates" → "Mac App Store"
# 3. Generare certificato (.cer)
# 4. Installare nel Keychain

# Creare App ID
# 1. "Identifiers" → "App IDs"
# 2. Bundle ID: com.aeroftp.app
# 3. Capabilities: Network Client (FTP)
```

#### Opzione B - Self-Signed (Testing/Free)
```bash
# Creare certificato self-signed
security create-keychain -p build.keychain
security import private_key.p12 -k ~/Library/Keychains/build.keychain -P password
security list-keychains -s build.keychain
security default-keychain -s build.keychain
security unlock-keychain -p password build.keychain

# Oppure usare ad-hoc signing (necessita macOS)
# Viene automatico con Tauri
```

### Step 2: Build macOS App

```bash
# Installare dipendenze macOS (se su Linux)
sudo apt-get install xz libfuse2

# Build app macOS (Tauri)
npm run tauri build

# Output: src-tauri/target/release/bundle/dmg/
#          src-tauri/target/release/bundle/macos/
```

### Step 3: Signing

#### Automatic Signing (Tauri nativo)

Aggiungere al `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

Build con signing:
```bash
npm run tauri build -- --target universal-apple-darwin
```

#### Manual Signing (per controllo)

```bash
# Trovare l'app built
APP_PATH="src-tauri/target/release/bundle/macos/AeroFTP.app"

# Firmare l'app
codesign --force --deep --sign "Developer ID Application: Your Name (TEAM_ID)" "$APP_PATH"

# Verificare firma
codesign --verify --deep --verbose "$APP_PATH"
```

### Step 4: Notarization (Richiesta per Distribuzione)

#### Per App Store:
```bash
# Upload ad Apple per notarization
xcrun notarytool submit \
  "AeroFTP-0.7.0.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

# Ricevere UUID del ticket notarization

# Stapler: allegare ticket al DMG
xcrun stapler staple "AeroFTP-0.7.0.dmg"
```

#### Per Distribuzione Diretta (GitHub):
```bash
# Notarization con Apple ID gratuito
xcrun notarytool submit \
  "AeroFTP-0.7.0.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --wait

# Stapler
xcrun stapler staple "AeroFTP-0.7.0.dmg"
```

---

## 🚀 Opzioni di Distribuzione

### Opzione 1: Mac App Store (Recommended)

#### Pro:
- ✅ Massima visibilità
- ✅ Aggiornamenti automatici
- ✅ Recensioni utenti
- ✅ Trust automatico (no avvisi sicurezza)
- ✅ Distribuzione automatica

#### Contro:
- ❌ Costo annuale $99
- ❌ Processo di approvazione (1-2 settimane)
- ❌ Regole App Store restrittive (nessun FTP nativo)

#### Passaggi:
1. Creare record "Mac App Store Connect"
2. Generare provisioning profile
3. Upload build (Transporter app o CLI)
4. Inserire metadati:
   - Screenshot (minimum 6.5", 16:9)
   - Description
   - Keywords: "FTP", "File Transfer", "Client"
   - Category: Productivity → Utilities
   - Age Rating: 4+
   - Privacy Policy URL
5. Submit per review
6. Attendere approvazione

### Opzione 2: GitHub Releases (Free)

#### Pro:
- ✅ Gratuita
- ✅ Controllo completo
- ✅ Distribuzione immediata
- ✅ Versioning semantico
- ✅ Auto-updates possibili (Tauri Updater)

#### Contro:
- ❌ Meno visibilità
- ❌ Avvisi "app da sviluppatore sconosciuto"
- ❌ Gestione aggiornamenti manuale

#### Passaggi:
1. Creare GitHub Release tag
2. Upload `.dmg` notarizzato
3. Upload `.dmg.blockmap` (generato automatico)
4. Creare Release Notes
5. Pubblicare

### Opzione 3: Sito Web + DMG

#### Pro:
- ✅ Controllo totale
- ✅ Integrabile con analytics
- ✅ Marketing personalizzato

#### Contro:
- ❌ Hosting richiesto
- ❌ SEO da gestire
- ❌ Aggiornamenti manuali

---

## 📝 Checklist Pre-Release

### Codice
- [ ] Versione aggiornata in `package.json` (0.7.0)
- [ ] Versione aggiornata in `src-tauri/Cargo.toml` (0.7.2)
- [ ] Versione aggiornata in `tauri.conf.json` (0.7.0)
- [ ] CHANGELOG.md aggiornato
- [ ] README.md aggiornato con download macOS
- [ ] Tutti test passati su macOS

### Assets
- [ ] Icone macOS pronte (icon.icns) ✅ (già presenti)
- [ ] Screenshots pronti (minimo 4, 6.5" 16:9)
- [ ] Privacy Policy creata
- [ ] Support email configurato
- [ ] License file presente

### Documentazione
- [ ] Readme aggiornato con download link macOS
- [ ] Changelog completo
- [ ] Known Issues documentato
- [ ] Troubleshooting guide

### Build
- [ ] Build production completa senza errori
- [ ] macOS build: `npm run tauri build -- --target aarch64-apple-darwin`
- [ ] macOS build Intel: `npm run tauri build -- --target x86_64-apple-darwin`
- [ ] Universal build: `npm run tauri build -- --target universal-apple-darwin`
- [ ] DMG generation funzionante
- [ ] App signing verificata

### Security
- [ ] Hardened Runtime abilitato (opzionale)
- [ ] Entitlements corretti configurati
- [ ] Sandbox testata
- [ ] Network permissions testate
- [ ] File system permissions testate

---

## 🎯 Piano Rilascio Consigliato

### Fase 1: Testing Interno (1 settimana)
1. Build su Mac reale (non solo CI)
2. Test tutte le funzionalità:
   - Connessione FTP
   - Upload/Download file
   - Upload/Download cartelle
   - Sync
   - Preview immagini/video/audio
   - Terminal
   - AI Chat
3. Test su diverse versioni macOS:
   - Ventura (13.0)
   - Sonoma (14.0)
   - Sequoia (15.0)
4. Test Apple Silicon vs Intel

### Fase 2: Beta (2 settimane)
1. Release su GitHub come "Pre-release"
2. Distribuire a beta testers
3. Raccolta feedback
4. Fix bug criticali

### Fase 3: Release Production (1 settimana)
1. Notarization DMG
2. Release su GitHub (production)
3. (Opzionale) Sottomissione Mac App Store
4. Annuncio sui social media

---

## 🔗 Risorse Utili

### Documentazione Tauri
- [Tauri macOS Signing Guide](https://v2.tauri.app/distribute/sign-macos/)
- [Tauri Notarization Guide](https://v2.tauri.app/distribute/notarize/)
- [Tauri App Store Guide](https://v2.tauri.app/distribute/mac-app-store/)

### Strumenti Apple
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Developer Portal](https://developer.apple.com/account/)
- [Transporter](https://apps.apple.com/transporter)
- [Notarytool Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

### Comandi Utili
```bash
# Verificare certificati installati
security find-identity -v -p codesigning

# Verificare firma app
codesign -dv --verbose /path/to/AeroFTP.app

# Check notarization status
xcrun notarytool history --apple-id "your@email.com"

# Rimuovere quarantine (per testing)
xattr -cr com.apple.quarantine /path/to/AeroFTP.app
```

---

## 💡 Suggerimenti Aggiuntivi

### Tauri Updater
Implementare auto-updates per distribuzione GitHub:
```bash
npm install @tauri-apps/plugin-updater
```

Configurare in `tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "endpoints": ["https://github.com/axpnet/aeroftp/releases/latest"],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### Universal Binary
Supportare sia Apple Silicon che Intel:
```bash
npm run tauri build -- --target universal-apple-darwin
```

Vantaggi:
- Unico DMG per tutte le Mac
- Dimensione ridotta (codice condiviso)
- Automatico on Apple Silicon su Rosetta

### Hardened Runtime
Sicurezza massima:
```bash
codesign --force --deep --sign "identity" --options=runtime \
  /path/to/AeroFTP.app
```

---

## 📅 Timeline Stimata

| Fase | Durata | Inizio | Fine | Responsabile |
|-------|---------|--------|------|-------------|
| Configurazione | 2 giorni | Day 1 | Day 2 | Developer |
| Testing | 1 settimana | Day 3 | Day 9 | Developer + Beta Testers |
| Bug Fixes | 3 giorni | Day 10 | Day 12 | Developer |
| Notarization | 1 giorno | Day 13 | Day 13 | Developer |
| Release | 1 giorno | Day 14 | Day 14 | Developer |

**Totale**: ~2 settimane

---

## ⚠️ Warning e Note Importanti

### Security Warning
- FTP client richiede network client permissions
- File system access richiesto per download/upload
- Sandbox può limitare alcune funzionalità

### App Store Restrictions
- FTP non è API nativa Apple → può essere problematico
- App Store richiede notarization + Apple Developer Account
- Aggiornamenti non immediati (review process)

### Alternative
Se App Store è troppo restrittivo:
1. **Setapp** ($20/anno, 30% royalty) - Ottima per utility
2. **GitHub Sponsor** - Per supporto diretto
3. **Sito web** - DMG + Tauri Updater

---

## ✅ Riepilogo Azioni Immediata

Per iniziare oggi:

1. 📁 Creare file `src-tauri/entitlements.plist`
2. ⚙️ Aggiornare `src-tauri/tauri.conf.json` con sezione macOS
3. 🖥️ Testare build su Mac (se disponibile)
4. 📝 Preparare screenshots 6.5" (16:9) minimo 4
5. 🌐 Creare privacy policy base
6. 🎯 Decidere distribuzione: GitHub o Mac App Store

---

**Creato da**: OpenCode (GLM-4.7) - Cesare
**Data**: 2025-12-24
**Stato**: Piano completo, pronto per implementazione
