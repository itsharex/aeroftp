/**
 * ProtocolSelector Component
 * Dropdown for selecting storage protocol (FTP, WebDAV, S3, etc.)
 */

import React from 'react';
import {
    Server,
    Cloud,
    Database,
    Lock,
    ShieldCheck
} from 'lucide-react';
import { ProviderType } from '../types';

interface ProtocolSelectorProps {
    value: ProviderType;
    onChange: (protocol: ProviderType) => void;
    disabled?: boolean;
    className?: string;
    showLabel?: boolean;
}

interface ProtocolInfo {
    type: ProviderType;
    name: string;
    icon: React.ReactNode;
    description: string;
    defaultPort: number;
    badge?: string;
}

const PROTOCOLS: ProtocolInfo[] = [
    {
        type: 'ftp',
        name: 'FTP',
        icon: <Server size={16} />,
        description: 'File Transfer Protocol',
        defaultPort: 21,
    },
    {
        type: 'ftps',
        name: 'FTPS',
        icon: <ShieldCheck size={16} />,
        description: 'FTP over TLS/SSL',
        defaultPort: 990,
        badge: 'Secure',
    },
    {
        type: 'webdav',
        name: 'WebDAV',
        icon: <Cloud size={16} />,
        description: 'Nextcloud, ownCloud, Synology',
        defaultPort: 443,
        badge: 'New',
    },
    {
        type: 's3',
        name: 'S3',
        icon: <Database size={16} />,
        description: 'AWS S3, MinIO, R2, B2',
        defaultPort: 443,
        badge: 'New',
    },
    // SFTP will be added in a future release
    // {
    //     type: 'sftp',
    //     name: 'SFTP',
    //     icon: <Lock size={16} />,
    //     description: 'SSH File Transfer Protocol',
    //     defaultPort: 22,
    //     badge: 'Coming Soon',
    // },
];

export const getProtocolInfo = (type: ProviderType): ProtocolInfo => {
    return PROTOCOLS.find(p => p.type === type) || PROTOCOLS[0];
};

export const getDefaultPort = (type: ProviderType): number => {
    return getProtocolInfo(type).defaultPort;
};

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
    value,
    onChange,
    disabled = false,
    className = '',
    showLabel = true,
}) => {
    const selectedProtocol = getProtocolInfo(value);

    return (
        <div className={className}>
            {showLabel && (
                <label className="block text-sm font-medium mb-1.5">Protocol</label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value as ProviderType)}
                    disabled={disabled}
                    className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {PROTOCOLS.map((protocol) => (
                        <option key={protocol.type} value={protocol.type}>
                            {protocol.name} - {protocol.description}
                        </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                    {selectedProtocol.icon}
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {selectedProtocol.badge && (
                <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${selectedProtocol.badge === 'New'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : selectedProtocol.badge === 'Secure'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                    {selectedProtocol.badge}
                </span>
            )}
        </div>
    );
};

// Protocol-specific fields component
interface ProtocolFieldsProps {
    protocol: ProviderType;
    options: {
        bucket?: string;
        region?: string;
        endpoint?: string;
        pathStyle?: boolean;
    };
    onChange: (options: ProtocolFieldsProps['options']) => void;
    disabled?: boolean;
}

export const ProtocolFields: React.FC<ProtocolFieldsProps> = ({
    protocol,
    options,
    onChange,
    disabled = false,
}) => {
    if (protocol === 's3') {
        return (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Database size={14} />
                    S3 Configuration
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Bucket Name *</label>
                    <input
                        type="text"
                        value={options.bucket || ''}
                        onChange={(e) => onChange({ ...options, bucket: e.target.value })}
                        disabled={disabled}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                        placeholder="my-bucket"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Region</label>
                        <input
                            type="text"
                            value={options.region || ''}
                            onChange={(e) => onChange({ ...options, region: e.target.value })}
                            disabled={disabled}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder="us-east-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Custom Endpoint</label>
                        <input
                            type="text"
                            value={options.endpoint || ''}
                            onChange={(e) => onChange({ ...options, endpoint: e.target.value })}
                            disabled={disabled}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl"
                            placeholder="s3.example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">For MinIO, Wasabi, R2, etc.</p>
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        checked={options.pathStyle || false}
                        onChange={(e) => onChange({ ...options, pathStyle: e.target.checked })}
                        disabled={disabled}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    Path-style URLs (for self-hosted S3)
                </label>
            </div>
        );
    }

    if (protocol === 'webdav') {
        return (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Cloud size={14} />
                    <span>
                        WebDAV works with Nextcloud, ownCloud, Synology, QNAP, and more.
                        Enter the full WebDAV URL as the server address.
                    </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Example: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">cloud.example.com/remote.php/dav/files/user/</code>
                </p>
            </div>
        );
    }

    // FTP/FTPS don't need extra fields
    return null;
};

// Protocol icons for quick display
export const ProtocolIcon: React.FC<{ protocol?: ProviderType; size?: number; className?: string }> = ({
    protocol = 'ftp',
    size = 16,
    className = '',
}) => {
    const info = getProtocolInfo(protocol);
    return (
        <span className={`inline-flex items-center ${className}`} title={info.description}>
            {React.cloneElement(info.icon as React.ReactElement, { size })}
        </span>
    );
};

// Protocol badge with name
export const ProtocolBadge: React.FC<{ protocol?: ProviderType; className?: string }> = ({
    protocol = 'ftp',
    className = '',
}) => {
    const info = getProtocolInfo(protocol);
    const colorClass = {
        ftp: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        ftps: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        sftp: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        webdav: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        s3: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    }[protocol];

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colorClass} ${className}`}>
            {info.icon}
            {info.name}
        </span>
    );
};

export default ProtocolSelector;
