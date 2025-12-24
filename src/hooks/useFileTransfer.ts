/**
 * useFileTransfer Hook
 * Manages file upload/download operations with progress tracking
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { TransferProgress, DownloadParams, UploadParams } from '../types';

interface UseFileTransferProps {
    toast: {
        success: (title: string, message?: string) => void;
        error: (title: string, message?: string) => void;
    };
    onTransferComplete?: () => void;
}

interface UseFileTransferReturn {
    activeTransfer: TransferProgress | null;
    hasActivity: boolean;

    downloadFile: (remotePath: string, fileName: string, destinationPath?: string, isDir?: boolean) => Promise<void>;
    uploadFile: (localPath: string, fileName: string, isDir?: boolean, remotePath?: string) => Promise<void>;
    cancelTransfer: () => void;
}

export const useFileTransfer = ({
    toast,
    onTransferComplete,
}: UseFileTransferProps): UseFileTransferReturn => {
    const [activeTransfer, setActiveTransfer] = useState<TransferProgress | null>(null);
    const [hasActivity, setHasActivity] = useState(false);

    const downloadFile = useCallback(async (
        remotePath: string,
        fileName: string,
        destinationPath?: string,
        isDir: boolean = false
    ) => {
        setHasActivity(true);

        // Set up progress listener
        const unlisten: UnlistenFn = await listen<TransferProgress>('transfer-progress', (event) => {
            setActiveTransfer(event.payload);
        });

        try {
            if (isDir) {
                await invoke('download_folder', {
                    params: { remote_path: remotePath, local_path: destinationPath || '' }
                });
                toast.success('Folder Downloaded', `${fileName} downloaded successfully`);
            } else {
                const localPath = destinationPath
                    ? `${destinationPath}/${fileName}`
                    : fileName;
                await invoke('download_file', {
                    params: { remote_path: remotePath, local_path: localPath } as DownloadParams,
                    isDir: false
                });
                toast.success('Downloaded', `${fileName} downloaded successfully`);
            }

            onTransferComplete?.();
        } catch (error) {
            toast.error('Download Failed', String(error));
        } finally {
            unlisten();
            setActiveTransfer(null);
            setHasActivity(false);
        }
    }, [toast, onTransferComplete]);

    const uploadFile = useCallback(async (
        localPath: string,
        fileName: string,
        isDir: boolean = false,
        remotePath?: string
    ) => {
        setHasActivity(true);

        // Set up progress listener
        const unlisten: UnlistenFn = await listen<TransferProgress>('transfer-progress', (event) => {
            setActiveTransfer(event.payload);
        });

        try {
            if (isDir) {
                await invoke('upload_folder', {
                    params: { local_path: localPath, remote_path: remotePath || '' }
                });
                toast.success('Folder Uploaded', `${fileName} uploaded successfully`);
            } else {
                const targetRemotePath = remotePath
                    ? `${remotePath}/${fileName}`
                    : fileName;
                await invoke('upload_file', {
                    params: { local_path: localPath, remote_path: targetRemotePath } as UploadParams,
                    isDir: false
                });
                toast.success('Uploaded', `${fileName} uploaded successfully`);
            }

            onTransferComplete?.();
        } catch (error) {
            toast.error('Upload Failed', String(error));
        } finally {
            unlisten();
            setActiveTransfer(null);
            setHasActivity(false);
        }
    }, [toast, onTransferComplete]);

    const cancelTransfer = useCallback(() => {
        invoke('cancel_transfer').catch(() => { });
        setActiveTransfer(null);
        setHasActivity(false);
    }, []);

    return {
        activeTransfer,
        hasActivity,
        downloadFile,
        uploadFile,
        cancelTransfer,
    };
};

export default useFileTransfer;
