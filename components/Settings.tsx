

import React, { useState, useRef, useEffect } from 'react';
import { Power, PowerOff, CheckCircle, XCircle, Save, RefreshCw, ChevronDown } from 'lucide-react';
import { Statut, Ramassage, Livraison, Remboursement, CommandeRetour, ColorCategory, MessageCategory, AllMessageTemplates } from '../types';
import { useCustomization } from '../contexts/CustomizationContext';

const ColorSettingsSection: React.FC<{
  title: string;
  category: ColorCategory;
  options: object;
}> = ({ title, category, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, setAllColors } = useCustomization();
  
  const handleColorChange = (option: string, color: string) => {
    setAllColors(prevColors => ({
      ...prevColors,
      [category]: {
        ...prevColors[category],
        [option]: color,
      }
    }));
  };

  return (
    <div className="border-b dark:border-gray-700 last:border-b-0 py-2">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-2 font-semibold text-lg hover:bg-accent dark:hover:bg-dark-accent/50 rounded-md px-2">
        <span>{title}</span>
        <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
         <div className="pt-4 pb-2 px-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* FIX: Explicitly type `option` as a string to prevent it from being inferred as `any`, which causes indexing errors. */}
            {Object.values(options).map((option: string) => (
              <div key={option} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border dark:border-gray-600" style={{ backgroundColor: (colors[category] as any)[option] }}></div>
                  <span className="text-sm font-medium">{option}</span>
                </div>
                <input 
                  type="color"
                  value={(colors[category] as any)[option]}
                  onChange={(e) => handleColorChange(option, e.target.value)}
                  className="w-10 h-10 p-0 border-none rounded-md cursor-pointer bg-transparent"
                  style={{'--tw-ring-color': (colors[category] as any)[option] } as React.CSSProperties}
                />
              </div>
            ))}
         </div>
      )}
    </div>
  );
};

const MessageSettingsSection: React.FC<{
  title: string;
  category: MessageCategory;
  options: object;
}> = ({ title, category, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { messageTemplates, setMessageTemplates } = useCustomization();
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const cursorPositionRef = useRef<{ position: number; status: string } | null>(null);

  useEffect(() => {
    if (cursorPositionRef.current) {
      const { position, status } = cursorPositionRef.current;
      const textarea = textareaRefs.current[status];
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = position;
        textarea.selectionEnd = position;
      }
      cursorPositionRef.current = null;
    }
  });

  const availableVariables = ['{{client}}', '{{id}}', '{{produit}}', '{{prix}}', '{{status}}', '{{téléphone}}', '{{adresse}}'];
  const availableEmojis = ['✅', '👋', '📦', '🚚', '💰', '👍', '😊'];

  const handleTemplateChange = (status: string, value: string) => {
    setMessageTemplates(prev => {
      const newCategoryTemplates = { ...prev[category] };
      // FIX: Cast to `any` to allow string indexing on a union of record types, which TypeScript cannot otherwise resolve safely.
      (newCategoryTemplates as any)[status] = {
        ...(newCategoryTemplates as any)[status],
        template: value
      };
      return {
        ...prev,
        [category]: newCategoryTemplates
      };
    });
  };

  const handleToggleEnabled = (status: string) => {
    setMessageTemplates(prev => {
      const newCategoryTemplates = { ...prev[category] };
      // FIX: Cast to `any` to allow string indexing on a union of record types.
      const currentTemplate = (newCategoryTemplates as any)[status];
      (newCategoryTemplates as any)[status] = {
        ...currentTemplate,
        enabled: !currentTemplate.enabled
      };
      return {
        ...prev,
        [category]: newCategoryTemplates
      };
    });
  };

  const handleInsertText = (textToInsert: string, status: string) => {
    const textarea = textareaRefs.current[status];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);

    cursorPositionRef.current = { position: start + textToInsert.length, status };
    handleTemplateChange(status, newText);
  };

  return (
     <div className="border-b dark:border-gray-700 last:border-b-0 py-2">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-2 font-semibold text-lg hover:bg-accent dark:hover:bg-dark-accent/50 rounded-md px-2">
            <span>{title}</span>
            <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="pt-4 pb-2 px-2 space-y-6">
                {/* FIX: Explicitly type `status` as a string to resolve errors when it's used as an index, a key, or a child element. */}
                {Object.values(options).map((status: string) => {
                    // FIX: Cast to `any` to allow string indexing on a union of record types.
                    const messageConfig = (messageTemplates[category] as any)[status];
                    if (!messageConfig) return null;
                    const isEnabled = messageConfig.enabled;

                    return (
                        <div key={status}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-muted-foreground flex items-center gap-2">{status}</label>
                                <button
                                    onClick={() => handleToggleEnabled(status)}
                                    title={isEnabled ? 'Désactiver' : 'Activer'}
                                    className={`p-1.5 rounded-md transition-colors ${isEnabled ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50' : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50'}`}
                                >
                                    {isEnabled ? <Power size={18} /> : <PowerOff size={18} />}
                                </button>
                            </div>
                             <div className="flex flex-wrap gap-2 mb-2 items-center">
                              {availableVariables.map(variable => (
                                <button
                                  key={variable}
                                  type="button"
                                  onClick={() => handleInsertText(variable, status)}
                                  disabled={!isEnabled}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-mono rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-100"
                                >
                                  {variable}
                                </button>
                              ))}
                               <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                               {availableEmojis.map(emoji => (
                                 <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleInsertText(emoji, status)}
                                  disabled={!isEnabled}
                                  className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Insert ${emoji} emoji`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <textarea
                                ref={el => textareaRefs.current[status] = el}
                                value={messageConfig.template}
                                onChange={(e) => handleTemplateChange(status, e.target.value)}
                                rows={4}
                                disabled={!isEnabled}
                                className="w-full p-2 border rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:bg-muted/50 dark:disabled:bg-dark-muted/50 transition-opacity"
                            />
                        </div>
                    );
                })}
            </div>
        )}
     </div>
  );
};


const Settings: React.FC = () => {
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [isWooConnected, setIsWooConnected] = useState(false);
  const { saveColors, resetColors, saveMessageTemplates, resetMessageTemplates, currency, setCurrency } = useCustomization();

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showColorSaveConfirmation, setShowColorSaveConfirmation] = useState(false);


  React.useEffect(() => {
    setIsShopifyConnected(localStorage.getItem('shopifyConnected') === 'true');
    setIsWooConnected(localStorage.getItem('wooConnected') === 'true');
  }, []);

  const toggleConnection = (platform: 'shopify' | 'woo') => {
    if (platform === 'shopify') {
      const newState = !isShopifyConnected;
      setIsShopifyConnected(newState);
      localStorage.setItem('shopifyConnected', String(newState));
    } else {
      const newState = !isWooConnected;
      setIsWooConnected(newState);
      localStorage.setItem('wooConnected', String(newState));
    }
  };

  const handleSaveTemplates = () => {
    saveMessageTemplates();
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };
  
  const handleSaveColors = () => {
    saveColors();
    setShowColorSaveConfirmation(true);
    setTimeout(() => setShowColorSaveConfirmation(false), 2000);
  }

  const PlatformCard: React.FC<{
    name: string;
    description: string;
    isConnected: boolean;
    onToggle: () => void;
    logo: string;
  }> = ({ name, description, isConnected, onToggle, logo }) => (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground flex flex-col md:flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <img src={logo} alt={`${name} logo`} className="h-12 w-12" />
        <div>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-muted-foreground dark:text-dark-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
          {isConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-white ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isConnected ? <PowerOff size={16} /> : <Power size={16} />}
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Gérez vos connexions, personnalisez les messages et les couleurs.</p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Connexions</h2>
        <PlatformCard
          name="Shopify"
          description="Connect your Shopify store to sync orders."
          isConnected={isShopifyConnected}
          onToggle={() => toggleConnection('shopify')}
          logo="https://cdn.worldvectorlogo.com/logos/shopify.svg"
        />
        <PlatformCard
          name="WooCommerce"
          description="Connect your WordPress store to sync orders."
          isConnected={isWooConnected}
          onToggle={() => toggleConnection('woo')}
          logo="https://cdn.worldvectorlogo.com/logos/woocommerce-logo.svg"
        />
      </div>

       <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Devise</h2>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
          <label htmlFor="currency-select" className="block text-sm font-medium mb-2">Sélectionnez la devise de l'application</label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD' | 'MAD')}
            className="w-full max-w-xs p-2 border rounded-md bg-card dark:bg-dark-card focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="MAD">Dirham Marocain (MAD)</option>
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollar ($)</option>
          </select>
        </div>
      </div>

       <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Configuration des Couleurs</h2>
         <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
             <ColorSettingsSection title="Confirmation" category="statut" options={Statut} />
             <ColorSettingsSection title="Ramassage" category="ramassage" options={Ramassage} />
             <ColorSettingsSection title="Livraison" category="livraison" options={Livraison} />
             <ColorSettingsSection title="Remboursement" category="remboursement" options={Remboursement} />
             <ColorSettingsSection title="Commande retour" category="commandeRetour" options={CommandeRetour} />
             
             <div className="flex justify-end items-center mt-6 gap-4">
                {showColorSaveConfirmation && <span className="text-sm text-green-600">Couleurs sauvegardées !</span>}
                <button onClick={resetColors} className="px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-sm border hover:bg-accent dark:hover:bg-dark-accent">
                    <RefreshCw size={14} />
                    Réinitialiser
                </button>
                <button onClick={handleSaveColors} className="px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-white bg-blue-500 hover:bg-blue-600">
                    <Save size={16} />
                    Sauvegarder les couleurs
                </button>
             </div>
        </div>
      </div>


      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Configuration des Messages WhatsApp</h2>
         <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
             <div className="space-y-4">
                <p className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
                    {"Utilisez des placeholders comme {{client}}, {{id}}, {{produit}}, {{prix}}, {{status}} pour personnaliser vos messages."}
                </p>
                <MessageSettingsSection title="Messages de Confirmation" category="statut" options={Statut} />
                <MessageSettingsSection title="Messages de Ramassage" category="ramassage" options={Ramassage} />
                <MessageSettingsSection title="Messages de Livraison" category="livraison" options={Livraison} />
             </div>
             <div className="flex justify-end items-center mt-6">
                {showSaveConfirmation && <span className="text-sm text-green-600 mr-4">Modèles sauvegardés !</span>}
                 <button onClick={resetMessageTemplates} className="px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-sm border hover:bg-accent dark:hover:bg-dark-accent mr-4">
                    <RefreshCw size={14} />
                    Réinitialiser
                </button>
                <button onClick={handleSaveTemplates} className="px-4 py-2 rounded-md flex items-center gap-2 font-semibold text-white bg-blue-500 hover:bg-blue-600">
                    <Save size={16} />
                    Sauvegarder les modèles
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
