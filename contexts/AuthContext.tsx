import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUser: (username: string, password: string, role: Role, assignedProductIds: string[]) => { success: boolean, message: string };
  updateUser: (userId: string, updatedData: Partial<User>) => { success: boolean, message: string };
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin',
  role: Role.Admin,
  assignedProductIds: [],
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
        // Ensure old user objects have the new property
        return JSON.parse(savedUsers).map((u: User) => ({ ...u, assignedProductIds: u.assignedProductIds || [] }));
      }
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    } catch (e) {
      return [defaultAdmin];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to local storage", error);
    }
  }, [users]);
  
  // When current user data is updated by an admin, update it in state and localStorage as well.
  useEffect(() => {
    if (currentUser) {
      const updatedCurrentUser = users.find(u => u.id === currentUser.id);
      if (updatedCurrentUser && JSON.stringify(updatedCurrentUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedCurrentUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
      }
    }
  }, [users, currentUser]);

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

  const createUser = (username: string, password: string, role: Role, assignedProductIds: string[]): { success: boolean, message: string } => {
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Ce nom d\'utilisateur existe déjà.' };
    }
    if (!username || !password) {
      return { success: false, message: 'Le nom d\'utilisateur et le mot de passe ne peuvent pas être vides.' };
    }
    const newUser: User = {
      id: `user-${new Date().getTime()}`,
      username,
      password,
      role,
      assignedProductIds,
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    return { success: true, message: 'Utilisateur créé avec succès.' };
  };
  
  const updateUser = (userId: string, updatedData: Partial<User>): { success: boolean, message: string } => {
    // Check for username uniqueness if it's being changed
    if (updatedData.username && users.some(u => u.id !== userId && u.username.toLowerCase() === updatedData.username?.toLowerCase())) {
        return { success: false, message: 'Ce nom d\'utilisateur est déjà pris.' };
    }

    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === userId) {
          // If password is empty string, don't update it
          const newPassword = updatedData.password ? updatedData.password : user.password;
          return { ...user, ...updatedData, password: newPassword };
        }
        return user;
      })
    );
    return { success: true, message: 'Utilisateur mis à jour avec succès.' };
  };

  const deleteUser = (userId: string) => {
    if (userId === 'admin-001') {
      alert("L'administrateur par défaut ne peut pas être supprimé.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    }
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, createUser, updateUser, deleteUser }}>
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
