import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role, User } from '../types';
import { UserPlus, Save } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { users, createUser } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.User);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const result = createUser(newUsername, newPassword, newRole);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setNewUsername('');
      setNewPassword('');
      setNewRole(Role.User);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Gérez les comptes utilisateurs et leurs rôles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><UserPlus size={20}/> Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Role.User}>User</option>
                  <option value={Role.Admin}>Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <Save size={16}/>
                Create User
              </button>
              {message && (
                <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
            <h2 className="text-xl font-semibold mb-4">Existing Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground dark:text-dark-muted-foreground">
                  <tr>
                    <th className="p-2">Username</th>
                    <th className="p-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} className="border-t dark:border-gray-700">
                      <td className="p-2 font-medium">{user.username}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === Role.Admin ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;