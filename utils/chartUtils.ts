
import { Order, Livraison, CommandeRetour } from '../types';

export const filterAndAggregateData = (
  orders: Order[],
  filter: 'Week' | 'Month' | 'Year'
) => {
    // Determine the reference date (anchor) based on the data
    // If orders exist, use the date of the most recent order.
    // This ensures that if we are looking at historical data (e.g. "Last Year"), 
    // the charts default to showing that data instead of empty "Current Year".
    let referenceDate = new Date();
    if (orders.length > 0) {
        // Find the latest date in the filtered orders
        const timestamps = orders.map(o => new Date(o.date).getTime());
        referenceDate = new Date(Math.max(...timestamps));
    }

    let filteredOrders: Order[];

    // Filter orders based on the reference date scope
    if (filter === 'Week') {
        // Last 7 days ending at referenceDate
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(referenceDate.getDate() - 6); 
        startOfWeek.setHours(0, 0, 0, 0);
        
        // End of the reference day
        const endOfWeek = new Date(referenceDate);
        endOfWeek.setHours(23, 59, 59, 999);

        filteredOrders = orders.filter(order => {
            const d = new Date(order.date);
            return d >= startOfWeek && d <= endOfWeek;
        });
    } else if (filter === 'Month') {
        // The specific month of the referenceDate
        filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate.getFullYear() === referenceDate.getFullYear() && 
                   orderDate.getMonth() === referenceDate.getMonth();
        });
    } else { // Year
        // The specific year of the referenceDate
        filteredOrders = orders.filter(order => new Date(order.date).getFullYear() === referenceDate.getFullYear());
    }

    // Aggregate data
    if (filter === 'Week') {
        const data = [];
        // Generate X-axis for the specific 7 days window
        for (let i = 6; i >= 0; i--) {
            const d = new Date(referenceDate);
            d.setDate(referenceDate.getDate() - i);
            d.setHours(0,0,0,0);
            
            data.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d, // Keep date object for matching
                onDelivery: 0, delivered: 0, returned: 0, sales: 0,
            });
        }
        
        filteredOrders.forEach(order => {
            const orderDate = new Date(order.date);
            orderDate.setHours(0,0,0,0);
            // Match by time value
            const dayData = data.find(d => d.date.getTime() === orderDate.getTime());
            if (dayData) {
                if (order.commandeRetour === CommandeRetour.Retourner) dayData.returned++;
                else if (order.livraison === Livraison.Livre) dayData.delivered++;
                else dayData.onDelivery++;
                dayData.sales += order.price;
            }
        });
        // Clean up data structure for Recharts
        return data.map(({name, onDelivery, delivered, returned, sales}) => ({name, onDelivery, delivered, returned, sales}));

    } else if (filter === 'Month') {
        const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
        const data = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, onDelivery: 0, delivered: 0, returned: 0, sales: 0 }));
        
        filteredOrders.forEach(order => {
            const day = new Date(order.date).getDate() - 1;
            if (data[day]) {
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
                if (order.commandeRetour === CommandeRetour.Retourner) data[monthIndex].returned++;
                else if (order.livraison === Livraison.Livre) data[monthIndex].delivered++;
                else data[monthIndex].onDelivery++;
                data[monthIndex].sales += order.price;
            }
        });
        return data;
    }
};
