import React, { useState, useMemo, useEffect, useRef } from 'react';
import { mockOrders } from '../services/mockData';
import { Order, Statut, Ramassage, Livraison, Remboursement, CommandeRetour, MessageCategory, MessageTemplate, Platform } from '../types';
import { Search, MessageSquare, Phone, XCircle, Filter, PlusCircle, Upload } from 'lucide-react';
import ColorSelector from './ColorSelector';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import AddOrderModal from './AddOrderModal';
import FilterColorSelector from './FilterColorSelector';


const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(JSON.stringify(mockOrders)));
  const [searchTerm, setSearchTerm] = useState('');
  const { users, deliveryCompanies } = useAuth();
  const { messageTemplates } = useCustomization();
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const initialFilters = {
    statut: '',
    ramassage: '',
    livraison: '',
    remboursement: '',
    commandeRetour: '',
    assignedUserId: '',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState(initialFilters);


  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(order => {
        if (filters.statut && order.statut !== filters.statut) return false;
        if (filters.ramassage && order.ramassage !== filters.ramassage) return false;
        if (filters.livraison && order.livraison !== filters.livraison) return false;
        if (filters.remboursement && order.remboursement !== filters.remboursement) return false;
        if (filters.commandeRetour && order.commandeRetour !== filters.commandeRetour) return false;
        if (filters.assignedUserId && order.assignedUserId !== filters.assignedUserId) return false;
        if (filters.startDate && new Date(order.date) < new Date(filters.startDate + 'T00:00:00')) return false;
        if (filters.endDate && new Date(order.date) > new Date(filters.endDate + 'T23:59:59')) return false;
        return true;
      });
  }, [orders, searchTerm, filters]);

  const handleUpdateOrder = (orderId: string, field: keyof Order, value: any) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, [field]: value } : order
      )
    );
  };
  
   const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };
  
  const handleWhatsAppClick = (order: Order, category: MessageCategory) => {
    const status = order[category];
    if (!status) return;

    const messageConfig = (messageTemplates[category] as Record<string, MessageTemplate>)[status];
    
    if (!messageConfig || !messageConfig.enabled) {
        alert(`Le message pour "${status}" est désactivé ou non configuré.`);
        return;
    }

    let message = messageConfig.template;

    message = message.replace(/{{client}}/g, order.customerName)
                     .replace(/{{id}}/g, order.id)
                     .replace(/{{produit}}/g, order.product)
                     .replace(/{{prix}}/g, order.price.toFixed(2))
                     .replace(/{{status}}/g, status);


    let phone = order.customerPhone.replace(/[^0-9]/g, '');
    // Automatically format for Morocco (+212)
    if (phone.startsWith('0')) {
      phone = '212' + phone.substring(1);
    } else if (phone.length === 9 && !phone.startsWith('212')) {
      // Handles cases like 6XXXXXXXX
      phone = '212' + phone;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'date' | 'platform' | 'statut' | 'ramassage' | 'livraison' | 'remboursement' | 'commandeRetour' | 'assignedUserId' | 'callCount' | 'deliveryCompanyId'>) => {
    const newOrder: Order = {
      id: `manual-${Date.now()}`,
      date: new Date().toISOString(),
      ...newOrderData,
      platform: Platform.Manual,
      statut: Statut.PasDeReponse,
      ramassage: Ramassage.NonRamasser,
      livraison: Livraison.PasDeReponse,
      remboursement: Remboursement.NonPayer,
      commandeRetour: CommandeRetour.NonRetourne,
      assignedUserId: null,
      deliveryCompanyId: null,
      callCount: 0,
    };
    setOrders(prev => [newOrder, ...prev]);
    setIsAddOrderModalOpen(false);
    setNotification({ type: 'success', message: 'Commande ajoutée avec succès !' });
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) throw new Error("Le fichier CSV doit avoir un en-tête et au moins une ligne de données.");

            const header = rows[0].split(',').map(h => h.trim());
            const expectedHeaders = ['customerName', 'customerPhone', 'address', 'price', 'product', 'noteClient', 'noteObligatoire'];
            const headerMap = expectedHeaders.map(h => header.indexOf(h));

            if (headerMap.some(index => index === -1)) {
                throw new Error(`En-tête CSV manquant ou incorrect. Attendu : ${expectedHeaders.join(', ')}`);
            }

            const newOrders: Order[] = rows.slice(1).map((rowStr, index) => {
                const values = rowStr.split(',');
                const price = parseFloat(values[headerMap[3]]);
                if (isNaN(price)) {
                    throw new Error(`Prix non valide à la ligne ${index + 2}.`);
                }
                
                return {
                    id: `import-${Date.now()}-${index}`,
                    date: new Date().toISOString(),
                    customerName: values[headerMap[0]]?.trim() || '',
                    customerPhone: values[headerMap[1]]?.trim() || '',
                    address: values[headerMap[2]]?.trim() || '',
                    price: price,
                    product: values[headerMap[4]]?.trim() || '',
                    noteClient: values[headerMap[5]]?.trim() || '',
                    noteObligatoire: values[headerMap[6]]?.trim() || '',
                    platform: Platform.Manual,
                    statut: Statut.PasDeReponse,
                    assignedUserId: null,
                    ramassage: Ramassage.NonRamasser,
                    livraison: Livraison.PasDeReponse,
                    remboursement: Remboursement.NonPayer,
                    commandeRetour: CommandeRetour.NonRetourne,
                    deliveryCompanyId: null,
                    callCount: 0,
                };
            });

            setOrders(prev => [...newOrders, ...prev]);
            setNotification({ type: 'success', message: `${newOrders.length} commandes importées avec succès.` });

        } catch (error: any) {
            setNotification({ type: 'error', message: `Erreur d'importation : ${error.message}` });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
};

  const renderInput = (order: Order, field: keyof Order, placeholder: string) => (
      <input
          type="text"
          value={order[field] as string}
          onChange={(e) => handleUpdateOrder(order.id, field, e.target.value)}
          placeholder={placeholder}
          className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs"
      />
  );
  
  const renderActionButton = (order: Order, category: MessageCategory) => {
      const status = order[category];
      const messageConfig = status ? messageTemplates[category][status as keyof typeof messageTemplates[typeof category]] : undefined;
      const isEnabled = messageConfig?.enabled ?? false;
      
      return (
           <button 
                onClick={() => handleWhatsAppClick(order, category)} 
                title="Envoyer message WhatsApp" 
                disabled={!isEnabled}
                className="w-full text-xs bg-blue-500 text-white p-1.5 rounded-md hover:bg-blue-600 flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
            >
              <MessageSquare size={12}/>
              Send
            </button>
      );
  };


  const headerStyles = {
    info: 'bg-orange-300 dark:bg-orange-800',
    actions: 'bg-pink-200 dark:bg-pink-800',
    status: 'bg-gray-200 dark:bg-gray-700'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Commandes</h1>
      {notification && (
        <div className={`p-4 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
            {notification.message}
        </div>
      )}
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-secondary-foreground bg-secondary hover:bg-accent"
                >
                    <Filter size={16} />
                    Filtres
                </button>
                <button
                    onClick={() => setIsAddOrderModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusCircle size={16} />
                    Ajouter
                </button>
                 <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-secondary-foreground bg-secondary hover:bg-accent"
                 >
                    <Upload size={16} />
                    Importer
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".csv"
                    className="hidden"
                />
            </div>
          </div>

        {showFilters && (
            <div className="mb-6 p-4 border-2 border-blue-500 rounded-lg shadow-md bg-blue-50/20 dark:bg-blue-900/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Filter size={20} />
                        Filtres
                    </h3>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <label htmlFor="startDate" className="block text-xs font-medium text-muted-foreground mb-1">Date de début</label>
                            <input
                                type="date"
                                id="startDate"
                                value={filters.startDate}
                                onChange={e => handleFilterChange('startDate', e.target.value)}
                                className="w-40 p-2 border rounded-md bg-card dark:bg-dark-card focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-xs font-medium text-muted-foreground mb-1">Date de fin</label>
                            <input
                                type="date"
                                id="endDate"
                                value={filters.endDate}
                                onChange={e => handleFilterChange('endDate', e.target.value)}
                                className="w-40 p-2 border rounded-md bg-card dark:bg-dark-card focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <FilterColorSelector
                        value={filters.statut}
                        onChange={(value) => handleFilterChange('statut', value)}
                        options={Statut}
                        category="statut"
                        defaultLabel="Toute Confirmation"
                    />
                    <FilterColorSelector
                        value={filters.ramassage}
                        onChange={(value) => handleFilterChange('ramassage', value)}
                        options={Ramassage}
                        category="ramassage"
                        defaultLabel="Tout Ramassage"
                    />
                    <FilterColorSelector
                        value={filters.livraison}
                        onChange={(value) => handleFilterChange('livraison', value)}
                        options={Livraison}
                        category="livraison"
                        defaultLabel="Toute Livraison"
                    />
                    <FilterColorSelector
                        value={filters.remboursement}
                        onChange={(value) => handleFilterChange('remboursement', value)}
                        options={Remboursement}
                        category="remboursement"
                        defaultLabel="Tout Remboursement"
                    />
                    <FilterColorSelector
                        value={filters.commandeRetour}
                        onChange={(value) => handleFilterChange('commandeRetour', value)}
                        options={CommandeRetour}
                        category="commandeRetour"
                        defaultLabel="Tout Retour"
                    />
                    <div className="w-full">
                       <select
                          aria-label="Filtrer par utilisateur"
                          value={filters.assignedUserId}
                          onChange={e => handleFilterChange('assignedUserId', e.target.value)}
                          className="w-full p-2 border rounded-md bg-card dark:bg-dark-card focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Tout Utilisateur</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                    </div>
                    
                     <button
                        onClick={resetFilters}
                        className="w-full flex items-center justify-center gap-2 p-2 border rounded-md bg-card dark:bg-dark-card hover:bg-accent dark:hover:bg-dark-accent text-sm font-medium"
                     >
                        <XCircle size={16} />
                        Réinitialiser
                    </button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="font-bold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className={`p-2 border ${headerStyles.info}`}>Date</th>
                <th className={`p-2 border ${headerStyles.info}`}>Client</th>
                <th className={`p-2 border ${headerStyles.info}`}>Téléphone</th>
                <th className={`p-2 border ${headerStyles.info}`}>Adresse</th>
                <th className={`p-2 border ${headerStyles.info}`}>Prix</th>
                <th className={`p-2 border ${headerStyles.info}`}>PRODUIT</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Appel / fois</th>
                <th className={`p-2 border ${headerStyles.status}`}>Confirmation</th>
                <th className={`p-2 border ${headerStyles.status}`}>User</th>
                <th className={`p-2 border ${headerStyles.status}`}>NOTE DU CLIENT</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Msg de Confirmation</th>
                <th className={`p-2 border ${headerStyles.status}`}>Ramassage</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Message de Ramassage</th>
                <th className={`p-2 border ${headerStyles.status}`}>Livraison</th>
                <th className={`p-2 border ${headerStyles.status}`}>Société de Livraison</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Message de Livraison</th>
                <th className={`p-2 border ${headerStyles.status}`}>Remboursement</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Msg Remboursement</th>
                <th className={`p-2 border ${headerStyles.status}`}>Commande retour</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Msg Commande retour</th>
                <th className={`p-2 border ${headerStyles.status}`}>Note Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                  <td className="p-1 border min-w-[100px]">{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-1 border min-w-[150px]">{order.customerName}</td>
                  <td className="p-1 border min-w-[120px]">{order.customerPhone}</td>
                  <td className="p-1 border min-w-[200px]">{order.address}</td>
                  <td className="p-1 border min-w-[80px] text-right">{order.price.toFixed(2)}€</td>
                  <td className="p-1 border min-w-[150px]">{order.product}</td>
                  <td className={`p-1 border min-w-[120px]`}>
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-sm">{order.callCount}</span>
                        <button
                            onClick={() => handleUpdateOrder(order.id, 'callCount', order.callCount + 1)}
                            title="Incrémenter le nombre d'appels"
                            className="p-1.5 rounded-md bg-pink-500 text-white hover:bg-pink-600"
                        >
                            <Phone size={12} />
                        </button>
                    </div>
                  </td>
                  <td className="p-1 border min-w-[150px]">
                    <ColorSelector
                      value={order.statut}
                      onChange={(newValue) => handleUpdateOrder(order.id, 'statut', newValue)}
                      options={Statut}
                      category="statut"
                    />
                  </td>
                  <td className="p-1 border min-w-[150px]">
                    <select
                        value={order.assignedUserId || ''}
                        onChange={(e) => handleUpdateOrder(order.id, 'assignedUserId', e.target.value || null)}
                        className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs"
                    >
                        <option value="">-- Non assigné --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-1 border min-w-[200px]">{renderInput(order, 'noteClient', 'Note...')}</td>
                  <td className={`p-1 border min-w-[100px]`}>{renderActionButton(order, 'statut')}</td>
                  <td className="p-1 border min-w-[150px]">
                    <ColorSelector
                        value={order.ramassage}
                        onChange={(newValue) => handleUpdateOrder(order.id, 'ramassage', newValue)}
                        options={Ramassage}
                        category="ramassage"
                    />
                  </td>
                  <td className={`p-1 border min-w-[100px]`}>{renderActionButton(order, 'ramassage')}</td>
                  <td className="p-1 border min-w-[180px]">
                    <ColorSelector
                        value={order.livraison}
                        onChange={(newValue) => handleUpdateOrder(order.id, 'livraison', newValue)}
                        options={Livraison}
                        category="livraison"
                    />
                  </td>
                  <td className="p-1 border min-w-[170px]">
                    <select value={order.deliveryCompanyId || ''} onChange={(e) => handleUpdateOrder(order.id, 'deliveryCompanyId', e.target.value || null)} className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs">
                        <option value="">-- Non assigné --</option>
                        {deliveryCompanies.map(company => ( <option key={company.id} value={company.id}>{company.name}</option> ))}
                    </select>
                  </td>
                   <td className={`p-1 border min-w-[100px]`}>{renderActionButton(order, 'livraison')}</td>
                  <td className="p-1 border min-w-[120px]">
                    <ColorSelector
                        value={order.remboursement}
                        onChange={(newValue) => handleUpdateOrder(order.id, 'remboursement', newValue)}
                        options={Remboursement}
                        category="remboursement"
                    />
                  </td>
                  <td className={`p-1 border min-w-[100px]`}>{renderActionButton(order, 'remboursement')}</td>
                  <td className="p-1 border min-w-[150px]">
                     <ColorSelector
                        value={order.commandeRetour}
                        onChange={(newValue) => handleUpdateOrder(order.id, 'commandeRetour', newValue)}
                        options={CommandeRetour}
                        category="commandeRetour"
                    />
                  </td>
                  <td className={`p-1 border min-w-[100px]`}>{renderActionButton(order, 'commandeRetour')}</td>
                  <td className="p-1 border min-w-[200px]">{renderInput(order, 'noteObligatoire', 'Note...')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
       <AddOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </div>
  );
};

export default Orders;