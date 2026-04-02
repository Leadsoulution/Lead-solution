import React, { useState, useMemo, useRef } from 'react';
import { DeliveryCompany } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import { PlusCircle, Search, Truck, Key, Link, Edit, Trash2, X, AlertCircle, Copy, Check, Upload } from 'lucide-react';
import { api } from '../src/services/api';
import * as XLSX from 'xlsx';

const PREDEFINED_COMPANIES = [
  { name: 'GUEPEX', logo: 'https://guepex.com/assets/img/logo.png', defaultUrl: 'https://api.guepex.com/v1' },
  { name: 'YALIDIN', logo: 'https://yalidine.com/wp-content/uploads/2021/11/yalidine-logo.png', defaultUrl: 'https://api.yalidine.com/v1' },
  { name: 'LYNX ECOTRACK', logo: 'https://lynxecotrack.com/logo.png', defaultUrl: 'https://api.lynxecotrack.com/v1' },
  { name: 'RJ360 ECOTRACK', logo: 'https://rj360.com/logo.png', defaultUrl: 'https://api.rj360.com/v1' },
  { name: 'Sendit', logo: 'https://app.sendit.ma/assets/img/logo.png', defaultUrl: 'https://app.sendit.ma/api/v1/' },
  { name: 'Ameex', logo: 'https://ameex.app/assets/img/logo.png', defaultUrl: 'https://api.ameex.app/customer/Delivery/Parcels/Action/Type/Add' },
];

interface DeliveryCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: DeliveryCompany) => Promise<{ success: boolean, message: string }>;
  company: DeliveryCompany | null;
}

const DeliveryCompanyModal: React.FC<DeliveryCompanyModalProps> = ({ isOpen, onClose, onSave, company }) => {
  const [formData, setFormData] = useState<DeliveryCompany>(
    company || { id: '', name: '', apiUrl: '', apiKey: '', apiSecret: '', status: 'active', citiesMapping: '' }
  );
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFormData(company || { id: `dc-${Date.now()}`, name: '', apiUrl: '', apiKey: '', apiSecret: '', status: 'active', citiesMapping: '' });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Assuming the excel has columns like 'City' and 'ID'
        const mapping = JSON.stringify(data);
        setFormData(prev => ({ ...prev, citiesMapping: mapping }));
        setError('');
        alert('Fichier des villes importé avec succès !');
      } catch (err) {
        console.error(err);
        setError('Erreur lors de la lecture du fichier Excel. Assurez-vous qu\'il est valide.');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-card dark:bg-dark-card z-10">
          <h2 className="text-xl font-semibold">{company?.id && !company.id.startsWith('dc-') ? 'Modifier la société' : 'Ajouter une société'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
          <div>
            <label className="block text-sm font-medium">Nom de la société *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">URL de l'API</label>
            <input type="url" name="apiUrl" value={formData.apiUrl} onChange={handleChange} className="w-full mt-1 input-style" placeholder="https://api.delivery.com/v1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Clé publique (Public Key)</label>
            <input type="text" name="apiKey" value={formData.apiKey} onChange={handleChange} className="w-full mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium">Clé privée (Private Key)</label>
            <input type="text" name="apiSecret" value={formData.apiSecret || ''} onChange={handleChange} className="w-full mt-1 input-style" />
          </div>
          
          <div className="pt-2 border-t dark:border-gray-700">
            <label className="block text-sm font-medium mb-2">Mapping des villes (Optionnel)</label>
            <div className="flex items-center gap-2">
                <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                    className="hidden" 
                    id="city-upload"
                />
                <label 
                    htmlFor="city-upload" 
                    className="flex items-center gap-2 px-4 py-2 bg-secondary dark:bg-dark-secondary text-sm rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <Upload size={16} />
                    {importing ? 'Importation...' : 'Importer Excel des villes'}
                </label>
                {formData.citiesMapping && formData.citiesMapping.length > 5 && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        <Check size={14} /> Villes chargées
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Importez un fichier Excel pour éviter les conflits de noms de villes avec cette société.</p>
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

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apiUrl?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const handleSaveCompany = async (company: DeliveryCompany) => {
    try {
      // Check if it's an update (exists in our list)
      const isUpdate = companies.some(c => c.id === company.id);
      
      if (isUpdate) {
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleConnect = (predefined: typeof PREDEFINED_COMPANIES[0]) => {
    setEditingCompany({
        id: `dc-${Date.now()}`,
        name: predefined.name,
        apiUrl: predefined.defaultUrl,
        apiKey: '',
        apiSecret: '',
        status: 'active',
        citiesMapping: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (company: DeliveryCompany) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  // Combine predefined and connected companies for the grid
  const allDisplayCompanies = useMemo(() => {
    const displayList: any[] = [];
    
    // First add all connected companies
    companies.forEach(c => {
        const predefinedMatch = PREDEFINED_COMPANIES.find(p => p.name.toLowerCase() === c.name.toLowerCase());
        displayList.push({
            ...c,
            logo: predefinedMatch?.logo || null,
            isConnected: true
        });
    });

    // Then add predefined ones that aren't connected yet
    PREDEFINED_COMPANIES.forEach(p => {
        if (!companies.some(c => c.name.toLowerCase() === p.name.toLowerCase())) {
            displayList.push({
                ...p,
                id: `pre-${p.name}`,
                isConnected: false
            });
        }
    });

    return displayList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Truck className="text-gray-700 dark:text-gray-300" />
            Delivery Companies
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connect your delivery partners to start shipping<br/>
                Transporteurs pour votre marché : Algeria (modifier le pays dans Paramètres → Entreprise)
            </p>
        </div>
        
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-sm"
            />
        </div>
      </div>

      <div className="flex items-center gap-4 border-b dark:border-gray-800 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary dark:bg-dark-secondary rounded-md text-sm font-medium">
              <Truck size={16} />
              Available
          </div>
          <span className="text-sm text-gray-500">{allDisplayCompanies.length} companies</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allDisplayCompanies.map((company) => (
              <div 
                key={company.id} 
                className="bg-[#2a2a2a] dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col items-center justify-between gap-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors relative group"
              >
                  {company.isConnected && (
                      <button 
                        onClick={(e) => handleDelete(company.id, e)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                          <Trash2 size={16} />
                      </button>
                  )}
                  
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden p-2">
                      {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-contain" onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl font-bold text-gray-400">${company.name.charAt(0)}</span>`;
                          }} />
                      ) : (
                          <span className="text-3xl font-bold text-gray-400">{company.name.charAt(0)}</span>
                      )}
                  </div>
                  
                  <h3 className="font-bold text-white text-lg text-center">{company.name}</h3>
                  
                  <button 
                    onClick={() => company.isConnected ? handleEdit(company) : handleConnect(company)}
                    className="w-full py-2.5 bg-white text-black hover:bg-gray-100 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                      {company.isConnected ? (
                          <>
                            <Edit size={16} />
                            Modifier
                          </>
                      ) : (
                          <>
                            <PlusCircle size={16} />
                            Connect
                          </>
                      )}
                  </button>
              </div>
          ))}

          {/* Add custom company card */}
          <div 
            onClick={() => {
                setEditingCompany(null);
                setIsModalOpen(true);
            }}
            className="bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer min-h-[220px]"
          >
              <div className="w-12 h-12 rounded-full bg-secondary dark:bg-dark-secondary flex items-center justify-center text-gray-500">
                  <PlusCircle size={24} />
              </div>
              <h3 className="font-medium text-gray-600 dark:text-gray-400 text-center">Ajouter une autre société</h3>
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