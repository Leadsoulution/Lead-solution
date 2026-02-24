
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Products from './components/Products';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Clients from './components/Clients';
import Financials from './components/Financials';
import { View, Role, Order, Product, Client, Platform, Statut, Ramassage, Livraison, Remboursement, CommandeRetour } from './types';
import { Menu, X } from 'lucide-react';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { mockOrders, mockProducts, mockClients } from './services/mockData';
import Integrations from './components/Integrations';
import { IntegrationsProvider, useIntegrations } from './contexts/IntegrationsContext';
import AIAnalysis from './components/AIAnalysis';

const DashboardLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { integrations } = useIntegrations();
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<View>(() => {
    if (currentUser?.role === Role.Confirmation) {
      return View.Orders;
    }
    return View.Dashboard;
  });

  // Load Orders from LocalStorage or fallback to Mock Data
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const savedOrders = localStorage.getItem('app_orders');
      return savedOrders ? JSON.parse(savedOrders) : JSON.parse(JSON.stringify(mockOrders));
    } catch (e) {
      console.error("Failed to load orders", e);
      return JSON.parse(JSON.stringify(mockOrders));
    }
  });

  // Load Products from LocalStorage or fallback to Mock Data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('app_products');
      return savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(mockProducts));
    } catch (e) {
      console.error("Failed to load products", e);
      return JSON.parse(JSON.stringify(mockProducts));
    }
  });

  // Load Clients from LocalStorage or fallback to Mock Data
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const savedClients = localStorage.getItem('app_clients');
      return savedClients ? JSON.parse(savedClients) : JSON.parse(JSON.stringify(mockClients));
    } catch (e) {
      console.error("Failed to load clients", e);
      return JSON.parse(JSON.stringify(mockClients));
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Persist Orders to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app_orders', JSON.stringify(orders));
  }, [orders]);

  // Persist Products to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app_products', JSON.stringify(products));
  }, [products]);

  // Persist Clients to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app_clients', JSON.stringify(clients));
  }, [clients]);

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
  
  // Effect to fetch live data when an integration is connected
  useEffect(() => {
    const fetchWooCommerceOrders = async () => {
      // Only fetch if we haven't already fetched (simple check to avoid overwriting manual edits in this demo)
      // In a real app, you would merge data based on IDs.
      setIsLoading(true);
      console.log('Simulating fetch from WooCommerce...');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate external data containing SKU (Code Article)
      const rawExternalOrders = [
        {
          id: 'LIVE-WC-001',
          date: new Date().toISOString(),
          customerName: 'John Doe (Live)',
          customerPhone: '212611223344',
          address: '1 Live Street, Casablanca',
          sku: 'WH-001', // Example SKU matching local product
          fallbackProduct: 'Wireless Headphones',
          price: 150.00,
        },
        {
          id: 'LIVE-WC-002',
          date: new Date(Date.now() - 86400000).toISOString(),
          customerName: 'Jane Smith (Live)',
          customerPhone: '212655667788',
          address: '2 Live Avenue, Rabat',
          sku: 'SW-001',
          fallbackProduct: 'Smartwatch',
          price: 299.50,
        },
        {
          id: 'LIVE-WC-003',
          date: new Date(Date.now() - 172800000).toISOString(),
          customerName: 'Sam Wilson (Live)',
          customerPhone: '212612345678',
          address: '3 Integration Lane, Marrakech',
          sku: 'LW-001',
          fallbackProduct: 'Leather Wallet',
          price: 49.99,
        },
      ];

      const liveOrders: Order[] = rawExternalOrders.map(raw => {
          // Resolve Product by SKU (ID) first, then fallback to name
          const matchedProduct = products.find(p => p.id === raw.sku);
          
          return {
            id: raw.id,
            date: raw.date,
            customerName: raw.customerName,
            customerPhone: raw.customerPhone,
            address: raw.address,
            // Use local name if SKU matched, otherwise use fallback name
            product: matchedProduct ? matchedProduct.name : raw.fallbackProduct,
            // Use local price if matched to ensure consistency, otherwise external price
            price: matchedProduct ? matchedProduct.sellingPrice : raw.price,
            statut: Statut.NonDefini,
            assignedUserId: null,
            noteClient: 'Imported from WooCommerce (SKU Match)',
            ramassage: Ramassage.NonDefini,
            livraison: Livraison.NonDefini,
            remboursement: Remboursement.NonDefini,
            commandeRetour: CommandeRetour.NonDefini,
            platform: Platform.WooCommerce,
            callCount: 0,
          };
      });
      
      // Merge live orders with existing orders, avoiding duplicates by ID
      setOrders(prevOrders => {
        const existingIds = new Set(prevOrders.map(o => o.id));
        const newUniqueOrders = liveOrders.filter(o => !existingIds.has(o.id));
        return [...newUniqueOrders, ...prevOrders];
      });
      setIsLoading(false);
      console.log('Live WooCommerce orders loaded.');
    };

    if (integrations.WooCommerce.isConnected) {
      fetchWooCommerceOrders();
    } 
    // Removed the else block that reset orders to mock data. 
    // If disconnected, we keep the current local state.
  }, [integrations.WooCommerce.isConnected, products]); // Added 'products' to dependency to ensure matching works if products change


  // Auto-create clients from orders if they don't exist
  useEffect(() => {
    const existingClientPhones = new Set(clients.map(c => c.phone));
    const newClients: Client[] = [];
    orders.forEach(order => {
      if (order.customerPhone && !existingClientPhones.has(order.customerPhone)) {
        newClients.push({
          id: `client-${order.customerPhone}`,
          name: order.customerName,
          phone: order.customerPhone,
          address: order.address,
        });
        existingClientPhones.add(order.customerPhone); // Prevent duplicates in the same run
      }
    });
    if (newClients.length > 0) {
      setClients(prev => [...prev, ...newClients]);
    }
  }, [orders]);

  const fetchWooCommerceOrders = async (settings: IntegrationSettings): Promise<Order[]> => {
    try {
        // Remove trailing slash if present
        const baseUrl = settings.storeUrl.replace(/\/$/, '');
        const auth = btoa(`${settings.apiKey}:${settings.apiSecret}`);
        
        const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=20`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 0 || response.status === 401 || response.status === 403) {
                 throw new Error("Erreur de connexion (CORS ou Auth). Vérifiez vos identifiants et les permissions CORS de votre serveur.");
            }
            throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error("Format de réponse invalide de WooCommerce.");
        }

        return data.map((wcOrder: any) => ({
            id: String(wcOrder.id),
            date: wcOrder.date_created,
            customerName: `${wcOrder.billing.first_name} ${wcOrder.billing.last_name}`.trim(),
            customerPhone: wcOrder.billing.phone || '',
            address: [wcOrder.billing.address_1, wcOrder.billing.city].filter(Boolean).join(', '),
            product: wcOrder.line_items?.[0]?.name || 'Produit Inconnu',
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

  const handleSyncOrders = async (silent: boolean = false) => {
    if (!silent) {
        setIsLoading(true);
    }
    
    let newOrdersCount = 0;
    let errors: string[] = [];

    // 1. WooCommerce Sync
    if (integrations.WooCommerce.isConnected) {
        try {
            const wcOrders = await fetchWooCommerceOrders(integrations.WooCommerce);
            setOrders(prev => {
                const existingIds = new Set(prev.map(o => o.id));
                const uniqueNewOrders = wcOrders.filter(o => !existingIds.has(o.id));
                newOrdersCount += uniqueNewOrders.length;
                return [...uniqueNewOrders, ...prev];
            });
        } catch (e: any) {
            errors.push(`WooCommerce: ${e.message}`);
        }
    }

    // 2. Simulation / Demo Fallback (if no real sync happened and no errors, or explicit demo request)
    const isAnyConnected = integrations.WooCommerce.isConnected || integrations.Shopify.isConnected || integrations.YouCan.isConnected;
    
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
  useEffect(() => {
    const isAnyConnected = integrations.WooCommerce.isConnected || integrations.Shopify.isConnected || integrations.YouCan.isConnected;
    
    if (isAnyConnected) {
        const intervalId = setInterval(() => {
            handleSyncOrders(true); // Silent sync
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }
  }, [integrations]);


  const renderView = () => {
    const isAdmin = currentUser?.role === Role.Admin;
    switch (view) {
      case View.Dashboard:
        return <Dashboard orders={orders} />;
      case View.Products:
        return <Products orders={orders} products={products} setProducts={setProducts} />;
      case View.Orders:
        return <Orders orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} onSync={handleSyncOrders} />;
      case View.Clients:
        return <Clients clients={clients} setClients={setClients} orders={orders} />;
      case View.Statistics:
        return <Statistics orders={orders} />;
      case View.AIAnalysis:
        return <AIAnalysis orders={orders} products={products} clients={clients} />;
      case View.Settings:
        return <Settings />;
      case View.AdminPanel:
        return isAdmin ? <AdminPanel products={products} /> : <Dashboard orders={orders} />;
      case View.Integrations:
        return isAdmin ? <Integrations /> : <Dashboard orders={orders} />;
      case View.Financials:
        return isAdmin ? <Financials orders={orders} products={products} /> : <Dashboard orders={orders} />;
      default:
        return <Dashboard orders={orders}/>;
    }
  };

  return (
    <div className={`relative flex h-screen bg-secondary dark:bg-dark-secondary/50 text-secondary-foreground dark:text-dark-secondary-foreground`}>
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="text-white text-center p-8 bg-black/60 rounded-lg">
            <svg className="animate-spin h-10 w-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 4.93L7.76 7.76" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.24 16.24L19.07 19.07" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.93 19.07L7.76 16.24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.24 7.76L19.07 4.93" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-lg font-semibold">Synchronisation des commandes...</p>
            <p className="text-sm">Veuillez patienter.</p>
          </div>
        </div>
      )}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64
        bg-card dark:bg-dark-card 
        transition-all duration-300 ease-in-out 
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
          <Sidebar 
            currentView={view} 
            setView={setView} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-card dark:bg-dark-card lg:hidden border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold">Orderly</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Login />;
  }
  return <DashboardLayout />;
};

const App: React.FC = () => {
  return (
    <CustomizationProvider>
      <AuthProvider>
        <IntegrationsProvider>
          <AppRouter />
        </IntegrationsProvider>
      </AuthProvider>
    </CustomizationProvider>
  );
};

export default App;
