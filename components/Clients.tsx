
import React, { useState, useMemo } from 'react';
import { Client, Order, Statut } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import { PlusCircle, Search, User, Phone, Home, ShoppingBag, DollarSign, Edit, Trash2, X, AlertCircle, ChevronDown } from 'lucide-react';
import { colord } from 'colord';
import { api } from '../src/services/api';

// Modal for Adding/Editing a Client
interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => Promise<{ success: boolean, message: string }>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Le nom et le téléphone sont obligatoires.');
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
  const [selectedClient, setSelectedClient] = useState<(Client & { totalOrders: number; totalSpent: number; orders: Order[] }) | null>(null);
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

  // ... inside Clients component ...

  const handleSaveClient = async (clientData: Client): Promise<{ success: boolean, message: string }> => {
    try {
        if (editingClient) { // Editing existing client
          // Check for duplicate phone (excluding current client)
          if (clients.some(c => c.phone === clientData.phone && c.id !== clientData.id)) {
            return { success: false, message: 'Ce numéro de téléphone est déjà utilisé par un autre client.' };
          }
          
          await api.updateClient(clientData);
          setClients(prev => prev.map(c => c.id === clientData.id ? clientData : c));
        } else { // Adding new client
          if (clients.some(c => c.phone === clientData.phone)) {
            return { success: false, message: 'Un client avec ce numéro de téléphone existe déjà.' };
          }
          
          const createdClient = await api.createClient(clientData);
          setClients(prev => [...prev, createdClient]);
        }
        return { success: true, message: '' };
    } catch (error) {
        console.error("Failed to save client", error);
        return { success: false, message: 'Erreur lors de la sauvegarde du client.' };
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ? Toutes ses commandes resteront, mais le client sera retiré de cette liste.")) {
      try {
          await api.deleteClient(clientId);
          setClients(prev => prev.filter(c => c.id !== clientId));
          if (selectedClient?.id === clientId) {
            setSelectedClient(null);
          }
      } catch (error) {
          console.error("Failed to delete client", error);
          alert("Erreur lors de la suppression du client.");
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

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={openModalToAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700" title="Ajouter un client">
            <PlusCircle size={16} />
            Ajouter
          </button>
        </div>
      </div>
      
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border dark:border-gray-800">
         <div className="hidden md:grid grid-cols-[1fr_1fr_2fr_auto] gap-4 items-center p-3 px-4 text-xs font-semibold text-muted-foreground border-b dark:border-gray-800">
            <div>Nom du client</div>
            <div>Téléphone</div>
            <div>Adresse</div>
            <div className="w-5"></div>
        </div>
        <div className="space-y-1 p-2">
            {filteredClients.map(client => {
            const isSelected = selectedClient?.id === client.id;
            return (
                <div key={client.id} className="rounded-lg overflow-hidden border dark:border-gray-700 transition-shadow hover:shadow-md">
                <div
                    onClick={() => setSelectedClient(isSelected ? null : client)}
                    className={`grid grid-cols-2 md:grid-cols-[1fr_1fr_2fr_auto] gap-x-4 gap-y-1 items-center p-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-accent dark:hover:bg-dark-accent'}`}
                >
                    <div className="font-semibold truncate col-span-2 md:col-span-1">{client.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{client.phone}</div>
                    <div className="text-sm text-muted-foreground truncate col-span-2 md:col-span-1">{client.address}</div>
                    <div className="justify-self-end">
                    <ChevronDown size={20} className={`transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {isSelected && (
                    <div className="p-4 bg-secondary dark:bg-dark-secondary/50">
                    <div className="p-4 mb-4 rounded-lg border-2 border-blue-500 bg-blue-50/20 dark:bg-blue-900/10">
                        <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">Profil du Client</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => openModalToEdit(client)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md" title="Modifier"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Supprimer"><Trash2 size={16} /></button>
                        </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground"/> <strong>{client.name}</strong></div>
                            <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground"/> {client.phone}</div>
                            <div className="flex items-center gap-2 col-span-full"><Home size={14} className="text-muted-foreground"/> {client.address || "Non spécifiée"}</div>
                            <div className="flex items-center gap-2"><ShoppingBag size={14} className="text-muted-foreground"/> {client.totalOrders} Commande(s)</div>
                            <div className="flex items-center gap-2"><DollarSign size={14} className="text-muted-foreground"/> {formatCurrency(client.totalSpent)} Dépensé</div>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Historique des Commandes</h3>
                    <div className="overflow-y-auto max-h-60 rounded-lg border dark:border-gray-700 bg-card dark:bg-dark-card">
                        <table className="w-full text-xs text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary dark:bg-dark-secondary/80 sticky top-0">
                            <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Produit</th>
                            <th className="p-2 text-right">Prix</th>
                            <th className="p-2">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {client.orders.map(order => {
                            const statusColor = colors.statut[order.statut];
                            const textColor = colord(statusColor).isDark() ? 'text-white' : 'text-black';
                            return (
                                <tr key={order.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                                <td className="p-2">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="p-2 font-medium">{order.product}</td>
                                <td className="p-2 text-right">{formatCurrency(order.price)}</td>
                                <td className="p-2">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: statusColor, color: textColor }}>
                                        {order.statut}
                                    </span>
                                </td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                         {client.orders.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Aucune commande trouvée pour ce client.
                            </div>
                         )}
                    </div>
                    </div>
                )}
                </div>
            )
            })}
            {filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <AlertCircle size={48} className="mb-4" />
                <h3 className="text-lg font-semibold">Aucun client trouvé</h3>
                <p className="max-w-xs">Essayez d'ajuster votre recherche ou d'ajouter un nouveau client.</p>
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
