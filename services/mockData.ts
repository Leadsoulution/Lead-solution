import { Order, Platform, Statut, Ramassage, Livraison, Remboursement, CommandeRetour, Product, Client } from '../types';

const generateRandomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

const startDate = new Date(2023, 0, 1);
const endDate = new Date();

export const mockProducts: Product[] = [
  {
    id: 'WH-001',
    name: 'Wireless Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
    initialStock: 100,
    purchasePrice: 45.00,
    sellingPrice: 99.99,
    showInOrders: true,
    discount: 10,
  },
  {
    id: 'LW-001',
    name: 'Leather Wallet',
    imageUrl: 'https://images.unsplash.com/photo-1613482193504-2b733335de9a3?q=80&w=1974&auto=format&fit=crop',
    initialStock: 200,
    purchasePrice: 15.00,
    sellingPrice: 49.50,
    showInOrders: true,
    discount: 5,
  },
  {
    id: 'SW-001',
    name: 'Smartwatch',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1964&auto=format&fit=crop',
    initialStock: 75,
    purchasePrice: 120.00,
    sellingPrice: 249.00,
    showInOrders: true,
    discount: 0,
  },
  {
    id: 'CM-001',
    name: 'Coffee Maker',
    imageUrl: 'https://images.unsplash.com/photo-1563823795-48356d299336?q=80&w=1964&auto=format&fit=crop',
    initialStock: 50,
    purchasePrice: 35.50,
    sellingPrice: 78.25,
    showInOrders: true,
    discount: 0,
  },
  {
    id: 'BS-001',
    name: 'Bookshelf',
    imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a6e594417?q=80&w=1964&auto=format&fit=crop',
    initialStock: 40,
    purchasePrice: 60.00,
    sellingPrice: 120.00,
    showInOrders: true,
    discount: 15,
  },
];

export const mockOrders: Order[] = [
  { 
    id: 'SF1001', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Alice Johnson', 
    customerPhone: '33612345678', 
    address: '123 Rue de Paris, 75001 Paris',
    price: 99.99, 
    product: 'Wireless Headphones', 
    statut: Statut.Confirme, 
    assignedUserId: 'admin-001',
    noteClient: 'Appeler avant de livrer',
    ramassage: Ramassage.Ramasser,
    livraison: Livraison.Livre,
    remboursement: Remboursement.Payer,
    commandeRetour: CommandeRetour.NonRetourne,
    noteObligatoire: '',
    platform: Platform.Shopify,
    callCount: 2,
  },
  { 
    id: 'WC2001', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Bob Smith', 
    customerPhone: '33787654321', 
    address: '45 Avenue de Lyon, 69002 Lyon',
    price: 49.50, 
    product: 'Leather Wallet', 
    statut: Statut.PasDeReponse, 
    assignedUserId: null,
    noteClient: '',
    ramassage: Ramassage.NonRamasser,
    livraison: Livraison.PasDeReponse,
    remboursement: Remboursement.NonPayer,
    commandeRetour: CommandeRetour.NonRetourne,
    noteObligatoire: '',
    platform: Platform.WooCommerce,
    callCount: 3,
  },
    { 
    id: 'SF1002', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Charlie Brown', 
    customerPhone: '33698765432', 
    address: '78 Boulevard de Marseille, 13008 Marseille',
    price: 249.00, 
    product: 'Smartwatch', 
    statut: Statut.Rappel, 
    assignedUserId: 'admin-001',
    noteClient: 'Cadeau, emballage svp',
    ramassage: Ramassage.Ramasser,
    livraison: Livraison.PriseDeRdv,
    remboursement: Remboursement.Payer,
    commandeRetour: CommandeRetour.NonRetourne,
    noteObligatoire: '',
    platform: Platform.Shopify,
    callCount: 1,
  },
  { 
    id: 'WC2002', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Diana Prince', 
    customerPhone: '33711223344', 
    address: '1 Rue de la Paix, 44000 Nantes',
    price: 99.99, 
    product: 'Wireless Headphones', 
    statut: Statut.Annule, 
    assignedUserId: null,
    noteClient: '',
    ramassage: Ramassage.NonRamasser,
    livraison: Livraison.Annule,
    remboursement: Remboursement.NonPayer,
    commandeRetour: CommandeRetour.Retourner,
    noteObligatoire: '',
    platform: Platform.WooCommerce,
    callCount: 0,
  },
    { 
    id: 'SF1003', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Ethan Hunt', 
    customerPhone: '33655667788', 
    address: '22 Place du Capitole, 31000 Toulouse',
    price: 78.25, 
    product: 'Coffee Maker', 
    statut: Statut.Confirme, 
    assignedUserId: 'admin-001',
    noteClient: '',
    ramassage: Ramassage.Ramasser,
    livraison: Livraison.Livre,
    remboursement: Remboursement.Payer,
    commandeRetour: CommandeRetour.NonRetourne,
    noteObligatoire: '',
    platform: Platform.Shopify,
    callCount: 1,
  },
  { 
    id: 'WC2003', 
    date: generateRandomDate(startDate, endDate), 
    customerName: 'Fiona Glenanne', 
    customerPhone: '33799887766', 
    address: '5 Allée de la Robertsau, 67000 Strasbourg',
    price: 120.00, 
    product: 'Bookshelf', 
    statut: Statut.BoiteVocale, 
    assignedUserId: 'admin-001',
    noteClient: 'Rappeler demain matin',
    ramassage: Ramassage.NonRamasser,
    livraison: Livraison.Reporte,
    remboursement: Remboursement.NonPayer,
    commandeRetour: CommandeRetour.NonRetourne,
    noteObligatoire: '',
    platform: Platform.WooCommerce,
    callCount: 1,
  },
];


// Create mock clients from mock orders to ensure consistency
const clientsFromOrders = new Map<string, Client>();
mockOrders.forEach(order => {
  if (!clientsFromOrders.has(order.customerPhone)) {
    clientsFromOrders.set(order.customerPhone, {
      id: `client-${order.customerPhone}`,
      name: order.customerName,
      phone: order.customerPhone,
      address: order.address
    });
  }
});

export const mockClients: Client[] = Array.from(clientsFromOrders.values());
