import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Statut, Ramassage, Livraison, Remboursement, CommandeRetour,
  AllStatusColors, AllMessageTemplates
} from '../types';

const DEFAULT_COLORS: AllStatusColors = {
  statut: {
    [Statut.PasDeReponse]: '#eab308',
    [Statut.Confirme]: '#22c55e',
    [Statut.BoiteVocale]: '#f97316',
    [Statut.Annule]: '#ef4444',
    [Statut.Rappel]: '#3b82f6',
  },
  ramassage: {
    [Ramassage.Ramasser]: '#16a34a',
    [Ramassage.NonRamasser]: '#fde047',
  },
  livraison: {
    [Livraison.PasDeReponse]: '#eab308',
    [Livraison.Livre]: '#22c55e',
    [Livraison.Reporte]: '#f97316',
    [Livraison.Annule]: '#ef4444',
    [Livraison.PriseDeRdv]: '#3b82f6',
  },
  remboursement: {
    [Remboursement.Payer]: '#16a34a',
    [Remboursement.NonPayer]: '#fde047',
  },
  commandeRetour: {
    [CommandeRetour.Retourner]: '#f97316',
    [CommandeRetour.NonRetourne]: '#22c55e',
    [CommandeRetour.Bloquer]: '#ef4444',
  }
};

const DEFAULT_MESSAGE_TEMPLATES: AllMessageTemplates = {
  statut: {
    [Statut.PasDeReponse]: { template: "Bonjour {{client}}, nous avons tenté de vous joindre concernant votre commande {{id}}. Nous réessaierons.", enabled: true },
    [Statut.Confirme]: { template: "Bonne nouvelle {{client}} ! Votre commande {{id}} ({{produit}}) a été confirmée.", enabled: true },
    [Statut.BoiteVocale]: { template: "Bonjour {{client}}, nous vous avons laissé un message vocal concernant votre commande {{id}}.", enabled: true },
    [Statut.Annule]: { template: "Bonjour {{client}}, nous avons le regret de vous informer que votre commande {{id}} a été annulée.", enabled: true },
    [Statut.Rappel]: { template: "Bonjour {{client}}, ceci est un rappel concernant votre commande {{id}}. Veuillez nous recontacter.", enabled: true },
  },
  ramassage: {
    [Ramassage.Ramasser]: { template: "Bonjour {{client}}, votre commande {{id}} est prête et a été ramassée pour la livraison.", enabled: true },
    [Ramassage.NonRamasser]: { template: "Bonjour {{client}}, un problème est survenu lors du ramassage de votre commande {{id}}. Nous vous contacterons.", enabled: true },
  },
  livraison: {
    [Livraison.PasDeReponse]: { template: "Bonjour {{client}}, le livreur a tenté de vous joindre pour la commande {{id}} sans succès.", enabled: true },
    [Livraison.Livre]: { template: "Excellente nouvelle {{client}} ! Votre commande {{id}} a été livrée. Profitez bien de votre {{produit}} !", enabled: true },
    [Livraison.Reporte]: { template: "Bonjour {{client}}, la livraison de votre commande {{id}} a été reportée. Nous vous tiendrons informé.", enabled: true },
    [Livraison.Annule]: { template: "Bonjour {{client}}, la livraison de votre commande {{id}} a malheureusement été annulée.", enabled: true },
    [Livraison.PriseDeRdv]: { template: "Bonjour {{client}}, pour finaliser la livraison de votre commande {{id}}, merci de prendre rendez-vous avec notre transporteur.", enabled: true },
  },
  remboursement: {
    [Remboursement.Payer]: { template: "Bonjour {{client}}, nous confirmons que le paiement de {{prix}}€ pour votre commande {{id}} a bien été effectué.", enabled: true },
    [Remboursement.NonPayer]: { template: "Bonjour {{client}}, le paiement pour votre commande {{id}} n'a pas encore été effectué. Merci de vérifier.", enabled: true },
  },
  commandeRetour: {
    [CommandeRetour.Retourner]: { template: "Bonjour {{client}}, nous avons bien reçu le retour de votre commande {{id}}.", enabled: true },
    [CommandeRetour.NonRetourne]: { template: "Bonjour {{client}}, nous n'avons pas encore reçu le retour de votre commande {{id}}.", enabled: true },
    [CommandeRetour.Bloquer]: { template: "Bonjour {{client}}, un problème est survenu avec le retour de votre commande {{id}}. Le processus est actuellement bloqué.", enabled: true },
  }
};

interface CustomizationContextType {
  colors: AllStatusColors;
  setAllColors: React.Dispatch<React.SetStateAction<AllStatusColors>>;
  saveColors: () => void;
  resetColors: () => void;
  messageTemplates: AllMessageTemplates;
  setMessageTemplates: React.Dispatch<React.SetStateAction<AllMessageTemplates>>;
  saveMessageTemplates: () => void;
  resetMessageTemplates: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

// Helper for deep merging defaults with loaded data
const deepMerge = (defaults: any, loaded: any): any => {
  const result = { ...defaults };
  for (const key in defaults) {
    if (loaded && typeof loaded[key] === 'object' && loaded[key] !== null && !Array.isArray(loaded[key])) {
      result[key] = { ...defaults[key], ...loaded[key] };
    } else if (loaded && loaded[key] !== undefined) {
      result[key] = loaded[key];
    }
  }
  return result;
}


export const CustomizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [colors, setAllColors] = useState<AllStatusColors>(() => {
    try {
      const savedColors = localStorage.getItem('allStatusColors');
      const loadedColors = savedColors ? JSON.parse(savedColors) : {};
      return deepMerge(DEFAULT_COLORS, loadedColors);
    } catch (error) {
      console.error("Error parsing all status colors from localStorage", error);
      return DEFAULT_COLORS;
    }
  });

  const [messageTemplates, setMessageTemplates] = useState<AllMessageTemplates>(() => {
    try {
        const savedTemplates = localStorage.getItem('allMessageTemplates');
        const loadedTemplates = savedTemplates ? JSON.parse(savedTemplates) : {};
        return deepMerge(DEFAULT_MESSAGE_TEMPLATES, loadedTemplates);
    } catch (error) {
        console.error("Error parsing all message templates from localStorage", error);
        return DEFAULT_MESSAGE_TEMPLATES;
    }
  });

  const saveColors = () => {
    localStorage.setItem('allStatusColors', JSON.stringify(colors));
  };

  const resetColors = () => {
    setAllColors(DEFAULT_COLORS);
    localStorage.setItem('allStatusColors', JSON.stringify(DEFAULT_COLORS));
  }

  const saveMessageTemplates = () => {
    localStorage.setItem('allMessageTemplates', JSON.stringify(messageTemplates));
  };

  const resetMessageTemplates = () => {
    setMessageTemplates(DEFAULT_MESSAGE_TEMPLATES);
    localStorage.setItem('allMessageTemplates', JSON.stringify(DEFAULT_MESSAGE_TEMPLATES));
  }


  return (
    <CustomizationContext.Provider value={{ colors, setAllColors, saveColors, resetColors, messageTemplates, setMessageTemplates, saveMessageTemplates, resetMessageTemplates }}>
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};