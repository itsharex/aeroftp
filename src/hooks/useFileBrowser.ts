/**
 * useFileBrowser Hook
 * Manages local and remote file listings, navigation, and sorting
 */

import { useState, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { homeDir, downloadDir } from '@tauri-apps/api/path';
import { LocalFile, RemoteFile, FileListResponse } from '../types';

export type SortField = 'name' | 'size' | 'modified';
export type SortOrder = 'asc' | 'desc';

interface UseFileBrowserProps {
    isConnected: boolean;
}

interface UseFileBrowserReturn {
    // Local
    localFiles: LocalFile[];
    currentLocalPath: string;
    localSortField: SortField;
    localSortOrder: SortOrder;
    sortedLocalFiles: LocalFile[];
    selectedLocalFiles: Set<string>;
    localSearchFilter: string;

    // Remote
    remoteFiles: RemoteFile[];
    currentRemotePath: string;
    remoteSortField: SortField;
    remoteSortOrder: SortOrder;
    sortedRemoteFiles: RemoteFile[];
    selectedRemoteFiles: Set<string>;

    // Actions
    loadLocalFiles: (path: string) => Promise<void>;
    loadRemoteFiles: () => Promise<void>;
    changeLocalDirectory: (path: string) => Promise<void>;
    changeRemoteDirectory: (path: string) => Promise<void>;
    handleLocalSort: (field: SortField) => void;
    handleRemoteSort: (field: SortField) => void;
    initLocalPath: () => Promise<void>;

    // Setters
    setSelectedLocalFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
    setSelectedRemoteFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
    setLocalSearchFilter: React.Dispatch<React.SetStateAction<string>>;
    setCurrentLocalPath: React.Dispatch<React.SetStateAction<string>>;
    setCurrentRemotePath: React.Dispatch<React.SetStateAction<string>>;
    setLocalFiles: React.Dispatch<React.SetStateAction<LocalFile[]>>;
    setRemoteFiles: React.Dispatch<React.SetStateAction<RemoteFile[]>>;
}

export const useFileBrowser = ({ isConnected }: UseFileBrowserProps): UseFileBrowserReturn => {
    // Local state
    const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
    const [currentLocalPath, setCurrentLocalPath] = useState('/');
    const [localSortField, setLocalSortField] = useState<SortField>('name');
    const [localSortOrder, setLocalSortOrder] = useState<SortOrder>('asc');
    const [selectedLocalFiles, setSelectedLocalFiles] = useState<Set<string>>(new Set());
    const [localSearchFilter, setLocalSearchFilter] = useState('');

    // Remote state
    const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
    const [currentRemotePath, setCurrentRemotePath] = useState('/');
    const [remoteSortField, setRemoteSortField] = useState<SortField>('name');
    const [remoteSortOrder, setRemoteSortOrder] = useState<SortOrder>('asc');
    const [selectedRemoteFiles, setSelectedRemoteFiles] = useState<Set<string>>(new Set());

    // Sort helper
    const sortFiles = <T extends { name: string; size?: number | null; modified?: string | null }>(
        files: T[],
        field: SortField,
        order: SortOrder
    ): T[] => {
        return [...files].sort((a, b) => {
            let cmp = 0;
            switch (field) {
                case 'name':
                    cmp = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    cmp = (a.size || 0) - (b.size || 0);
                    break;
                case 'modified':
                    cmp = (a.modified || '').localeCompare(b.modified || '');
                    break;
            }
            return order === 'asc' ? cmp : -cmp;
        });
    };

    // Sorted and filtered files
    const sortedLocalFiles = useMemo(() => {
        let filtered = localFiles;
        if (localSearchFilter) {
            const lower = localSearchFilter.toLowerCase();
            filtered = localFiles.filter(f => f.name.toLowerCase().includes(lower));
        }
        return sortFiles(filtered, localSortField, localSortOrder);
    }, [localFiles, localSortField, localSortOrder, localSearchFilter]);

    const sortedRemoteFiles = useMemo(() => {
        return sortFiles(remoteFiles, remoteSortField, remoteSortOrder);
    }, [remoteFiles, remoteSortField, remoteSortOrder]);

    // Load files
    const loadLocalFiles = useCallback(async (path: string) => {
        try {
            const files = await invoke<LocalFile[]>('list_local_directory', { path });
            setLocalFiles(files);
            setCurrentLocalPath(path);
            setSelectedLocalFiles(new Set());
        } catch (error) {
            console.error('Failed to load local files:', error);
        }
    }, []);

    const loadRemoteFiles = useCallback(async () => {
        if (!isConnected) return;
        try {
            const response = await invoke<FileListResponse>('list_files');
            setRemoteFiles(response.files);
            setCurrentRemotePath(response.current_path);
            setSelectedRemoteFiles(new Set());
        } catch (error) {
            console.error('Failed to load remote files:', error);
        }
    }, [isConnected]);

    // Navigation
    const changeLocalDirectory = useCallback(async (path: string) => {
        await loadLocalFiles(path);
    }, [loadLocalFiles]);

    const changeRemoteDirectory = useCallback(async (path: string) => {
        if (!isConnected) return;
        try {
            if (path === '..') {
                await invoke('change_remote_dir_up');
            } else if (path.startsWith('/')) {
                await invoke('change_remote_dir', { path });
            } else {
                await invoke('change_remote_dir', { path });
            }
            await loadRemoteFiles();
        } catch (error) {
            console.error('Failed to change remote directory:', error);
        }
    }, [isConnected, loadRemoteFiles]);

    // Sorting handlers
    const handleLocalSort = useCallback((field: SortField) => {
        if (localSortField === field) {
            setLocalSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setLocalSortField(field);
            setLocalSortOrder('asc');
        }
    }, [localSortField]);

    const handleRemoteSort = useCallback((field: SortField) => {
        if (remoteSortField === field) {
            setRemoteSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setRemoteSortField(field);
            setRemoteSortOrder('asc');
        }
    }, [remoteSortField]);

    // Initialize local path
    const initLocalPath = useCallback(async () => {
        try {
            await loadLocalFiles(await homeDir());
        } catch {
            try {
                await loadLocalFiles(await downloadDir());
            } catch {
                await loadLocalFiles('/');
            }
        }
    }, [loadLocalFiles]);

    return {
        // Local
        localFiles,
        currentLocalPath,
        localSortField,
        localSortOrder,
        sortedLocalFiles,
        selectedLocalFiles,
        localSearchFilter,

        // Remote
        remoteFiles,
        currentRemotePath,
        remoteSortField,
        remoteSortOrder,
        sortedRemoteFiles,
        selectedRemoteFiles,

        // Actions
        loadLocalFiles,
        loadRemoteFiles,
        changeLocalDirectory,
        changeRemoteDirectory,
        handleLocalSort,
        handleRemoteSort,
        initLocalPath,

        // Setters
        setSelectedLocalFiles,
        setSelectedRemoteFiles,
        setLocalSearchFilter,
        setCurrentLocalPath,
        setCurrentRemotePath,
        setLocalFiles,
        setRemoteFiles,
    };
};

export default useFileBrowser;
