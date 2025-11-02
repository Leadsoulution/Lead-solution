import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role, DeliveryCompany } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUser: (username: string, password: string, role: Role) => { success: boolean, message: string };
  deliveryCompanies: DeliveryCompany[];
  addDeliveryCompany: (name: string) => { success: boolean, message: string };
  updateDeliveryCompany: (id: string, newName: string) => void;
  deleteDeliveryCompany: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin',
  role: Role.Admin,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
      // If no users, create default admin
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    } catch (e) {
      return [defaultAdmin];
    }
  });

  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>(() => {
    try {
      const savedCompanies = localStorage.getItem('deliveryCompanies');
      return savedCompanies ? JSON.parse(savedCompanies) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to local storage", error);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('deliveryCompanies', JSON.stringify(deliveryCompanies));
    } catch (error) {
      console.error("Failed to save delivery companies to local storage", error);
    }
  }, [deliveryCompanies]);
  
  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const createUser = (username: string, password: string, role: Role): { success: boolean, message: string } => {
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'Username already exists.' };
    }
    if (!username || !password) {
      return { success: false, message: 'Username and password cannot be empty.' };
    }
    const newUser: User = {
      id: `user-${new Date().getTime()}`,
      username,
      password,
      role,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    return { success: true, message: 'User created successfully.' };
  };

  const addDeliveryCompany = (name: string): { success: boolean, message: string } => {
    if (!name.trim()) {
      return { success: false, message: 'Le nom de la société ne peut pas être vide.' };
    }
    if (deliveryCompanies.some(c => c.name.toLowerCase() === name.toLowerCase().trim())) {
      return { success: false, message: 'Cette société de livraison existe déjà.' };
    }
    const newCompany: DeliveryCompany = {
      id: `dc-${Date.now()}`,
      name: name.trim(),
    };
    setDeliveryCompanies(prev => [...prev, newCompany]);
    return { success: true, message: 'Société de livraison ajoutée.' };
  };

  const updateDeliveryCompany = (id: string, newName: string) => {
    if (!newName.trim()) return; // Prevent empty names
    setDeliveryCompanies(prev =>
      prev.map(c => (c.id === id ? { ...c, name: newName.trim() } : c))
    );
  };

  const deleteDeliveryCompany = (id: string) => {
    setDeliveryCompanies(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, createUser, deliveryCompanies, addDeliveryCompany, updateDeliveryCompany, deleteDeliveryCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};