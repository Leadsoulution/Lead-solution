import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from '../contexts/HistoryContext';
import { Role, User, Product, View } from '../types';
import { UserPlus, Save, Edit, Trash2, X } from 'lucide-react';

const AVAILABLE_VIEWS = [
  { id: View.Dashboard, label: 'Dashboard' },
  { id: View.Products, label: 'Products' },
  { id: View.Orders, label: 'Orders' },
  { id: View.Clients, label: 'Clients' },
  { id: View.Statistics, label: 'Statistiques' },
  { id: View.AIAnalysis, label: 'AI Analysis' },
  { id: View.Settings, label: 'Settings' },
  { id: View.AdminPanel, label: 'Admin Panel' },
  { id: View.Integrations, label: 'Integrations' },
  { id: View.Financials, label: 'Financials' },
  { id: View.History, label: 'Historique' },
];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  products: Product[];
  onSave: (userId: string, updatedData: Partial<User>) => Promise<{ success: boolean, message: string }>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, products, onSave }) => {
    const { currentUser } = useAuth();
    const { addLog } = useHistory();
    const [formData, setFormData] = useState<Partial<User>>({
        username: user.username,
        email: user.email || '',
        password: '',
        role: user.role,
        assignedProductIds: user.assignedProductIds || [],
        permissions: user.permissions || []
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setFormData({
            username: user.username,
            email: user.email || '',
            password: '',
            role: user.role,
            assignedProductIds: user.assignedProductIds || [],
            permissions: user.permissions || []
        });
        setMessage(null);
    }, [user, isOpen]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductSelectionChange = (productId: string) => {
        setFormData(prev => {
            const currentIds = prev.assignedProductIds || [];
            const newIds = currentIds.includes(productId)
                ? currentIds.filter(id => id !== productId)
                : [...currentIds, productId];
            return { ...prev, assignedProductIds: newIds };
        });
    };

    const handlePermissionChange = (viewId: View) => {
        setFormData(prev => {
            const currentPermissions = prev.permissions || [];
            const newPermissions = currentPermissions.includes(viewId)
                ? currentPermissions.filter(id => id !== viewId)
                : [...currentPermissions, viewId];
            return { ...prev, permissions: newPermissions };
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        // Remove password if it's empty, so it's not updated
        const dataToSave = { ...formData };
        if (!dataToSave.password) {
            delete dataToSave.password;
        }
        
        const result = await onSave(user.id, dataToSave);
        
        if(result.success) {
             addLog({
                userId: currentUser?.id || 'unknown',
                username: currentUser?.username || 'Unknown',
                action: 'Update User',
                details: `Updated user ${user.username}`,
                targetId: user.id,
                targetType: 'User',
                oldValue: JSON.stringify(user),
                newValue: JSON.stringify({ ...user, ...dataToSave })
            });
            setMessage({ type: 'success', text: result.message });
            setTimeout(() => onClose(), 1500);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Modifier l'utilisateur : {user.username}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                     {message && (
                      <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {message.text}
                      </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full mt-1 input-style" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 input-style" placeholder="email@example.com" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">New Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full mt-1 input-style" placeholder="Laisser vide pour ne pas changer" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 input-style" disabled={user.id === 'admin-001'}>
                            <option value={Role.User}>User</option>
                            <option value={Role.Admin}>Admin</option>
                            <option value={Role.Confirmation}>Confirmation Centre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Permissions (Vues)</label>
                        <div className="max-h-40 overflow-y-auto p-2 border rounded-md space-y-2 grid grid-cols-2 gap-2">
                             {AVAILABLE_VIEWS.map(view => (
                                <div key={view.id} className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id={`edit-perm-${view.id}`} 
                                    checked={formData.permissions?.includes(view.id)} 
                                    onChange={() => handlePermissionChange(view.id)} 
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                />
                                <label htmlFor={`edit-perm-${view.id}`} className="text-sm font-medium select-none cursor-pointer flex-1">{view.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Produits Assignés</label>
                        <div className="max-h-40 overflow-y-auto p-2 border rounded-md space-y-2">
                             {products.map(product => (
                                <div key={product.id} className="flex items-center gap-3">
                                <input type="checkbox" id={`edit-prod-${product.id}`} checked={formData.assignedProductIds?.includes(product.id)} onChange={() => handleProductSelectionChange(product.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                <label htmlFor={`edit-prod-${product.id}`} className="text-sm font-medium select-none cursor-pointer flex-1">{product.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <style>{`.input-style { padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }`}</style>
                </form>
                 <div className="flex justify-end items-center gap-4 p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent dark:hover:bg-dark-accent">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Sauvegarder</button>
                </div>
            </div>
        </div>
    );
};

interface AdminPanelProps {
  products: Product[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ products }) => {
  const { users, createUser, updateUser, deleteUser, currentUser } = useAuth();
  const { addLog } = useHistory();
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.User);
  const [assignedProducts, setAssignedProducts] = useState<string[]>([]);
  const [newPermissions, setNewPermissions] = useState<View[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

    const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const result = await createUser(newUsername, newEmail, newPassword, newRole, assignedProducts, newPermissions);
    if (result.success) {
      addLog({
        userId: currentUser?.id || 'unknown',
        username: currentUser?.username || 'Unknown',
        action: 'Create User',
        details: `Created user ${newUsername} with role ${newRole}`,
        targetId: newUsername, // Using username as ID for now since ID is generated inside createUser
        targetType: 'User',
      });
      setMessage({ type: 'success', text: result.message });
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole(Role.User);
      setAssignedProducts([]);
      setNewPermissions([]);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleProductSelectionChange = (productId: string) => {
    setAssignedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePermissionChange = (viewId: View) => {
    setNewPermissions(prev =>
      prev.includes(viewId)
        ? prev.filter(id => id !== viewId)
        : [...prev, viewId]
    );
  };
  
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (userId === 'admin-001') {
        alert("L'administrateur par défaut ne peut pas être supprimé.");
        return;
      }
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
        deleteUser(userId);
        addLog({
            userId: currentUser?.id || 'unknown',
            username: currentUser?.username || 'Unknown',
            action: 'Delete User',
            details: `Deleted user ${userToDelete?.username || userId}`,
            targetId: userId,
            targetType: 'User',
        });
      }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Panneau d'administration</h1>
        <p className="text-muted-foreground">Gérez les comptes utilisateurs, leurs rôles et les produits assignés.</p>
      </div>
      
       {message && (
          <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
              {message.text}
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><UserPlus size={20}/> Créer un utilisateur</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Username</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full mt-1 input-style" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full mt-1 input-style" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 input-style" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} className="w-full mt-1 input-style">
                  <option value={Role.User}>User</option>
                  <option value={Role.Admin}>Admin</option>
                  <option value={Role.Confirmation}>Confirmation Centre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions (Vues)</label>
                <div className="max-h-40 overflow-y-auto p-2 border rounded-md space-y-2 grid grid-cols-1 gap-1">
                     {AVAILABLE_VIEWS.map(view => (
                        <div key={view.id} className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id={`perm-${view.id}`} 
                            checked={newPermissions.includes(view.id)} 
                            onChange={() => handlePermissionChange(view.id)} 
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        />
                        <label htmlFor={`perm-${view.id}`} className="text-sm font-medium select-none cursor-pointer flex-1">{view.label}</label>
                        </div>
                    ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Produits Assignés</label>
                <div className="max-h-40 overflow-y-auto p-2 border rounded-md space-y-2">
                    {products.map(product => (
                        <div key={product.id} className="flex items-center gap-3">
                            <input type="checkbox" id={`prod-${product.id}`} checked={assignedProducts.includes(product.id)} onChange={() => handleProductSelectionChange(product.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <label htmlFor={`prod-${product.id}`} className="text-sm font-medium select-none cursor-pointer flex-1">{product.name}</label>
                        </div>
                    ))}
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
                <Save size={16}/>Créer l'utilisateur
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
            <h2 className="text-xl font-semibold mb-4">Utilisateurs existants</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground dark:text-dark-muted-foreground">
                  <tr>
                    <th className="p-2">Username</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Permissions</th>
                    <th className="p-2">Produits</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-t dark:border-gray-700">
                      <td className="p-2 font-medium">{user.username}</td>
                      <td className="p-2 text-muted-foreground">{user.email || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ user.role === Role.Admin ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : user.role === Role.Confirmation ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 text-xs">
                        {user.permissions && user.permissions.length > 0 
                            ? `${user.permissions.length} vue(s)` 
                            : 'Toutes (Admin)'}
                      </td>
                       <td className="p-2 text-xs">
                        {user.assignedProductIds.length > 0
                            ? `${user.assignedProductIds.length} produit(s)`
                            : 'Aucun'
                        }
                      </td>
                      <td className="p-2 text-right space-x-1">
                        <button onClick={() => handleOpenEditModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md" title="Modifier"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Supprimer"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {editingUser && <EditUserModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} user={editingUser} products={products} onSave={updateUser} />}
      <style>{`.input-style { padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }`}</style>
    </div>
  );
};

export default AdminPanel;
