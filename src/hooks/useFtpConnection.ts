/**
 * useFtpConnection Hook
 * Manages FTP connection state and operations
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ConnectionParams, FtpSession } from '../types';

interface QuickConnectDirs {
    remoteDir: string;
    localDir: string;
}

interface UseFtpConnectionProps {
    toast: {
        success: (title: string, message?: string) => void;
        error: (title: string, message?: string) => void;
        info: (title: string, message?: string) => void;
    };
    onConnected?: (params: ConnectionParams, initialRemotePath?: string, initialLocalPath?: string) => void;
    onDisconnected?: () => void;
}

interface UseFtpConnectionReturn {
    // State
    isConnected: boolean;
    isReconnecting: boolean;
    loading: boolean;
    connectionParams: ConnectionParams;
    quickConnectDirs: QuickConnectDirs;

    // Setters
    setConnectionParams: React.Dispatch<React.SetStateAction<ConnectionParams>>;
    setQuickConnectDirs: React.Dispatch<React.SetStateAction<QuickConnectDirs>>;
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;
    sendNoop: () => Promise<void>;
}

export const useFtpConnection = ({
    toast,
    onConnected,
    onDisconnected,
}: UseFtpConnectionProps): UseFtpConnectionReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [connectionParams, setConnectionParams] = useState<ConnectionParams>({
        server: '',
        username: '',
        password: '',
    });

    const [quickConnectDirs, setQuickConnectDirs] = useState<QuickConnectDirs>({
        remoteDir: '',
        localDir: '',
    });

    const connect = useCallback(async () => {
        if (!connectionParams.server || !connectionParams.username) {
            toast.error('Missing Fields', 'Please fill in server and username');
            return;
        }

        setLoading(true);
        try {
            await invoke('connect_ftp', { params: connectionParams });
            setIsConnected(true);
            toast.success('Connected', `Connected to ${connectionParams.server}`);

            // Notify parent with connection details
            onConnected?.(connectionParams, quickConnectDirs.remoteDir, quickConnectDirs.localDir);
        } catch (error) {
            toast.error('Connection Failed', String(error));
        } finally {
            setLoading(false);
        }
    }, [connectionParams, quickConnectDirs, toast, onConnected]);

    const disconnect = useCallback(async () => {
        try {
            await invoke('disconnect_ftp');
            setIsConnected(false);
            toast.info('Disconnected', 'Disconnected from server');
            onDisconnected?.();
        } catch (error) {
            toast.error('Error', `Disconnection failed: ${error}`);
        }
    }, [toast, onDisconnected]);

    const reconnect = useCallback(async () => {
        setIsReconnecting(true);
        try {
            await invoke('reconnect_ftp');
            toast.success('Reconnected', 'Connection restored');
        } catch (error) {
            toast.error('Reconnection Failed', String(error));
            setIsConnected(false);
        } finally {
            setIsReconnecting(false);
        }
    }, [toast]);

    const sendNoop = useCallback(async () => {
        if (!isConnected) return;
        try {
            await invoke('ftp_noop');
        } catch {
            // Connection lost, try to reconnect
            await reconnect();
        }
    }, [isConnected, reconnect]);

    return {
        // State
        isConnected,
        isReconnecting,
        loading,
        connectionParams,
        quickConnectDirs,

        // Setters
        setConnectionParams,
        setQuickConnectDirs,
        setIsConnected,

        // Actions
        connect,
        disconnect,
        reconnect,
        sendNoop,
    };
};

export default useFtpConnection;
