
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import Logo from './Logo';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-secondary/50">
      <div className="w-full max-w-md p-8 space-y-8 bg-card dark:bg-dark-card rounded-xl shadow-lg">
        <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo className="h-12 w-12" />
              <h1 className="text-3xl font-bold text-card-foreground dark:text-dark-card-foreground">Orderly</h1>
            </div>
          <h2 className="text-xl text-muted-foreground dark:text-dark-muted-foreground">Welcome back! Please log in.</h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogIn size={16}/>
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
