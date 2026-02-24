import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Order, Statut, Livraison, Product, CommandeRetour } from '../types';
import { Trash2, PlusCircle, Archive, Edit, Save, X, Plus } from 'lucide-react';
import AddProductModal from './AddProductModal';
import { useCustomization } from '../contexts/CustomizationContext';

interface ProductsProps {
  orders: Order[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  isCustom: boolean;
  field?: keyof Product | 'stockReel' | 'stockDisponible' | 'priceRemise';
}

const Products: React.FC<ProductsProps> = ({ orders, products, setProducts }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { formatCurrency } = useCustomization();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedProductData, setEditedProductData] = useState<Partial<Product>>({});

  // Column Management
  const [columns, setColumns] = useState<Column[]>([
    { id: 'imageUrl', label: 'Photo', width: 80, minWidth: 60, isCustom: false, field: 'imageUrl' },
    { id: 'id', label: 'Code Article', width: 120, minWidth: 100, isCustom: false, field: 'id' },
    { id: 'name', label: 'Nom du Produit', width: 200, minWidth: 150, isCustom: false, field: 'name' },
    { id: 'initialStock', label: 'Stock Initial', width: 100, minWidth: 80, isCustom: false, field: 'initialStock' },
    { id: 'stockReel', label: 'Stock Réel', width: 100, minWidth: 80, isCustom: false, field: 'stockReel' },
    { id: 'stockDisponible', label: 'Stock Virtuel', width: 100, minWidth: 80, isCustom: false, field: 'stockDisponible' },
    { id: 'purchasePrice', label: "Prix d'Achat", width: 100, minWidth: 80, isCustom: false, field: 'purchasePrice' },
    { id: 'sellingPrice', label: "Prix de Vente", width: 100, minWidth: 80, isCustom: false, field: 'sellingPrice' },
    { id: 'discount', label: 'Remise (%)', width: 100, minWidth: 80, isCustom: false, field: 'discount' },
    { id: 'priceRemise', label: 'Prix Remisé', width: 100, minWidth: 80, isCustom: false, field: 'priceRemise' },
    { id: 'showInOrders', label: 'Afficher', width: 80, minWidth: 60, isCustom: false, field: 'showInOrders' },
    { id: 'actions', label: 'Actions', width: 100, minWidth: 80, isCustom: false },
  ]);

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const newColId = `custom_${Date.now()}`;
    setColumns(prev => [
      ...prev.slice(0, prev.length - 1), // Insert before 'Actions'
      { id: newColId, label: newColumnName, width: 150, minWidth: 100, isCustom: true },
      prev[prev.length - 1]
    ]);
    setNewColumnName('');
    setIsAddColumnModalOpen(false);
  };

  // Column Resizing Logic
  const activeResizeRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    activeResizeRef.current = {
      index,
      startX: e.clientX,
      startWidth: columns[index].width,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!activeResizeRef.current) return;
    const { index, startX, startWidth } = activeResizeRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(columns[index].minWidth, startWidth + diff);

    setColumns(prev => {
      const next = [...prev];
      next[index] = { ...next[index], width: newWidth };
      return next;
    });
  }, [columns]);

  const handleResizeEnd = useCallback(() => {
    activeResizeRef.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  const handleUpdateCustomField = (productId: string, fieldId: string, value: string) => {
    setProducts(prevProducts => 
        prevProducts.map(product => {
            if (product.id === productId) {
                return {
                    ...product,
                    customFields: {
                        ...(product.customFields || {}),
                        [fieldId]: value
                    }
                };
            }
            return product;
        })
    );
  };

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const productsWithStock = useMemo(() => {
    return products.map(product => {
      const ordersForProduct = orders.filter(order => order.product === product.name);

      const deliveredCount = ordersForProduct.filter(
        o => o.livraison === Livraison.Livre
      ).length;
      const stockReel = product.initialStock - deliveredCount;

      const unavailableCount = ordersForProduct.filter(
        o => o.statut === Statut.Confirme && 
             o.livraison !== Livraison.Annule && 
             o.commandeRetour !== CommandeRetour.Retourner
      ).length;
      const stockDisponible = product.initialStock - unavailableCount;

      return {
        ...product,
        stockReel,
        stockDisponible,
      };
    });
  }, [orders, products]);

  const handleAddProduct = (newProduct: Product) => {
    if (products.some(p => p.id.toLowerCase() === newProduct.id.toLowerCase())) {
        alert("Un produit avec ce code d'article existe déjà.");
        return;
    }
    setProducts(prev => [{ ...newProduct, showInOrders: true }, ...prev]);
    setIsAddModalOpen(false);
    setNotification({ type: 'success', message: 'Produit ajouté avec succès !' });
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setNotification({ type: 'success', message: 'Produit supprimé avec succès.' });
    }
  };

  const handleToggleShowInOrders = (productId: string) => {
    setProducts(prevProducts => 
        prevProducts.map(p => 
            p.id === productId ? { ...p, showInOrders: !(p.showInOrders ?? true) } : p
        )
    );
  };
  
  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setEditedProductData(product);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedProductData({});
  };

  const handleSaveEdit = () => {
    if (!editingProductId) return;
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === editingProductId ? { ...p, ...editedProductData } : p
      )
    );
    setEditingProductId(null);
    setEditedProductData({});
    setNotification({ type: 'success', message: 'Produit mis à jour avec succès.' });
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProductData(prev => ({
      ...prev,
      [name]: ['initialStock', 'purchasePrice', 'sellingPrice', 'discount'].includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleExportProducts = () => {
    if (productsWithStock.length === 0) {
      setNotification({ type: 'error', message: "Aucun produit à exporter." });
      return;
    }

    const headers = [
      'Code Article', 'Nom du Produit', 'URL de l\'image', 'Stock Initial', 'Prix d\'Achat', 'Prix de Vente',
      'Remise (%)',
      'Stock Réel', 'Stock Virtuel'
    ];

    const escapeCSV = (val: any): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = productsWithStock.map(p => [
      escapeCSV(p.id),
      escapeCSV(p.name),
      escapeCSV(p.imageUrl),
      escapeCSV(p.initialStock),
      escapeCSV(p.purchasePrice),
      escapeCSV(p.sellingPrice),
      escapeCSV(p.discount),
      escapeCSV(p.stockReel),
      escapeCSV(p.stockDisponible),
    ].join(','));

    const BOM = "\uFEFF";
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `produits_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: `${productsWithStock.length} produits exportés avec succès.` });
  };

  const renderCell = (product: Product & { stockReel: number; stockDisponible: number }, col: Column) => {
    const isEditing = editingProductId === product.id;
    const inputClass = "w-full p-1 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-sm";
    const inputNumberClass = `${inputClass} text-right`;

    if (col.isCustom) {
        return (
            <input
                type="text"
                value={product.customFields?.[col.id] || ''}
                onChange={(e) => handleUpdateCustomField(product.id, col.id, e.target.value)}
                className={inputClass}
            />
        );
    }

    switch (col.field) {
        case 'imageUrl':
            return (
                <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
            );
        case 'id': return <span className="font-mono text-xs">{product.id}</span>;
        case 'name':
            return isEditing ? <input type="text" name="name" value={editedProductData.name || ''} onChange={handleEditInputChange} className={inputClass} /> : <span className="font-medium">{product.name}</span>;
        case 'initialStock':
            return isEditing ? <input type="number" name="initialStock" value={editedProductData.initialStock || 0} onChange={handleEditInputChange} className={inputNumberClass} /> : product.initialStock;
        case 'stockReel': return product.stockReel;
        case 'stockDisponible':
             return <span className={`font-semibold ${product.stockDisponible > 10 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>{product.stockDisponible}</span>;
        case 'purchasePrice':
            return isEditing ? <input type="number" name="purchasePrice" value={editedProductData.purchasePrice || 0} onChange={handleEditInputChange} className={inputNumberClass} /> : formatCurrency(product.purchasePrice);
        case 'sellingPrice':
            return isEditing ? <input type="number" name="sellingPrice" value={editedProductData.sellingPrice || 0} onChange={handleEditInputChange} className={inputNumberClass} /> : formatCurrency(product.sellingPrice);
        case 'discount':
            return isEditing ? <input type="number" name="discount" value={editedProductData.discount || 0} onChange={handleEditInputChange} className={inputNumberClass} /> : `${product.discount || 0}%`;
        case 'priceRemise':
             const discountedPrice = product.sellingPrice * (1 - (product.discount || 0) / 100);
             return <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(discountedPrice)}</span>;
        case 'showInOrders':
             return (
                <button
                    onClick={() => handleToggleShowInOrders(product.id)}
                    className={`p-1 rounded-full ${product.showInOrders !== false ? 'text-green-500 bg-green-100 dark:bg-green-900/30' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}
                >
                    {product.showInOrders !== false ? <Archive size={16} /> : <X size={16} />}
                </button>
             );
        case 'actions':
             return (
                <div className="flex items-center justify-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Save size={16} />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleEditClick(product)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
             );
        default: return null;
    }
  };

  const inputClass = "w-full p-1 border rounded-md bg-transparent focus:ring-1 focus:ring-blue-500 text-sm";
  const inputNumberClass = `${inputClass} text-right`;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produits</h1>
        <div className="flex items-center gap-2">
            <button
                onClick={handleExportProducts}
                className="flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-md shadow-sm text-secondary-foreground bg-secondary hover:bg-accent"
            >
                <Archive size={16} />
                Exporter les produits
            </button>
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
                <PlusCircle size={16} />
                Ajouter un produit
            </button>
        </div>
      </div>
       {notification && (
        <div className={`p-4 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
            {notification.message}
        </div>
      )}
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary dark:bg-dark-secondary">
              <tr>
                <th className="px-2 py-3">Photo</th>
                <th className="px-2 py-3">Code Article</th>
                <th className="px-2 py-3">Nom du Produit</th>
                <th className="px-2 py-3 text-right">Stock Initial</th>
                <th className="px-2 py-3 text-right">Stock Réel</th>
                <th className="px-2 py-3 text-right">Stock Virtuel</th>
                <th className="px-2 py-3 text-right">Prix d'Achat</th>
                <th className="px-2 py-3 text-right">Prix de Vente</th>
                <th className="px-2 py-3 text-right">Remise (%)</th>
                <th className="px-2 py-3 text-right">Prix Remisé</th>
                <th className="px-2 py-3 text-center">Afficher</th>
                <th className="px-2 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {productsWithStock.map(product => {
                const isEditing = editingProductId === product.id;
                const discountedPrice = product.sellingPrice * (1 - (product.discount || 0) / 100);

                return (
                  <tr key={product.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                    <td className="px-2 py-2 w-20">
                      {isEditing ?
                        <input type="text" name="imageUrl" value={editedProductData.imageUrl || ''} onChange={handleEditInputChange} className={inputClass} placeholder="URL de l'image" />
                        : <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                      }
                    </td>
                    <td className="px-2 py-2 font-mono text-muted-foreground min-w-[100px]">{product.id}</td>
                    <td className="px-2 py-2 font-medium min-w-[200px]">
                      {isEditing ? <input type="text" name="name" value={editedProductData.name || ''} onChange={handleEditInputChange} className={inputClass} /> : product.name}
                    </td>
                    <td className="px-2 py-2 text-right min-w-[100px]">
                      {isEditing ? <input type="number" name="initialStock" value={editedProductData.initialStock || 0} onChange={handleEditInputChange} className={inputNumberClass} /> : product.initialStock}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold">{product.stockReel}</td>
                    <td className={`px-2 py-2 text-right font-semibold ${product.stockDisponible > 10 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>{product.stockDisponible}</td>
                    <td className="px-2 py-2 text-right min-w-[120px]">
                      {isEditing ? <input type="number" name="purchasePrice" value={editedProductData.purchasePrice || 0} onChange={handleEditInputChange} className={inputNumberClass} step="0.01" /> : formatCurrency(product.purchasePrice)}
                    </td>
                    <td className="px-2 py-2 text-right min-w-[120px]">
                      {isEditing ? <input type="number" name="sellingPrice" value={editedProductData.sellingPrice || 0} onChange={handleEditInputChange} className={inputNumberClass} step="0.01" /> : formatCurrency(product.sellingPrice)}
                    </td>
                     <td className="px-2 py-2 text-right min-w-[100px]">
                      {isEditing ? (
                        <div className="relative">
                           <input type="number" name="discount" value={editedProductData.discount || 0} onChange={handleEditInputChange} className={inputNumberClass} step="0.01" />
                           <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 pointer-events-none">%</span>
                        </div>
                      ) : `${product.discount || 0}%`}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-blue-600 dark:text-blue-400">{formatCurrency(discountedPrice)}</td>
                    <td className="px-2 py-2 text-center">
                      <div
                        onClick={() => !isEditing && handleToggleShowInOrders(product.id)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                            product.showInOrders ?? true ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            product.showInOrders ?? true ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md" title="Sauvegarder"><Save size={16} /></button>
                            <button onClick={handleCancelEdit} className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Annuler"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(product)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md" title="Modifier"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md" title="Supprimer"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
            })}
            </tbody>
          </table>
        </div>
      </div>
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
};

export default Products;