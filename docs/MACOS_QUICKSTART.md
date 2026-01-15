# 🚀 AeroFTP macOS Quick Start Guide

## Per iniziare subito (Oggi)

### 1️⃣ Aggiornare Versioni
```bash
# Frontend (package.json)
vim package.json
# "version": "0.7.0"

# Backend (src-tauri/Cargo.toml)
vim src-tauri/Cargo.toml
# version = "0.7.2"

# Tauri config (tauri.conf.json)
vim tauri.conf.json
# "version": "0.7.0"
```

### 2️⃣ Testare Build (su Linux)

```bash
# Installare strumenti per macOS build
sudo apt-get update
sudo apt-get install xz libfuse2

# Build app
npm run tauri build

# Output: src-tauri/target/release/bundle/dmg/AeroFTP-0.7.0-x86_64.dmg
```

### 3️⃣ Preparare Assets

#### Screenshots (minimo 4, 6.5" x 16.9")
```
screenshots/
├── 1-main.png       6.5" x 16.9" (schermata principale)
├── 2-browse.png     6.5" x 16.9" (navigazione file)
├── 3-transfer.png    6.5" x 16.9" (upload/download)
└── 4-ai.png         6.5" x 16.9" (AI assistant)
```

**Come creare:**
1. Apri app in macOS
2. Premi `Cmd+Shift+4` per screenshot
3. Seleiona "Selected Portion" per dimensione precisa
4. Salva in PNG 2x retina (1290 x 3360 px)

### 4️⃣ Build su Mac Reale (per testing completo)

Se hai Mac a disposizione:

```bash
# Clonare repository su Mac
git clone https://github.com/axpnet/aeroftp.git
cd aeroftp

# Installare dipendenze
npm install

# Testare in dev mode
npm run tauri dev

# Build production
npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon
# Oppure:
npm run tauri build -- --target x86_64-apple-darwin     # Intel
```

---

## 🧪 Testing Checklist su macOS

### 🌐 Funzionalità Core
- [ ] Connessione FTP (FTP, FTPS se supportato)
- [ ] Navigazione file (pannello locale + remoto)
- [ ] Upload file singolo
- [ ] Download file singolo
- [ ] Upload cartella (nuova feature!)
- [ ] Download cartella (nuova feature!)
- [ ] Delete file remoto
- [ ] Delete cartella remota (nuovo fix!)
- [ ] Rename file/folder
- [ ] Create folder

### 🎬 Preview System
- [ ] Preview immagini
- [ ] Preview PDF
- [ ] Preview audio (AeroPlayer)
- [ ] Preview video
- [ ] Preview text files

### 🤖 DevTools
- [ ] AI Chat funzionante
- [ ] SSH Terminal (Unix only)
- [ ] Code Editor con syntax highlighting

### 📊 UI/UX
- [ ] Dark/Light theme toggle
- [ ] Responsive layout
- [ ] Drag & drop funzionale
- [ ] Context menu funzionante
- [ ] Progress bar trasferimenti
- [ ] Toast notifications
- [ ] Keyboard shortcuts

### 🏗️ macOS Specific
- [ ] Menu bar integrato (Cmd+, per Settings, etc)
- [ ] Dock icon correttamente visualizzata
- [ ] Cmd+Q chiude l'app
- [ ] Cmd+R refresh
- [ ] Cmd+N new folder
- [ ] Spotlight integration (opzionale)
- [ ] File associations (.ftp?) (opzionale)

---

## 🐛 macOS Known Issues da Monitorare

### Comuni
- ⚠️ **Sandbox warnings**: App in sandbox può avere limiti FTP
- ⚠️ **Quarantine**: DMG scaricato mostra "non verificato" → normale per distribuzione diretta
- ⚠️ **Notarization**: Richiesto per evitare avvisi su macOS
- ⚠️ **Apple Silicon**: Testare su M1/M2/M3 + Rosetta

### Potenziali
- 🔍 **FTP over FTPS**: Server non-standard possono fallire
- 🔍 **Large transfers**: Timeout su file > 2GB
- 🔍 **Unicode filenames**: FTP server possono non supportare caratteri speciali
- 🔍 **Firewall**: macOS firewall può bloccare connessioni attive

---

## 📦 Distribuzione: GitHub (Consigliato per Inizio)

### Vantaggi
- ✅ Gratuito e immediato
- ✅ Controllo completo
- ✅ Auto-updates integrabili
- ✅ Issue tracking integrato
- ✅ Analytics (GitHub insights)

### Passaggi Rapidi

```bash
# 1. Tag la release
git tag -a v0.7.0 -m "Release v0.7.0 - macOS Support"
git push origin v0.7.0

# 2. Build (su Mac o Linux con toolchain)
npm run tauri build -- --target universal-apple-darwin

# 3. Notarize (se hai Mac)
xcrun notarytool submit \
  "src-tauri/target/release/bundle/dmg/AeroFTP-0.7.0-universal.dmg" \
  --apple-id "YOUR_APPLE_ID" \
  --password "app-password" \
  --wait

# 4. Stapler (allega ticket)
xcrun stapler staple "src-tauri/target/release/bundle/dmg/AeroFTP-0.7.0-universal.dmg"

# 5. Upload su GitHub
gh release create v0.7.0 \
  --title "AeroFTP v0.7.0 - macOS Release" \
  --notes "See CHANGELOG.md for details" \
  src-tauri/target/release/bundle/dmg/*.dmg
```

---

## 🛑 Distribuzione: Mac App Store (Opzionale)

### Considerazioni
- 💰 **Costo**: $99/anno
- ⏰ **Tempo**: 1-2 settimane per approvazione
- 🚫 **Restrizioni**: FTP non API Apple può essere problematico

### Quando scegliere Mac App Store?
- Hai marketing budget
- Vuoi massima visibilità
- Accetti processo review lungo
- Sei disposto a pagare $99/anno

### Alternativa: Setapp
- 💰 **Costo**: $20/mese o $199/anno
- ✅ **Vantaggi**:
  - Target utenti professionali
  - Meno restrittivo di App Store
  - Pubblicazione più rapida
  - Supporto diretto agli utenti
- 🔗 [Setapp per sviluppatori](https://setapp.com/developers)

---

## 📝 README.md - Sezione macOS da Aggiungere

Aggiungi a README.md:

```markdown
## 🍎 macOS Download

### Versione Intel + Apple Silicon (Universal)
[Download DMG](https://github.com/axpnet/aeroftp/releases/download/v0.7.0/AeroFTP-0.7.0-universal.dmg) (100MB)

### Per Apple Silicon (M1/M2/M3)
[Download DMG](https://github.com/axpnet/aeroftp/releases/download/v0.7.0/AeroFTP-0.7.0-aarch64.dmg) (80MB)

### Per Intel
[Download DMG](https://github.com/axpnet/aeroftp/releases/download/v0.7.0/AeroFTP-0.7.0-x86_64.dmg) (80MB)

**Requisiti**:
- macOS 13.0 (Ventura) o superiore
- 100MB spazio disco
- Connessione internet (per FTP)

**Installazione**:
1. Download il file `.dmg`
2. Trascina AeroFTP in Applications
3. Apri dal Launchpad o Applications

**Note di sicurezza**:
L'app è firmata e notarizzata. Se ricevi avviso di sicurezza:
1. Apri "Impostazioni di Sistema" > "Privacy e Sicurezza"
2. Trova AeroFTP nella lista
3. Clicca "Apri comunque"
4. L'avviso non comparirà più
```

---

## 🎯 Azioni Immediate per Te

Oggi stesso:

### 📋 Checklist Ora
- [ ] Aggiornare versioni nei 3 file (package.json, Cargo.toml, tauri.conf.json)
- [ ] Creare directory `screenshots/`
- [ ] Creare 4 screenshot (6.5" x 16.9")
- [ ] Scrivere 1 paragrafo privacy policy
- [ ] Testare build su Mac (se disponibile)
- [ ] Creare tag git per v0.7.0
- [ ] Preparare CHANGELOG.md per v0.7.0

### 📊 Prossimi 3 giorni
- Day 1: Testing + bug fixes
- Day 2: Build + notarization (se Mac) o DMG test (se Linux)
- Day 3: Release su GitHub
- Day 4: Annuncio sociale + aggiornamento README

---

## 💡 Suggerimenti Finali

### Per Il Primo Release macOS:
**Vai con GitHub Release** - È gratuito, immediato, ti permette di:
- Testare con utenti reali
- Ricevere feedback
- Iterare velocemente
- Costruire community

### Per Release Futura:
**Setapp può essere meglio** se:
- Target professionale (non consumer)
- Disposto a pagare per distribuzione
- Vuoi supporto diretto
- Eviti burocrazia App Store

---

**Last Updated**: 2026-01-15  
**Current Version**: 0.9.5
