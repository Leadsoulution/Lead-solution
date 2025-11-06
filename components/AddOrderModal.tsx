
import React, { useState } from 'react';
import { Order, Product } from '../types';
import { X } from 'lucide-react';

type NewOrderData = Omit<Order, 'id' | 'date' | 'platform' | 'statut' | 'ramassage' | 'livraison' | 'remboursement' | 'commandeRetour' | 'assignedUserId' | 'callCount'>;

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: NewOrderData) => void;
  products: Product[];
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, onClose, onAddOrder, products }) => {
  const initialFormState: NewOrderData = {
    customerName: '',
    customerPhone: '',
    address: '',
    price: 0,
    product: '',
    noteClient: '',
  };
  const [formData, setFormData] = useState<NewOrderData>(initialFormState);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.product || formData.price <= 0) {
      setError('Veuillez remplir tous les champs obligatoires (Client, Produit, Prix).');
      return;
    }
    setError('');
    onAddOrder(formData);
    setFormData(initialFormState);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Ajouter une nouvelle commande</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Nom du client *</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Téléphone</label>
            <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="w-full mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium">Adresse</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium">Produit *</label>
            <select
              name="product"
              value={formData.product}
              onChange={handleChange}
              className="w-full mt-1 input-style"
              required
            >
              <option value="" disabled>-- Sélectionner un produit --</option>
              {products.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Prix *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full mt-1 input-style" required min="0.01" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium">Note du client</label>
            <textarea name="noteClient" value={formData.noteClient} onChange={handleChange} rows={2} className="w-full mt-1 input-style" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
           <style>{`.input-style { padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }`}</style>
        </form>
        <div className="flex justify-end items-center gap-4 p-4 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent dark:hover:bg-dark-accent">
            Annuler
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Ajouter la commande
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;