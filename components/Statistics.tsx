

import React, { useMemo, useState } from 'react';
import { Order, Statut, Livraison, CommandeRetour } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, TooltipProps
} from 'recharts';
import { Calendar } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { filterAndAggregateData } from '../utils/chartUtils';

// Card components defined locally for this specific design
const StatCard: React.FC<{ title: string; value: string; percentage?: string; color: string; }> = ({ title, value, percentage, color }) => (
  <div className={`p-6 rounded-2xl text-white ${color} shadow-lg`}>
    <p className="text-sm text-white/90">{title}</p>
    <div className="flex items-baseline gap-4 mt-2">
      <p className="text-3xl font-bold">{value}</p>
      {percentage && <p className="text-sm font-medium">{percentage}</p>}
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; timeFilter?: boolean; onFilterChange?: (filter: 'Week' | 'Month' | 'Year') => void; activeFilter?: 'Week' | 'Month' | 'Year'; footer?: React.ReactNode }> = ({ title, children, timeFilter = false, onFilterChange, activeFilter, footer }) => (
  <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm dark:bg-dark-card dark:text-dark-card-foreground">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {timeFilter && onFilterChange && activeFilter && (
        <div className="flex items-center gap-1 text-sm bg-secondary dark:bg-dark-secondary p-1 rounded-lg">
          <button onClick={() => onFilterChange('Week')} className={`px-3 py-1 rounded-md ${activeFilter === 'Week' ? 'bg-blue-600 text-white' : 'hover:bg-card dark:hover:bg-dark-card'}`}>Week</button>
          <button onClick={() => onFilterChange('Month')} className={`px-3 py-1 rounded-md ${activeFilter === 'Month' ? 'bg-blue-600 text-white' : 'hover:bg-card dark:hover:bg-dark-card'}`}>Month</button>
          <button onClick={() => onFilterChange('Year')} className={`px-3 py-1 rounded-md ${activeFilter === 'Year' ? 'bg-blue-600 text-white' : 'hover:bg-card dark:hover:bg-dark-card'}`}>Year</button>
        </div>
      )}
    </div>
    <div className="h-[300px]">
      {children}
    </div>
    {footer && <div className="mt-4 flex justify-center items-center flex-wrap gap-2">{footer}</div>}
  </div>
);

// Custom Tooltips for charts
const CustomSalesTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  const { formatCurrency } = useCustomization();
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-blue-700 text-white rounded-lg shadow-lg border border-blue-500">
        <p className="font-semibold">{`Date: ${label}`}</p>
        <p className="text-sm">{`Total Amount: ${formatCurrency(Number(payload[0].value))}`}</p>
        <p className="text-sm">{`Shipments: ${(Number(payload[0].value) / 150).toFixed(0)}`}</p>
      </div>
    );
  }
  return null;
};

const CustomShipmentTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-blue-700 text-white rounded-lg shadow-lg border border-blue-500">
        <p className="font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-sm">
            {`${p.name}: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface StatisticsProps {
  orders: Order[];
}

const Statistics: React.FC<StatisticsProps> = ({ orders }) => {
  const { formatCurrency } = useCustomization();
  const [shipmentTimeFilter, setShipmentTimeFilter] = useState<'Week' | 'Month' | 'Year'>('Year');
  const [salesTimeFilter, setSalesTimeFilter] = useState<'Week' | 'Month' | 'Year'>('Year');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<'All' | 'On Delivery' | 'Delivered' | 'Returned'>('All');
  const [salesProductFilter, setSalesProductFilter] = useState<string>('All');
  
  const [dateRange, setDateRange] = useState(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    return {
        start: startOfYear.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
    };
  });

  const filteredOrders = useMemo(() => {
    const start = new Date(dateRange.start + 'T00:00:00');
    const end = new Date(dateRange.end + 'T23:59:59');
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
    });
  }, [orders, dateRange]);

  const confirmedOrders = useMemo(() => {
    return filteredOrders.filter(o => o.statut === Statut.Confirme);
  }, [filteredOrders]);

  const stats = useMemo(() => {
    const totalShipments = confirmedOrders.length;

    if (totalShipments === 0) {
      return { totalShipments: 0, activeShipments: 0, completedOrders: 0, returnedOrders: 0, averageOrderValue: 0, activePercentage: '0%', completedPercentage: '0%', returnedPercentage: '0%' };
    }

    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.price, 0);
    
    // Make categories mutually exclusive to fix discrepancies.
    // Priority: Returned > Completed > Active
    const returnedOrders = confirmedOrders.filter(o => o.commandeRetour === CommandeRetour.Retourner).length;
    
    const completedOrders = confirmedOrders.filter(o => 
        o.commandeRetour !== CommandeRetour.Retourner && 
        o.livraison === Livraison.Livre
    ).length;

    const activeShipments = confirmedOrders.filter(o => 
        o.commandeRetour !== CommandeRetour.Retourner && 
        o.livraison !== Livraison.Livre
    ).length;

    const averageOrderValue = totalRevenue / totalShipments;
    
    return {
      totalShipments,
      activeShipments,
      completedOrders,
      returnedOrders,
      averageOrderValue,
      activePercentage: `${(activeShipments / totalShipments * 100).toFixed(0)}% of total`,
      completedPercentage: `${(completedOrders / totalShipments * 100).toFixed(0)}% of total`,
      returnedPercentage: `${(returnedOrders / totalShipments * 100).toFixed(0)}% of total`
    };
  }, [confirmedOrders]);

  const shipmentChartData = useMemo(() => {
    const aggregated = filterAndAggregateData(confirmedOrders, shipmentTimeFilter);
    return aggregated.map(({ name, onDelivery, delivered, returned }) => ({ name, onDelivery, delivered, returned }));
  }, [confirmedOrders, shipmentTimeFilter]);

  const salesChartData = useMemo(() => {
    const relevantOrders = salesProductFilter === 'All'
      ? confirmedOrders
      : confirmedOrders.filter(o => o.product === salesProductFilter);
    const aggregated = filterAndAggregateData(relevantOrders, salesTimeFilter);
    return aggregated.map(({ name, sales }) => ({ name, sales }));
  }, [confirmedOrders, salesTimeFilter, salesProductFilter]);
  
  const categoryData = useMemo(() => {
    // FIX: Explicitly typing the accumulator `acc` ensures that `salesByProduct` is correctly inferred as `Record<string, number>`, preventing downstream type errors.
    const salesByProduct = confirmedOrders.reduce((acc: Record<string, number>, order) => {
      if (!acc[order.product]) {
        acc[order.product] = 0;
      }
      acc[order.product] += order.price;
      return acc;
    }, {});

    const totalSales = Object.values(salesByProduct).reduce((sum, val) => sum + val, 0);

    return Object.entries(salesByProduct)
      .map(([name, value]) => ({ name, value, percentage: totalSales > 0 ? ((value / totalSales) * 100).toFixed(0) : '0' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [confirmedOrders]);

  const avgCheckData = useMemo(() => {
    const checkByProduct: Record<string, { total: number; count: number }> = {};
    confirmedOrders.forEach(order => {
        if (!checkByProduct[order.product]) checkByProduct[order.product] = { total: 0, count: 0 };
        checkByProduct[order.product].total += order.price;
        checkByProduct[order.product].count++;
    });
    
    return Object.entries(checkByProduct)
        .map(([name, data]) => ({ name, value: data.total / data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
  }, [confirmedOrders]);

  const deliveryTimeData = [
    { name: 'Alabama', days: 12 }, { name: 'Florida', days: 8 }, { name: 'Missouri', days: 6 },
    { name: 'California', days: 5 }, { name: 'New York', days: 2 }
  ];

  const DONUT_COLORS = ['#6366f1', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80'];
  
  const shipmentFilters: Array<{name: 'All' | 'On Delivery' | 'Delivered' | 'Returned', color: string}> = [
    { name: 'All', color: '' },
    { name: 'On Delivery', color: '#81d4fa' },
    { name: 'Delivered', color: '#a5d6a7' },
    { name: 'Returned', color: '#f4a2a1' }
  ];

  const shipmentChartFooter = (
    <>
      {shipmentFilters.map(filter => (
        <button
          key={filter.name}
          onClick={() => setShipmentStatusFilter(filter.name)}
          className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${shipmentStatusFilter === filter.name ? 'bg-blue-600 text-white' : 'bg-secondary dark:bg-dark-secondary text-secondary-foreground hover:bg-muted dark:hover:bg-dark-muted'}`}
        >
          {filter.name !== 'All' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: filter.color }}></div>}
          <span>{filter.name}</span>
        </button>
      ))}
    </>
  );
  
  const productNamesForFilter = useMemo(() => ['All', ...Array.from(new Set(orders.map(o => o.product)))], [orders]);
  
  const salesChartFooter = (
     <>
      {productNamesForFilter.slice(0, 6).map(name => (
        <button
          key={name}
          onClick={() => setSalesProductFilter(name)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${salesProductFilter === name ? 'bg-blue-600 text-white' : 'bg-secondary dark:bg-dark-secondary text-secondary-foreground hover:bg-muted dark:hover:bg-dark-muted'}`}
        >
          {name}
        </button>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-card dark:bg-dark-card text-sm">
            <Calendar size={16} className="text-muted-foreground" />
            <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent focus:outline-none text-secondary-foreground dark:text-dark-secondary-foreground"
                aria-label="Start date"
            />
            <span className="text-muted-foreground">to</span>
            <input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent focus:outline-none text-secondary-foreground dark:text-dark-secondary-foreground"
                aria-label="End date"
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Commandes Confirmées" value={stats.totalShipments.toLocaleString()} color="bg-blue-700" />
        <StatCard title="Active Shipments" value={stats.activeShipments.toLocaleString()} percentage={stats.activePercentage} color="bg-sky-500" />
        <StatCard title="Livré" value={stats.completedOrders.toLocaleString()} percentage={stats.completedPercentage} color="bg-emerald-500" />
        <StatCard title="Returned" value={stats.returnedOrders.toLocaleString()} percentage={stats.returnedPercentage} color="bg-rose-500" />
        <StatCard title="Av. Order Value" value={formatCurrency(stats.averageOrderValue)} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartCard
            title="Shipment"
            timeFilter
            onFilterChange={setShipmentTimeFilter}
            activeFilter={shipmentTimeFilter}
            footer={shipmentChartFooter}
          >
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={shipmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomShipmentTooltip />} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}/>
                  <Legend iconType="circle" iconSize={10} verticalAlign="top" align="right" wrapperStyle={{top: -5}} />
                  {(shipmentStatusFilter === 'All' || shipmentStatusFilter === 'On Delivery') && <Bar dataKey="onDelivery" stackId="a" fill="#81d4fa" name="On Delivery" radius={[4, 4, 0, 0]} barSize={20} />}
                  {(shipmentStatusFilter === 'All' || shipmentStatusFilter === 'Delivered') && <Bar dataKey="delivered" stackId="a" fill="#a5d6a7" name="Delivered" barSize={20} />}
                  {(shipmentStatusFilter === 'All' || shipmentStatusFilter === 'Returned') && <Bar dataKey="returned" stackId="a" fill="#f4a2a1" name="Returned" barSize={20} />}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
           <ChartCard
            title="Sales"
            timeFilter
            onFilterChange={setSalesTimeFilter}
            activeFilter={salesTimeFilter}
            footer={salesChartFooter}
          >
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value)/1000}k`} />
                  <Tooltip content={<CustomSalesTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
             </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm dark:bg-dark-card dark:text-dark-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
           <div className="grid grid-cols-2 h-[250px] items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={2} dataKey="value" nameKey="name" >
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} stroke={DONUT_COLORS[index % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]}/>
                </PieChart>
             </ResponsiveContainer>
              <div className="flex flex-col justify-center gap-3 text-sm">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{entry.name}</span>
                        <span className="text-xs text-muted-foreground">{entry.percentage}%</span>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm dark:bg-dark-card dark:text-dark-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Av. Check</h3>
          <div className="space-y-3 pt-2">
            {avgCheckData.map((entry, index) => (
                <div key={entry.name} className="flex flex-col">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{entry.name}</span>
                        <span className="font-semibold">{formatCurrency(entry.value)}</span>
                    </div>
                    <div className="w-full bg-secondary dark:bg-dark-secondary rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${(entry.value / Math.max(...avgCheckData.map(d => d.value)))*100}%`, backgroundColor: `rgba(59, 130, 246, ${1 - index*0.15})` }}></div>
                    </div>
                </div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm dark:bg-dark-card dark:text-dark-card-foreground">
          <h3 className="text-lg font-semibold mb-4">Av. Delivery Time</h3>
          <div className="space-y-3 pt-2">
            {deliveryTimeData.map(entry => {
                let color = '#4ade80'; if (entry.days > 5) color = '#facc15'; if (entry.days > 8) color = '#f87171';
                return (
                    <div key={entry.name} className="flex flex-col">
                         <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{entry.name}</span>
                            <span className="font-semibold">{entry.days} days</span>
                        </div>
                        <div className="w-full bg-secondary dark:bg-dark-secondary rounded-full h-2.5">
                            <div className="h-2.5 rounded-full" style={{ width: `${(entry.days / 12)*100}%`, backgroundColor: color }}></div>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;