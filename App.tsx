import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { View, Role } from './types';
import { Menu, X } from 'lucide-react';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DeliveryCompanies from './components/DeliveryCompanies';

const DashboardLayout: React.FC = () => {
  const [view, setView] = useState<View>(View.Dashboard);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        return <Dashboard />;
      case View.Orders:
        return <Orders />;
      case View.Statistics:
        return <Statistics />;
      case View.Settings:
        return <Settings />;
      case View.AdminPanel:
        return isAdmin ? <AdminPanel /> : <Dashboard />;
      case View.DeliveryCompanies:
        return isAdmin ? <DeliveryCompanies /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`flex h-screen bg-secondary dark:bg-dark-secondary/50 text-secondary-foreground dark:text-dark-secondary-foreground`}>
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card dark:bg-dark-card transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
          <Sidebar currentView={view} setView={setView} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
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