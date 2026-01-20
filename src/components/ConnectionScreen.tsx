/**
 * ConnectionScreen Component
 * Initial connection form with Quick Connect and Saved Servers
 */

import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, HardDrive, ChevronRight } from 'lucide-react';
import { ConnectionParams, ProviderType } from '../types';
import { SavedServers } from './SavedServers';
import { useTranslation } from '../i18n';
import { ProtocolSelector, ProtocolFields, getDefaultPort } from './ProtocolSelector';

interface QuickConnectDirs {
    remoteDir: string;
    localDir: string;
}

interface ConnectionScreenProps {
    connectionParams: ConnectionParams;
    quickConnectDirs: QuickConnectDirs;
    loading: boolean;
    onConnectionParamsChange: (params: ConnectionParams) => void;
    onQuickConnectDirsChange: (dirs: QuickConnectDirs) => void;
    onConnect: () => void;
    onSavedServerConnect: (params: ConnectionParams, initialPath?: string, localInitialPath?: string) => Promise<void>;
    onSkipToFileManager: () => void;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
    connectionParams,
    quickConnectDirs,
    loading,
    onConnectionParamsChange,
    onQuickConnectDirsChange,
    onConnect,
    onSavedServerConnect,
    onSkipToFileManager,
}) => {
    const t = useTranslation();
    const protocol = connectionParams.protocol || 'ftp';

    const handleBrowseLocalDir = async () => {
        try {
            const selected = await open({ directory: true, multiple: false, title: t('browser.local') });
            if (selected && typeof selected === 'string') {
                onQuickConnectDirsChange({ ...quickConnectDirs, localDir: selected });
            }
        } catch (e) {
            console.error('Folder picker error:', e);
        }
    };

    const handleProtocolChange = (newProtocol: ProviderType) => {
        onConnectionParamsChange({
            ...connectionParams,
            protocol: newProtocol,
            port: getDefaultPort(newProtocol),
        });
    };

    // Dynamic server placeholder based on protocol
    const getServerPlaceholder = () => {
        switch (protocol) {
            case 'webdav':
                return 'cloud.example.com/remote.php/dav/files/user/';
            case 's3':
                return 's3.amazonaws.com (or MinIO endpoint)';
            default:
                return t('connection.serverPlaceholder');
        }
    };

    // Dynamic username label based on protocol
    const getUsernameLabel = () => {
        if (protocol === 's3') return 'Access Key ID';
        return t('connection.username');
    };

    // Dynamic password label based on protocol
    const getPasswordLabel = () => {
        if (protocol === 's3') return 'Secret Access Key';
        return t('connection.password');
    };

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {/* Quick Connect */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4">{t('connection.quickConnect')}</h2>
                <div className="space-y-3">
                    {/* Protocol Selector */}
                    <ProtocolSelector
                        value={protocol}
                        onChange={handleProtocolChange}
                        disabled={loading}
                    />

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            {protocol === 's3' ? 'Endpoint' : t('connection.server')}
                        </label>
                        <input
                            type="text"
                            value={connectionParams.server}
                            onChange={(e) => onConnectionParamsChange({ ...connectionParams, server: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder={getServerPlaceholder()}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{getUsernameLabel()}</label>
                        <input
                            type="text"
                            value={connectionParams.username}
                            onChange={(e) => onConnectionParamsChange({ ...connectionParams, username: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder={protocol === 's3' ? 'AKIAIOSFODNN7EXAMPLE' : t('connection.usernamePlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{getPasswordLabel()}</label>
                        <input
                            type="password"
                            value={connectionParams.password}
                            onChange={(e) => onConnectionParamsChange({ ...connectionParams, password: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder={t('connection.passwordPlaceholder')}
                        />
                    </div>

                    {/* Protocol-specific fields */}
                    <ProtocolFields
                        protocol={protocol}
                        options={connectionParams.options || {}}
                        onChange={(options) => onConnectionParamsChange({ ...connectionParams, options })}
                        disabled={loading}
                    />

                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('browser.remote')} {t('browser.path')}</label>
                        <input
                            type="text"
                            value={quickConnectDirs.remoteDir}
                            onChange={(e) => onQuickConnectDirsChange({ ...quickConnectDirs, remoteDir: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder={protocol === 's3' ? '/prefix/' : '/www'}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('browser.local')} {t('browser.path')}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={quickConnectDirs.localDir}
                                onChange={(e) => onQuickConnectDirsChange({ ...quickConnectDirs, localDir: e.target.value })}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                                placeholder="/home/user/projects"
                            />
                            <button
                                type="button"
                                onClick={handleBrowseLocalDir}
                                className="px-4 py-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-xl transition-colors"
                                title={t('common.browse')}
                            >
                                <FolderOpen size={18} />
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onConnect}
                        disabled={loading || (protocol === 's3' && !connectionParams.options?.bucket)}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-3 rounded-xl disabled:opacity-50"
                    >
                        {loading ? t('connection.connecting') : t('common.connect')}
                    </button>
                </div>
            </div>

            {/* Saved Servers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                <SavedServers onConnect={onSavedServerConnect} />
            </div>

            {/* Skip to File Manager Button */}
            <div className="md:col-span-2 text-center mt-4">
                <button
                    onClick={onSkipToFileManager}
                    className="group px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-600 dark:text-gray-300 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                >
                    <HardDrive size={18} className="group-hover:text-blue-500 transition-colors" />
                    <span>{t('browser.local')} {t('browser.files')}</span>
                    <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-gray-500 mt-2">{t('statusBar.notConnected')}</p>
            </div>
        </div>
    );
};

export default ConnectionScreen;
