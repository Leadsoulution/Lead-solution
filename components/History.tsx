import React, { useState } from 'react';
import { useHistory } from '../contexts/HistoryContext';
import { Search, Trash2, Filter, Clock, User, Activity } from 'lucide-react';
import { LogEntry } from '../types';

const History: React.FC = () => {
  const { logs, clearLogs } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || log.targetType === filterType;

    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('Create') || action.includes('Add')) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (action.includes('Delete') || action.includes('Remove')) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    if (action.includes('Update') || action.includes('Edit')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Historique du Système
          </h1>
          <p className="text-muted-foreground">Suivi des actions et modifications effectuées sur la plateforme.</p>
        </div>
        <button 
          onClick={clearLogs}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 size={18} />
          Effacer l'historique
        </button>
      </div>

      <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par action, utilisateur, détails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="Order">Commandes</option>
              <option value="User">Utilisateurs</option>
              <option value="Product">Produits</option>
              <option value="Settings">Paramètres</option>
              <option value="Auth">Authentification</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted-foreground bg-muted/50 dark:bg-dark-muted/50 uppercase font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Date & Heure</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3 rounded-tr-lg">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/50 dark:hover:bg-dark-accent/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted-foreground" />
                        <span className="font-medium">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.targetType || '-'}</span>
                        <span className="text-xs text-muted-foreground font-mono">{log.targetId || ''}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-md truncate" title={log.details}>
                      {log.details}
                      {log.oldValue && log.newValue && (
                        <div className="mt-1 text-xs grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded">
                          <div className="text-red-500 line-through truncate" title={log.oldValue}>{log.oldValue}</div>
                          <div className="text-green-500 truncate" title={log.newValue}>{log.newValue}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8 opacity-20" />
                      <p>Aucun historique trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
