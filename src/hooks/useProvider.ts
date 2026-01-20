/**
 * useProvider Hook
 * 
 * React hook for interacting with multi-protocol storage providers.
 * Provides a unified API for FTP, WebDAV, S3, and other storage backends.
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ProviderType, ProviderOptions } from '../types';

// Types for provider operations
export interface ProviderConnectionParams {
    protocol: ProviderType;
    server: string;
    port?: number;
    username: string;
    password: string;
    initial_path?: string;
    bucket?: string;       // S3
    region?: string;       // S3
    endpoint?: string;     // S3-compatible
    path_style?: boolean;  // S3
}

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

export interface ProviderListResponse {
    files: RemoteEntry[];
    current_path: string;
}

export interface ProviderConnectionInfo {
    connected: boolean;
    protocol: string | null;
    display_name: string | null;
    server_info: string | null;
}

export interface UseProviderResult {
    // State
    isConnected: boolean;
    isConnecting: boolean;
    connectionInfo: ProviderConnectionInfo | null;
    currentPath: string;
    files: RemoteEntry[];
    error: string | null;

    // Connection
    connect: (params: ProviderConnectionParams) => Promise<boolean>;
    disconnect: () => Promise<void>;
    checkConnection: () => Promise<ProviderConnectionInfo>;

    // Navigation
    listFiles: (path?: string) => Promise<RemoteEntry[]>;
    changeDir: (path: string) => Promise<void>;
    goUp: () => Promise<void>;
    pwd: () => Promise<string>;

    // File operations
    download: (remotePath: string, localPath: string) => Promise<void>;
    upload: (localPath: string, remotePath: string) => Promise<void>;
    mkdir: (path: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    deleteDir: (path: string, recursive?: boolean) => Promise<void>;
    rename: (from: string, to: string) => Promise<void>;

    // Info
    stat: (path: string) => Promise<RemoteEntry>;
    exists: (path: string) => Promise<boolean>;
    fileSize: (path: string) => Promise<number>;
    serverInfo: () => Promise<string>;

    // Utils
    keepAlive: () => Promise<void>;
    clearError: () => void;
}

/**
 * Hook for multi-protocol storage provider operations
 */
export function useProvider(): UseProviderResult {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionInfo, setConnectionInfo] = useState<ProviderConnectionInfo | null>(null);
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<RemoteEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Connect to provider
    const connect = useCallback(async (params: ProviderConnectionParams): Promise<boolean> => {
        setIsConnecting(true);
        setError(null);

        try {
            await invoke('provider_connect', { params });

            // Get connection info
            const info = await invoke<ProviderConnectionInfo>('provider_check_connection');
            setConnectionInfo(info);
            setIsConnected(true);

            // List initial files
            const response = await invoke<ProviderListResponse>('provider_list_files', { path: null });
            setFiles(response.files);
            setCurrentPath(response.current_path);

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setIsConnected(false);
            return false;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(async () => {
        try {
            await invoke('provider_disconnect');
        } catch (err) {
            console.warn('Disconnect error:', err);
        } finally {
            setIsConnected(false);
            setConnectionInfo(null);
            setFiles([]);
            setCurrentPath('/');
        }
    }, []);

    // Check connection status
    const checkConnection = useCallback(async (): Promise<ProviderConnectionInfo> => {
        try {
            const info = await invoke<ProviderConnectionInfo>('provider_check_connection');
            setConnectionInfo(info);
            setIsConnected(info.connected);
            return info;
        } catch (err) {
            const info: ProviderConnectionInfo = {
                connected: false,
                protocol: null,
                display_name: null,
                server_info: null,
            };
            setConnectionInfo(info);
            setIsConnected(false);
            return info;
        }
    }, []);

    // List files
    const listFiles = useCallback(async (path?: string): Promise<RemoteEntry[]> => {
        try {
            const response = await invoke<ProviderListResponse>('provider_list_files', {
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
    }, []);

    // Change directory
    const changeDir = useCallback(async (path: string) => {
        try {
            const response = await invoke<ProviderListResponse>('provider_change_dir', { path });
            setFiles(response.files);
            setCurrentPath(response.current_path);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Go up
    const goUp = useCallback(async () => {
        try {
            const response = await invoke<ProviderListResponse>('provider_go_up');
            setFiles(response.files);
            setCurrentPath(response.current_path);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Get current directory
    const pwd = useCallback(async (): Promise<string> => {
        try {
            const path = await invoke<string>('provider_pwd');
            setCurrentPath(path);
            return path;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Download file
    const download = useCallback(async (remotePath: string, localPath: string) => {
        try {
            await invoke('provider_download_file', {
                remotePath,
                localPath
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Upload file
    const upload = useCallback(async (localPath: string, remotePath: string) => {
        try {
            await invoke('provider_upload_file', {
                localPath,
                remotePath
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Create directory
    const mkdir = useCallback(async (path: string) => {
        try {
            await invoke('provider_mkdir', { path });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Delete file
    const deleteFile = useCallback(async (path: string) => {
        try {
            await invoke('provider_delete_file', { path });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Delete directory
    const deleteDir = useCallback(async (path: string, recursive: boolean = false) => {
        try {
            await invoke('provider_delete_dir', { path, recursive });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Rename
    const rename = useCallback(async (from: string, to: string) => {
        try {
            await invoke('provider_rename', { from, to });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Stat
    const stat = useCallback(async (path: string): Promise<RemoteEntry> => {
        try {
            return await invoke<RemoteEntry>('provider_stat', { path });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Exists
    const exists = useCallback(async (path: string): Promise<boolean> => {
        try {
            return await invoke<boolean>('provider_exists', { path });
        } catch (err) {
            return false;
        }
    }, []);

    // File size
    const fileSize = useCallback(async (path: string): Promise<number> => {
        try {
            return await invoke<number>('provider_file_size', { path });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Server info
    const serverInfo = useCallback(async (): Promise<string> => {
        try {
            return await invoke<string>('provider_server_info');
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        }
    }, []);

    // Keep alive
    const keepAlive = useCallback(async () => {
        try {
            await invoke('provider_keep_alive');
        } catch (err) {
            console.warn('Keep alive failed:', err);
        }
    }, []);

    return {
        // State
        isConnected,
        isConnecting,
        connectionInfo,
        currentPath,
        files,
        error,

        // Connection
        connect,
        disconnect,
        checkConnection,

        // Navigation
        listFiles,
        changeDir,
        goUp,
        pwd,

        // File operations
        download,
        upload,
        mkdir,
        deleteFile,
        deleteDir,
        rename,

        // Info
        stat,
        exists,
        fileSize,
        serverInfo,

        // Utils
        keepAlive,
        clearError,
    };
}

export default useProvider;
