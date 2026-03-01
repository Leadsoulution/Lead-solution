
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, KeyRound, ArrowLeft, Save } from 'lucide-react';
import Logo from './Logo';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, users, updateUser } = useAuth();
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  const [resetStep, setResetStep] = useState<'email' | 'new-password'>('email');
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    
    const user = users.find(u => u.email?.toLowerCase() === resetEmail.toLowerCase());
    
    if (user) {
        // Simulate sending email
        setResetMessage({ type: 'success', text: `Un lien de réinitialisation a été envoyé à ${resetEmail}.` });
        
        // For demo purposes, automatically move to next step after a delay or show a button
        setTimeout(() => {
             // In a real app, this would happen after clicking the email link
             setResetStep('new-password');
             setResetMessage({ type: 'success', text: "Simulation: Lien cliqué. Veuillez entrer votre nouveau mot de passe." });
        }, 1500);

    } else {
        setResetMessage({ type: 'error', text: "Aucun compte associé à cet email." });
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      const user = users.find(u => u.email?.toLowerCase() === resetEmail.toLowerCase());
      if (user) {
          const result = await updateUser(user.id, { password: newPassword });
          if (result.success) {
              setResetMessage({ type: 'success', text: "Mot de passe réinitialisé avec succès ! Redirection..." });
              setTimeout(() => {
                  setShowForgotPassword(false);
                  setResetStep('email');
                  setResetEmail('');
                  setNewPassword('');
                  setResetMessage(null);
              }, 2000);
          } else {
              setResetMessage({ type: 'error', text: result.message || "Erreur lors de la mise à jour." });
          }
      }
  };

  if (showForgotPassword) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-secondary dark:bg-dark-secondary/50">
          <div className="w-full max-w-md p-8 space-y-8 bg-card dark:bg-dark-card rounded-xl shadow-lg">
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Logo className="h-12 w-12" />
                  <h1 className="text-3xl font-bold text-card-foreground dark:text-dark-card-foreground">Orderly</h1>
                </div>
              <h2 className="text-xl text-muted-foreground dark:text-dark-muted-foreground">Réinitialisation du mot de passe</h2>
            </div>
            
            {resetStep === 'email' ? (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    />
                </div>
                {resetMessage && (
                    <p className={`text-sm ${resetMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {resetMessage.text}
                    </p>
                )}
                <div className="space-y-3">
                    <button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                    <KeyRound size={16}/>
                    Envoyer le lien
                    </button>
                    <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
                    >
                    <ArrowLeft size={16}/>
                    Retour à la connexion
                    </button>
                </div>
                </form>
            ) : (
                <form className="space-y-6" onSubmit={handleSaveNewPassword}>
                    <div>
                        <label className="block text-sm font-medium">Nouveau mot de passe</label>
                        <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 mt-1 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500"
                        placeholder="Nouveau mot de passe"
                        />
                    </div>
                    {resetMessage && (
                        <p className={`text-sm ${resetMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                            {resetMessage.text}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Save size={16}/>
                        Enregistrer le nouveau mot de passe
                    </button>
                </form>
            )}
          </div>
        </div>
      );
  }

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
          <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-500 hover:underline"
              >
                  Mot de passe oublié ?
              </button>
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
