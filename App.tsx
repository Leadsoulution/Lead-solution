
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
            statut: Statut.PasDeReponse,
            assignedUserId: null,
            noteClient: 'Imported from WooCommerce (SKU Match)',
            ramassage: Ramassage.NonRamasser,
            livraison: Livraison.PasDeReponse,
            remboursement: Remboursement.NonPayer,
            commandeRetour: CommandeRetour.NonRetourne,
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

  const handleSyncOrders = async () => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (integrations.WooCommerce.isConnected || integrations.Shopify.isConnected || integrations.YouCan.isConnected) {
        // Simulate finding a new order
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const newLiveOrder: Order = {
            id: `LIVE-SYNC-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerName: `Client Web ${Math.floor(Math.random() * 100)}`,
            customerPhone: `2126${Math.floor(Math.random() * 100000000)}`,
            address: `${Math.floor(Math.random() * 200)} Bd Mohammed V, Casablanca`,
            product: randomProduct ? randomProduct.name : 'Produit Importé',
            price: randomProduct ? randomProduct.sellingPrice : 299,
            statut: Statut.PasDeReponse,
            assignedUserId: null,
            noteClient: 'Commande synchronisée depuis le site',
            ramassage: Ramassage.NonRamasser,
            livraison: Livraison.PasDeReponse,
            remboursement: Remboursement.NonPayer,
            commandeRetour: CommandeRetour.NonRetourne,
            platform: integrations.WooCommerce.isConnected ? Platform.WooCommerce : (integrations.Shopify.isConnected ? Platform.Shopify : Platform.YouCan),
            callCount: 0,
        };
        
        setOrders(prev => [newLiveOrder, ...prev]);
    } else {
        alert("Veuillez d'abord connecter une boutique dans l'onglet Intégrations.");
    }
    setIsLoading(false);
  };


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
