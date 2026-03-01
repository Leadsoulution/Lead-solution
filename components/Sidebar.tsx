
import React from 'react';
import { View, Role } from '../types';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, ShoppingCart, Settings, Package2, BarChart3, Shield, LogOut, Package, ChevronLeft, ChevronRight, Link, Users, Landmark, BrainCircuit, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isDarkMode, setIsDarkMode, isCollapsed, toggleCollapsed }) => {
  const { currentUser, logout } = useAuth();

  const allNavItems = [
    { view: View.Dashboard, icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { view: View.Products, icon: <Package className="h-5 w-5" />, label: 'Products' },
    { view: View.Orders, icon: <ShoppingCart className="h-5 w-5" />, label: 'Orders' },
    { view: View.Clients, icon: <Users className="h-5 w-5" />, label: 'Clients' },
    { view: View.Statistics, icon: <BarChart3 className="h-5 w-5" />, label: 'Statistiques' },
    { view: View.AIAnalysis, icon: <BrainCircuit className="h-5 w-5" />, label: 'AI Analysis' },
    { view: View.Settings, icon: <Settings className="h-5 w-5" />, label: 'Settings' },
    { view: View.AdminPanel, icon: <Shield className="h-5 w-5" />, label: 'Admin Panel' },
    { view: View.Integrations, icon: <Link className="h-5 w-5" />, label: 'Integrations' },
    { view: View.Financials, icon: <Landmark className="h-5 w-5" />, label: 'Financials' },
    { view: View.History, icon: <History className="h-5 w-5" />, label: 'Historique' },
  ];

  const visibleNavItems = allNavItems.filter(item => {
      // If permissions are set, use them
      if (currentUser?.permissions && currentUser.permissions.length > 0) {
          return currentUser.permissions.includes(item.view);
      }
      // Fallback for backward compatibility or if permissions are missing
      if (currentUser?.role === Role.Admin) return true;
      if (currentUser?.role === Role.Confirmation) return item.view === View.Orders;
      // Default for User: Dashboard, Products, Orders
      if (currentUser?.role === Role.User) {
          return [View.Dashboard, View.Products, View.Orders].includes(item.view);
      }
      return false;
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative flex h-full max-h-screen flex-col gap-2">
      <button
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-1/2 -right-3 z-20 hidden h-6 w-6 items-center justify-center rounded-full border bg-card p-0 text-muted-foreground hover:bg-accent dark:bg-dark-card dark:border-gray-700 dark:hover:bg-dark-accent lg:flex"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 ${isCollapsed ? 'justify-center' : ''}`}>
        <a href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          {!isCollapsed && <span className="">Orderly</span>}
        </a>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {visibleNavItems.map(item => (
            <a
              key={item.view}
              href="#"
              title={isCollapsed ? item.label : undefined}
              onClick={(e) => {
                e.preventDefault();
                setView(item.view);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isCollapsed ? 'justify-center' : ''} ${
                currentView === item.view
                  ? 'bg-muted text-primary dark:bg-dark-muted dark:text-dark-primary'
                  : 'text-muted-foreground hover:text-primary dark:text-dark-muted-foreground dark:hover:text-dark-primary'
              }`}
            >
              {item.icon}
              {!isCollapsed && item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 space-y-2">
         <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} isCollapsed={isCollapsed} />
         <button 
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-primary dark:text-dark-muted-foreground dark:hover:text-dark-primary border dark:border-gray-700 hover:bg-accent dark:hover:bg-dark-accent ${isCollapsed ? 'justify-center' : ''}`}
         >
           <LogOut className="h-5 w-5" />
           {!isCollapsed && 'Logout'}
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
