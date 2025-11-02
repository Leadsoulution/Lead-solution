

import React, { useMemo, useState } from 'react';
import { mockOrders } from '../services/mockData';
import { Statut, Platform, Livraison, Role } from '../types';
import StatCard from './StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, ShoppingCart, Users, BarChart3, Percent, Truck } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';
import { useAuth } from '../contexts/AuthContext';

const Statistics: React.FC = () => {
    const { colors } = useCustomization();
    const { users, currentUser } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    const filteredOrders = useMemo(() => {
        let orders = mockOrders;
        // If a regular user is logged in, they only see their stats
        if (currentUser?.role === Role.User) {
            return orders.filter(order => order.assignedUserId === currentUser.id);
        }

        // If an admin has selected a specific user from the dropdown
        if (selectedUserId !== 'all') {
            return orders.filter(order => order.assignedUserId === selectedUserId);
        }
        
        // Admin view with "All users" selected
        return orders;
    }, [selectedUserId, currentUser]);

    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.price, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const uniqueCustomers = new Set(filteredOrders.map(o => o.customerName)).size;
        
        const confirmedOrders = filteredOrders.filter(o => o.statut === Statut.Confirme).length;
        const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;

        const deliveredOrders = filteredOrders.filter(o => o.livraison === Livraison.Livre).length;
        const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

        return { totalRevenue, totalOrders, averageOrderValue, uniqueCustomers, confirmationRate, deliveryRate };
    }, [filteredOrders]);

    const userSalesData = useMemo(() => {
        const salesByUser = filteredOrders.reduce((acc, order) => {
            const user = users.find(u => u.id === order.assignedUserId);
            const userName = user ? user.username : 'Non assigné';
            acc[userName] = (acc[userName] || 0) + order.price;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(salesByUser).map(([name, value]) => ({ name, value }));
    }, [filteredOrders, users]);

    const statusDistributionData = useMemo(() => {
        const counts = filteredOrders.reduce((acc, order) => {
            acc[order.statut] = (acc[order.statut] || 0) + 1;
            return acc;
        }, {} as Record<Statut, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredOrders]);

    const revenueOverTimeData = useMemo(() => {
        const monthlySales = filteredOrders.reduce((acc, order) => {
            const month = new Date(order.date).toLocaleString('default', { year: '2-digit', month: 'short' });
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += order.price;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(monthlySales)
            .map(([name, revenue]) => ({ name, "Chiffre d'affaires": revenue }))
            .sort((a, b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
    }, [filteredOrders]);
    
    const topProducts = useMemo(() => {
        const productStats = filteredOrders.reduce((acc, order) => {
            if (!acc[order.product]) {
                acc[order.product] = { name: order.product, quantity: 0, sales: 0 };
            }
            acc[order.product].quantity += 1;
            acc[order.product].sales += order.price;
            return acc;
        }, {} as Record<string, { name: string, quantity: number, sales: number }>);

        return Object.values(productStats)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [filteredOrders]);

    const userPerformance = useMemo(() => {
        return users.map(user => {
            const assignedOrders = mockOrders.filter(order => order.assignedUserId === user.id);
            const totalAssigned = assignedOrders.length;
            if (totalAssigned === 0) {
                return { name: user.username, totalOrders: 0, confirmationRate: 0, deliveryRate: 0 };
            }
            const confirmed = assignedOrders.filter(o => o.statut === Statut.Confirme).length;
            const delivered = assignedOrders.filter(o => o.livraison === Livraison.Livre).length;
            return {
                name: user.username,
                totalOrders: totalAssigned,
                confirmationRate: (confirmed / totalAssigned) * 100,
                deliveryRate: (delivered / totalAssigned) * 100
            };
        });
    }, [users]);


    const USER_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#ef4444', '#8b5cf6', '#eab308', '#64748b'];
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Statistiques</h1>
                {currentUser?.role === Role.Admin && (
                    <div className="w-full max-w-xs">
                        <select
                            aria-label="Filtrer par commercial"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            className="w-full p-2 border rounded-md bg-card dark:bg-dark-card focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">Tous les commerciaux</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Chiffre d'affaires" value={`${stats.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Commandes" value={stats.totalOrders} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Taux de Confirmation" value={`${stats.confirmationRate.toFixed(1)}%`} icon={<Percent className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Taux de Livraison" value={`${stats.deliveryRate.toFixed(1)}%`} icon={<Truck className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                    <h2 className="text-lg font-semibold mb-4">Évolution du Chiffre d'Affaires</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueOverTimeData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${String(value)}€`} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), "Chiffre d'affaires"]} />
                            <Area type="monotone" dataKey="Chiffre d'affaires" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                    <h2 className="text-lg font-semibold mb-4">Ventes par User</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            {/* FIX: The 'percent' prop from recharts can be undefined or not a number. Added explicit Number conversion and a fallback to 0 to prevent a TypeError during the arithmetic operation. */}
                            <Pie data={userSalesData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}>
                                {userSalesData.map((entry, index) => <Cell key={`cell-${entry.name}`} fill={USER_COLORS[index % USER_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {currentUser?.role === Role.Admin && (
                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                    <h2 className="text-lg font-semibold mb-4">Performance par Commercial</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-secondary dark:bg-dark-secondary">
                                <tr>
                                    <th className="px-4 py-2">Commercial</th>
                                    <th className="px-4 py-2 text-right">Commandes Assignées</th>
                                    <th className="px-4 py-2 text-right">Taux Confirmation</th>
                                    <th className="px-4 py-2 text-right">Taux Livraison</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userPerformance.map((user) => (
                                    <tr key={user.name} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="px-4 py-2 font-medium">{user.name}</td>
                                        <td className="px-4 py-2 text-right">{user.totalOrders}</td>
                                        <td className="px-4 py-2 text-right">{user.confirmationRate.toFixed(1)}%</td>
                                        <td className="px-4 py-2 text-right">{user.deliveryRate.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                    <h2 className="text-lg font-semibold mb-4">Top 5 Produits</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-secondary dark:bg-dark-secondary">
                                <tr>
                                    <th className="px-4 py-2">Produit</th>
                                    <th className="px-4 py-2 text-right">Ventes</th>
                                    <th className="px-4 py-2 text-right">Qté</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product) => (
                                    <tr key={product.name} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="px-4 py-2 font-medium">{product.name}</td>
                                        <td className="px-4 py-2 text-right">{product.sales.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                                        <td className="px-4 py-2 text-right">{product.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-3 p-4 rounded-xl border bg-card text-card-foreground shadow dark:bg-dark-card dark:text-dark-card-foreground">
                    <h2 className="text-lg font-semibold mb-4">Répartition des Confirmations de Commande</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                            <Legend />
                            <Bar dataKey="value" name="Commandes" radius={[0, 4, 4, 0]}>
                                {statusDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors.statut[entry.name as Statut]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Statistics;