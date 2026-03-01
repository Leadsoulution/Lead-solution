import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Role, View } from '../types';
import { api } from '../src/services/api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (username: string, email: string, password: string, role: Role, assignedProductIds: string[], permissions: View[]) => Promise<{ success: boolean, message: string }>;
  updateUser: (userId: string, updatedData: Partial<User>) => Promise<{ success: boolean, message: string }>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: User = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin',
  role: Role.Admin,
  assignedProductIds: [],
  permissions: [
    View.Dashboard,
    View.Products,
    View.Orders,
    View.Clients,
    View.Statistics,
    View.AIAnalysis,
    View.Settings,
    View.AdminPanel,
    View.Integrations,
    View.Financials,
  ], 
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

  const [users, setUsers] = useState<User[]>([defaultAdmin]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await api.getUsers();
        if (fetchedUsers && fetchedUsers.length > 0) {
            setUsers(fetchedUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);
  
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

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app with a backend, we should hit a /login endpoint.
    // For now, we check against the loaded users.
    // WARNING: This assumes the API returns passwords (which it shouldn't in production).
    // If the API returns hashed passwords, this check will fail unless we hash the input here too.
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

  const createUser = async (username: string, email: string, password: string, role: Role, assignedProductIds: string[], permissions: View[]): Promise<{ success: boolean, message: string }> => {
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'Ce nom d\'utilisateur existe déjà.' };
    }
    if (!username || !password) {
      return { success: false, message: 'Le nom d\'utilisateur et le mot de passe ne peuvent pas être vides.' };
    }
    const newUser: User = {
      id: `user-${new Date().getTime()}`,
      username,
      email,
      password,
      role,
      assignedProductIds,
      permissions,
    };
    
    try {
        await api.createUser(newUser);
        setUsers(prevUsers => [...prevUsers, newUser]);
        return { success: true, message: 'Utilisateur créé avec succès.' };
    } catch (error) {
        console.error("Failed to create user", error);
        return { success: false, message: 'Erreur lors de la création de l\'utilisateur.' };
    }
  };
  
  const updateUser = async (userId: string, updatedData: Partial<User>): Promise<{ success: boolean, message: string }> => {
    // Check for username uniqueness if it's being changed
    if (updatedData.username && users.some(u => u.id !== userId && u.username.toLowerCase() === updatedData.username?.toLowerCase())) {
        return { success: false, message: 'Ce nom d\'utilisateur est déjà pris.' };
    }

    try {
        await api.updateUser({ id: userId, ...updatedData } as User);
        setUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === userId) {
              const newPassword = updatedData.password ? updatedData.password : user.password;
              return { ...user, ...updatedData, password: newPassword };
            }
            return user;
          })
        );
        return { success: true, message: 'Utilisateur mis à jour avec succès.' };
    } catch (error) {
        console.error("Failed to update user", error);
        return { success: false, message: 'Erreur lors de la mise à jour de l\'utilisateur.' };
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === 'admin-001') {
      alert("L'administrateur par défaut ne peut pas être supprimé.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
          await api.deleteUser(userId);
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } catch (error) {
          console.error("Failed to delete user", error);
          alert("Erreur lors de la suppression de l'utilisateur.");
      }
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
