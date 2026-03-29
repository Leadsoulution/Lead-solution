
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Products from './components/Products';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Clients from './components/Clients';
import DeliveryCompanies from './components/DeliveryCompanies';
import Financials from './components/Financials';
import { View, Role, Order, Product, Client, DeliveryCompany, Platform, Statut, Ramassage, Livraison, Remboursement, CommandeRetour, IntegrationSettings, User } from './types';
import { Menu, X } from 'lucide-react';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Integrations from './components/Integrations';
import { IntegrationsProvider, useIntegrations } from './contexts/IntegrationsContext';
import AIAnalysis from './components/AIAnalysis';
import { HistoryProvider } from './contexts/HistoryContext';
import History from './components/History';
import { api } from './src/services/api';
import { USE_MOCK_DATA } from './src/config';

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useAuth();
  const { integrations } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<View>(() => {
    if (currentUser?.permissions && currentUser.permissions.length > 0) {
        return currentUser.permissions[0];
    }
    if (currentUser?.role === Role.Confirmation) {
      return View.Orders;
    }
    return View.Dashboard;
  });

  const prevUserRef = useRef<User | null>(null);

  useEffect(() => {
    if (currentUser && !prevUserRef.current) {
      if (currentUser.permissions && currentUser.permissions.length > 0) {
        setView(currentUser.permissions[0]);
      } else if (currentUser.role === Role.Confirmation) {
        setView(View.Orders);
      } else {
        setView(View.Dashboard);
      }
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  // Load Orders from API
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]);
  
  // Update ref whenever orders change
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);
  // Load Products from API
  const [products, setProducts] = useState<Product[]>([]);
  // Load Clients from API
  const [clients, setClients] = useState<Client[]>([]);
  // Load Delivery Companies from API
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([]);

  useEffect(() => {
      const fetchData = async (showLoading = true) => {
          if (showLoading) setIsLoading(true);
          
          try {
              // Fetch Orders
              try {
                  const fetchedOrders = await api.getOrders();
                  setOrders(prev => {
                      // Merge fetched orders with existing orders to prevent flashing
                      // Keep any orders that are in prev but not yet in fetchedOrders ONLY IF they were just synced locally
                      const fetchedIds = new Set(fetchedOrders.map(o => o.id));
                      const newOrdersInPrev = prev.filter(o => !fetchedIds.has(o.id) && (o as any)._isNewLocal);
                      
                      // Also, if fetchedOrders has an order, but it's missing customerName (e.g. from PHP backend),
                      // we should merge the fields from prev if they exist.
                      const mergedFetchedOrders = fetchedOrders.map(fetchedOrder => {
                          const existingOrder = prev.find(o => o.id === fetchedOrder.id);
                          if (existingOrder) {
                              return { ...existingOrder, ...fetchedOrder, customerName: fetchedOrder.customerName || existingOrder.customerName, customerPhone: fetchedOrder.customerPhone || existingOrder.customerPhone };
                          }
                          return fetchedOrder;
                      });

                      return [...newOrdersInPrev, ...mergedFetchedOrders];
                  });
              } catch (e) {
                  console.error("Failed to fetch orders", e);
              }

              // Fetch Products
              try {
                  const fetchedProducts = await api.getProducts();
                  setProducts(fetchedProducts);
              } catch (e) {
                  console.error("Failed to fetch products", e);
              }

              // Fetch Clients
              try {
                  const fetchedClients = await api.getClients();
                  setClients(fetchedClients);
              } catch (e) {
                  console.error("Failed to fetch clients", e);
              }

              // Fetch Delivery Companies
              try {
                  const fetchedCompanies = await api.getDeliveryCompanies();
                  setDeliveryCompanies(fetchedCompanies);
              } catch (e) {
                  console.error("Failed to fetch delivery companies", e);
              }
          } finally {
              if (showLoading) setIsLoading(false);
          }
      };
      
      // Initial fetch with loading indicator
      fetchData(true);

      // Poll every 5 seconds for real-time updates across browsers
      let timeoutId: NodeJS.Timeout;
      let isFetching = false;

      const pollData = async () => {
          if (!isFetching) {
              isFetching = true;
              await fetchData(false);
              isFetching = false;
          }
          timeoutId = setTimeout(pollData, 5000);
      };

      timeoutId = setTimeout(pollData, 5000);

      return () => clearTimeout(timeoutId);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Persist Orders to API whenever they change (Optimistic UI handled in components, this is just a sync fallback if needed)
  // In a real API-driven app, we don't sync the whole array back. Components call api.create/update.
  // So we remove the useEffect hooks that saved to localStorage.

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  // Auto-create clients from orders if they don't exist
  useEffect(() => {
    const existingClientPhones = new Set(clients.map(c => c.phone));
    const newClients: Client[] = [];
    orders.forEach(order => {
      if (order.customerPhone && !existingClientPhones.has(order.customerPhone)) {
        const newClient: Client = {
          id: `client-${order.customerPhone}`,
          name: order.customerName,
          phone: order.customerPhone,
          address: order.address,
        };
        newClients.push(newClient);
        existingClientPhones.add(order.customerPhone); // Prevent duplicates in the same run
      }
    });
    
    if (newClients.length > 0) {
      // Optimistic update
      setClients(prev => [...prev, ...newClients]);
      
      // Persist to API
      newClients.forEach(client => {
          api.createClient(client).catch(err => console.error(`Failed to auto-create client ${client.name}`, err));
      });
    }
  }, [orders]);

  const fetchWooCommerceOrders = async (settings: IntegrationSettings): Promise<Order[]> => {
    // ... (keep existing implementation)
    try {
        const response = await fetch('/api/proxy_woocommerce.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storeUrl: settings.storeUrl,
                apiKey: settings.apiKey,
                apiSecret: settings.apiSecret
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur API WooCommerce: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error("Format de réponse invalide de WooCommerce.");
        }

        return data.map((wcOrder: any) => ({
            id: `WC-${wcOrder.id}`,
            date: wcOrder.date_created,
            customerName: `${wcOrder.billing.first_name} ${wcOrder.billing.last_name}`.trim(),
            customerPhone: wcOrder.billing.phone || '',
            address: [wcOrder.billing.address_1, wcOrder.billing.city].filter(Boolean).join(', '),
            product: wcOrder.line_items?.[0]?.name || 'Produit Inconnu',
            quantity: wcOrder.line_items?.[0]?.quantity || 1,
            price: parseFloat(wcOrder.total),
            statut: Statut.NonDefini, // Default status for new imports
            assignedUserId: null,
            noteClient: wcOrder.customer_note || '',
            ramassage: Ramassage.NonDefini,
            livraison: Livraison.NonDefini,
            remboursement: Remboursement.NonDefini,
            commandeRetour: CommandeRetour.NonDefini,
            platform: Platform.WooCommerce,
            callCount: 0,
        }));
    } catch (error: any) {
        console.error("WooCommerce Sync Error:", error);
        throw error;
    }
  };

  // ... (keep other fetch functions)

  const fetchShopifyOrders = async (settings: IntegrationSettings): Promise<Order[]> => {
    try {
        const response = await fetch('/api/proxy_shopify.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storeUrl: settings.storeUrl,
                accessToken: settings.apiSecret === 'oauth-token' ? settings.apiKey : settings.apiSecret
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur API Shopify: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.orders || !Array.isArray(data.orders)) {
            throw new Error("Format de réponse invalide de Shopify.");
        }

        return data.orders.map((order: any) => ({
            id: `SH-${order.id}`,
            date: order.created_at,
            customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Client Inconnu',
            customerPhone: order.shipping_address?.phone || order.customer?.phone || '',
            address: [order.shipping_address?.address1, order.shipping_address?.city].filter(Boolean).join(', '),
            product: order.line_items?.[0]?.name || 'Produit Inconnu',
            quantity: order.line_items?.[0]?.quantity || 1,
            price: parseFloat(order.total_price),
            statut: Statut.NonDefini,
            assignedUserId: null,
            noteClient: order.note || '',
            ramassage: Ramassage.NonDefini,
            livraison: Livraison.NonDefini,
            remboursement: Remboursement.NonDefini,
            commandeRetour: CommandeRetour.NonDefini,
            platform: Platform.Shopify,
            callCount: 0,
        }));
    } catch (error: any) {
        console.error("Shopify Sync Error:", error);
        throw error;
    }
  };

  const fetchYouCanOrders = async (settings: IntegrationSettings): Promise<Order[]> => {
    try {
        const response = await fetch('/api/proxy_youcan.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storeUrl: settings.storeUrl,
                apiKey: settings.apiKey
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur API YouCan: ${response.statusText}`);
        }
        
        const data = await response.json();
        const ordersList = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);

        return ordersList.map((order: any) => ({
            id: `YC-${order.id}`,
            date: order.created_at,
            customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Client Inconnu',
            customerPhone: order.customer?.phone || '',
            address: order.shipping_address?.address1 || '',
            product: order.items?.[0]?.name || 'Produit Inconnu',
            quantity: order.items?.[0]?.quantity || 1,
            price: parseFloat(order.total),
            statut: Statut.NonDefini,
            assignedUserId: null,
            noteClient: order.note || '',
            ramassage: Ramassage.NonDefini,
            livraison: Livraison.NonDefini,
            remboursement: Remboursement.NonDefini,
            commandeRetour: CommandeRetour.NonDefini,
            platform: Platform.YouCan,
            callCount: 0,
        }));
    } catch (error: any) {
        console.error("YouCan Sync Error:", error);
        throw error;
    }
  };

  const fetchGoogleSheetsOrders = async (settings: IntegrationSettings): Promise<Order[]> => {
    try {
        const response = await fetch('/api/proxy_googlesheets.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetId: settings.spreadsheetId,
                clientEmail: settings.clientEmail,
                privateKey: settings.privateKey
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur API Google Sheets: ${response.statusText}`);
        }
        
        const { headers, rows } = await response.json();
        
        if (!headers || !rows) return [];

        // Helper to find index of a column by possible names
        const findIndex = (possibleNames: string[]) => 
            headers.findIndex((h: string) => possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase())));

        const idxId = findIndex(['id', 'ref', 'reference', 'order', 'commande']);
        const idxDate = findIndex(['date', 'created', 'time', 'heure']);
        const idxName = findIndex(['name', 'nom', 'client', 'customer']);
        const idxPhone = findIndex(['phone', 'tel', 'mobile', 'telephone']);
        const idxAddress = findIndex(['address', 'adresse', 'city', 'ville']);
        const idxProduct = findIndex(['product', 'produit', 'item', 'article']);
        const idxQuantity = findIndex(['quantity', 'quantite', 'qte', 'qty']);
        const idxPrice = findIndex(['price', 'prix', 'total', 'montant']);
        // const idxStatus = findIndex(['status', 'statut', 'state', 'etat']); // Not used for mapping to internal status yet

        return rows.map((row: any[], index: number) => {
            // Generate ID if missing
            const id = (idxId !== -1 && row[idxId]) ? row[idxId] : `GS-${Date.now()}-${index}`;
            
            return {
                id: String(id),
                date: (idxDate !== -1 && row[idxDate]) ? row[idxDate] : new Date().toISOString(),
                customerName: (idxName !== -1 && row[idxName]) ? row[idxName] : 'Client Inconnu',
                customerPhone: (idxPhone !== -1 && row[idxPhone]) ? row[idxPhone] : '',
                address: (idxAddress !== -1 && row[idxAddress]) ? row[idxAddress] : '',
                product: (idxProduct !== -1 && row[idxProduct]) ? row[idxProduct] : 'Produit Inconnu',
                quantity: (idxQuantity !== -1 && row[idxQuantity]) ? (parseInt(String(row[idxQuantity]).replace(/[^\d]/g, '')) || 1) : 1,
                price: (idxPrice !== -1 && row[idxPrice]) ? (parseFloat(String(row[idxPrice]).replace(/[^\d.-]/g, '')) || 0) : 0,
                statut: Statut.NonDefini, // Default status
                assignedUserId: null,
                noteClient: 'Importé depuis Google Sheets',
                ramassage: Ramassage.NonDefini,
                livraison: Livraison.NonDefini,
                remboursement: Remboursement.NonDefini,
                commandeRetour: CommandeRetour.NonDefini,
                platform: Platform.GoogleSheets,
                callCount: 0,
            };
        });

    } catch (error: any) {
        console.error("Google Sheets Sync Error:", error);
        throw error;
    }
  };

  const handleSyncOrders = async (silent: boolean = false) => {
    if (!silent) {
        setIsLoading(true);
    }
    
    let newOrdersCount = 0;
    let errors: string[] = [];

    const syncRunAddedIds = new Set<string>();

    const processSyncedOrders = async (syncedOrders: Order[]) => {
        const existingIds = new Set(ordersRef.current.map(o => o.id));
        const newUniqueOrders = syncedOrders.filter(o => !existingIds.has(o.id) && !syncRunAddedIds.has(o.id));
        
        if (newUniqueOrders.length > 0) {
            newUniqueOrders.forEach(o => syncRunAddedIds.add(o.id));
            
            setOrders(prev => {
                const prevIds = new Set(prev.map(o => o.id));
                const trulyUnique = newUniqueOrders.filter(o => !prevIds.has(o.id)).map(o => ({...o, _isNewLocal: true}));
                return [...trulyUnique, ...prev];
            });
            
            // Persist new orders
            for (const order of newUniqueOrders) {
                try {
                    await api.createOrder(order);
                } catch (e) {
                    console.error(`Failed to persist synced order ${order.id}`, e);
                }
            }
        }
        return newUniqueOrders.length;
    };

    // 1. WooCommerce Sync
    if (integrations.WooCommerce.isConnected) {
        try {
            const wcOrders = await fetchWooCommerceOrders(integrations.WooCommerce);
            newOrdersCount += await processSyncedOrders(wcOrders);
        } catch (e: any) {
            errors.push(`WooCommerce: ${e.message}`);
        }
    }

    // 2. Shopify Sync
    if (integrations.Shopify.isConnected) {
        try {
            const shopifyOrders = await fetchShopifyOrders(integrations.Shopify);
            newOrdersCount += await processSyncedOrders(shopifyOrders);
        } catch (e: any) {
            errors.push(`Shopify: ${e.message}`);
        }
    }

    // 3. YouCan Sync
    if (integrations.YouCan.isConnected) {
        try {
            const youCanOrders = await fetchYouCanOrders(integrations.YouCan);
            newOrdersCount += await processSyncedOrders(youCanOrders);
        } catch (e: any) {
            errors.push(`YouCan: ${e.message}`);
        }
    }

    // 4. Google Sheets Sync
    if (integrations.GoogleSheets.isConnected) {
        try {
            const gsOrders = await fetchGoogleSheetsOrders(integrations.GoogleSheets);
            newOrdersCount += await processSyncedOrders(gsOrders);
        } catch (e: any) {
            errors.push(`Google Sheets: ${e.message}`);
        }
    }

    // ... (rest of the function)

    // 2. Simulation / Demo Fallback (if no real sync happened and no errors, or explicit demo request)
    const isAnyConnected = integrations.WooCommerce.isConnected || integrations.Shopify.isConnected || integrations.YouCan.isConnected || integrations.GoogleSheets.isConnected;
    
    if (!silent) {
        // If we tried to sync but failed, show error.
        if (errors.length > 0) {
            alert(`Erreur de synchronisation:\n${errors.join('\n')}\n\nNote: Si vous testez en local ou sans proxy, CORS peut bloquer la requête.`);
        } 
        // If connected but no real orders found (and no error), we might want to simulate for demo purposes IF the user wants
        else if (isAnyConnected && newOrdersCount === 0) {
             // Check if we should simulate (only if it's likely a demo/test)
             // For now, let's just alert that no *new* orders were found from the API.
             alert("Synchronisation terminée. Aucune nouvelle commande trouvée sur la boutique connectée.");
        }
        else if (newOrdersCount > 0) {
            alert(`${newOrdersCount} nouvelles commandes synchronisées avec succès !`);
        }
        else if (!isAnyConnected) {
            // Offer demo mode if no store is connected
            if (window.confirm("Aucune boutique n'est connectée. Voulez-vous simuler une synchronisation pour tester ?")) {
                 const randomProduct = products[Math.floor(Math.random() * products.length)];
                 const newLiveOrder: Order = {
                    id: `DEMO-SYNC-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString(),
                    customerName: `Client Démo ${Math.floor(Math.random() * 100)}`,
                    customerPhone: `2126${Math.floor(Math.random() * 100000000)}`,
                    address: `Adresse Démo, Casablanca`,
                    product: randomProduct ? randomProduct.name : 'Produit Démo',
                    quantity: 1,
                    price: randomProduct ? randomProduct.sellingPrice : 199,
                    statut: Statut.NonDefini,
                    assignedUserId: null,
                    noteClient: 'Commande de démonstration',
                    ramassage: Ramassage.NonDefini,
                    livraison: Livraison.NonDefini,
                    remboursement: Remboursement.NonDefini,
                    commandeRetour: CommandeRetour.NonDefini,
                    platform: Platform.Manual,
                    callCount: 0,
                };
                setOrders(prev => [newLiveOrder, ...prev]);
                alert("Commande de démonstration ajoutée ! Pour une vraie synchronisation, configurez vos boutiques dans l'onglet Intégrations.");
            } else {
                setView(View.Integrations);
            }
        }
        setIsLoading(false);
    }
  };

  // Automatic Polling
  const handleSyncOrdersRef = useRef(handleSyncOrders);
  useEffect(() => {
      handleSyncOrdersRef.current = handleSyncOrders;
  });

  useEffect(() => {
    const isAnyConnected = integrations.WooCommerce.isConnected || integrations.Shopify.isConnected || integrations.YouCan.isConnected || integrations.GoogleSheets.isConnected;
    
    if (isAnyConnected) {
        let timeoutId: NodeJS.Timeout;
        let isSyncing = false;
        
        const pollSync = async () => {
            if (!isSyncing) {
                isSyncing = true;
                await handleSyncOrdersRef.current(true); // Silent sync
                isSyncing = false;
            }
            timeoutId = setTimeout(pollSync, 10000);
        };

        timeoutId = setTimeout(pollSync, 10000);

        return () => clearTimeout(timeoutId);
    }
  }, [integrations]);


  const renderView = () => {
    const hasPermission = (viewToCheck: View) => {
        if (currentUser?.role === Role.Admin) return true;
        
        if (currentUser?.permissions && currentUser.permissions.length > 0) {
            if (currentUser.permissions.includes('all' as any)) return true;
            return currentUser.permissions.includes(viewToCheck);
        }
        // Fallback logic matching Sidebar
        if (currentUser?.role === Role.Confirmation) return viewToCheck === View.Orders;
        if (currentUser?.role === Role.User) {
             return [View.Dashboard, View.Products, View.Orders].includes(viewToCheck);
        }
        return false;
    };

    if (!hasPermission(view)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
                <p className="text-muted-foreground">Vous n'avez pas la permission d'accéder à cette page.</p>
                <p className="text-sm mt-2">Veuillez contacter l'administrateur.</p>
            </div>
        );
    }

    switch (view) {
      case View.Dashboard:
        return <Dashboard orders={orders} />;
      case View.Products:
        return <Products orders={orders} products={products} setProducts={setProducts} />;
      case View.Orders:
        return <Orders orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} onSync={handleSyncOrders} deliveryCompanies={deliveryCompanies} />;
      case View.Clients:
        return <Clients clients={clients} setClients={setClients} orders={orders} />;
      case View.DeliveryCompanies:
        return <DeliveryCompanies companies={deliveryCompanies} setCompanies={setDeliveryCompanies} />;
      case View.Statistics:
        return <Statistics orders={orders} />;
      case View.AIAnalysis:
        return <AIAnalysis orders={orders} products={products} clients={clients} />;
      case View.Settings:
        return <Settings />;
      case View.AdminPanel:
        return <AdminPanel products={products} />;
      case View.Integrations:
        return <Integrations />;
      case View.Financials:
        return <Financials orders={orders} products={products} />;
      case View.History:
        return <History />;
      default:
        return <Dashboard orders={orders}/>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        currentView={view}
        setView={setView}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isCollapsed={isSidebarCollapsed}
        toggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : ''}`}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
           <div className="md:hidden mb-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md bg-card border shadow-sm">
                  <Menu size={24} />
              </button>
           </div>
           {isSidebarOpen && (
               <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
                   <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background p-6 shadow-lg">
                       <div className="flex items-center justify-between mb-8">
                           <h2 className="text-lg font-semibold">Menu</h2>
                           <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md hover:bg-accent">
                               <X size={24} />
                           </button>
                       </div>
                       <Sidebar
                           currentView={view}
                           setView={(v) => { setView(v); setIsSidebarOpen(false); }}
                           isDarkMode={isDarkMode}
                           setIsDarkMode={setIsDarkMode}
                           isCollapsed={false}
                           toggleCollapsed={() => {}}
                       />
                   </div>
               </div>
           )}
           
           {renderView()}
        </div>
      </main>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Login />;
  }
  return <AuthenticatedApp />;
};

// ... (inside App component)
const App: React.FC = () => {
  return (
    <CustomizationProvider>
      <AuthProvider>
        <IntegrationsProvider>
          <HistoryProvider>
            <AppRouter />
          </HistoryProvider>
        </IntegrationsProvider>
      </AuthProvider>
    </CustomizationProvider>
  );
};

export default App;
