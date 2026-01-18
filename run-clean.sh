#!/bin/bash
# Script per avviare AeroFTP senza contaminazione da snap

# Ripristina ambiente pulito
unset GTK_PATH GIO_MODULE_DIR LOCPATH GTK_IM_MODULE_FILE GTK_EXE_PREFIX GSETTINGS_SCHEMA_DIR
export PATH="/home/axpdev/.cargo/bin:/home/axpdev/.bun/bin:/home/axpdev/.local/bin:/usr/local/bin:/usr/bin:/bin"
export XDG_DATA_DIRS="/usr/share:/usr/local/share"

cd /var/www/html/FTP_CLIENT_GUI

# Avvia con npm
npm run tauri dev
