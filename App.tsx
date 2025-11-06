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
import { View, Role, Order, Product, Client } from './types';
import { Menu, X } from 'lucide-react';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { mockOrders, mockProducts, mockClients } from './services/mockData';
import Integrations from './components/Integrations';
import { IntegrationsProvider } from './contexts/IntegrationsContext';

const DashboardLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<View>(() => {
    if (currentUser?.role === Role.Confirmation) {
      return View.Orders;
    }
    return View.Dashboard;
  });
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(JSON.stringify(mockOrders)));
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
    <div className={`flex h-screen bg-secondary dark:bg-dark-secondary/50 text-secondary-foreground dark:text-dark-secondary-foreground`}>
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