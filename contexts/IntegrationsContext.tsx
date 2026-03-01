import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PlatformIntegration, IntegrationSettings, Setting } from '../types';
import { api } from '../src/services/api';

interface IntegrationsContextType {
  integrations: Record<PlatformIntegration, IntegrationSettings>;
  updateIntegration: (platform: PlatformIntegration, settings: Partial<IntegrationSettings>) => void;
  getWebhookUrl: (platform: PlatformIntegration) => string;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

const initialIntegrationsState: Record<PlatformIntegration, IntegrationSettings> = {
  // ... (keep existing initial state)
  [PlatformIntegration.Shopify]: {
    platform: PlatformIntegration.Shopify,
    isConnected: false,
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
  },
  [PlatformIntegration.WooCommerce]: {
    platform: PlatformIntegration.WooCommerce,
    isConnected: false,
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
  },
  [PlatformIntegration.YouCan]: {
    platform: PlatformIntegration.YouCan,
    isConnected: false,
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
  },
  [PlatformIntegration.GoogleSheets]: {
    platform: PlatformIntegration.GoogleSheets,
    isConnected: false,
    storeUrl: '', // Not used
    apiKey: '', // Not used
    apiSecret: '', // Not used
    spreadsheetId: '',
    clientEmail: '',
    privateKey: '',
  },
};

export const IntegrationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [integrations, setIntegrations] = useState<Record<PlatformIntegration, IntegrationSettings>>(initialIntegrationsState);
  const [webhookIdentifier, setWebhookIdentifier] = useState<string>('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (Array.isArray(settings)) {
            const integrationSetting = settings.find((s: Setting) => s.setting_key === 'platformIntegrations');
            if (integrationSetting) {
                setIntegrations({
                    ...initialIntegrationsState,
                    ...JSON.parse(integrationSetting.setting_value)
                });
            }
            
            const webhookIdSetting = settings.find((s: Setting) => s.setting_key === 'webhook_identifier');
            if (webhookIdSetting) {
                setWebhookIdentifier(webhookIdSetting.setting_value);
            } else {
                // Generate and save if not exists
                const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                setWebhookIdentifier(newId);
                api.updateSettings({ key: 'webhook_identifier', value: newId });
            }
        }
      } catch (error) {
        console.error("Failed to fetch integration settings", error);
      }
    };
    fetchSettings();
  }, []);

  const updateIntegration = async (platform: PlatformIntegration, settings: Partial<IntegrationSettings>) => {
    const updatedIntegrations = {
      ...integrations,
      [platform]: {
        ...integrations[platform],
        ...settings,
      },
    };
    setIntegrations(updatedIntegrations);
    try {
        await api.updateSettings({ key: 'platformIntegrations', value: JSON.stringify(updatedIntegrations) });
    } catch (error) {
        console.error("Failed to save integrations", error);
    }
  };

  const getWebhookUrl = (platform: PlatformIntegration): string => {
    const baseUrl = 'https://api.ordersync.com/webhook';
    return `${baseUrl}/${platform.toLowerCase()}/${webhookIdentifier}`;
  };

  return (
    <IntegrationsContext.Provider value={{ integrations, updateIntegration, getWebhookUrl }}>
      {children}
    </IntegrationsContext.Provider>
  );
};

export const useIntegrations = (): IntegrationsContextType => {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error('useIntegrations must be used within an IntegrationsProvider');
  }
  return context;
};
