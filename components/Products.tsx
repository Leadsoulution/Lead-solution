import React, { useMemo, useState } from 'react';
import { Order, Statut, Livraison, Product } from '../types';
import { Trash2, PlusCircle, Archive } from 'lucide-react';
import AddProductModal from './AddProductModal';
import { useCustomization } from '../contexts/CustomizationContext';

interface ProductsProps {
  orders: Order[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ orders, products, setProducts }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const { formatCurrency } = useCustomization();

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const productsWithStock = useMemo(() => {
    return products.map(product => {
      const ordersForProduct = orders.filter(order => order.product === product.name);

      const deliveredCount = ordersForProduct.filter(o => o.livraison === Livraison.Livre).length;
      const stockReel = product.initialStock - deliveredCount;
      
      const reservedCount = ordersForProduct.filter(
        o => o.statut === Statut.Confirme && o.livraison !== Livraison.Livre
      ).length;
      const stockDisponible = stockReel - reservedCount;

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

  const handleExportProducts = () => {
    if (productsWithStock.length === 0) {
      setNotification({ type: 'error', message: "Aucun produit à exporter." });
      return;
    }

    const headers = [
      'Code Article', 'Nom du Produit', 'URL de l\'image', 'Stock Initial', 'Prix d\'Achat', 'Prix de Vente', 'Stock Réel', 'Stock Disponible'
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
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Code Article</th>
                <th className="px-4 py-3">Nom du Produit</th>
                <th className="px-4 py-3 text-right">Stock Réel</th>
                <th className="px-4 py-3 text-right">Stock Disponible</th>
                <th className="px-4 py-3 text-right">Prix de Vente</th>
                <th className="px-4 py-3 text-right">Prix d'Achat</th>
                <th className="px-4 py-3 text-center">Afficher dans Ordres</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {productsWithStock.map(product => (
                <tr key={product.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                  <td className="px-4 py-2">
                    <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">{product.id}</td>
                  <td className="px-4 py-2 font-medium">{product.name}</td>
                  <td className="px-4 py-2 text-right font-semibold">{product.stockReel}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${product.stockDisponible > 10 ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>{product.stockDisponible}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(product.sellingPrice)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{formatCurrency(product.purchasePrice)}</td>
                  <td className="px-4 py-2 text-center">
                    <div
                      onClick={() => handleToggleShowInOrders(product.id)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${
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
                   <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
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