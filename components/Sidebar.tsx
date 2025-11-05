
import React from 'react';
import { View, Role } from '../types';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, ShoppingCart, Settings, Package2, BarChart3, Shield, LogOut, Package, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  const isConfirmationUser = currentUser?.role === Role.Confirmation;

  const navItems = [
    { view: View.Dashboard, icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { view: View.Products, icon: <Package className="h-5 w-5" />, label: 'Products' },
    { view: View.Orders, icon: <ShoppingCart className="h-5 w-5" />, label: 'Orders' },
    { view: View.Statistics, icon: <BarChart3 className="h-5 w-5" />, label: 'Statistiques' },
    { view: View.Settings, icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ].filter(item => {
    if (isConfirmationUser) {
      return item.view === View.Orders;
    }
    return true;
  });

  const adminNavItems = [
     { view: View.AdminPanel, icon: <Shield className="h-5 w-5" />, label: 'Admin Panel' },
     { view: View.Integrations, icon: <Link className="h-5 w-5" />, label: 'Integrations' },
  ];

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
          <Package2 className="h-6 w-6" />
          {!isCollapsed && <span className="">OrderSync</span>}
        </a>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map(item => (
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
          {currentUser?.role === Role.Admin && (
            <div className="mt-2 border-t pt-2 dark:border-gray-700">
              {adminNavItems.map(item => (
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
            </div>
          )}
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
