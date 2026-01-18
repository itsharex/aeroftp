/**
 * Humanized Activity Log Hook
 * Provides friendly, conversational log messages like a colleague notifying you
 * 
 * Supports multiple languages with a warm, professional tone
 */

import { useCallback } from 'react';
import { useActivityLog, OperationType, OperationStatus } from './useActivityLog';
import { useI18n } from '../i18n';

// ============================================================================
// Humanized Message Templates (with {placeholders})
// ============================================================================

interface HumanizedMessages {
    [key: string]: {
        [operation: string]: {
            start?: string;
            success?: string;
            error?: string;
            progress?: string;
        };
    };
}

const HUMANIZED_MESSAGES: HumanizedMessages = {
    en: {
        CONNECT: {
            start: "Connecting to {server}... 🔌",
            success: "Welcome! 🚀 Connected to {server}",
            error: "Couldn't reach {server}. Check connection details?"
        },
        DISCONNECT: {
            start: "Disconnecting from server...",
            success: "All done! Disconnected safely 👋",
            error: "Had trouble disconnecting, but you should be fine"
        },
        UPLOAD: {
            start: "Uploading {filename}... this might take a moment ⬆️",
            success: "Nice! {filename} is now on the server 🎉",
            error: "Upload failed for {filename}. Want to try again?",
            progress: "Uploading {filename}: {percent}% ({speed})"
        },
        DOWNLOAD: {
            start: "Grabbing {filename} for you... ⬇️",
            success: "Got it! {filename} is ready in your folder 📥",
            error: "Couldn't download {filename}. The file might have moved?",
            progress: "Downloading {filename}: {percent}% ({speed})"
        },
        DELETE: {
            start: "Removing {filename}... 🗑️",
            success: "Done! {filename} has been deleted",
            error: "Couldn't delete {filename}. Check permissions?"
        },
        RENAME: {
            start: "Renaming {oldname} to {newname}...",
            success: "Renamed! {oldname} → {newname} ✏️",
            error: "Couldn't rename the file. Name already taken?"
        },
        MKDIR: {
            start: "Creating folder {foldername}...",
            success: "Created new folder: {foldername} 📁",
            error: "Couldn't create folder. It might already exist?"
        },
        NAVIGATE: {
            success: "Now viewing: {path}",
        },
        DELETE_MULTIPLE: {
            start: "Removing {count} items... 🗑️",
            success: "Cleaned up! Deleted {folders} and {files}",
            error: "Some items couldn't be deleted"
        },
        UPLOAD_MULTIPLE: {
            start: "Uploading {count} items... ⬆️",
            success: "All {count} items uploaded successfully! 🎉",
            error: "Some uploads failed"
        },
        DOWNLOAD_MULTIPLE: {
            start: "Downloading {count} items... ⬇️",
            success: "Got all {count} items! 📥",
            error: "Some downloads failed"
        }
    },
    it: {
        CONNECT: {
            start: "Connessione a {server}... 🔌",
            success: "Benvenuto! 🚀 Connesso a {server}",
            error: "Non riesco a raggiungere {server}. Controlla i dati?"
        },
        DISCONNECT: {
            start: "Mi disconnetto dal server...",
            success: "Tutto ok! Disconnesso in sicurezza 👋",
            error: "Ho avuto problemi a disconnettermi, ma dovrebbe andare bene"
        },
        UPLOAD: {
            start: "Sto caricando {filename}... ci vuole un attimo ⬆️",
            success: "Fatto! {filename} è ora sul server 🎉",
            error: "Caricamento fallito per {filename}. Riproviamo?",
            progress: "Caricando {filename}: {percent}% ({speed})"
        },
        DOWNLOAD: {
            start: "Sto scaricando {filename} per te... ⬇️",
            success: "Ecco! {filename} è pronto nella tua cartella 📥",
            error: "Non riesco a scaricare {filename}. Il file è stato spostato?",
            progress: "Scaricando {filename}: {percent}% ({speed})"
        },
        DELETE: {
            start: "Sto eliminando {filename}... 🗑️",
            success: "Fatto! {filename} è stato eliminato",
            error: "Non riesco a eliminare {filename}. Controlla i permessi?"
        },
        RENAME: {
            start: "Rinomino {oldname} in {newname}...",
            success: "Rinominato! {oldname} → {newname} ✏️",
            error: "Non riesco a rinominare. Nome già in uso?"
        },
        MKDIR: {
            start: "Creo la cartella {foldername}...",
            success: "Creata nuova cartella: {foldername} 📁",
            error: "Non riesco a creare la cartella. Esiste già?"
        },
        NAVIGATE: {
            success: "Ora stai visualizzando: {path}",
        },
        DELETE_MULTIPLE: {
            start: "Sto rimuovendo {count} elementi... 🗑️",
            success: "Pulizia fatta! Eliminati {folders} e {files}",
            error: "Alcuni elementi non sono stati eliminati"
        },
        UPLOAD_MULTIPLE: {
            start: "Carico {count} elementi... ⬆️",
            success: "Tutti i {count} elementi caricati! 🎉",
            error: "Alcuni caricamenti sono falliti"
        },
        DOWNLOAD_MULTIPLE: {
            start: "Scarico {count} elementi... ⬇️",
            success: "Ho preso tutti i {count} elementi! 📥",
            error: "Alcuni download sono falliti"
        }
    },
    fr: {
        CONNECT: {
            start: "Connexion à {server}... 🔌",
            success: "Bienvenue! 🚀 Connecté à {server}",
            error: "Impossible de joindre {server}. Vérifie les paramètres ?"
        },
        DISCONNECT: {
            start: "Déconnexion du serveur...",
            success: "Terminé ! Déconnecté en toute sécurité 👋",
            error: "Problème de déconnexion, mais ça devrait aller"
        },
        UPLOAD: {
            start: "Envoi de {filename} en cours... ⬆️",
            success: "Super ! {filename} est maintenant sur le serveur 🎉",
            error: "L'envoi de {filename} a échoué. On réessaie ?",
            progress: "Envoi de {filename}: {percent}% ({speed})"
        },
        DOWNLOAD: {
            start: "Téléchargement de {filename}... ⬇️",
            success: "Voilà ! {filename} est dans ton dossier 📥",
            error: "Impossible de télécharger {filename}. Fichier déplacé ?",
            progress: "Téléchargement de {filename}: {percent}% ({speed})"
        },
        DELETE: {
            start: "Suppression de {filename}... 🗑️",
            success: "Fait ! {filename} a été supprimé",
            error: "Impossible de supprimer {filename}. Vérifie les permissions ?"
        },
        RENAME: {
            start: "Renommage de {oldname} en {newname}...",
            success: "Renommé ! {oldname} → {newname} ✏️",
            error: "Impossible de renommer. Nom déjà utilisé ?"
        },
        MKDIR: {
            start: "Création du dossier {foldername}...",
            success: "Nouveau dossier créé : {foldername} 📁",
            error: "Impossible de créer le dossier. Il existe déjà ?"
        },
        NAVIGATE: {
            success: "Affichage de : {path}",
        },
        DELETE_MULTIPLE: {
            start: "Suppression de {count} éléments... 🗑️",
            success: "Nettoyé ! Supprimés {folders} et {files}",
            error: "Certains éléments n'ont pas pu être supprimés"
        },
        UPLOAD_MULTIPLE: {
            start: "Envoi de {count} éléments... ⬆️",
            success: "Les {count} éléments ont été envoyés ! 🎉",
            error: "Certains envois ont échoué"
        },
        DOWNLOAD_MULTIPLE: {
            start: "Téléchargement de {count} éléments... ⬇️",
            success: "Les {count} éléments récupérés ! 📥",
            error: "Certains téléchargements ont échoué"
        }
    },
    es: {
        CONNECT: {
            start: "Conectando a {server}... 🔌",
            success: "¡Bienvenido! 🚀 Conectado a {server}",
            error: "No puedo alcanzar {server}. ¿Verificamos los datos?"
        },
        DISCONNECT: {
            start: "Desconectando del servidor...",
            success: "¡Todo listo! Desconectado de forma segura 👋",
            error: "Tuve problemas al desconectar, pero debería estar bien"
        },
        UPLOAD: {
            start: "Subiendo {filename}... puede tomar un momento ⬆️",
            success: "¡Genial! {filename} ya está en el servidor 🎉",
            error: "Falló la subida de {filename}. ¿Intentamos de nuevo?",
            progress: "Subiendo {filename}: {percent}% ({speed})"
        },
        DOWNLOAD: {
            start: "Descargando {filename} para ti... ⬇️",
            success: "¡Listo! {filename} está en tu carpeta 📥",
            error: "No pude descargar {filename}. ¿Se movió el archivo?",
            progress: "Descargando {filename}: {percent}% ({speed})"
        },
        DELETE: {
            start: "Eliminando {filename}... 🗑️",
            success: "¡Hecho! {filename} ha sido eliminado",
            error: "No pude eliminar {filename}. ¿Verificamos permisos?"
        },
        RENAME: {
            start: "Renombrando {oldname} a {newname}...",
            success: "¡Renombrado! {oldname} → {newname} ✏️",
            error: "No pude renombrar. ¿El nombre ya existe?"
        },
        MKDIR: {
            start: "Creando carpeta {foldername}...",
            success: "Nueva carpeta creada: {foldername} 📁",
            error: "No pude crear la carpeta. ¿Ya existe?"
        },
        NAVIGATE: {
            success: "Ahora viendo: {path}",
        },
        DELETE_MULTIPLE: {
            start: "Eliminando {count} elementos... 🗑️",
            success: "¡Limpieza hecha! Eliminados {folders} y {files}",
            error: "Algunos elementos no pudieron eliminarse"
        },
        UPLOAD_MULTIPLE: {
            start: "Subiendo {count} elementos... ⬆️",
            success: "¡Todos los {count} elementos subidos! 🎉",
            error: "Algunas subidas fallaron"
        },
        DOWNLOAD_MULTIPLE: {
            start: "Descargando {count} elementos... ⬇️",
            success: "¡Obtuve los {count} elementos! 📥",
            error: "Algunas descargas fallaron"
        }
    },
    zh: {
        CONNECT: {
            start: "正在连接 {server}... 🔌",
            success: "欢迎！🚀 已连接到 {server}",
            error: "无法连接到 {server}，请检查连接设置"
        },
        DISCONNECT: {
            start: "正在断开连接...",
            success: "完成！已安全断开连接 👋",
            error: "断开连接时遇到问题"
        },
        UPLOAD: {
            start: "正在上传 {filename}... ⬆️",
            success: "太棒了！{filename} 已上传到服务器 🎉",
            error: "{filename} 上传失败，要重试吗？",
            progress: "正在上传 {filename}: {percent}% ({speed})"
        },
        DOWNLOAD: {
            start: "正在下载 {filename}... ⬇️",
            success: "完成！{filename} 已保存到你的文件夹 📥",
            error: "无法下载 {filename}，文件可能已移动？",
            progress: "正在下载 {filename}: {percent}% ({speed})"
        },
        DELETE: {
            start: "正在删除 {filename}... 🗑️",
            success: "完成！{filename} 已删除",
            error: "无法删除 {filename}，请检查权限"
        },
        RENAME: {
            start: "正在将 {oldname} 重命名为 {newname}...",
            success: "已重命名！{oldname} → {newname} ✏️",
            error: "无法重命名，该名称可能已存在？"
        },
        MKDIR: {
            start: "正在创建文件夹 {foldername}...",
            success: "已创建新文件夹：{foldername} 📁",
            error: "无法创建文件夹，可能已存在？"
        },
        NAVIGATE: {
            success: "当前位置：{path}",
        },
        DELETE_MULTIPLE: {
            start: "正在删除 {count} 个项目... 🗑️",
            success: "清理完成！已删除 {folders} 和 {files}",
            error: "部分项目无法删除"
        },
        UPLOAD_MULTIPLE: {
            start: "正在上传 {count} 个项目... ⬆️",
            success: "全部 {count} 个项目上传成功！🎉",
            error: "部分上传失败"
        },
        DOWNLOAD_MULTIPLE: {
            start: "正在下载 {count} 个项目... ⬇️",
            success: "已获取全部 {count} 个项目！📥",
            error: "部分下载失败"
        }
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Replace placeholders in a message template
 */
function formatMessage(template: string, vars: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
}

/**
 * Get pluralized count text
 */
function pluralize(count: number, singular: string, plural: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

// ============================================================================
// Hook
// ============================================================================

export interface HumanizedLogParams {
    filename?: string;
    oldname?: string;
    newname?: string;
    foldername?: string;
    server?: string;
    path?: string;
    count?: number;
    folders?: number;
    files?: number;
    percent?: number;
    speed?: string;
    isRemote?: boolean;
}

export type HumanizedOperationType = 
    | 'CONNECT' | 'DISCONNECT' 
    | 'UPLOAD' | 'DOWNLOAD' 
    | 'DELETE' | 'RENAME' | 'MKDIR' 
    | 'NAVIGATE'
    | 'DELETE_MULTIPLE' | 'UPLOAD_MULTIPLE' | 'DOWNLOAD_MULTIPLE';

export function useHumanizedLog() {
    const activityLog = useActivityLog();
    const { language } = useI18n();

    /**
     * Get the humanized message for an operation
     */
    const getMessage = useCallback((
        operation: HumanizedOperationType,
        phase: 'start' | 'success' | 'error' | 'progress',
        params: HumanizedLogParams = {}
    ): string => {
        const lang = HUMANIZED_MESSAGES[language] || HUMANIZED_MESSAGES['en'];
        const opMessages = lang[operation] || HUMANIZED_MESSAGES['en'][operation];
        
        if (!opMessages || !opMessages[phase]) {
            // Fallback to English
            const fallback = HUMANIZED_MESSAGES['en'][operation];
            if (!fallback || !fallback[phase]) {
                return `${operation} ${phase}`;
            }
            return formatMessage(fallback[phase]!, buildVars(params, language));
        }

        return formatMessage(opMessages[phase]!, buildVars(params, language));
    }, [language]);

    /**
     * Build variables object for message formatting
     */
    const buildVars = (params: HumanizedLogParams, lang: string): Record<string, string | number> => {
        const vars: Record<string, string | number> = { ...params } as Record<string, string | number>;
        
        // Add formatted folder/file counts
        if (params.folders !== undefined) {
            const folderWord = lang === 'it' ? (params.folders === 1 ? 'cartella' : 'cartelle') :
                              lang === 'fr' ? (params.folders === 1 ? 'dossier' : 'dossiers') :
                              lang === 'es' ? (params.folders === 1 ? 'carpeta' : 'carpetas') :
                              lang === 'zh' ? '个文件夹' :
                              (params.folders === 1 ? 'folder' : 'folders');
            vars.folders = lang === 'zh' ? `${params.folders}${folderWord}` : pluralize(params.folders, folderWord, folderWord);
        }
        
        if (params.files !== undefined) {
            const fileWord = lang === 'it' ? (params.files === 1 ? 'file' : 'file') :
                            lang === 'fr' ? (params.files === 1 ? 'fichier' : 'fichiers') :
                            lang === 'es' ? (params.files === 1 ? 'archivo' : 'archivos') :
                            lang === 'zh' ? '个文件' :
                            (params.files === 1 ? 'file' : 'files');
            vars.files = lang === 'zh' ? `${params.files}${fileWord}` : pluralize(params.files, fileWord, fileWord);
        }

        return vars;
    };

    /**
     * Log a humanized operation start
     */
    const logStart = useCallback((
        operation: HumanizedOperationType,
        params: HumanizedLogParams = {}
    ): string => {
        const message = getMessage(operation, 'start', params);
        const opType = operation.includes('_') ? operation.split('_')[0] as OperationType : operation as OperationType;
        return activityLog.log(opType, message, 'running');
    }, [getMessage, activityLog]);

    /**
     * Log a humanized success
     */
    const logSuccess = useCallback((
        operation: HumanizedOperationType,
        params: HumanizedLogParams = {},
        existingId?: string
    ): string => {
        const message = getMessage(operation, 'success', params);
        const opType = operation.includes('_') ? operation.split('_')[0] as OperationType : operation as OperationType;
        
        if (existingId) {
            activityLog.updateEntry(existingId, { status: 'success', message });
            return existingId;
        }
        return activityLog.log(opType, message, 'success');
    }, [getMessage, activityLog]);

    /**
     * Log a humanized error
     */
    const logError = useCallback((
        operation: HumanizedOperationType,
        params: HumanizedLogParams = {},
        existingId?: string
    ): string => {
        const message = getMessage(operation, 'error', params);
        const opType = operation.includes('_') ? operation.split('_')[0] as OperationType : operation as OperationType;
        
        if (existingId) {
            activityLog.updateEntry(existingId, { status: 'error', message });
            return existingId;
        }
        return activityLog.log(opType, message, 'error');
    }, [getMessage, activityLog]);

    /**
     * Update progress message
     */
    const updateProgress = useCallback((
        id: string,
        operation: HumanizedOperationType,
        params: HumanizedLogParams
    ): void => {
        const message = getMessage(operation, 'progress', params);
        activityLog.updateEntry(id, { message });
    }, [getMessage, activityLog]);

    /**
     * Log navigation (instant success, no start phase)
     */
    const logNavigate = useCallback((path: string, isRemote: boolean): string => {
        const location = isRemote ? '🌐' : '💻';
        const message = getMessage('NAVIGATE', 'success', { path }) + ` ${location}`;
        return activityLog.log('NAVIGATE', message, 'success');
    }, [getMessage, activityLog]);

    return {
        logStart,
        logSuccess,
        logError,
        updateProgress,
        logNavigate,
        // Expose raw log for custom messages
        log: activityLog.log,
        updateEntry: activityLog.updateEntry,
    };
}

export default useHumanizedLog;
