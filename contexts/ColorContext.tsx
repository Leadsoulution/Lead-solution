import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// FIX: Corrected import typo from StatusColors to StatutColors
import { Statut, StatutColors } from '../types';

// FIX: Corrected type typo from StatusColors to StatutColors
const DEFAULT_COLORS: StatutColors = {
  // FIX: The property '[Statut.NonDefini]' was missing, causing a type error. Added it to ensure conformity with the 'StatutColors' type definition.
  [Statut.NonDefini]: '#FFFFFF',
  [Statut.PasDeReponse]: '#eab308',
  [Statut.Confirme]: '#22c55e',
  [Statut.BoiteVocale]: '#f97316',
  [Statut.Annule]: '#ef4444',
  [Statut.Rappel]: '#3b82f6',
};

interface ColorContextType {
  // FIX: Corrected type typo from StatusColors to StatutColors
  colors: StatutColors;
  setStatusColor: (status: Statut, color: string) => void;
  saveColors: () => void;
  resetColors: () => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // FIX: Corrected type typo from StatusColors to StatutColors
  const [colors, setColors] = useState<StatutColors>(() => {
    try {
      const savedColors = localStorage.getItem('statusColors');
      return savedColors ? JSON.parse(savedColors) : DEFAULT_COLORS;
    } catch (error) {
      console.error("Error parsing status colors from localStorage", error);
      return DEFAULT_COLORS;
    }
  });

  const setStatusColor = (status: Statut, color: string) => {
    setColors(prevColors => ({
      ...prevColors,
      [status]: color,
    }));
  };
  
  const saveColors = () => {
    localStorage.setItem('statusColors', JSON.stringify(colors));
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    localStorage.setItem('statusColors', JSON.stringify(DEFAULT_COLORS));
  }

  return (
    <ColorContext.Provider value={{ colors, setStatusColor, saveColors, resetColors }}>
      {children}
    </ColorContext.Provider>
  );
};

export const useStatusColors = (): ColorContextType => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useStatusColors must be used within a ColorProvider');
  }
  return context;
};