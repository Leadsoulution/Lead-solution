import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Products from './components/Products';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { View, Role, Order, Product } from './types';
import { Menu, X } from 'lucide-react';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DeliveryCompanies from './components/DeliveryCompanies';
import { mockOrders, mockProducts } from './services/mockData';

const DashboardLayout: React.FC = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(JSON.stringify(mockOrders)));
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(JSON.stringify(mockProducts)));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { currentUser } = useAuth();

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

  const renderView = () => {
    const isAdmin = currentUser?.role === Role.Admin;
    switch (view) {
      case View.Dashboard:
        return <Dashboard orders={orders} />;
      case View.Products:
        return <Products orders={orders} products={products} setProducts={setProducts} />;
      case View.Orders:
        return <Orders orders={orders} setOrders={setOrders} products={products} setProducts={setProducts} />;
      case View.Statistics:
        return <Statistics orders={orders} />;
      case View.Settings:
        return <Settings />;
      case View.AdminPanel:
        return isAdmin ? <AdminPanel /> : <Dashboard orders={orders} />;
      case View.DeliveryCompanies:
        return isAdmin ? <DeliveryCompanies /> : <Dashboard orders={orders} />;
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
        <AppRouter />
      </AuthProvider>
    </CustomizationProvider>
  );
};

export default App;