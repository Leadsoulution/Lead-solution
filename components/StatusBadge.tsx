
import React from 'react';
import { Statut } from '../types';
import { useCustomization } from '../contexts/CustomizationContext';
import { colord } from 'colord';

interface StatusBadgeProps {
  status: Statut;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { colors } = useCustomization();
  const color = colors.statut[status];
  
  const textColor = colord(color).isDark() ? 'text-white' : 'text-black';
  
  return (
    <span 
      className={`px-2 py-1 text-xs font-medium rounded-full ${textColor}`}
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
