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

  const [initialMockOrders] = useState<Order[]>(() => JSON.parse(JSON.stringify(mockOrders)));
  const [orders, setOrders] = useState<Order[]>(initialMockOrders);
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(JSON.stringify(mockProducts)));
  const [clients, setClients] = useState<Client[]>(() => JSON.parse(JSON.stringify(mockClients)));

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
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
      setIsLoading(true);
      console.log('Simulating fetch from WooCommerce...');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // This is where a real API call would happen.
      // For this demo, we'll return new mock data to simulate a live connection.
      const liveOrders: Order[] = [
        {
          id: 'LIVE-WC-001',
          date: new Date().toISOString(),
          customerName: 'John Doe (Live)',
          customerPhone: '212611223344',
          address: '1 Live Street, Casablanca',
          price: 150.00,
          product: 'Wireless Headphones',
          statut: Statut.PasDeReponse,
          assignedUserId: null,
          noteClient: 'Order fetched from live WooCommerce store.',
          ramassage: Ramassage.NonRamasser,
          livraison: Livraison.PasDeReponse,
          remboursement: Remboursement.NonPayer,
          commandeRetour: CommandeRetour.NonRetourne,
          platform: Platform.WooCommerce,
          callCount: 0,
        },
        {
          id: 'LIVE-WC-002',
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          customerName: 'Jane Smith (Live)',
          customerPhone: '212655667788',
          address: '2 Live Avenue, Rabat',
          price: 299.50,
          product: 'Smartwatch',
          statut: Statut.PasDeReponse,
          assignedUserId: null,
          noteClient: 'Urgent order from live integration.',
          ramassage: Ramassage.NonRamasser,
          livraison: Livraison.PasDeReponse,
          remboursement: Remboursement.NonPayer,
          commandeRetour: CommandeRetour.NonRetourne,
          platform: Platform.WooCommerce,
          callCount: 0,
        },
        {
          id: 'LIVE-WC-003',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          customerName: 'Sam Wilson (Live)',
          customerPhone: '212612345678',
          address: '3 Integration Lane, Marrakech',
          price: 49.99,
          product: 'Leather Wallet',
          statut: Statut.PasDeReponse,
          assignedUserId: null,
          noteClient: '',
          ramassage: Ramassage.NonRamasser,
          livraison: Livraison.PasDeReponse,
          remboursement: Remboursement.NonPayer,
          commandeRetour: CommandeRetour.NonRetourne,
          platform: Platform.WooCommerce,
          callCount: 0,
        },
      ];
      
      setOrders(liveOrders);
      setIsLoading(false);
      console.log('Live WooCommerce orders loaded.');
    };

    if (integrations.WooCommerce.isConnected) {
      fetchWooCommerceOrders();
    } else {
      // If disconnected, revert to original mock data
      setOrders(initialMockOrders);
    }
  }, [integrations.WooCommerce.isConnected, initialMockOrders]);


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


  const renderView = () => {
    const isAdmin = currentUser?.role === Role.Admin;
    switch (view) {
      case View.Dashboard:
        return <Dashboard orders={orders} />;
      case View.Products:
        return <Products orders={orders} products={products} setProducts={setProducts} />;
      case View.Orders:
        return <Orders orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} />;
      case View.Clients:
        return <Clients clients={clients} setClients={setClients} orders={orders} />;
      case View.Statistics:
        return <Statistics orders={orders} />;
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
          <h1 className="text-xl font-bold">OrderSync</h1>
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
