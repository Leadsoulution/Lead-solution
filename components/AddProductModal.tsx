import React, { useState } from 'react';
import { Product } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  products: Product[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct, products }) => {
  const initialFormState: Omit<Product, 'showInOrders'> = {
    id: '',
    name: '',
    imageUrl: '',
    initialStock: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    discount: 0,
    isPack: false,
    packProducts: [],
  };
  const [formData, setFormData] = useState<Omit<Product, 'showInOrders'>>(initialFormState);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Reset pack products if unchecking
        ...(name === 'isPack' && !checked ? { packProducts: [] } : {})
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['initialStock', 'purchasePrice', 'sellingPrice', 'discount'].includes(name) ? parseFloat(value) || 0 : value,
      }));
    }
  };
  
  const handleAddPackProduct = () => {
    setFormData(prev => ({
      ...prev,
      packProducts: [...(prev.packProducts || []), { productId: '', quantity: 1 }]
    }));
  };

  const handleRemovePackProduct = (index: number) => {
    setFormData(prev => {
      const newPackProducts = [...(prev.packProducts || [])];
      newPackProducts.splice(index, 1);
      return { ...prev, packProducts: newPackProducts };
    });
  };

  const handlePackProductChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setFormData(prev => {
      const newPackProducts = [...(prev.packProducts || [])];
      newPackProducts[index] = { ...newPackProducts[index], [field]: value };
      return { ...prev, packProducts: newPackProducts };
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("L'image est trop grande. La taille maximale est de 2 Mo.");
          return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name || formData.sellingPrice <= 0) {
      setError("Veuillez remplir tous les champs obligatoires (Code article, Nom, Prix de vente).");
      return;
    }
    setError('');
    onAddProduct(formData);
    setFormData(initialFormState);
  };
  
  const handleClose = () => {
    setFormData(initialFormState);
    setError('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Ajouter un nouveau produit</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-accent dark:hover:bg-dark-accent">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Code Article (ID) *</label>
            <input type="text" name="id" value={formData.id} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Nom du produit *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 input-style" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Image du produit</label>
            <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                className="w-full mt-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary dark:file:bg-dark-secondary file:text-secondary-foreground dark:file:text-dark-secondary-foreground hover:file:bg-accent dark:hover:file:bg-dark-accent"
            />
            {formData.imageUrl && (
                <div className="mt-2">
                    <img src={formData.imageUrl} alt="Aperçu" className="h-20 w-20 object-cover rounded-md border" />
                </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Stock initial</label>
            <input type="number" name="initialStock" value={formData.initialStock} onChange={handleChange} className="w-full mt-1 input-style" min="0" />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium">Prix de Vente *</label>
                <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="w-full mt-1 input-style" required min="0.01" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium">Prix d'Achat</label>
                <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="w-full mt-1 input-style" min="0" step="0.01" />
              </div>
            </div>
             <div>
                <label className="block text-sm font-medium">Remise (%)</label>
                <input type="number" name="discount" value={formData.discount || 0} onChange={handleChange} className="w-full mt-1 input-style" min="0" step="0.01" />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isPack"
                name="isPack"
                checked={formData.isPack || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPack" className="text-sm font-medium">
                Ce produit est un pack (grouper plusieurs produits)
              </label>
            </div>

            {formData.isPack && (
              <div className="space-y-3 border p-4 rounded-md mt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Produits du pack</h3>
                  <button
                    type="button"
                    onClick={handleAddPackProduct}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={14} /> Ajouter un produit
                  </button>
                </div>
                
                {(!formData.packProducts || formData.packProducts.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">Aucun produit dans ce pack. Ajoutez-en un.</p>
                )}

                {formData.packProducts?.map((packProduct, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-1">Produit</label>
                      <select
                        value={packProduct.productId}
                        onChange={(e) => handlePackProductChange(index, 'productId', e.target.value)}
                        className="w-full input-style text-sm"
                        required
                      >
                        <option value="" disabled>Sélectionner...</option>
                        {products.filter(p => !p.isPack).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-muted-foreground mb-1">Quantité</label>
                      <input
                        type="number"
                        value={packProduct.quantity}
                        onChange={(e) => handlePackProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full input-style text-sm"
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePackProduct(index)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md mb-[2px]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          {error && <p className="text-sm text-red-500">{error}</p>}
           <style>{`.input-style { padding: 0.5rem; border-radius: 0.375rem; background-color: transparent; border: 1px solid hsl(215, 20.2%, 65.1%); } .input-style:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }`}</style>
        </form>
        <div className="flex justify-end items-center gap-4 p-4 border-t dark:border-gray-700">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent dark:hover:bg-dark-accent">
            Annuler
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            Ajouter le produit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;