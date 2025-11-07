import React, { useMemo, useState, useEffect } from 'react';
import { Order, Product, Livraison } from '../types';
import { useCustomization } from '../contexts/CustomizationContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { DollarSign, Landmark, TrendingDown, TrendingUp, Save } from 'lucide-react';
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

// FIX: Define an interface for the costs state to ensure type safety.
interface FinancialCosts {
  fixed: {
    packaging: number;
    wifi: number;
    rent: number;
    transport: number;
  };
  variable: {
    facebookAdsPercent: number;
    tiktokAdsPercent: number;
    confirmation: number;
    delivery: number;
  };
}

const Financials: React.FC<FinancialsProps> = ({ orders, products }) => {
  const { formatCurrency } = useCustomization();
  const [notification, setNotification] = useState<string | null>(null);

  const [calculatorData, setCalculatorData] = useState({
    leads: 1000,
    adSpend: 20000,
    confRate: 60,
    delivRate: 50,
    sellingPrice: 250,
    productCost: 100,
    shippingFee: 40,
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // FIX: Apply the FinancialCosts interface to the useState hook to fix typing issues.
  const [costs, setCosts] = useState<FinancialCosts>(() => {
    try {
        const savedCosts = localStorage.getItem('financialCosts');
        return savedCosts ? JSON.parse(savedCosts) : {
        fixed: {
            packaging: 5,
            wifi: 1,
            rent: 3,
            transport: 4,
        },
        variable: {
            facebookAdsPercent: 15,
            tiktokAdsPercent: 10,
            confirmation: 15,
            delivery: 35,
        },
        };
    } catch (e) {
        return {
            fixed: { packaging: 5, wifi: 1, rent: 3, transport: 4 },
            variable: { facebookAdsPercent: 15, tiktokAdsPercent: 10, confirmation: 15, delivery: 35 },
        }
    }
  });

  const handleCostChange = (type: 'fixed' | 'variable', name: string, value: string) => {
    setCosts(prev => ({
        ...prev,
        [type]: {
            ...prev[type],
            [name]: parseFloat(value) || 0
        }
    }));
  };

  const handleCalculatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCalculatorData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
    }));
  };
  
 const handleCalculatedFieldChange = (name: string, value: string) => {
    const numericValue = parseFloat(value) || 0;

    setCalculatorData(prev => {
        const newData = { ...prev };
        let ordersConfirmed: number;
        let ordersDelivered: number;

        switch (name) {
            case 'cpl':
                newData.adSpend = numericValue * prev.leads;
                break;
            case 'ordersConfirmed':
                if (prev.leads > 0) {
                    newData.confRate = (numericValue / prev.leads) * 100;
                }
                break;
            case 'ordersDelivered':
                ordersConfirmed = prev.leads * (prev.confRate / 100);
                if (ordersConfirmed > 0) {
                    newData.delivRate = (numericValue / ordersConfirmed) * 100;
                }
                break;
            case 'cpd':
                ordersConfirmed = prev.leads * (prev.confRate / 100);
                ordersDelivered = ordersConfirmed * (prev.delivRate / 100);
                newData.adSpend = numericValue * ordersDelivered;
                break;
            case 'profitPerUnit':
                ordersConfirmed = prev.leads * (prev.confRate / 100);
                ordersDelivered = ordersConfirmed * (prev.delivRate / 100);
                if (ordersDelivered > 0) {
                    const cpd = prev.adSpend / ordersDelivered;
                    newData.sellingPrice = numericValue + prev.productCost + prev.shippingFee + cpd;
                }
                break;
            case 'totalProfit':
                ordersConfirmed = prev.leads * (prev.confRate / 100);
                ordersDelivered = ordersConfirmed * (prev.delivRate / 100);
                if (ordersDelivered > 0) {
                    const newProfitPerUnit = numericValue / ordersDelivered;
                    const cpd = prev.adSpend / ordersDelivered;
                    newData.sellingPrice = newProfitPerUnit + prev.productCost + prev.shippingFee + cpd;
                }
                break;
            case 'roi':
                ordersConfirmed = prev.leads * (prev.confRate / 100);
                ordersDelivered = ordersConfirmed * (prev.delivRate / 100);
                if (ordersDelivered > 0) {
                    const totalCogs = prev.productCost * ordersDelivered;
                    const investment = prev.adSpend + totalCogs;
                    const newTotalProfit = (numericValue / 100) * investment;
                    const newProfitPerUnit = newTotalProfit / ordersDelivered;
                    const cpd = prev.adSpend / ordersDelivered;
                    newData.sellingPrice = newProfitPerUnit + prev.productCost + prev.shippingFee + cpd;
                }
                break;
        }
        return newData;
    });
};

  const calculatorResults = useMemo(() => {
    const { leads, adSpend, confRate, delivRate, sellingPrice, productCost, shippingFee } = calculatorData;
    
    const cpl = leads > 0 ? adSpend / leads : 0;
    const ordersConfirmed = leads * (confRate / 100);
    const ordersDelivered = ordersConfirmed * (delivRate / 100);
    const cpd = ordersDelivered > 0 ? adSpend / ordersDelivered : 0;

    const totalRevenue = ordersDelivered * sellingPrice;
    const totalCogs = ordersDelivered * productCost;
    const totalShipping = ordersDelivered * shippingFee;
    const totalProfit = totalRevenue - totalCogs - totalShipping - adSpend;
    
    const profitPerUnit = ordersDelivered > 0 ? totalProfit / ordersDelivered : 0;
    
    const investment = adSpend + totalCogs;
    const roi = investment > 0 ? (totalProfit / investment) * 100 : 0;

    return {
        cpl,
        ordersConfirmed,
        ordersDelivered,
        cpd,
        profitPerUnit,
        totalProfit,
        roi,
    };
  }, [calculatorData]);

  const saveCosts = () => {
      localStorage.setItem('financialCosts', JSON.stringify(costs));
      setNotification('Frais sauvegardés avec succès !');
  };

  const financialAnalysis = useMemo(() => {
    const totalFixedCost = Object.values(costs.fixed).reduce((sum, cost) => sum + cost, 0);

    return products.map(product => {
      const { sellingPrice, purchasePrice } = product;

      const facebookAdsCost = sellingPrice * (costs.variable.facebookAdsPercent / 100);
      const tiktokAdsCost = sellingPrice * (costs.variable.tiktokAdsPercent / 100);
      const totalVariableCostForUnit = facebookAdsCost + tiktokAdsCost + costs.variable.confirmation + costs.variable.delivery;

      const totalCostPerUnit = purchasePrice + totalFixedCost + totalVariableCostForUnit;
      const netProfitPerUnit = sellingPrice - totalCostPerUnit;
      const marginPercent = sellingPrice > 0 ? (netProfitPerUnit / sellingPrice) * 100 : 0;
      
      const quantitySold = orders.filter(o => o.product === product.name && o.livraison === Livraison.Livre).length;

      return {
        ...product,
        quantity_sold: quantitySold,
        costs: {
          fixed_cost: totalFixedCost,
          variable_cost: totalVariableCostForUnit,
          total_cost: totalCostPerUnit,
          net_profit: netProfitPerUnit,
          margin_percent: marginPercent,
        },
        total_revenue: quantitySold * sellingPrice,
        total_profit: quantitySold * netProfitPerUnit,
        total_expenses: quantitySold * totalCostPerUnit,
      };
    }).filter(p => p !== null);
  }, [orders, products, costs]);

  const overviewStats = useMemo(() => {
    const totalRevenue = financialAnalysis.reduce((sum, p) => sum + (p?.total_revenue || 0), 0);
    const totalExpenses = financialAnalysis.reduce((sum, p) => sum + (p?.total_expenses || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, totalProfit };
  }, [financialAnalysis]);

  const monthlyProfitData = useMemo(() => {
    const profitMap = new Map<string, number>();
    financialAnalysis.forEach(p => p && profitMap.set(p.name, p.costs.net_profit));
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map(month => ({ name: month, profit: 0 }));

    orders.forEach(order => {
        if (order.livraison === Livraison.Livre) {
            const monthIndex = new Date(order.date).getMonth();
            const profit = profitMap.get(order.product);
            if (profit && data[monthIndex]) {
                data[monthIndex].profit += profit;
            }
        }
    });
    return data;
  }, [orders, financialAnalysis]);

  const totalFixedCosts = Object.values(costs.fixed).reduce((s, c) => s + c, 0);
  const inputClass = "w-28 text-right py-1 rounded-md border bg-secondary dark:bg-dark-secondary focus:ring-1 focus:ring-blue-500 ml-auto block";

  const CalcInputCell: React.FC<{ name: keyof typeof calculatorData; value: number; }> = ({ name, value }) => (
    <td className="p-0 border border-gray-500 dark:border-gray-600">
        <input
            type="number"
            name={name}
            value={value}
            onChange={handleCalculatorChange}
            className="w-full h-full p-2 bg-transparent text-center font-bold outline-none"
            step="any"
        />
    </td>
);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Landmark size={32}/>
        <h1 className="text-3xl font-bold">Analyse Financière & Simulateur</h1>
      </div>
      
      <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-md dark:bg-dark-card dark:text-dark-card-foreground">
        <h2 className="p-2 bg-blue-500 text-white font-bold text-lg text-center rounded-t-md">
            GOOD MARKETER - GOOD SELLER
        </h2>
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
                <thead className="bg-gray-200 dark:bg-gray-700 font-semibold">
                    <tr>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Leads</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">AD Spend DH</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">CPL DH</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Conf. Rate %</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Orders Confi.</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Deliv. Rate %</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Orders Delive.</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">CPD DH</th>
                    </tr>
                </thead>
                <tbody className="bg-cyan-300 dark:bg-cyan-700 dark:text-white">
                    <tr>
                        <CalcInputCell name="leads" value={calculatorData.leads} />
                        <CalcInputCell name="adSpend" value={calculatorData.adSpend} />
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                           <input type="number" value={calculatorResults.cpl.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('cpl', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" step="any" />
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <div className="relative h-full">
                                <input type="number" name="confRate" value={calculatorData.confRate} onChange={handleCalculatorChange} className="w-full h-full p-2 pr-6 bg-transparent text-center font-bold outline-none"/>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                            </div>
                        </td>
                         <td className="p-0 border border-gray-500 dark:border-gray-600">
                           <input type="number" value={calculatorResults.ordersConfirmed.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('ordersConfirmed', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" step="any" />
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <div className="relative h-full">
                                <input type="number" name="delivRate" value={calculatorData.delivRate} onChange={handleCalculatorChange} className="w-full h-full p-2 pr-6 bg-transparent text-center font-bold outline-none"/>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                            </div>
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                           <input type="number" value={calculatorResults.ordersDelivered.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('ordersDelivered', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" step="any" />
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                           <input type="number" value={calculatorResults.cpd.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('cpd', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none text-red-600 dark:text-red-400" step="any" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div className="overflow-x-auto mt-[-1px]">
             <table className="w-full border-collapse text-center">
                <thead className="bg-gray-200 dark:bg-gray-700 font-semibold">
                    <tr>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Selling Price</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Product Cost</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Shipping Fee</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Profit Per Unit</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Totale Profit</th>
                        <th className="p-2 border border-gray-500 dark:border-gray-600">Roi</th>
                    </tr>
                </thead>
                <tbody className="bg-cyan-300 dark:bg-cyan-700 dark:text-white">
                    <tr>
                        <CalcInputCell name="sellingPrice" value={calculatorData.sellingPrice} />
                        <CalcInputCell name="productCost" value={calculatorData.productCost} />
                        <CalcInputCell name="shippingFee" value={calculatorData.shippingFee} />
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <input type="number" value={calculatorResults.profitPerUnit.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('profitPerUnit', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none text-green-900 dark:text-green-200" step="any"/>
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                             <input type="number" value={calculatorResults.totalProfit.toFixed(0)} onChange={(e) => handleCalculatedFieldChange('totalProfit', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" step="any"/>
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <div className="relative h-full">
                                <input type="number" value={calculatorResults.roi.toFixed(2)} onChange={(e) => handleCalculatedFieldChange('roi', e.target.value)} className="w-full h-full p-2 pr-6 bg-transparent text-center font-bold outline-none" step="any"/>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={formatCurrency(overviewStats.totalRevenue)} icon={<DollarSign />} color="bg-blue-600" />
        <StatCard title="Total Expenses" value={formatCurrency(overviewStats.totalExpenses)} icon={<TrendingDown />} color="bg-rose-500" />
        <StatCard title="Total Profit" value={formatCurrency(overviewStats.totalProfit)} icon={<TrendingUp />} color="bg-emerald-500" />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2 dark:border-gray-700">Méthode de Calcul des Frais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                <h3 className="text-lg font-semibold mb-4">Frais Fixes (par unité)</h3>
                <table className="w-full text-sm">
                    <thead className="text-left">
                        <tr>
                            <th className="py-2 font-medium text-muted-foreground">Frais</th>
                            <th className="py-2 font-medium text-muted-foreground text-right">Montant ({formatCurrency(0).replace(/[\d,.]/g, '')})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        <tr>
                            <td className="py-2">Packaging</td>
                            <td className="py-2"><input type="number" value={costs.fixed.packaging} onChange={(e) => handleCostChange('fixed', 'packaging', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                        <tr>
                            <td className="py-2">Wifi</td>
                            <td className="py-2"><input type="number" value={costs.fixed.wifi} onChange={(e) => handleCostChange('fixed', 'wifi', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                        <tr>
                            <td className="py-2">Loyer</td>
                            <td className="py-2"><input type="number" value={costs.fixed.rent} onChange={(e) => handleCostChange('fixed', 'rent', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                         <tr>
                            <td className="py-2">Transport</td>
                            <td className="py-2"><input type="number" value={costs.fixed.transport} onChange={(e) => handleCostChange('fixed', 'transport', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                    </tbody>
                    <tfoot className="font-bold border-t-2 dark:border-gray-600">
                        <tr>
                            <td className="pt-3">Total des Frais Fixes</td>
                            <td className="pt-3 text-right">{formatCurrency(totalFixedCosts)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             <div className="p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                <h3 className="text-lg font-semibold mb-4">Frais Variables</h3>
                 <table className="w-full text-sm">
                    <thead className="text-left">
                        <tr>
                            <th className="py-2 font-medium text-muted-foreground">Frais</th>
                            <th className="py-2 font-medium text-muted-foreground text-right">Valeur</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        <tr>
                           <td className="py-2">Facebook Ads</td>
                           <td className="py-2">
                               <div className="relative ml-auto w-28">
                                   <input type="number" value={costs.variable.facebookAdsPercent} onChange={(e) => handleCostChange('variable', 'facebookAdsPercent', e.target.value)} className="w-full text-right pr-6 py-1 rounded-md border bg-secondary dark:bg-dark-secondary focus:ring-1 focus:ring-blue-500" step="0.01"/>
                                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                               </div>
                           </td>
                        </tr>
                         <tr>
                           <td className="py-2">Tiktok Ads</td>
                           <td className="py-2">
                               <div className="relative ml-auto w-28">
                                   <input type="number" value={costs.variable.tiktokAdsPercent} onChange={(e) => handleCostChange('variable', 'tiktokAdsPercent', e.target.value)} className="w-full text-right pr-6 py-1 rounded-md border bg-secondary dark:bg-dark-secondary focus:ring-1 focus:ring-blue-500" step="0.01"/>
                                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                               </div>
                           </td>
                        </tr>
                        <tr>
                           <td className="py-2">Confirmation</td>
                           <td className="py-2"><input type="number" value={costs.variable.confirmation} onChange={(e) => handleCostChange('variable', 'confirmation', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                         <tr>
                           <td className="py-2">Livraison</td>
                           <td className="py-2"><input type="number" value={costs.variable.delivery} onChange={(e) => handleCostChange('variable', 'delivery', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                    </tbody>
                </table>
                 <p className="text-xs text-muted-foreground mt-4">Les frais de publicité sont calculés en pourcentage du prix de vente du produit.</p>
            </div>
        </div>
        <div className="flex justify-end items-center gap-4">
            {notification && <span className="text-sm text-green-600">{notification}</span>}
            <button onClick={saveCosts} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
                <Save size={16} /> Sauvegarder les Frais
            </button>
        </div>
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
                <th className="px-4 py-3 text-right">Prix d'Achat</th>
                <th className="px-4 py-3 text-right">Charges Variables</th>
                <th className="px-4 py-3 text-right">Charges Fixes</th>
                <th className="px-4 py-3 text-right">Coût Total/Unité</th>
                <th className="px-4 py-3 text-right">Bénéfice Net/Unité</th>
                <th className="px-4 py-3 text-right">Marge Bénéficiaire</th>
                <th className="px-4 py-3 text-right">Qté Vendue</th>
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
                  <td className="px-4 py-3 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right text-orange-500">{formatCurrency(p.costs.variable_cost)}</td>
                  <td className="px-4 py-3 text-right text-orange-500">{formatCurrency(p.costs.fixed_cost)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{formatCurrency(p.costs.total_cost)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatCurrency(p.costs.net_profit)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.costs.margin_percent > 20 ? 'text-green-500' : 'text-orange-500'}`}>
                    {p.costs.margin_percent.toFixed(1)}%
                  </td>
                   <td className="px-4 py-3 text-right">{p.quantity_sold}</td>
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