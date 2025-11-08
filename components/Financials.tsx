







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

// Define an interface for the costs state to ensure type safety.
interface FinancialCosts {
  monthlyFixed: {
    rent: number;
    wifi: number;
  };
  perUnit: {
    packaging: number;
    transport: number;
  };
  variable: {
    facebookAdsPercent: number;
    tiktokAdsPercent: number;
    confirmation: number;
    delivery: number;
  };
}

// Add interface for calculator data to ensure type safety.
interface CalculatorData {
  leads: number;
  adSpend: number;
  confRate: number;
  delivRate: number;
  sellingPrice: number;
  productCost: number;
  shippingFee: number;
}

const Financials: React.FC<FinancialsProps> = ({ orders, products }) => {
  const { formatCurrency } = useCustomization();
  const [notification, setNotification] = useState<string | null>(null);

  // Apply the CalculatorData interface to the useState hook.
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
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
  
  // Apply the FinancialCosts interface to the useState hook to fix typing issues.
  // Replace the unsafe useState initializer with a type-safe version that correctly parses and coerces values from localStorage.
  const [costs, setCosts] = useState<FinancialCosts>(() => {
    try {
        const savedCosts = localStorage.getItem('financialCosts');
        const parsed = savedCosts ? JSON.parse(savedCosts) : {};

        const defaults: FinancialCosts = {
            monthlyFixed: { rent: 3, wifi: 1 },
            perUnit: { packaging: 5, transport: 4 },
            variable: { facebookAdsPercent: 15, tiktokAdsPercent: 10, confirmation: 15, delivery: 35 },
        };

        // Migration for old data structure
        if (parsed.fixed) {
            parsed.monthlyFixed = { rent: parsed.fixed.rent, wifi: parsed.fixed.wifi };
            parsed.perUnit = { packaging: parsed.fixed.packaging, transport: parsed.fixed.transport };
            delete parsed.fixed;
        }

        // Deep merge with type safety by coercing to Number
        const result: FinancialCosts = {
            monthlyFixed: {
                rent: Number(parsed.monthlyFixed?.rent ?? defaults.monthlyFixed.rent),
                wifi: Number(parsed.monthlyFixed?.wifi ?? defaults.monthlyFixed.wifi),
            },
            perUnit: {
                packaging: Number(parsed.perUnit?.packaging ?? defaults.perUnit.packaging),
                transport: Number(parsed.perUnit?.transport ?? defaults.perUnit.transport),
            },
            variable: {
                facebookAdsPercent: Number(parsed.variable?.facebookAdsPercent ?? defaults.variable.facebookAdsPercent),
                tiktokAdsPercent: Number(parsed.variable?.tiktokAdsPercent ?? defaults.variable.tiktokAdsPercent),
                confirmation: Number(parsed.variable?.confirmation ?? defaults.variable.confirmation),
                delivery: Number(parsed.variable?.delivery ?? defaults.variable.delivery),
            },
        };
        return result;
    } catch (e) {
        return {
            monthlyFixed: { rent: 3, wifi: 1 },
            perUnit: { packaging: 5, transport: 4 },
            variable: { facebookAdsPercent: 15, tiktokAdsPercent: 10, confirmation: 15, delivery: 35 },
        };
    }
  });

  const handleCostChange = (type: 'monthlyFixed' | 'perUnit' | 'variable', name: string, value: string) => {
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
        [name]: parseFloat(value.replace(',', '.')) || 0,
    }));
  };
  
 const handleCalculatedFieldChange = (name: string, value: string) => {
    const numericValue = parseFloat(value.replace(',', '.')) || 0;

    setCalculatorData(prev => {
        const newData = { ...prev };

        switch (name) {
            case 'cpl':
                newData.adSpend = numericValue * prev.leads;
                break;
            case 'ordersConfirmed':
                if (prev.leads > 0) {
                    newData.confRate = (numericValue / prev.leads) * 100;
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
    // Add Number() casting to ensure values are numeric for the reduce operation.
    const totalPerUnitCost = Object.values(costs.perUnit).reduce((sum, cost) => sum + Number(cost), 0);

    return products.map(product => {
      const { sellingPrice, purchasePrice } = product;

      const facebookAdsCost = sellingPrice * (costs.variable.facebookAdsPercent / 100);
      const tiktokAdsCost = sellingPrice * (costs.variable.tiktokAdsPercent / 100);
      const totalVariableCostForUnit = facebookAdsCost + tiktokAdsCost + costs.variable.confirmation + costs.variable.delivery;

      const costPerUnitSold = purchasePrice + totalPerUnitCost + totalVariableCostForUnit;
      const netProfitPerUnit = sellingPrice - costPerUnitSold;
      const marginPercent = sellingPrice > 0 ? (netProfitPerUnit / sellingPrice) * 100 : 0;
      
      const quantitySold = orders.filter(o => o.product === product.name && o.livraison === Livraison.Livre).length;

      return {
        ...product,
        quantity_sold: quantitySold,
        costs: {
          per_unit_cost: totalPerUnitCost,
          variable_cost: totalVariableCostForUnit,
          total_cost_per_unit_sold: costPerUnitSold,
          net_profit_per_unit: netProfitPerUnit,
          margin_percent: marginPercent,
        },
        total_revenue: quantitySold * sellingPrice,
        total_product_line_expenses: quantitySold * costPerUnitSold,
        total_product_line_profit: quantitySold * netProfitPerUnit,
      };
    }).filter(p => p !== null);
  }, [orders, products, costs]);

  const overviewStats = useMemo(() => {
    // Add Number() casting to ensure values are numeric for the reduce operation.
    const totalMonthlyFixedCosts = Object.values(costs.monthlyFixed).reduce((sum, cost) => sum + Number(cost), 0);
    const totalRevenue = financialAnalysis.reduce((sum, p) => sum + (p?.total_revenue || 0), 0);
    const totalProductLinesExpenses = financialAnalysis.reduce((sum, p) => sum + (p?.total_product_line_expenses || 0), 0);
    const totalExpenses = totalProductLinesExpenses + totalMonthlyFixedCosts;
    const totalProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, totalProfit };
  }, [financialAnalysis, costs.monthlyFixed]);

  const monthlyProfitData = useMemo(() => {
    const profitMap = new Map<string, number>();
    financialAnalysis.forEach(p => p && profitMap.set(p.name, p.costs.net_profit_per_unit));
    
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

    // Add Number() casting to ensure values are numeric for the reduce operation.
    const totalMonthlyFixedCosts = Object.values(costs.monthlyFixed).reduce((sum, cost) => sum + Number(cost), 0);
    const currentMonth = new Date().getMonth();
    
    return data.map((monthData, index) => {
        // Only apply costs for past and current months of the current year for this chart
        if (index <= currentMonth) {
            return { ...monthData, profit: monthData.profit - totalMonthlyFixedCosts };
        }
        return monthData;
    });

  }, [orders, financialAnalysis, costs.monthlyFixed]);

  // Add Number() casting to ensure values are numeric for the reduce operation.
  const totalMonthlyFixedCosts = Object.values(costs.monthlyFixed).reduce((s, c) => s + Number(c), 0);
  // Add Number() casting to ensure values are numeric for the reduce operation.
  const totalPerUnitCosts = Object.values(costs.perUnit).reduce((s, c) => s + Number(c), 0);
  const inputClass = "w-28 text-right py-1 rounded-md border bg-secondary dark:bg-dark-secondary focus:ring-1 focus:ring-blue-500 ml-auto block";
  
  const formatNumberForCalc = (num: number, decimalPlaces = 2) => {
    if (num % 1 === 0) {
      return String(num);
    }
    return num.toFixed(decimalPlaces).replace('.', ',');
  };

  const CalcInputCell: React.FC<{ name: keyof CalculatorData; value: number; }> = ({ name, value }) => (
    <td className="p-0 border border-gray-500 dark:border-gray-600">
        <input
            type="text"
            name={name}
            value={formatNumberForCalc(value)}
            onChange={handleCalculatorChange}
            className="w-full h-full p-2 bg-transparent text-center font-bold outline-none"
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
                           <input type="text" value={formatNumberForCalc(calculatorResults.cpl)} onChange={(e) => handleCalculatedFieldChange('cpl', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" />
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <div className="relative h-full">
                                <input type="text" name="confRate" value={formatNumberForCalc(calculatorData.confRate)} onChange={handleCalculatorChange} className="w-full h-full p-2 pr-6 bg-transparent text-center font-bold outline-none"/>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                            </div>
                        </td>
                         <td className="p-0 border border-gray-500 dark:border-gray-600">
                           <input type="text" value={formatNumberForCalc(calculatorResults.ordersConfirmed, 0)} onChange={(e) => handleCalculatedFieldChange('ordersConfirmed', e.target.value)} className="w-full h-full p-2 bg-transparent text-center font-bold outline-none" />
                        </td>
                        <td className="p-0 border border-gray-500 dark:border-gray-600">
                            <div className="relative h-full">
                                <input type="text" name="delivRate" value={formatNumberForCalc(calculatorData.delivRate)} onChange={handleCalculatorChange} className="w-full h-full p-2 pr-6 bg-transparent text-center font-bold outline-none"/>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
                            </div>
                        </td>
                        <td className="p-2 border border-gray-500 dark:border-gray-600 font-bold">
                           {formatNumberForCalc(calculatorResults.ordersDelivered, 0)}
                        </td>
                        <td className="p-2 border border-gray-500 dark:border-gray-600 font-bold text-red-600 dark:text-red-400">
                           {formatNumberForCalc(calculatorResults.cpd)}
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
                        <td className="p-2 border border-gray-500 dark:border-gray-600 font-bold text-green-900 dark:text-green-200">
                            {formatNumberForCalc(calculatorResults.profitPerUnit)}
                        </td>
                        <td className="p-2 border border-gray-500 dark:border-gray-600 font-bold">
                             {formatNumberForCalc(calculatorResults.totalProfit, 0)}
                        </td>
                        <td className="p-2 border border-gray-500 dark:border-gray-600 font-bold relative">
                            <span>{formatNumberForCalc(calculatorResults.roi)}</span>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                <h3 className="text-lg font-semibold mb-4">Frais Opérationnels</h3>
                
                <p className="text-sm font-medium text-muted-foreground">Frais Fixes Mensuels</p>
                <table className="w-full text-sm mt-2">
                    <tbody className="divide-y dark:divide-gray-700">
                        <tr>
                            <td className="py-2">Loyer</td>
                            <td className="py-2"><input type="number" value={costs.monthlyFixed.rent} onChange={(e) => handleCostChange('monthlyFixed', 'rent', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                         <tr>
                            <td className="py-2">Wifi</td>
                            <td className="py-2"><input type="number" value={costs.monthlyFixed.wifi} onChange={(e) => handleCostChange('monthlyFixed', 'wifi', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                    </tbody>
                     <tfoot className="font-bold border-t-2 dark:border-gray-600">
                        <tr>
                            <td className="pt-3">Total Mensuel</td>
                            <td className="pt-3 text-right">{formatCurrency(totalMonthlyFixedCosts)}</td>
                        </tr>
                    </tfoot>
                </table>

                <p className="text-sm font-medium text-muted-foreground mt-6">Frais par Unité</p>
                 <table className="w-full text-sm mt-2">
                    <tbody className="divide-y dark:divide-gray-700">
                        <tr>
                            <td className="py-2">Packaging</td>
                            <td className="py-2"><input type="number" value={costs.perUnit.packaging} onChange={(e) => handleCostChange('perUnit', 'packaging', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                        <tr>
                            <td className="py-2">Transport</td>
                            <td className="py-2"><input type="number" value={costs.perUnit.transport} onChange={(e) => handleCostChange('perUnit', 'transport', e.target.value)} className={inputClass} step="0.01"/></td>
                        </tr>
                    </tbody>
                    <tfoot className="font-bold border-t-2 dark:border-gray-600">
                        <tr>
                            <td className="pt-3">Total par Unité</td>
                            <td className="pt-3 text-right">{formatCurrency(totalPerUnitCosts)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             <div className="lg:col-span-2 p-6 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
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
                <th className="px-4 py-3 text-right">Charges par Unité</th>
                <th className="px-4 py-3 text-right">Charges Variables</th>
                <th className="px-4 py-3 text-right">Coût / Unité Vendue</th>
                <th className="px-4 py-3 text-right">Bénéfice / Unité</th>
                <th className="px-4 py-3 text-right">Marge Bénéficiaire</th>
                <th className="px-4 py-3 text-right">Qté Vendue</th>
                <th className="px-4 py-3 text-right">Bénéfice Produit Total</th>
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
                  <td className="px-4 py-3 text-right text-orange-500">{formatCurrency(p.costs.per_unit_cost)}</td>
                  <td className="px-4 py-3 text-right text-orange-500">{formatCurrency(p.costs.variable_cost)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{formatCurrency(p.costs.total_cost_per_unit_sold)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatCurrency(p.costs.net_profit_per_unit)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.costs.margin_percent > 20 ? 'text-green-500' : 'text-orange-500'}`}>
                    {p.costs.margin_percent.toFixed(1)}%
                  </td>
                   <td className="px-4 py-3 text-right">{p.quantity_sold}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(p.total_product_line_profit)}</td>
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