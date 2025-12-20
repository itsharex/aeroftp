import * as React from 'react';
import { X, Plus, Loader2, Wifi, WifiOff, Database } from 'lucide-react';
import { FtpSession, SessionStatus } from '../types';

interface SessionTabsProps {
    sessions: FtpSession[];
    activeSessionId: string | null;
    onTabClick: (sessionId: string) => void;
    onTabClose: (sessionId: string) => void;
    onNewTab: () => void;
}

const statusConfig: Record<SessionStatus, { icon: React.ReactNode; color: string; title: string }> = {
    connected: { icon: <Wifi size={12} />, color: 'text-green-500', title: 'Connected' },
    connecting: { icon: <Loader2 size={12} className="animate-spin" />, color: 'text-yellow-500', title: 'Connecting...' },
    cached: { icon: <Database size={12} />, color: 'text-blue-500', title: 'Cached (reconnecting...)' },
    disconnected: { icon: <WifiOff size={12} />, color: 'text-gray-400', title: 'Disconnected' },
};

export const SessionTabs: React.FC<SessionTabsProps> = ({
    sessions,
    activeSessionId,
    onTabClick,
    onTabClose,
    onNewTab,
}) => {
    if (sessions.length === 0) return null;

    return (
        <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const status = statusConfig[session.status];

                return (
                    <div
                        key={session.id}
                        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all min-w-0 max-w-[200px] ${isActive
                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
                            }`}
                        onClick={() => onTabClick(session.id)}
                    >
                        {/* Status indicator */}
                        <span className={`shrink-0 ${status.color}`} title={status.title}>
                            {status.icon}
                        </span>

                        {/* Server name */}
                        <span className={`truncate text-sm ${isActive ? 'font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {session.serverName}
                        </span>

                        {/* Close button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(session.id);
                            }}
                            className="shrink-0 p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Close tab"
                        >
                            <X size={12} />
                        </button>
                    </div>
                );
            })}

            {/* New tab button */}
            <button
                onClick={onNewTab}
                className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="New connection"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};

export default SessionTabs;
