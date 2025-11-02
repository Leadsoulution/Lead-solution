import React, { useState, useRef, useEffect } from 'react';
import { Statut } from '../types';
import { useStatusColors } from '../contexts/ColorContext';
import { ChevronDown } from 'lucide-react';
import { colord } from 'colord';

interface StatusSelectorProps {
  value: Statut;
  onChange: (value: Statut) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useStatusColors();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleSelect = (status: Statut) => {
    onChange(status);
    setIsOpen(false);
  };

  const selectedColor = colors[value];
  const selectedTextColor = colord(selectedColor).isDark() ? 'text-white' : 'text-black';


  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 text-xs font-medium ${selectedTextColor}`}
        style={{ backgroundColor: selectedColor }}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-card dark:bg-dark-card border rounded-md shadow-lg max-h-60 overflow-auto">
          {Object.values(Statut).map(status => {
            const statusColor = colors[status];
            const statusTextColor = colord(statusColor).isDark() ? 'text-white' : 'text-black';
            return (
              <li
                key={status}
                onClick={() => handleSelect(status)}
                className={`px-3 py-2 text-xs cursor-pointer font-medium ${statusTextColor}`}
                style={{backgroundColor: statusColor}}
              >
                <span>{status}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StatusSelector;