import React, { useMemo } from 'react';
import { Order, Product, Livraison } from '../types';
import { productCosts } from '../services/costs';
import { useCustomization } from '../contexts/CustomizationContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { DollarSign, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface FinancialsProps {
  orders: Order[];
  products: Product[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-2xl text-white ${color} shadow-lg`}>
    <div className="flex justify-between items-center">
      <p className="text-sm text-white/90">{title}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  const { formatCurrency } = useCustomization();
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-card dark:bg-dark-card rounded-lg shadow-lg border dark:border-gray-700">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-emerald-500">{`Profit: ${formatCurrency(Number(payload[0].value))}`}</p>
      </div>
    );
  }
  return null;
};

const Financials: React.FC<FinancialsProps> = ({ orders, products }) => {
  const { formatCurrency } = useCustomization();

  const financialAnalysis = useMemo(() => {
    return products.map(product => {
      const costs = productCosts[product.id];
      if (!costs) return null;

      const quantitySold = orders.filter(o => o.product === product.name && o.livraison === Livraison.Livre).length;
      
      const totalFixedCost = Object.values(costs.fixed).reduce((sum, cost) => sum + cost, 0);
      const totalVariableCost = Object.values(costs.variable).reduce((sum, cost) => sum + cost, 0);
      const totalCostPerUnit = totalFixedCost + totalVariableCost;
      const netProfitPerUnit = product.sellingPrice - totalCostPerUnit;
      const marginPercent = product.sellingPrice > 0 ? (netProfitPerUnit / product.sellingPrice) * 100 : 0;

      return {
        ...product,
        quantity_sold: quantitySold,
        costs: {
          ...costs,
          total_cost: totalCostPerUnit,
          net_profit: netProfitPerUnit,
          margin_percent: marginPercent,
        },
        total_revenue: quantitySold * product.sellingPrice,
        total_profit: quantitySold * netProfitPerUnit,
        total_expenses: quantitySold * totalCostPerUnit,
      };
    }).filter(p => p !== null);
  }, [orders, products]);

  const overviewStats = useMemo(() => {
    const totalRevenue = financialAnalysis.reduce((sum, p) => sum + (p?.total_revenue || 0), 0);
    const totalExpenses = financialAnalysis.reduce((sum, p) => sum + (p?.total_expenses || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, totalProfit };
  }, [financialAnalysis]);

  const monthlyProfitData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map(month => ({ name: month, profit: 0 }));

    financialAnalysis.forEach(productData => {
      if (!productData) return;
      const ordersForProduct = orders.filter(
        o => o.product === productData.name && o.livraison === Livraison.Livre
      );
      ordersForProduct.forEach(order => {
        const monthIndex = new Date(order.date).getMonth();
        data[monthIndex].profit += productData.costs.net_profit;
      });
    });
    return data;
  }, [financialAnalysis, orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Landmark size={32}/>
        <h1 className="text-3xl font-bold">Analyse Financière</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={formatCurrency(overviewStats.totalRevenue)} icon={<DollarSign />} color="bg-blue-600" />
        <StatCard title="Total Expenses" value={formatCurrency(overviewStats.totalExpenses)} icon={<TrendingDown />} color="bg-rose-500" />
        <StatCard title="Total Profit" value={formatCurrency(overviewStats.totalProfit)} icon={<TrendingUp />} color="bg-emerald-500" />
      </div>

      <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm dark:bg-dark-card dark:text-dark-card-foreground">
        <h3 className="text-lg font-semibold mb-4">Bénéfice Net Mensuel</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyProfitData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
        <h2 className="text-xl font-semibold mb-4">Ventilation des Coûts par Produit</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary dark:bg-dark-secondary">
              <tr>
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3 text-right">Prix Vente</th>
                <th className="px-4 py-3 text-right">Qté Vendue</th>
                <th className="px-4 py-3 text-right">Coût Total/Unité</th>
                <th className="px-4 py-3 text-right">Bénéfice Net/Unité</th>
                <th className="px-4 py-3 text-right">Marge Bénéficiaire</th>
                <th className="px-4 py-3 text-right">Bénéfice Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {financialAnalysis.map(p => p && (
                <tr key={p.id} className="hover:bg-muted dark:hover:bg-dark-muted">
                  <td className="px-4 py-3 font-medium flex items-center gap-3">
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 object-cover rounded-md" />
                    <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right">{p.quantity_sold}</td>
                  <td className="px-4 py-3 text-right text-red-500">{formatCurrency(p.costs.total_cost)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatCurrency(p.costs.net_profit)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.costs.margin_percent > 20 ? 'text-green-500' : 'text-orange-500'}`}>
                    {p.costs.margin_percent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(p.total_profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Financials;
