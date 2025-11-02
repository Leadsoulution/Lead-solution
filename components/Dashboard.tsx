

import React from 'react';
import { mockOrders } from '../services/mockData';
import { Statut, Order } from '../types';
import StatCard from './StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';

const Dashboard: React.FC = () => {
  const { colors } = useCustomization();
  const totalSales = mockOrders.reduce((sum, order) => sum + order.price, 0);
  const totalOrders = mockOrders.length;
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const ordersToday = mockOrders.filter(o => new Date(o.date).toDateString() === today.toDateString()).length;
  const ordersThisWeek = mockOrders.filter(o => new Date(o.date) >= startOfWeek).length;
  const ordersThisMonth = mockOrders.filter(o => new Date(o.date) >= startOfMonth).length;

  const statusCounts = mockOrders.reduce((acc, order) => {
    acc[order.statut] = (acc[order.statut] || 0) + 1;
    return acc;
  }, {} as Record<Statut, number>);
  
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  const monthlySalesData = mockOrders.reduce((acc, order) => {
    const month = new Date(order.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      existing.sales += order.price;
    } else {
      acc.push({ name: month, sales: order.price });
    }
    return acc;
  }, [] as { name: string; sales: number }[]).reverse();


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${totalSales.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Total revenue from all sales" />
        <StatCard title="Total Orders" value={totalOrders} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description={`${ordersToday} orders today`} />
        <StatCard title="Orders This Week" value={ordersThisWeek} icon={<Package className="h-4 w-4 text-muted-foreground" />} description="Total orders in the last 7 days" />
        <StatCard title="Orders This Month" value={ordersThisMonth} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Total orders this month" />
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-4 p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
          <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={{fill: 'hsla(var(--muted), 0.5)'}} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-1 lg:col-span-3 p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
          <h2 className="text-lg font-semibold mb-4">Répartition des Confirmations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              {/* FIX: The 'percent' prop from recharts can be undefined or not a number. Added explicit Number conversion and a fallback to 0 to prevent a TypeError during the arithmetic operation. */}
              <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.statut[entry.name as Statut]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
               <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;