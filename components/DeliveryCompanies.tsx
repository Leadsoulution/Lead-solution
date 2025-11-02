import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, Truck, Trash2, PlusCircle, CheckCircle, Share2, Code, Zap } from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ title, description, icon, isEnabled, onToggle }) => {
  return (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-accent dark:bg-dark-accent p-3 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground dark:text-dark-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </div>
    </div>
  );
};

const DeliveryCompanies: React.FC = () => {
  const { deliveryCompanies, addDeliveryCompany, updateDeliveryCompany, deleteDeliveryCompany } = useAuth();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyMessage, setCompanyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const popularMoroccanCompanies = ['Amana', 'Chronopost', 'Aramex', 'SDTM', 'Cocolis', 'Cathedis'];

  const [integrations, setIntegrations] = useState({
    portal: false,
    api: false,
    code: false,
  });

  useEffect(() => {
    try {
      const savedIntegrations = localStorage.getItem('deliveryIntegrations');
      if (savedIntegrations) {
        setIntegrations(JSON.parse(savedIntegrations));
      }
    } catch (error) {
      console.error("Failed to load integrations from localStorage", error);
    }
  }, []);

  const handleToggle = (key: keyof typeof integrations) => {
    setIntegrations(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem('deliveryIntegrations', JSON.stringify(newState));
      return newState;
    });
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyMessage(null);
    const result = addDeliveryCompany(newCompanyName);
    if (result.success) {
      setCompanyMessage({ type: 'success', text: result.message });
      setNewCompanyName('');
    } else {
      setCompanyMessage({ type: 'error', text: result.message });
    }
  };
  
  const handleAddPopularCompany = (name: string) => {
     setCompanyMessage(null);
     const result = addDeliveryCompany(name);
      if (result.success) {
      setCompanyMessage({ type: 'success', text: `${name} a été ajouté avec succès.` });
    } else {
      setCompanyMessage({ type: 'error', text: result.message });
    }
  }

  const handleCompanyUpdate = (id: string, name: string) => {
    updateDeliveryCompany(id, name);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Sociétés de Livraison</h1>
        <p className="text-muted-foreground">Gérez vos partenaires de livraison et leurs méthodes d'intégration.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-8">
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Truck size={20}/> Ajouter une société</h3>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Nom de la société</label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Chronopost"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  <Save size={16}/>
                  Ajouter
                </button>
                {companyMessage && (
                  <p className={`text-sm mt-2 ${companyMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {companyMessage.text}
                  </p>
                )}
              </form>
            </div>

            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                <h3 className="text-xl font-semibold mb-4">Ajouter des transporteurs populaires</h3>
                <div className="space-y-2">
                    {popularMoroccanCompanies.map(companyName => {
                        const isAdded = deliveryCompanies.some(c => c.name.toLowerCase() === companyName.toLowerCase());
                        return (
                            <div key={companyName} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{companyName}</span>
                                <button
                                    onClick={() => handleAddPopularCompany(companyName)}
                                    disabled={isAdded}
                                    className={`p-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${
                                        isAdded 
                                            ? 'text-green-600 cursor-default' 
                                            : 'bg-secondary hover:bg-accent dark:bg-dark-secondary dark:hover:bg-dark-accent'
                                    }`}
                                >
                                    {isAdded ? <CheckCircle size={14} /> : <PlusCircle size={14} />}
                                    {isAdded ? 'Ajouté' : 'Ajouter'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

          </div>
          <div className="md:col-span-2">
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
              <h3 className="text-xl font-semibold mb-4">Liste des sociétés</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground dark:text-dark-muted-foreground">
                    <tr>
                      <th className="p-2">Nom</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryCompanies.map((company) => (
                      <tr key={company.id} className="border-t dark:border-gray-700">
                        <td className="p-2 font-medium">
                          <input
                            type="text"
                            value={company.name}
                            onChange={(e) => handleCompanyUpdate(company.id, e.target.value)}
                            className="w-full bg-transparent p-1 rounded-md focus:ring-1 focus:ring-blue-500 focus:bg-accent dark:focus:bg-dark-accent"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => deleteDeliveryCompany(company.id)}
                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-2xl font-semibold border-b pb-2">Méthodes d'intégration</h2>
            <IntegrationCard
                title="Portail Partenaire"
                description="Intégration via un tableau ou un portail partenaire."
                icon={<Share2 className="h-6 w-6 text-primary dark:text-dark-primary" />}
                isEnabled={integrations.portal}
                onToggle={() => handleToggle('portal')}
            />
            <IntegrationCard
                title="Intégration API (Automatique)"
                description="Synchronisation automatique via API."
                icon={<Zap className="h-6 w-6 text-primary dark:text-dark-primary" />}
                isEnabled={integrations.api}
                onToggle={() => handleToggle('api')}
            />
            <IntegrationCard
                title="Par Code"
                description="Intégration via des scripts ou codes de suivi."
                icon={<Code className="h-6 w-6 text-primary dark:text-dark-primary" />}
                isEnabled={integrations.code}
                onToggle={() => handleToggle('code')}
            />
        </div>
    </div>
  );
};

export default DeliveryCompanies;