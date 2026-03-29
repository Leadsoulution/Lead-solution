import React, { useState, useMemo, useEffect } from 'react';
import { DeliveryCompany } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import { PlusCircle, Search, Truck, Key, Link, Edit, Trash2, X, AlertCircle, Copy, Check } from 'lucide-react';
import { api } from '../src/services/api';

interface DeliveryCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: DeliveryCompany) => Promise<{ success: boolean, message: string }>;
  company: DeliveryCompany | null;
}

const DeliveryCompanyModal: React.FC<DeliveryCompanyModalProps> = ({ isOpen, onClose, onSave, company }) => {
  const [formData, setFormData] = useState<DeliveryCompany>(
    company || { id: '', name: '', apiUrl: '', apiKey: '', status: 'active' }
  );
  const [error, setError] = useState('');

  React.useEffect(() => {
    setFormData(company || { id: `dc-${Date.now()}`, name: '', apiUrl: '', apiKey: '', status: 'active' });
    setError('');
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Le nom est obligatoire.');
      return;
    }
    const result = await onSave(formData);
    if (result.success) {
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">{company ? 'Modifier la société' : 'Ajouter une société'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <label className="block text-sm font-medium">Nom de la société *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">URL de l'API</label>
            <input type="url" name="apiUrl" value={formData.apiUrl} onChange={handleChange} className="w-full mt-1 input-style" placeholder="https://api.delivery.com/v1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Clé API (API Key)</label>
            <input type="text" name="apiKey" value={formData.apiKey} onChange={handleChange} className="w-full mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium">Statut</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 input-style bg-transparent">
              <option value="active" className="dark:bg-gray-800">Actif</option>
              <option value="inactive" className="dark:bg-gray-800">Inactif</option>
            </select>
          </div>
          <div className="flex justify-end items-center gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent dark:hover:bg-dark-accent">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Sauvegarder</button>
          </div>
        </form>
        <style>{`.input-style { padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }`}</style>
      </div>
    </div>
  );
};

interface DeliveryCompaniesProps {
  companies: DeliveryCompany[];
  setCompanies: React.Dispatch<React.SetStateAction<DeliveryCompany[]>>;
}

const DeliveryCompanies: React.FC<DeliveryCompaniesProps> = ({ companies, setCompanies }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { colors } = useCustomization();

  const handleCopyWebhook = (id: string) => {
    const webhookUrl = `${window.location.origin}/api/webhooks/delivery/${id}`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apiUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const handleSaveCompany = async (company: DeliveryCompany) => {
    try {
      if (editingCompany) {
        await api.updateDeliveryCompany(company);
        setCompanies(prev => prev.map(c => c.id === company.id ? company : c));
      } else {
        const newCompany = await api.createDeliveryCompany(company);
        setCompanies(prev => [...prev, newCompany]);
      }
      return { success: true, message: '' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erreur lors de la sauvegarde.' };
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette société de livraison ?')) {
      try {
        await api.deleteDeliveryCompany(id);
        setCompanies(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Truck className="text-blue-500" />
          Sociétés de livraison
        </h2>
        <button
          onClick={() => {
            setEditingCompany(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          <span>Ajouter une société</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une société..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Nom</th>
                <th className="p-4 font-medium">API URL</th>
                <th className="p-4 font-medium">Webhook URL</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck size={48} className="text-gray-300 dark:text-gray-600 mb-2" />
                      <p>Aucune société de livraison trouvée.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{company.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Link size={16} />
                        <span className="text-sm truncate max-w-[200px]" title={company.apiUrl}>{company.apiUrl || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
                          {`${window.location.origin}/api/webhooks/delivery/${company.id}`}
                        </code>
                        <button
                          onClick={() => handleCopyWebhook(company.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Copier l'URL du webhook"
                        >
                          {copiedId === company.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        company.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {company.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCompany(company);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCompany}
        company={editingCompany}
      />
    </div>
  );
};

export default DeliveryCompanies;