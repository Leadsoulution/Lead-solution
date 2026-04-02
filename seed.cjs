const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const products = [
  {
    id: 'p-101',
    name: 'Écouteurs Sans Fil Pro',
    imageUrl: 'https://picsum.photos/seed/earbuds/200/200',
    initialStock: 150,
    purchasePrice: 15.0,
    sellingPrice: 39.99,
    showInOrders: 1,
    discount: 0,
    category: 'Électronique',
    isPack: 0,
    packProducts: '[]',
    customFields: '{}'
  },
  {
    id: 'p-102',
    name: 'Montre Connectée Sport',
    imageUrl: 'https://picsum.photos/seed/watch/200/200',
    initialStock: 80,
    purchasePrice: 25.0,
    sellingPrice: 59.99,
    showInOrders: 1,
    discount: 10,
    category: 'Accessoires',
    isPack: 0,
    packProducts: '[]',
    customFields: '{}'
  },
  {
    id: 'p-103',
    name: 'Sac à Dos Antivol',
    imageUrl: 'https://picsum.photos/seed/backpack/200/200',
    initialStock: 200,
    purchasePrice: 12.0,
    sellingPrice: 29.99,
    showInOrders: 1,
    discount: 0,
    category: 'Bagagerie',
    isPack: 0,
    packProducts: '[]',
    customFields: '{}'
  }
];

const orders = [
  {
    id: 'ORD-2026-001',
    date: new Date().toISOString(),
    customerName: 'Amine Bahazzaz',
    customerPhone: '0600112233',
    address: '123 Rue de la Paix, Casablanca',
    price: 39.99,
    quantity: 1,
    product: 'Écouteurs Sans Fil Pro',
    statut: 'Nouveau',
    assignedUserId: '',
    noteClient: 'Appeler avant livraison',
    ramassage: '',
    livraison: '',
    remboursement: '',
    commandeRetour: '',
    platform: 'Shopify',
    callCount: 0,
    customFields: '{}',
    deliveryCompanyId: '',
    deliveryStatus: '',
    trackingNumber: ''
  },
  {
    id: 'ORD-2026-002',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    customerName: 'Sara Youssefi',
    customerPhone: '0611223344',
    address: '45 Avenue Hassan II, Rabat',
    price: 59.99,
    quantity: 1,
    product: 'Montre Connectée Sport',
    statut: 'En cours',
    assignedUserId: '',
    noteClient: '',
    ramassage: '',
    livraison: '',
    remboursement: '',
    commandeRetour: '',
    platform: 'WooCommerce',
    callCount: 1,
    customFields: '{}',
    deliveryCompanyId: '',
    deliveryStatus: '',
    trackingNumber: ''
  },
  {
    id: 'ORD-2026-003',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    customerName: 'Omar Tazi',
    customerPhone: '0622334455',
    address: '78 Boulevard Zerktouni, Marrakech',
    price: 89.97,
    quantity: 3,
    product: 'Sac à Dos Antivol',
    statut: 'Confirmé',
    assignedUserId: '',
    noteClient: 'Urgent',
    ramassage: '',
    livraison: '',
    remboursement: '',
    commandeRetour: '',
    platform: 'Facebook',
    callCount: 2,
    customFields: '{}',
    deliveryCompanyId: '',
    deliveryStatus: '',
    trackingNumber: ''
  }
];

const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (
    id, name, imageUrl, initialStock, purchasePrice, sellingPrice, 
    showInOrders, discount, category, isPack, packProducts, customFields
  ) VALUES (
    @id, @name, @imageUrl, @initialStock, @purchasePrice, @sellingPrice, 
    @showInOrders, @discount, @category, @isPack, @packProducts, @customFields
  )
`);

const insertOrder = db.prepare(`
  INSERT OR REPLACE INTO orders (
    id, date, customerName, customerPhone, address, price, quantity, 
    product, statut, assignedUserId, noteClient, ramassage, livraison, 
    remboursement, commandeRetour, platform, callCount, customFields,
    deliveryCompanyId, deliveryStatus, trackingNumber
  ) VALUES (
    @id, @date, @customerName, @customerPhone, @address, @price, @quantity, 
    @product, @statut, @assignedUserId, @noteClient, @ramassage, @livraison, 
    @remboursement, @commandeRetour, @platform, @callCount, @customFields,
    @deliveryCompanyId, @deliveryStatus, @trackingNumber
  )
`);

db.transaction(() => {
  for (const p of products) insertProduct.run(p);
  for (const o of orders) insertOrder.run(o);
})();

console.log('Successfully seeded products and orders!');
