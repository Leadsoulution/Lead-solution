import React, { useState, useEffect } from 'react';
import { Share2, Code, Zap } from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ title, description, icon, isEnabled, onToggle }) => {
  return (
    <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-accent dark:bg-dark-accent p-3 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground dark:text-dark-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </div>
    </div>
  );
};


const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState({
    portal: false,
    api: false,
    code: false,
  });

  useEffect(() => {
    try {
      const savedIntegrations = localStorage.getItem('deliveryIntegrations');
      if (savedIntegrations) {
        setIntegrations(JSON.parse(savedIntegrations));
      }
    } catch (error) {
      console.error("Failed to load integrations from localStorage", error);
    }
  }, []);

  const handleToggle = (key: keyof typeof integrations) => {
    setIntegrations(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem('deliveryIntegrations', JSON.stringify(newState));
      return newState;
    });
  };


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
       <div>
        <h1 className="text-3xl font-bold">Intégrations</h1>
        <p className="text-muted-foreground">Activez et gérez les méthodes d'intégration pour vos sociétés de livraison.</p>
      </div>

      <div className="space-y-4">
        <IntegrationCard
            title="Portail Partenaire"
            description="Intégration via un tableau ou un portail partenaire."
            icon={<Share2 className="h-6 w-6 text-primary dark:text-dark-primary" />}
            isEnabled={integrations.portal}
            onToggle={() => handleToggle('portal')}
        />
        <IntegrationCard
            title="Intégration API (Automatique)"
            description="Synchronisation automatique via API."
            icon={<Zap className="h-6 w-6 text-primary dark:text-dark-primary" />}
            isEnabled={integrations.api}
            onToggle={() => handleToggle('api')}
        />
        <IntegrationCard
            title="Par Code"
            description="Intégration via des scripts ou codes de suivi."
            icon={<Code className="h-6 w-6 text-primary dark:text-dark-primary" />}
            isEnabled={integrations.code}
            onToggle={() => handleToggle('code')}
        />
      </div>
    </div>
  );
};

export default Integrations;
