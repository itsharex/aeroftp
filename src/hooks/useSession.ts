/**
 * useSession Hook
 * 
 * React hook for multi-session provider management.
 * Supports concurrent connections to multiple providers (FTP, OAuth, etc.)
 * Each session is identified by a unique session_id.
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ProviderType } from '../types';

// Connection parameters for session
export interface SessionConnectParams {
    protocol: ProviderType;
    server?: string;
    port?: number;
    username?: string;
    password?: string;
    initial_path?: string;
    bucket?: string;
    region?: string;
    endpoint?: string;
    path_style?: boolean;
    // OAuth2 credentials
    client_id?: string;
    client_secret?: string;
}

// Session info from backend
export interface SessionInfo {
    session_id: string;
    provider_type: string;
    display_name: string;
    connected_at: number;
    last_activity: number;
    current_path: string;
}

// File entry from provider
export interface RemoteEntry {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    modified: string | null;
    permissions: string | null;
    owner: string | null;
    group: string | null;
    is_symlink: boolean;
    link_target: string | null;
    mime_type: string | null;
    metadata: Record<string, string>;
}

export interface SessionListResponse {
    files: RemoteEntry[];
    current_path: string;
}

export interface UseSessionResult {
    // State
    activeSessionId: string | null;
    sessions: SessionInfo[];
    isConnecting: boolean;
    error: string | null;
    currentPath: string;
    files: RemoteEntry[];

    // Session lifecycle
    connect: (params: SessionConnectParams) => Promise<string | null>;
    disconnect: (sessionId?: string) => Promise<void>;
    switchSession: (sessionId: string) => Promise<void>;
    listSessions: () => Promise<SessionInfo[]>;
    getSessionInfo: (sessionId?: string) => Promise<SessionInfo | null>;

    // File operations (all use active session by default, or specified sessionId)
    listFiles: (path?: string, sessionId?: string) => Promise<RemoteEntry[]>;
    changeDir: (path: string, sessionId?: string) => Promise<void>;
    mkdir: (path: string, sessionId?: string) => Promise<void>;
    deleteItem: (path: string, isDir: boolean, sessionId?: string) => Promise<void>;
    rename: (from: string, to: string, sessionId?: string) => Promise<void>;
    download: (remotePath: string, localPath: string, sessionId?: string) => Promise<void>;
    upload: (localPath: string, remotePath: string, sessionId?: string) => Promise<void>;
    createShareLink: (path: string, sessionId?: string) => Promise<string>;

    // Utils
    clearError: () => void;
}

/**
 * Hook for multi-session provider management
 */
export function useSession(): UseSessionResult {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<RemoteEntry[]>([]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Connect to provider, returns session_id
    const connect = useCallback(async (params: SessionConnectParams): Promise<string | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            const sessionId = await invoke<string>('session_connect', { params });
            setActiveSessionId(sessionId);

            // Refresh session list
            const sessionList = await invoke<SessionInfo[]>('session_list');
            setSessions(sessionList);

            // Get initial file listing
            const response = await invoke<SessionListResponse>('session_list_files', {
                sessionId,
                path: null
            });
            setFiles(response.files);
            setCurrentPath(response.current_path);

            return sessionId;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Disconnect session (active if not specified)
    const disconnect = useCallback(async (sessionId?: string) => {
        try {
            await invoke('session_disconnect', { sessionId: sessionId || activeSessionId });
            
            // Refresh session list
            const sessionList = await invoke<SessionInfo[]>('session_list');
            setSessions(sessionList);

            // If we disconnected the active session, switch to another or clear
            if (!sessionId || sessionId === activeSessionId) {
                if (sessionList.length > 0) {
                    setActiveSessionId(sessionList[0].session_id);
                    // Refresh files for new active session
                    const response = await invoke<SessionListResponse>('session_list_files', {
                        sessionId: sessionList[0].session_id,
                        path: null
                    });
                    setFiles(response.files);
                    setCurrentPath(response.current_path);
                } else {
                    setActiveSessionId(null);
                    setFiles([]);
                    setCurrentPath('/');
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        }
    }, [activeSessionId]);

    // Switch to a different session
    const switchSession = useCallback(async (sessionId: string) => {
        try {
            await invoke('session_switch', { sessionId });
            setActiveSessionId(sessionId);

            // Refresh files for new active session
            const response = await invoke<SessionListResponse>('session_list_files', {
                sessionId,
                path: null
            });
            setFiles(response.files);
            setCurrentPath(response.current_path);

            // Refresh session list
            const sessionList = await invoke<SessionInfo[]>('session_list');
            setSessions(sessionList);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        }
    }, []);

    // List all sessions
    const listSessions = useCallback(async (): Promise<SessionInfo[]> => {
        try {
            const sessionList = await invoke<SessionInfo[]>('session_list');
            setSessions(sessionList);
            return sessionList;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            return [];
        }
    }, []);

    // Get info for a session
    const getSessionInfo = useCallback(async (sessionId?: string): Promise<SessionInfo | null> => {
        try {
            return await invoke<SessionInfo>('session_info', {
                sessionId: sessionId || activeSessionId
            });
        } catch (err) {
            return null;
        }
    }, [activeSessionId]);

    // List files
    const listFiles = useCallback(async (path?: string, sessionId?: string): Promise<RemoteEntry[]> => {
        try {
            const response = await invoke<SessionListResponse>('session_list_files', {
                sessionId: sessionId || activeSessionId,
                path: path || null
            });
            setFiles(response.files);
            setCurrentPath(response.current_path);
            return response.files;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Change directory
    const changeDir = useCallback(async (path: string, sessionId?: string) => {
        try {
            const response = await invoke<SessionListResponse>('session_change_dir', {
                sessionId: sessionId || activeSessionId,
                path
            });
            setFiles(response.files);
            setCurrentPath(response.current_path);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Create directory
    const mkdir = useCallback(async (path: string, sessionId?: string) => {
        try {
            await invoke('session_mkdir', {
                sessionId: sessionId || activeSessionId,
                path
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Delete file or directory
    const deleteItem = useCallback(async (path: string, isDir: boolean, sessionId?: string) => {
        try {
            await invoke('session_delete', {
                sessionId: sessionId || activeSessionId,
                path,
                isDir
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Rename file or directory
    const rename = useCallback(async (from: string, to: string, sessionId?: string) => {
        try {
            await invoke('session_rename', {
                sessionId: sessionId || activeSessionId,
                from,
                to
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Download file
    const download = useCallback(async (remotePath: string, localPath: string, sessionId?: string) => {
        try {
            await invoke('session_download', {
                sessionId: sessionId || activeSessionId,
                remotePath,
                localPath
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Upload file
    const upload = useCallback(async (localPath: string, remotePath: string, sessionId?: string) => {
        try {
            await invoke('session_upload', {
                sessionId: sessionId || activeSessionId,
                localPath,
                remotePath
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    // Create share link
    const createShareLink = useCallback(async (path: string, sessionId?: string): Promise<string> => {
        try {
            return await invoke<string>('session_create_share_link', {
                sessionId: sessionId || activeSessionId,
                path
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, [activeSessionId]);

    return {
        // State
        activeSessionId,
        sessions,
        isConnecting,
        error,
        currentPath,
        files,

        // Session lifecycle
        connect,
        disconnect,
        switchSession,
        listSessions,
        getSessionInfo,

        // File operations
        listFiles,
        changeDir,
        mkdir,
        deleteItem,
        rename,
        download,
        upload,
        createShareLink,

        // Utils
        clearError,
    };
}

export default useSession;
