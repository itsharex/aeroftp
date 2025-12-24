/**
 * useSessionManager Hook
 * Manages FTP session tabs for multi-server connections
 */

import { useState, useCallback } from 'react';
import { FtpSession, ConnectionParams } from '../types';

interface UseSessionManagerReturn {
    sessions: FtpSession[];
    activeSessionId: string | null;

    createSession: (serverName: string, connectionParams: ConnectionParams, remotePath: string, localPath: string, serverId?: string) => FtpSession;
    switchSession: (sessionId: string) => FtpSession | undefined;
    closeSession: (sessionId: string) => void;
    updateSession: (sessionId: string, updates: Partial<FtpSession>) => void;
    clearAllSessions: () => void;

    setSessions: React.Dispatch<React.SetStateAction<FtpSession[]>>;
    setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useSessionManager = (): UseSessionManagerReturn => {
    const [sessions, setSessions] = useState<FtpSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    const createSession = useCallback((
        serverName: string,
        connectionParams: ConnectionParams,
        remotePath: string,
        localPath: string,
        serverId?: string
    ): FtpSession => {
        const newSession: FtpSession = {
            id: Date.now().toString(),
            serverId: serverId || serverName, // Use serverId or fallback to serverName
            serverName,
            status: 'connected',
            remotePath,
            localPath,
            remoteFiles: [],
            localFiles: [],
            lastActivity: new Date(),
            connectionParams,
        };

        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newSession.id);

        return newSession;
    }, []);

    const switchSession = useCallback((sessionId: string): FtpSession | undefined => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setActiveSessionId(sessionId);
        }
        return session;
    }, [sessions]);

    const closeSession = useCallback((sessionId: string) => {
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== sessionId);

            // If closing active session, switch to another
            if (activeSessionId === sessionId && newSessions.length > 0) {
                setActiveSessionId(newSessions[newSessions.length - 1].id);
            } else if (newSessions.length === 0) {
                setActiveSessionId(null);
            }

            return newSessions;
        });
    }, [activeSessionId]);

    const updateSession = useCallback((sessionId: string, updates: Partial<FtpSession>) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, ...updates } : s
        ));
    }, []);

    const clearAllSessions = useCallback(() => {
        setSessions([]);
        setActiveSessionId(null);
    }, []);

    return {
        sessions,
        activeSessionId,
        createSession,
        switchSession,
        closeSession,
        updateSession,
        clearAllSessions,
        setSessions,
        setActiveSessionId,
    };
};

export default useSessionManager;
