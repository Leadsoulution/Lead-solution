
import React from 'react';
import { X } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  phone: string;
  message: string;
}

const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({ isOpen, onClose, onConfirm, phone, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 relative">
          <h2 className="text-lg font-semibold text-center w-full">Discuter sur WhatsApp avec le {phone}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent absolute top-3 right-3">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-2">
            <div 
              className="w-full p-3 bg-secondary dark:bg-dark-secondary/70 rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap text-sm" 
              style={{ wordBreak: 'break-word' }}
            >
                {message}
            </div>
        </div>
        <div className="flex justify-center p-4 pt-2">
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="w-full px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Ouvrir l'application
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPreviewModal;
