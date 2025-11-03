
import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isCollapsed?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, setIsDarkMode, isCollapsed }) => {
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md border text-muted-foreground dark:text-dark-muted-foreground hover:bg-accent dark:hover:bg-dark-accent ${isCollapsed ? 'justify-center' : 'justify-between'}`}
    >
      {!isCollapsed && <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>}
      {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;