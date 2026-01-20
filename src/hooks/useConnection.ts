/**
 * useConnection Hook
 *
 * Unified connection hook that bridges legacy FTP commands with the new
 * multi-protocol StorageProvider system. This allows the application to
 * work seamlessly with FTP, WebDAV, S3, and other storage backends.
 *
 * For FTP connections, it delegates to the legacy commands for backward compatibility.
 * For other protocols, it uses the new provider_* commands.
 */

import { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ConnectionParams, ProviderType, FileListResponse, RemoteFile } from '../types';

// Provider connection parameters for backend
interface ProviderConnectionParams {
    protocol: string;
    server: string;
    port?: number;
    username: string;
    password: string;
    initial_path?: string;
    bucket?: string;
    region?: string;
    endpoint?: string;
    path_style?: boolean;
}

// Unified connection state
export interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    protocol: ProviderType;
    serverName: string;
    currentPath: string;
    error: string | null;
}

// Connection result with files
export interface ConnectionResult {
    success: boolean;
    files: RemoteFile[];
    currentPath: string;
    error?: string;
}

// List result
export interface ListResult {
    files: RemoteFile[];
    currentPath: string;
}

export interface UseConnectionResult {
    // State
    state: ConnectionState;

    // Connection
    connect: (params: ConnectionParams, initialPath?: string) => Promise<ConnectionResult>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<ConnectionResult>;
    checkConnection: () => Promise<boolean>;

    // Navigation
    listFiles: () => Promise<ListResult>;
    changeDirectory: (path: string) => Promise<ListResult>;
    goUp: () => Promise<ListResult>;

    // File operations
    download: (remotePath: string, localPath: string) => Promise<void>;
    upload: (localPath: string, remotePath: string) => Promise<void>;
    mkdir: (path: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    deleteDir: (path: string, recursive?: boolean) => Promise<void>;
    rename: (from: string, to: string) => Promise<void>;

    // Utilities
    noop: () => Promise<void>;
    clearError: () => void;

    // Legacy access for advanced features
    isLegacyFtp: boolean;
}

// Check if protocol should use legacy FTP commands
function isLegacyProtocol(protocol: ProviderType | undefined): boolean {
    return !protocol || protocol === 'ftp' || protocol === 'ftps' || protocol === 'sftp';
}

// Convert ConnectionParams to ProviderConnectionParams for backend
function toProviderParams(params: ConnectionParams, initialPath?: string): ProviderConnectionParams {
    return {
        protocol: params.protocol || 'ftp',
        server: params.server,
        port: params.port,
        username: params.username,
        password: params.password,
        initial_path: initialPath,
        bucket: params.options?.bucket,
        region: params.options?.region,
        endpoint: params.options?.endpoint,
        path_style: params.options?.pathStyle,
    };
}

/**
 * Unified connection hook for multi-protocol support
 */
export function useConnection(): UseConnectionResult {
    const [state, setState] = useState<ConnectionState>({
        isConnected: false,
        isConnecting: false,
        protocol: 'ftp',
        serverName: '',
        currentPath: '/',
        error: null,
    });

    // Store connection params for reconnect
    const connectionParamsRef = useRef<ConnectionParams | null>(null);
    const initialPathRef = useRef<string | undefined>(undefined);

    // Check if using legacy FTP
    const isLegacyFtp = isLegacyProtocol(state.protocol);

    // Clear error
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Connect to server
    const connect = useCallback(async (params: ConnectionParams, initialPath?: string): Promise<ConnectionResult> => {
        setState(prev => ({ ...prev, isConnecting: true, error: null }));
        connectionParamsRef.current = params;
        initialPathRef.current = initialPath;

        const protocol = params.protocol || 'ftp';
        const useLegacy = isLegacyProtocol(protocol);

        try {
            let files: RemoteFile[] = [];
            let currentPath = '/';

            if (useLegacy) {
                // Use legacy FTP commands
                await invoke('connect_ftp', { params });

                // Navigate to initial path if specified
                if (initialPath) {
                    const response = await invoke<FileListResponse>('change_directory', { path: initialPath });
                    files = response.files;
                    currentPath = response.current_path;
                } else {
                    const response = await invoke<FileListResponse>('list_files');
                    files = response.files;
                    currentPath = response.current_path;
                }
            } else {
                // Use new provider commands
                const providerParams = toProviderParams(params, initialPath);
                await invoke('provider_connect', { params: providerParams });

                // List files
                const response = await invoke<{ files: any[]; current_path: string }>('provider_list_files', {
                    path: initialPath || null
                });

                // Convert provider entries to RemoteFile format
                files = response.files.map(f => ({
                    name: f.name,
                    path: f.path,
                    size: f.size,
                    is_dir: f.is_dir,
                    modified: f.modified,
                    permissions: f.permissions,
                }));
                currentPath = response.current_path;
            }

            setState({
                isConnected: true,
                isConnecting: false,
                protocol,
                serverName: params.server,
                currentPath,
                error: null,
            });

            return { success: true, files, currentPath };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState(prev => ({
                ...prev,
                isConnecting: false,
                isConnected: false,
                error: message,
            }));
            return { success: false, files: [], currentPath: '/', error: message };
        }
    }, []);

    // Disconnect
    const disconnect = useCallback(async (): Promise<void> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                await invoke('disconnect_ftp');
            } else {
                await invoke('provider_disconnect');
            }
        } catch (err) {
            console.warn('Disconnect error:', err);
        } finally {
            setState({
                isConnected: false,
                isConnecting: false,
                protocol: 'ftp',
                serverName: '',
                currentPath: '/',
                error: null,
            });
            connectionParamsRef.current = null;
            initialPathRef.current = undefined;
        }
    }, [state.protocol]);

    // Reconnect using stored params
    const reconnect = useCallback(async (): Promise<ConnectionResult> => {
        if (!connectionParamsRef.current) {
            return { success: false, files: [], currentPath: '/', error: 'No connection params available' };
        }

        if (isLegacyProtocol(state.protocol)) {
            // Use FTP reconnect command
            try {
                await invoke('reconnect_ftp');
                const response = await invoke<FileListResponse>('list_files');
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    currentPath: response.current_path,
                    error: null,
                }));
                return { success: true, files: response.files, currentPath: response.current_path };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setState(prev => ({ ...prev, error: message }));
                return { success: false, files: [], currentPath: '/', error: message };
            }
        } else {
            // For providers, reconnect by calling connect again
            return connect(connectionParamsRef.current, initialPathRef.current);
        }
    }, [state.protocol, connect]);

    // Check connection
    const checkConnection = useCallback(async (): Promise<boolean> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                return await invoke<boolean>('check_connection');
            } else {
                const info = await invoke<{ connected: boolean }>('provider_check_connection');
                return info.connected;
            }
        } catch {
            return false;
        }
    }, [state.protocol]);

    // List files
    const listFiles = useCallback(async (): Promise<ListResult> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                const response = await invoke<FileListResponse>('list_files');
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files: response.files, currentPath: response.current_path };
            } else {
                const response = await invoke<{ files: any[]; current_path: string }>('provider_list_files', { path: null });
                const files = response.files.map(f => ({
                    name: f.name,
                    path: f.path,
                    size: f.size,
                    is_dir: f.is_dir,
                    modified: f.modified,
                    permissions: f.permissions,
                }));
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files, currentPath: response.current_path };
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState(prev => ({ ...prev, error: message }));
            throw err;
        }
    }, [state.protocol]);

    // Change directory
    const changeDirectory = useCallback(async (path: string): Promise<ListResult> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                const response = await invoke<FileListResponse>('change_directory', { path });
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files: response.files, currentPath: response.current_path };
            } else {
                const response = await invoke<{ files: any[]; current_path: string }>('provider_change_dir', { path });
                const files = response.files.map(f => ({
                    name: f.name,
                    path: f.path,
                    size: f.size,
                    is_dir: f.is_dir,
                    modified: f.modified,
                    permissions: f.permissions,
                }));
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files, currentPath: response.current_path };
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState(prev => ({ ...prev, error: message }));
            throw err;
        }
    }, [state.protocol]);

    // Go up
    const goUp = useCallback(async (): Promise<ListResult> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                const response = await invoke<FileListResponse>('change_directory', { path: '..' });
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files: response.files, currentPath: response.current_path };
            } else {
                const response = await invoke<{ files: any[]; current_path: string }>('provider_go_up');
                const files = response.files.map(f => ({
                    name: f.name,
                    path: f.path,
                    size: f.size,
                    is_dir: f.is_dir,
                    modified: f.modified,
                    permissions: f.permissions,
                }));
                setState(prev => ({ ...prev, currentPath: response.current_path }));
                return { files, currentPath: response.current_path };
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState(prev => ({ ...prev, error: message }));
            throw err;
        }
    }, [state.protocol]);

    // Download file
    const download = useCallback(async (remotePath: string, localPath: string): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            await invoke('download_file', { params: { remote_path: remotePath, local_path: localPath } });
        } else {
            await invoke('provider_download_file', { remotePath, localPath });
        }
    }, [state.protocol]);

    // Upload file
    const upload = useCallback(async (localPath: string, remotePath: string): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            await invoke('upload_file', { params: { local_path: localPath, remote_path: remotePath } });
        } else {
            await invoke('provider_upload_file', { localPath, remotePath });
        }
    }, [state.protocol]);

    // Create directory
    const mkdir = useCallback(async (path: string): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            await invoke('create_remote_dir', { name: path });
        } else {
            await invoke('provider_mkdir', { path });
        }
    }, [state.protocol]);

    // Delete file
    const deleteFile = useCallback(async (path: string): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            await invoke('delete_remote_file', { path });
        } else {
            await invoke('provider_delete_file', { path });
        }
    }, [state.protocol]);

    // Delete directory
    const deleteDir = useCallback(async (path: string, recursive: boolean = false): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            if (recursive) {
                await invoke('delete_remote_folder', { path });
            } else {
                await invoke('delete_remote_dir', { path });
            }
        } else {
            await invoke('provider_delete_dir', { path, recursive });
        }
    }, [state.protocol]);

    // Rename
    const rename = useCallback(async (from: string, to: string): Promise<void> => {
        if (isLegacyProtocol(state.protocol)) {
            await invoke('rename_remote', { from, to });
        } else {
            await invoke('provider_rename', { from, to });
        }
    }, [state.protocol]);

    // NOOP/keep-alive
    const noop = useCallback(async (): Promise<void> => {
        try {
            if (isLegacyProtocol(state.protocol)) {
                await invoke('ftp_noop');
            } else {
                await invoke('provider_keep_alive');
            }
        } catch (err) {
            console.warn('NOOP/keep-alive failed:', err);
        }
    }, [state.protocol]);

    return {
        state,
        connect,
        disconnect,
        reconnect,
        checkConnection,
        listFiles,
        changeDirectory,
        goUp,
        download,
        upload,
        mkdir,
        deleteFile,
        deleteDir,
        rename,
        noop,
        clearError,
        isLegacyFtp,
    };
}

export default useConnection;
