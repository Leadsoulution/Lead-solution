
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Store Body - Dark Grey */}
      <rect x="15" y="35" width="70" height="55" rx="8" fill="#374151" />
      
      {/* Awning - Alternating Blue and Dark stripes */}
      {/* Base Dark Shape */}
      <path d="M10 35 L18 15 H82 L90 35 Z" fill="#1F2937" />
      
      {/* Blue Stripes */}
      <path d="M22 15 L18 35 H32 L36 15 H22 Z" fill="#2563EB" />
      <path d="M46 15 L42 35 H56 L60 15 H46 Z" fill="#2563EB" />
      <path d="M70 15 L66 35 H80 L84 15 H70 Z" fill="#2563EB" />

      {/* Arrow - White */}
      <path 
        d="M35 75 L65 45 M65 45 H45 M65 45 V65" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default Logo;
