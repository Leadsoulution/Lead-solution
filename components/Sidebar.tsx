import React from 'react';
import { View, Role } from '../types';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, ShoppingCart, Settings, Package2, BarChart3, Shield, LogOut, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isDarkMode, setIsDarkMode }) => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { view: View.Dashboard, icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { view: View.Orders, icon: <ShoppingCart className="h-5 w-5" />, label: 'Orders' },
    { view: View.Statistics, icon: <BarChart3 className="h-5 w-5" />, label: 'Statistiques' },
    { view: View.Settings, icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

  const adminNavItems = [
     { view: View.AdminPanel, icon: <Shield className="h-5 w-5" />, label: 'Admin Panel' },
     { view: View.DeliveryCompanies, icon: <Truck className="h-5 w-5" />, label: 'Sociétés de Livraison' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6" />
          <span className="">OrderSync</span>
        </a>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map(item => (
            <a
              key={item.view}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setView(item.view);
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                currentView === item.view
                  ? 'bg-muted text-primary dark:bg-dark-muted dark:text-dark-primary'
                  : 'text-muted-foreground hover:text-primary dark:text-dark-muted-foreground dark:hover:text-dark-primary'
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
          {currentUser?.role === Role.Admin && (
            <div className="mt-2 border-t pt-2 dark:border-gray-700">
              {adminNavItems.map(item => (
                 <a
                  key={item.view}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setView(item.view);
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    currentView === item.view
                      ? 'bg-muted text-primary dark:bg-dark-muted dark:text-dark-primary'
                      : 'text-muted-foreground hover:text-primary dark:text-dark-muted-foreground dark:hover:text-dark-primary'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>
      </div>
      <div className="mt-auto p-4 space-y-2">
         <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
         <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-muted-foreground hover:text-primary dark:text-dark-muted-foreground dark:hover:text-dark-primary border dark:border-gray-700 hover:bg-accent dark:hover:bg-dark-accent"
         >
           <LogOut className="h-5 w-5" />
           Logout
         </button>
      </div>
    </div>
  );
};

export default Sidebar;