
import React, { useState, useRef, useEffect } from 'react';
import { useCustomization } from '../contexts/CustomizationContext';
import { ChevronDown } from 'lucide-react';
import { colord } from 'colord';
import { ColorCategory } from '../types';

interface ColorSelectorProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Record<string, T>;
  category: ColorCategory;
}

const ColorSelector = <T extends string>({ value, onChange, options, category }: ColorSelectorProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useCustomization();
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
  
  const handleSelect = (status: T) => {
    onChange(status);
    setIsOpen(false);
  };
  
  const categoryColors = colors[category];
  const selectedColor = categoryColors?.[value as keyof typeof categoryColors] ?? '#cccccc';
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
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-card dark:bg-dark-card border rounded-md shadow-lg max-h-60 overflow-auto">
          {Object.values(options).map(status => {
            const statusColor = categoryColors?.[status as keyof typeof categoryColors] ?? '#cccccc';
            const statusTextColor = colord(statusColor).isDark() ? 'text-white' : 'text-black';
            return (
              <li
                key={status}
                onClick={() => handleSelect(status)}
                className={`px-3 py-2 text-xs cursor-pointer font-medium hover:brightness-110 ${statusTextColor}`}
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

export default ColorSelector;
