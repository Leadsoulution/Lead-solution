import React, { useState, useEffect } from 'react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import { IntegrationSettings, PlatformIntegration } from '../types';
import { Link, CheckCircle, XCircle, Copy, PowerOff, Power } from 'lucide-react';

interface IntegrationPlatformCardProps {
  platform: PlatformIntegration;
  logo: string;
  description: string;
}

const IntegrationPlatformCard: React.FC<IntegrationPlatformCardProps> = ({ platform, logo, description }) => {
  const { integrations, updateIntegration, getWebhookUrl } = useIntegrations();
  const settings = integrations[platform];
  const [formData, setFormData] = useState<Omit<IntegrationSettings, 'platform' | 'isConnected'>>(settings);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setFormData(integrations[platform]);
  }, [integrations, platform]);

  const getLabels = () => {
    switch (platform) {
      case PlatformIntegration.Shopify:
        return { 
          apiKey: 'Clé API (API Key)', 
          apiSecret: 'Jeton d\'accès (Admin API Access Token)',
          urlPlaceholder: 'https://ma-boutique.myshopify.com'
        };
      case PlatformIntegration.WooCommerce:
        return { 
          apiKey: 'Clé Client (Consumer Key)', 
          apiSecret: 'Secret Client (Consumer Secret)',
          urlPlaceholder: 'https://votre-site-wordpress.com'
        };
      case PlatformIntegration.YouCan:
        return { 
          apiKey: 'Jeton d\'accès (Access Token)', 
          apiSecret: null, // Not needed for YouCan
          urlPlaceholder: 'https://votre-boutique.youcan.shop'
        };
      case PlatformIntegration.GoogleSheets:
        return {
          apiKey: 'Email du compte de service (Client Email)',
          apiSecret: 'Clé privée (Private Key)',
          urlPlaceholder: 'ID de la feuille Google Sheets'
        };
      default:
        return { 
          apiKey: 'Clé API', 
          apiSecret: 'Secret API',
          urlPlaceholder: 'https://votreboutique.com'
        };
    }
  };

  const labels = getLabels();

  const handleConnect = () => {
    if (platform === PlatformIntegration.GoogleSheets) {
       if (!formData.spreadsheetId || !formData.clientEmail || !formData.privateKey) {
         alert("Veuillez remplir tous les champs pour Google Sheets.");
         return;
       }
    } else {
      // Basic validation for other platforms
      if (!formData.storeUrl || !formData.apiKey) {
        alert("Veuillez remplir l'URL du magasin et la clé API.");
        return;
      }
      // Require apiSecret for platforms other than YouCan
      if (labels.apiSecret && !formData.apiSecret) {
        alert("Veuillez remplir le champ Secret API.");
        return;
      }
    }

    updateIntegration(platform, { ...formData, isConnected: true });
  };

  const handleDisconnect = () => {
    updateIntegration(platform, { isConnected: false });
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(getWebhookUrl(platform));
    setNotification('URL du Webhook copiée !');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const maskedValue = "**************";

  return (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-md dark:bg-dark-card dark:text-dark-card-foreground space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt={`${platform} logo`} className="h-12 w-12" />
          <div>
            <h3 className="text-xl font-semibold">{platform}</h3>
            <p className="text-muted-foreground dark:text-dark-muted-foreground text-sm">{description}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${settings.isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
          {settings.isConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{settings.isConnected ? 'Connecté' : 'Déconnecté'}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {platform === PlatformIntegration.GoogleSheets ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">ID de la feuille Google Sheets</label>
              <input type="text" name="spreadsheetId" value={settings.isConnected ? settings.spreadsheetId : formData.spreadsheetId || ''} onChange={handleChange} placeholder="ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" className="input-style" disabled={settings.isConnected} />
              <p className="text-xs text-muted-foreground mt-1">L'ID se trouve dans l'URL de votre feuille Google.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email du compte de service</label>
              <input type="text" name="clientEmail" value={settings.isConnected ? settings.clientEmail : formData.clientEmail || ''} onChange={handleChange} placeholder="ex: service-account@project.iam.gserviceaccount.com" className="input-style" disabled={settings.isConnected} />
              <p className="text-xs text-muted-foreground mt-1">Partagez votre feuille avec cet email (accès éditeur).</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clé privée (Private Key)</label>
              <textarea name="privateKey" value={settings.isConnected ? maskedValue : formData.privateKey || ''} onChange={handleChange} placeholder="-----BEGIN PRIVATE KEY-----..." className="input-style h-24 font-mono text-xs" disabled={settings.isConnected} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">URL du magasin</label>
              <input type="text" name="storeUrl" value={settings.isConnected ? settings.storeUrl : formData.storeUrl} onChange={handleChange} placeholder={labels.urlPlaceholder} className="input-style" disabled={settings.isConnected} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{labels.apiKey}</label>
              <input type="password" name="apiKey" value={settings.isConnected ? maskedValue : formData.apiKey} onChange={handleChange} className="input-style" disabled={settings.isConnected} />
            </div>
            {labels.apiSecret && (
              <div>
                <label className="block text-sm font-medium mb-1">{labels.apiSecret}</label>
                <input type="password" name="apiSecret" value={settings.isConnected ? maskedValue : formData.apiSecret} onChange={handleChange} className="input-style" disabled={settings.isConnected} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end">
        {settings.isConnected ? (
          <button onClick={handleDisconnect} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600">
            <PowerOff size={16} /> Déconnecter
          </button>
        ) : (
          <button onClick={handleConnect} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
            <Power size={16} /> Sauvegarder & Connecter
          </button>
        )}
      </div>

      <div className="border-t pt-4 space-y-2 dark:border-gray-700">
          <h4 className="font-semibold">Intégration par Webhook</h4>
          <p className="text-xs text-muted-foreground">Copiez cet URL dans les paramètres webhook de votre plateforme pour une synchronisation instantanée des commandes.</p>
          <div className="relative flex items-center">
            <input type="text" readOnly value={getWebhookUrl(platform)} className="input-style pr-10" />
            <button onClick={handleCopyWebhook} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-accent dark:hover:bg-dark-accent">
              <Copy size={16} className="text-muted-foreground" />
            </button>
          </div>
          {notification && <p className="text-xs text-green-600 mt-1">{notification}</p>}
      </div>
      <style>{`.input-style { width: 100%; padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; } .input-style:disabled { opacity: 0.7; background-color: hsl(210, 40%, 98%); } .dark .input-style:disabled { background-color: hsl(217.2, 32.6%, 22.5%); }`}</style>
    </div>
  );
};

const Integrations: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Link size={28} />
          Intégrations des Plateformes
        </h1>
        <p className="text-muted-foreground">Connectez vos boutiques e-commerce pour synchroniser les commandes automatiquement.</p>
      </div>

      <div className="space-y-6">
        <IntegrationPlatformCard
          platform={PlatformIntegration.Shopify}
          logo="https://cdn.worldvectorlogo.com/logos/shopify.svg"
          description="Synchronisez les commandes de votre boutique Shopify."
        />
        <IntegrationPlatformCard
          platform={PlatformIntegration.WooCommerce}
          logo="https://cdn.worldvectorlogo.com/logos/woocommerce-logo.svg"
          description="Connectez votre boutique basée sur WordPress & WooCommerce."
        />
        <IntegrationPlatformCard
          platform={PlatformIntegration.YouCan}
          logo="https://youcan.shop/images/logo.svg"
          description="Intégrez votre boutique de la plateforme YouCan."
        />
        <IntegrationPlatformCard
          platform={PlatformIntegration.GoogleSheets}
          logo="https://cdn.worldvectorlogo.com/logos/google-sheets.svg"
          description="Synchronisez les commandes depuis une feuille Google Sheets."
        />
      </div>
    </div>
  );
};

export default Integrations;