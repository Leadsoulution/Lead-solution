
import React from 'react';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => {
  return (
    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
