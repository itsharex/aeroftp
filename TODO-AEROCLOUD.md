# AeroCloud TODO - Prossimi Fix

## ✅ Completati (2025-12-24)

### Cloud Button persistente
- **Fix:** Creato stato `isCloudActive` separato in App.tsx
- **Implementazione:** Usa eventi `cloud-sync-status` per sincronizzare lo stato
- Il pulsante Cloud ora resta attivo quando AeroCloud è abilitato

### System Tray Icon (Ubuntu)
- **Implementato:** Tray icon nativa con Tauri 2.0
- **Menu:** Sync Now, Pause, Open Cloud Folder, Show AeroFTP, Quit
- **Interazione:** Click sinistro mostra la finestra

### Background Sync con Tokio 🚀
- **Implementato:** Vero background sync loop con `tokio::spawn`
- **Features:**
  - Loop periodico basato su `sync_interval_secs` (minimo 60s)
  - Connessione FTP dedicata per non bloccare UI principale
  - Salvataggio credenziali server per sync automatico
  - Check flag ogni 5 secondi per stop veloce
  - Emissione eventi status: syncing, active, error, disabled
  - Auto-disable se AeroCloud viene disabilitato

### Hook Modulare `useTraySync`
- **Creato:** Hook React per gestione frontend sync
- **Funzioni:** startBackgroundSync, stopBackgroundSync, toggleBackgroundSync

---

## 🔧 Bug Fix (Priorità)

### 1. Sync Progress 0% durante download
- **Problema:** La barra di progresso resta a 0% anche durante il download
- **Causa:** Il backend non emette eventi di progresso durante `perform_full_sync`
- **Fix:** Aggiungere emit di `cloud_status_change` con progress aggiornato nel loop di `process_comparison`

### 2. Upload progress simulation
- **Problema:** Upload non mostra progresso (già noto)
- **Fix:** Usare `upload_file_with_progress` con callback per emettere eventi

---

## ⬆️ Upgrade (Phase 5+)

### 3. Tray Icon Dinamica
- **Obiettivo:** Cambiare icona durante sync (animazione)
- **Features:**
  - Icona diversa per: idle, syncing, error
  - Aggiornare tooltip con ultimo sync

### 4. File Watcher Integration
- **Obiettivo:** Auto-sync quando file cambiano
- **Status:** CloudWatcher già implementato, serve collegare a background sync

---

## 📋 Altri miglioramenti futuri

- [ ] Conflict Resolution UI (mostrare conflitti e permettere scelta)
- [ ] Sync history/log viewer nel CloudPanel
- [ ] Notifiche desktop per sync completato/errori
- [ ] i18n per CloudPanel (dopo Phase X)
- [ ] Encrypt saved credentials (attualmente plaintext JSON)

---

*Ultimo aggiornamento: 2025-12-24 13:20*
