
import { Order, Livraison, CommandeRetour } from '../types';

export const filterAndAggregateData = (
  orders: Order[],
  filter: 'Week' | 'Month' | 'Year'
) => {
    const now = new Date();
    let filteredOrders: Order[];

    // Filter orders
    if (filter === 'Week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);
        filteredOrders = orders.filter(order => new Date(order.date) >= oneWeekAgo);
    } else if (filter === 'Month') {
        filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
        });
    } else { // Year
        filteredOrders = orders.filter(order => new Date(order.date).getFullYear() === now.getFullYear());
    }

    // Aggregate data
    if (filter === 'Week') {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            d.setHours(0,0,0,0);
            data.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d,
                onDelivery: 0, delivered: 0, returned: 0, sales: 0,
            });
        }
        
        filteredOrders.forEach(order => {
            const orderDate = new Date(order.date);
            orderDate.setHours(0,0,0,0);
            const dayData = data.find(d => d.date.getTime() === orderDate.getTime());
            if (dayData) {
                // FIX: Prioritize 'Returned' status over 'Delivered' to match card logic.
                if (order.commandeRetour === CommandeRetour.Retourner) dayData.returned++;
                else if (order.livraison === Livraison.Livre) dayData.delivered++;
                else dayData.onDelivery++;
                dayData.sales += order.price;
            }
        });
        return data.map(({name, onDelivery, delivered, returned, sales}) => ({name, onDelivery, delivered, returned, sales}));
    } else if (filter === 'Month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const data = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, onDelivery: 0, delivered: 0, returned: 0, sales: 0 }));
        filteredOrders.forEach(order => {
            const day = new Date(order.date).getDate() - 1;
            if (data[day]) {
                // FIX: Prioritize 'Returned' status over 'Delivered' to match card logic.
                if (order.commandeRetour === CommandeRetour.Retourner) data[day].returned++;
                else if (order.livraison === Livraison.Livre) data[day].delivered++;
                else data[day].onDelivery++;
                data[day].sales += order.price;
            }
        });
        return data;
    } else { // Year
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const data = months.map(month => ({ name: month, onDelivery: 0, delivered: 0, returned: 0, sales: 0 }));
        
        filteredOrders.forEach(order => {
            const monthIndex = new Date(order.date).getMonth();
            if (data[monthIndex]) {
                // FIX: Prioritize 'Returned' status over 'Delivered' to match card logic.
                if (order.commandeRetour === CommandeRetour.Retourner) data[monthIndex].returned++;
                else if (order.livraison === Livraison.Livre) data[monthIndex].delivered++;
                else data[monthIndex].onDelivery++;
                data[monthIndex].sales += order.price;
            }
        });
        return data;
    }
};
