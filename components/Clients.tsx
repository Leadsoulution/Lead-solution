import React, { useState, useMemo } from 'react';
import { Client, Order, Statut } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import { PlusCircle, Search, User, Phone, Home, ShoppingBag, DollarSign, Edit, Trash2, X, AlertCircle } from 'lucide-react';

// Modal for Adding/Editing a Client
interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => { success: boolean, message: string };
  client: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState<Client>(
    client || { id: '', name: '', phone: '', address: '' }
  );
  const [error, setError] = useState('');

  React.useEffect(() => {
    setFormData(client || { id: `client-${Date.now()}`, name: '', phone: '', address: '' });
    setError('');
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Le nom et le téléphone sont obligatoires.');
      return;
    }
    const result = onSave(formData);
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
          <h2 className="text-xl font-semibold">{client ? 'Modifier le client' : 'Ajouter un client'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <label className="block text-sm font-medium">Nom complet *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Téléphone *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Adresse</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 input-style" />
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


interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  orders: Order[];
}

const Clients: React.FC<ClientsProps> = ({ clients, setClients, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { formatCurrency, colors } = useCustomization();

  const clientProfiles = useMemo(() => {
    return clients.map(client => {
      const clientOrders = orders.filter(o => o.customerPhone === client.phone);
      const totalSpent = clientOrders.reduce((sum, o) => sum + o.price, 0);
      return {
        ...client,
        totalOrders: clientOrders.length,
        totalSpent,
        orders: clientOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    });
  }, [clients, orders]);

  const filteredClients = useMemo(() => {
    return clientProfiles.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientProfiles, searchTerm]);

  const handleSaveClient = (clientData: Client): { success: boolean, message: string } => {
    if (editingClient) { // Editing existing client
      if (clients.some(c => c.phone === clientData.phone && c.id !== clientData.id)) {
        return { success: false, message: 'Ce numéro de téléphone est déjà utilisé par un autre client.' };
      }
      setClients(prev => prev.map(c => c.id === clientData.id ? clientData : c));
    } else { // Adding new client
      if (clients.some(c => c.phone === clientData.phone)) {
        return { success: false, message: 'Un client avec ce numéro de téléphone existe déjà.' };
      }
      setClients(prev => [...prev, clientData]);
    }
    return { success: true, message: '' };
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses commandes resteront, mais le client sera retiré de cette liste.")) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    }
  };

  const openModalToAdd = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const openModalToEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };
  
  const currentClientProfile = useMemo(() => {
    if (!selectedClient) return null;
    return clientProfiles.find(p => p.id === selectedClient.id);
  }, [selectedClient, clientProfiles]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Clients</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Client List */}
        <div className="lg:col-span-1 flex flex-col p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Liste des clients</h2>
            <button onClick={openModalToAdd} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md" title="Ajouter un client">
              <PlusCircle size={20} />
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedClient?.id === client.id ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400' : 'hover:bg-accent dark:hover:bg-dark-accent border-transparent'}`}
              >
                <div className="font-semibold">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.phone}</div>
                <div className="text-xs text-muted-foreground mt-1">{client.totalOrders} commande(s)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Details */}
        <div className="lg:col-span-2 flex flex-col p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
          {currentClientProfile ? (
            <div className="flex flex-col h-full">
                <div className="p-4 mb-4 rounded-lg border-2 border-blue-500 bg-blue-50/20 dark:bg-blue-900/10">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">Profil du Client</h2>
                        <div className="flex items-center gap-2">
                           <button onClick={() => openModalToEdit(currentClientProfile)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md" title="Modifier"><Edit size={16} /></button>
                           <button onClick={() => handleDeleteClient(currentClientProfile.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Supprimer"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground"/> <strong>{currentClientProfile.name}</strong></div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground"/> {currentClientProfile.phone}</div>
                        <div className="flex items-center gap-2 col-span-full"><Home size={14} className="text-muted-foreground"/> {currentClientProfile.address || "Non spécifiée"}</div>
                        <div className="flex items-center gap-2"><ShoppingBag size={14} className="text-muted-foreground"/> {currentClientProfile.totalOrders} Commande(s)</div>
                        <div className="flex items-center gap-2"><DollarSign size={14} className="text-muted-foreground"/> {formatCurrency(currentClientProfile.totalSpent)} Dépensé</div>
                    </div>
                </div>

              <h3 className="text-lg font-semibold mb-2">Historique des Commandes</h3>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary dark:bg-dark-secondary sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Produit</th>
                      <th className="p-2 text-right">Prix</th>
                      <th className="p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {currentClientProfile.orders.map(order => {
                      const statusColor = colors.statut[order.statut];
                      return (
                        <tr key={order.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                          <td className="p-2">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">{order.product}</td>
                          <td className="p-2 text-right">{formatCurrency(order.price)}</td>
                          <td className="p-2">
                             <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: statusColor, color: 'white' }}>
                                {order.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <AlertCircle size={48} className="mb-4" />
              <h3 className="text-lg font-semibold">Aucun client sélectionné</h3>
              <p className="max-w-xs">Veuillez sélectionner un client dans la liste de gauche pour voir ses détails et son historique de commandes.</p>
            </div>
          )}
        </div>
      </div>
      
      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};

export default Clients;
