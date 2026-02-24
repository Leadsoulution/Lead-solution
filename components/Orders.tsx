
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, Statut, Ramassage, Livraison, Remboursement, CommandeRetour, MessageCategory, MessageTemplate, Platform, Product, Role } from '../types';
import { Search, MessageSquare, Phone, XCircle, Filter, PlusCircle, Upload, Archive, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import ColorSelector from './ColorSelector';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import AddOrderModal from './AddOrderModal';
import FilterColorSelector from './FilterColorSelector';
import AddProductModal from './AddProductModal';
import WhatsAppPreviewModal from './WhatsAppPreviewModal';


interface OrdersProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onSync: () => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, setOrders, products, setProducts, onSync }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, currentUser } = useAuth();
  const { messageTemplates, formatCurrency } = useCustomization();
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [whatsappPreviewData, setWhatsappPreviewData] = useState<{ phone: string; message: string; rawPhone: string; } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
        await onSync();
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    setSelectedOrders(new Set());
  }, [searchTerm, selectedProductFilter]);

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
    let ordersToFilter = orders;

    // Filter for User and Confirmation roles based on assigned products
    if (currentUser?.role === Role.User || currentUser?.role === Role.Confirmation) {
        if (currentUser.assignedProductIds && currentUser.assignedProductIds.length > 0) {
            const allowedProductNames = new Set(
                products
                    .filter(p => currentUser.assignedProductIds.includes(p.id))
                    .map(p => p.name)
            );
            ordersToFilter = ordersToFilter.filter(order => allowedProductNames.has(order.product));
        } else {
            // If no products are assigned, they see no orders.
            return [];
        }
    }

    return ordersToFilter
      .filter(order => {
        if (selectedProductFilter && order.product !== selectedProductFilter) return false;
        if (filters.statut && order.statut !== filters.statut) return false;
        if (filters.ramassage && order.ramassage !== filters.ramassage) return false;
        if (filters.livraison && order.livraison !== filters.livraison) return false;
        if (filters.remboursement && order.remboursement !== filters.remboursement) return false;
        if (filters.commandeRetour && order.commandeRetour !== filters.commandeRetour) return false;
        if (filters.assignedUserId && order.assignedUserId !== filters.assignedUserId) return false;
        if (filters.startDate && new Date(order.date) < new Date(filters.startDate + 'T00:00:00')) return false;
        if (filters.endDate && new Date(order.date) > new Date(filters.endDate + 'T23:59:59')) return false;
        return true;
      })
      .filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [orders, searchTerm, filters, selectedProductFilter, currentUser, products]);
  
    const handleSelectOrder = (orderId: string) => {
        setSelectedOrders(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(orderId)) {
                newSelected.delete(orderId);
            } else {
                newSelected.add(orderId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

  const handleUpdateOrder = (orderId: string, field: keyof Order, value: any) => {
    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, [field]: value };
          // Auto-assign user on confirmation or recall for unassigned orders
          if (
            field === 'statut' &&
            !order.assignedUserId &&
            (value === Statut.Confirme || value === Statut.Rappel) &&
            (currentUser?.role === Role.User || currentUser?.role === Role.Confirmation)
          ) {
            updatedOrder.assignedUserId = currentUser.id;
          }
          return updatedOrder;
        }
        return order;
      })
    );
  };
  
  const handleProductChange = (orderId: string, inputVal: string) => {
    // Try to find product by Name OR by ID (Code Article)
    const newProduct = products.find(p => 
        p.name.toLowerCase() === inputVal.toLowerCase() || 
        p.id.toLowerCase() === inputVal.toLowerCase()
    );

    setOrders(prevOrders =>
      prevOrders.map(order => {
        if (order.id === orderId) {
          // If we found a matching product (by ID or Name), use its official Name and Price
          const updatedOrder = { 
              ...order, 
              product: newProduct ? newProduct.name : inputVal 
          };
          if (newProduct) {
            updatedOrder.price = newProduct.sellingPrice;
          }
          return updatedOrder;
        }
        return order;
      })
    );
  };

   const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleProductFilterClick = (productName: string) => {
    setSelectedProductFilter(prev => prev === productName ? null : productName);
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
                     .replace(/{{prix}}/g, formatCurrency(order.price))
                     .replace(/{{status}}/g, status)
                     .replace(/{{téléphone}}/g, order.customerPhone)
                     .replace(/{{adresse}}/g, order.address);


    let phoneForUrl = order.customerPhone.replace(/[^0-9]/g, '');
    // Automatically format for Morocco (+212)
    if (phoneForUrl.startsWith('0')) {
      phoneForUrl = '212' + phoneForUrl.substring(1);
    } else if (phoneForUrl.length === 9 && !phoneForUrl.startsWith('212')) {
      // Handles cases like 6XXXXXXXX
      phoneForUrl = '212' + phoneForUrl;
    }

    let displayPhone = `+${phoneForUrl}`;
    if (phoneForUrl.startsWith('212') && phoneForUrl.length === 12) {
      displayPhone = `+212 ${phoneForUrl.substring(3, 6)}-${phoneForUrl.substring(6, 9)}-${phoneForUrl.substring(9)}`;
    }
    
    setWhatsappPreviewData({ phone: displayPhone, message, rawPhone: phoneForUrl });
  };

  const handleConfirmWhatsApp = () => {
    if (whatsappPreviewData) {
      window.open(`https://wa.me/${whatsappPreviewData.rawPhone}?text=${encodeURIComponent(whatsappPreviewData.message)}`, '_blank');
      setWhatsappPreviewData(null);
    }
  };
  
  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'date' | 'platform' | 'statut' | 'ramassage' | 'livraison' | 'remboursement' | 'commandeRetour' | 'assignedUserId' | 'callCount'>) => {
    const newOrder: Order = {
      // Data from form
      customerName: newOrderData.customerName,
      customerPhone: newOrderData.customerPhone,
      address: newOrderData.address,
      price: newOrderData.price,
      product: newOrderData.product,
      noteClient: newOrderData.noteClient,

      // Default values
      id: `manual-${Date.now()}`,
      date: new Date().toISOString(),
      platform: Platform.Manual,
      statut: Statut.NonDefini,
      ramassage: Ramassage.NonDefini,
      livraison: Livraison.NonDefini,
      remboursement: Remboursement.NonDefini,
      commandeRetour: CommandeRetour.NonDefini,
      assignedUserId: null,
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

            // Detect delimiter (comma or semicolon) based on first line
            const firstLine = rows[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';

            const header = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
            const expectedHeaders = ['customerName', 'customerPhone', 'address', 'price', 'product', 'noteClient'];
            
            // Loose matching for headers (case insensitive)
            const headerMap = expectedHeaders.map(h => header.findIndex(head => head.toLowerCase().includes(h.toLowerCase())));

            if (headerMap.some(index => index === -1)) {
                 // Try to be smart: if headers are missing, assume standard column order if row has enough columns
                 console.warn("Headers missing, trying positional assumption.");
            }
            
            // Map indices or fallback to 0,1,2,3,4,5
            const idx = {
                name: headerMap[0] !== -1 ? headerMap[0] : 0,
                phone: headerMap[1] !== -1 ? headerMap[1] : 1,
                addr: headerMap[2] !== -1 ? headerMap[2] : 2,
                price: headerMap[3] !== -1 ? headerMap[3] : 3,
                prod: headerMap[4] !== -1 ? headerMap[4] : 4,
                note: headerMap[5] !== -1 ? headerMap[5] : 5,
            };

            const newOrders: Order[] = rows.slice(1).map((rowStr, index) => {
                const values = rowStr.split(delimiter).map(val => val.trim().replace(/"/g, ''));
                
                // Skip empty lines
                if (values.length <= 1) return null;

                // Resolve Product: Check if input matches ID or Name
                const productInput = values[idx.prod] || 'Produit inconnu';
                const matchedProduct = products.find(p => p.id === productInput || p.name === productInput);
                
                const productName = matchedProduct ? matchedProduct.name : productInput;
                const productPrice = matchedProduct ? matchedProduct.sellingPrice : parseFloat(values[idx.price]?.replace(',', '.') || '0');

                return {
                    id: `import-${Date.now()}-${index}`,
                    date: new Date().toISOString(),
                    customerName: values[idx.name] || 'Inconnu',
                    customerPhone: values[idx.phone] || '',
                    address: values[idx.addr] || '',
                    price: isNaN(productPrice) ? 0 : productPrice,
                    product: productName,
                    noteClient: values[idx.note] || '',
                    platform: Platform.Manual,
                    statut: Statut.NonDefini,
                    assignedUserId: null,
                    ramassage: Ramassage.NonDefini,
                    livraison: Livraison.NonDefini,
                    remboursement: Remboursement.NonDefini,
                    commandeRetour: CommandeRetour.NonDefini,
                    callCount: 0,
                };
            }).filter(o => o !== null) as Order[];

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

  const handleAddProduct = (newProduct: Product) => {
    if (products.some(p => p.id.toLowerCase() === newProduct.id.toLowerCase())) {
        alert("Un produit avec ce code d'article existe déjà.");
        return;
    }
    setProducts(prev => [newProduct, ...prev]);
    setIsAddProductModalOpen(false);
    setNotification({ type: 'success', message: 'Produit ajouté avec succès !' });
  };
  
  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        setNotification({ type: 'success', message: 'Commande supprimée avec succès.' });
    }
  };

  const renderInput = (order: Order, field: keyof Order, placeholder: string, disabled: boolean) => (
      <input
          type="text"
          value={order[field] as string || ''}
          onChange={(e) => handleUpdateOrder(order.id, field, e.target.value)}
          placeholder={placeholder}
          className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
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

  const handleExportOrders = () => {
    if (filteredOrders.length === 0) {
      setNotification({ type: 'error', message: "Aucune commande à exporter." });
      return;
    }
  
    const headers = [
      'ID', 'Date', 'Client', 'Téléphone', 'Adresse', 'Produit', 'Prix',
      'Confirmation', 'Utilisateur assigné', 'Note du Client', 'Ramassage', 'Livraison', 
      'Remboursement', 'Commande retour', 'Appels'
    ];
  
    const escapeCSV = (val: any): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
  
    const rows = filteredOrders.map(order => {
      const assignedUser = users.find(u => u.id === order.assignedUserId)?.username || 'Non assigné';
      
      return [
        escapeCSV(order.id),
        escapeCSV(new Date(order.date).toLocaleDateString('fr-FR')),
        escapeCSV(order.customerName),
        escapeCSV(order.customerPhone),
        escapeCSV(order.address),
        escapeCSV(order.product),
        escapeCSV(order.price),
        escapeCSV(order.statut),
        escapeCSV(assignedUser),
        escapeCSV(order.noteClient),
        escapeCSV(order.ramassage),
        escapeCSV(order.livraison),
        escapeCSV(order.remboursement),
        escapeCSV(order.commandeRetour),
        escapeCSV(order.callCount),
      ].join(',');
    });
  
    const BOM = "\uFEFF"; // Byte Order Mark for UTF-8
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: `${filteredOrders.length} commandes exportées avec succès.` });
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
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-secondary-foreground bg-secondary hover:bg-accent disabled:opacity-70"
                >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? 'Sync...' : 'Synchroniser'}
                </button>
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
                <button
                    onClick={handleExportOrders}
                    className="flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-secondary-foreground bg-secondary hover:bg-accent"
                >
                    <Archive size={16} />
                    Exporter
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
        
        {/* Product Filter Section */}
        <div className="mt-4 border-t pt-2 dark:border-gray-700">
            <p className="text-sm font-semibold mb-2 px-1">Filtrer par produit</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                <button
                    onClick={() => setSelectedProductFilter(null)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center text-center p-2 rounded-lg border-2 transition-all duration-200 w-20 h-20 gap-1 ${
                    !selectedProductFilter 
                        ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-[#CFCFCF] dark:bg-dark-card border-gray-300 dark:border-gray-700 text-secondary-foreground hover:shadow-md hover:scale-105 hover:border-blue-400'
                    }`}
                >
                    <Archive size={24} />
                    <span className="text-xs font-semibold">Tous les produits</span>
                </button>
                {products.filter(p => p.showInOrders ?? true).map(product => (
                <button
                    key={product.id}
                    onClick={() => handleProductFilterClick(product.name)}
                    className={`relative flex-shrink-0 flex flex-col items-center justify-start text-center p-2 rounded-lg border-2 transition-all duration-200 w-20 h-20 gap-1 group bg-[#CFCFCF] dark:bg-dark-card ${
                    selectedProductFilter === product.name
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-300 dark:border-gray-700 hover:shadow-md hover:scale-105 hover:border-blue-400'
                    }`}
                >
                    <div className="w-16 h-12 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                         <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</span>
                    {selectedProductFilter === product.name && (
                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 shadow">
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    )}
                </button>
                ))}
            </div>
        </div>


        {showFilters && (
            <div className="mt-6 p-4 border-2 border-blue-500 rounded-lg shadow-md bg-blue-50/20 dark:bg-blue-900/10">
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

        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse text-xs">
            <thead className="font-bold text-gray-600 dark:text-gray-300 uppercase">
              <tr>
                <th className={`p-2 border text-center ${headerStyles.info} w-10`}>
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length}
                        onChange={handleSelectAll}
                        ref={el => {
                            if (el) {
                                el.indeterminate = selectedOrders.size > 0 && selectedOrders.size < filteredOrders.length;
                            }
                        }}
                        aria-label="Sélectionner toutes les commandes"
                    />
                </th>
                <th className={`p-2 border ${headerStyles.info}`}>Date</th>
                <th className={`p-2 border ${headerStyles.info}`}>Client</th>
                <th className={`p-2 border ${headerStyles.info}`}>Téléphone</th>
                <th className={`p-2 border ${headerStyles.info}`}>Adresse</th>
                <th className={`p-2 border ${headerStyles.info}`}>PRODUIT</th>
                <th className={`p-2 border ${headerStyles.info}`}>Prix</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Appel / fois</th>
                <th className={`p-2 border ${headerStyles.status}`}>Confirmation</th>
                <th className={`p-2 border ${headerStyles.status}`}>User</th>
                <th className={`p-2 border ${headerStyles.status}`}>NOTE DU CLIENT</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Msg de Confirmation</th>
                <th className={`p-2 border ${headerStyles.status}`}>Ramassage</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Message de Ramassage</th>
                <th className={`p-2 border ${headerStyles.status}`}>Livraison</th>
                <th className={`p-2 border ${headerStyles.status}`}>Remboursement</th>
                <th className={`p-2 border ${headerStyles.status}`}>Commande retour</th>
                <th className={`p-2 border ${headerStyles.actions}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                  const product = products.find(p => p.name === order.product);
                  const isEditable = currentUser?.role === Role.Admin || !order.assignedUserId || order.assignedUserId === currentUser?.id;
                  const isStatusLocked = !!order.assignedUserId &&
                      order.assignedUserId !== currentUser?.id &&
                      currentUser?.role !== Role.Admin &&
                      (order.statut === Statut.Confirme || order.statut === Statut.Rappel);
                  return (
                    <tr key={order.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                      <td className="p-1 border text-center align-middle">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            aria-label={`Sélectionner la commande ${order.id}`}
                        />
                      </td>
                      <td className="p-1 border min-w-[100px]">{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-1 border min-w-[150px]">{renderInput(order, 'customerName', 'Nom...', !isEditable)}</td>
                      <td className="p-1 border min-w-[120px]">{renderInput(order, 'customerPhone', 'Téléphone...', !isEditable)}</td>
                      <td className="p-1 border min-w-[200px]">{renderInput(order, 'address', 'Adresse...', !isEditable)}</td>
                      <td className="p-1 border min-w-[200px]">
                        <div className="flex items-center gap-2">
                            {product ? (
                                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-cover rounded-md flex-shrink-0" />
                            ) : (
                                <div className="h-10 w-10 bg-secondary dark:bg-dark-secondary rounded-md flex-shrink-0"></div>
                            )}
                             <input
                                type="text"
                                value={order.product}
                                onChange={(e) => handleProductChange(order.id, e.target.value)}
                                className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isEditable}
                                placeholder="Nom ou ID produit..."
                              />
                        </div>
                      </td>
                      <td className="p-1 border min-w-[100px]">
                        <input
                          type="number"
                          value={order.price}
                          onChange={(e) => handleUpdateOrder(order.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs text-right disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isEditable}
                          step="0.01"
                        />
                      </td>
                      <td className={`p-1 border min-w-[120px]`}>
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-medium text-sm">{order.callCount}</span>
                            <button
                                onClick={() => handleUpdateOrder(order.id, 'callCount', order.callCount + 1)}
                                title="Incrémenter le nombre d'appels"
                                className="p-1.5 rounded-md bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isEditable}
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
                          disabled={isStatusLocked}
                        />
                      </td>
                      <td className="p-1 border min-w-[120px]">
                        <select
                            value={order.assignedUserId || ''}
                            onChange={(e) => handleUpdateOrder(order.id, 'assignedUserId', e.target.value || null)}
                            className="w-full p-1.5 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentUser?.role !== Role.Admin}
                        >
                            <option value="">-- Non assigné --</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-1 border min-w-[200px]">{renderInput(order, 'noteClient', 'Note...', false)}</td>
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
                      <td className="p-1 border min-w-[120px]">
                        <ColorSelector
                            value={order.remboursement}
                            onChange={(newValue) => handleUpdateOrder(order.id, 'remboursement', newValue)}
                            options={Remboursement}
                            category="remboursement"
                        />
                      </td>
                      <td className="p-1 border min-w-[150px]">
                         <ColorSelector
                            value={order.commandeRetour}
                            onChange={(newValue) => handleUpdateOrder(order.id, 'commandeRetour', newValue)}
                            options={CommandeRetour}
                            category="commandeRetour"
                        />
                      </td>
                      <td className="p-1 border text-center">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer la commande"
                          disabled={!isEditable}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                )})}
            </tbody>
          </table>
        </div>
      </div>
       <AddOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        onAddOrder={handleAddOrder}
        products={products}
      />
       <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
      <WhatsAppPreviewModal
        isOpen={!!whatsappPreviewData}
        onClose={() => setWhatsappPreviewData(null)}
        onConfirm={handleConfirmWhatsApp}
        phone={whatsappPreviewData?.phone || ''}
        message={whatsappPreviewData?.message || ''}
      />
    </div>
  );
};

export default Orders;
