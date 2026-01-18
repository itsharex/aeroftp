import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { downloadDir } from '@tauri-apps/api/path';
import { DownloadParams, DownloadFolderParams, UploadParams, UploadFolderParams } from '../types';
import { useActivityLog } from './useActivityLog';

interface UseTransferOperationsParams {
    toast: any;
    currentRemotePath: string;
}

export function useTransferOperations({
    toast,
    currentRemotePath
}: UseTransferOperationsParams) {

    const activityLog = useActivityLog();

    // ===================================
    // TRANSFER Operations (Upload/Download)
    // ===================================

    const downloadFile = useCallback(async (remoteFilePath: string, fileName: string, destinationPath?: string, isDir: boolean = false) => {
        const logId = activityLog.log('DOWNLOAD', `Downloading ${isDir ? 'folder' : 'file'}: ${fileName}...`, 'running');
        try {
            const defaultDownloadPath = await downloadDir();
            // User selects wrapper folder or uses provided one
            const downloadPath = destinationPath || await open({
                directory: true,
                multiple: false,
                defaultPath: defaultDownloadPath
            });

            if (downloadPath) {
                if (isDir) {
                    const folderPath = `${downloadPath}/${fileName}`;
                    const params: DownloadFolderParams = { remote_path: remoteFilePath, local_path: folderPath };
                    await invoke('download_folder', { params });
                    activityLog.updateEntry(logId, { status: 'success', message: `Downloaded folder: ${fileName}` });
                } else {
                    const params: DownloadParams = { remote_path: remoteFilePath, local_path: `${downloadPath}/${fileName}` };
                    await invoke('download_file', { params });
                    activityLog.updateEntry(logId, { status: 'success', message: `Downloaded: ${fileName}` });
                }
            } else {
                activityLog.updateEntry(logId, { status: 'error', message: `Download cancelled: ${fileName}` });
            }
        } catch (error) {
            activityLog.updateEntry(logId, { status: 'error', message: `Download failed: ${fileName}` });
            toast.error('Download Failed', String(error));
        }
    }, [activityLog, toast]);

    const uploadFile = useCallback(async (localFilePath: string, fileName: string, isDir: boolean = false) => {
        const logId = activityLog.log('UPLOAD', `Uploading ${isDir ? 'folder' : 'file'}: ${fileName}...`, 'running');
        try {
            const remotePath = `${currentRemotePath}${currentRemotePath.endsWith('/') ? '' : '/'}${fileName}`;
            if (isDir) {
                const params: UploadFolderParams = { local_path: localFilePath, remote_path: remotePath };
                await invoke('upload_folder', { params });
                activityLog.updateEntry(logId, { status: 'success', message: `Uploaded folder: ${fileName}` });
            } else {
                await invoke('upload_file', { params: { local_path: localFilePath, remote_path: remotePath } as UploadParams });
                activityLog.updateEntry(logId, { status: 'success', message: `Uploaded: ${fileName}` });
            }
        } catch (error) {
            activityLog.updateEntry(logId, { status: 'error', message: `Upload failed: ${fileName}` });
            toast.error('Upload Failed', String(error));
        }
    }, [currentRemotePath, activityLog, toast]);

    const cancelTransfer = useCallback(async () => {
        try {
            await invoke('cancel_transfer');
            activityLog.log('ERROR', 'Transfer cancelled by user', 'error');
        } catch { }
    }, [activityLog]);

    return {
        downloadFile,
        uploadFile,
        cancelTransfer
    };
}
