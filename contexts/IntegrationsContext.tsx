import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PlatformIntegration, IntegrationSettings } from '../types';

interface IntegrationsContextType {
  integrations: Record<PlatformIntegration, IntegrationSettings>;
  updateIntegration: (platform: PlatformIntegration, settings: Partial<IntegrationSettings>) => void;
  getWebhookUrl: (platform: PlatformIntegration) => string;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

const initialIntegrationsState: Record<PlatformIntegration, IntegrationSettings> = {
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
};

export const IntegrationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [integrations, setIntegrations] = useState<Record<PlatformIntegration, IntegrationSettings>>(() => {
    try {
      const savedIntegrations = localStorage.getItem('platformIntegrations');
      return savedIntegrations ? JSON.parse(savedIntegrations) : initialIntegrationsState;
    } catch (error) {
      console.error("Failed to load integrations from localStorage", error);
      return initialIntegrationsState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('platformIntegrations', JSON.stringify(integrations));
    } catch (error) {
      console.error("Failed to save integrations to localStorage", error);
    }
  }, [integrations]);

  const updateIntegration = (platform: PlatformIntegration, settings: Partial<IntegrationSettings>) => {
    setIntegrations(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        ...settings,
      },
    }));
  };

  const getWebhookUrl = (platform: PlatformIntegration): string => {
    // In a real application, this would be a unique, persistent URL per user/account.
    const baseUrl = 'https://api.ordersync.com/webhook';
    return `${baseUrl}/${platform.toLowerCase()}/${currentUserIdentifier()}`;
  };

  // Helper to generate a stable identifier for the webhook URL.
  const currentUserIdentifier = () => {
    // This is a mock identifier. In a real app, use a user ID or a securely generated token.
    let id = localStorage.getItem('webhook_identifier');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('webhook_identifier', id);
    }
    return id;
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