import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LogEntry } from '../types';
import { api } from '../src/services/api';

interface HistoryContextType {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fetchedLogs = await api.getLogs();
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };
    fetchLogs();
  }, []);

  const addLog = async (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    // Optimistic update
    setLogs(prevLogs => [newLog, ...prevLogs]);

    try {
        await api.createLog(newLog);
    } catch (error) {
        console.error("Failed to save log", error);
        // Revert if needed, but for logs maybe not critical
    }
  };

  const clearLogs = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer tout l'historique ?")) {
      // In a real app, we might want an API endpoint to clear logs, or just clear locally.
      // Since api.ts doesn't have clearLogs, we'll just clear state for now.
      // Or we could implement deleteLog in api.ts and loop through all logs (inefficient).
      // For now, let's just clear the state.
      setLogs([]);
    }
  };

  return (
    <HistoryContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
