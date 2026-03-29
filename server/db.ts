import Database from 'better-sqlite3';

export const db = new Database('database.sqlite');

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    date TEXT,
    customerName TEXT,
    customerPhone TEXT,
    address TEXT,
    price REAL,
    quantity INTEGER,
    product TEXT,
    statut TEXT,
    assignedUserId TEXT,
    noteClient TEXT,
    ramassage TEXT,
    livraison TEXT,
    remboursement TEXT,
    commandeRetour TEXT,
    platform TEXT,
    callCount INTEGER,
    customFields TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    imageUrl TEXT,
    initialStock INTEGER,
    purchasePrice REAL,
    sellingPrice REAL,
    showInOrders INTEGER,
    discount REAL,
    category TEXT,
    isPack INTEGER,
    packProducts TEXT,
    customFields TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT,
    role TEXT,
    assignedProductIds TEXT,
    permissions TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    userId TEXT,
    username TEXT,
    action TEXT,
    details TEXT,
    targetId TEXT,
    targetType TEXT,
    oldValue TEXT,
    newValue TEXT
  );

  CREATE TABLE IF NOT EXISTS delivery_companies (
    id TEXT PRIMARY KEY,
    name TEXT,
    apiUrl TEXT,
    apiKey TEXT,
    status TEXT,
    customFields TEXT,
    isDefault INTEGER DEFAULT 0
  );
`);

// Migration logic for delivery_companies (add isDefault column)
try {
  db.prepare('SELECT isDefault FROM delivery_companies LIMIT 1').get();
} catch (e) {
  console.log('Migrating delivery_companies table to add isDefault column...');
  db.exec(`
    ALTER TABLE delivery_companies ADD COLUMN isDefault INTEGER DEFAULT 0;
  `);
}

// Migration logic for orders (add delivery columns)
try {
  db.prepare('SELECT deliveryCompanyId FROM orders LIMIT 1').get();
} catch (e) {
  console.log('Migrating orders table to add delivery columns...');
  db.exec(`
    ALTER TABLE orders ADD COLUMN deliveryCompanyId TEXT;
    ALTER TABLE orders ADD COLUMN deliveryStatus TEXT;
  `);
}

// Migration logic for orders
try {
  db.prepare('SELECT customerName FROM orders LIMIT 1').get();
} catch (e) {
  console.log('Migrating orders table...');
  db.exec(`
    DROP TABLE IF EXISTS orders;
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      date TEXT,
      customerName TEXT,
      customerPhone TEXT,
      address TEXT,
      price REAL,
      quantity INTEGER,
      product TEXT,
      statut TEXT,
      assignedUserId TEXT,
      noteClient TEXT,
      ramassage TEXT,
      livraison TEXT,
      remboursement TEXT,
      commandeRetour TEXT,
      platform TEXT,
      callCount INTEGER,
      customFields TEXT,
      deliveryCompanyId TEXT,
      deliveryStatus TEXT
    );
  `);
}

// Migration logic for products
try {
  db.prepare('SELECT sellingPrice FROM products LIMIT 1').get();
} catch (e) {
  console.log('Migrating products table...');
  db.exec(`
    DROP TABLE IF EXISTS products;
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT,
      imageUrl TEXT,
      initialStock INTEGER,
      purchasePrice REAL,
      sellingPrice REAL,
      showInOrders INTEGER,
      discount REAL,
      category TEXT,
      isPack INTEGER,
      packProducts TEXT,
      customFields TEXT
    );
  `);
}

// Migration logic for clients
try {
  db.prepare('SELECT address FROM clients LIMIT 1').get();
} catch (e) {
  console.log('Migrating clients table...');
  db.exec(`
    DROP TABLE IF EXISTS clients;
    CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      address TEXT
    );
  `);
}

// Migration logic for logs
try {
  db.prepare('SELECT targetId FROM logs LIMIT 1').get();
} catch (e) {
  console.log('Migrating logs table...');
  db.exec(`
    DROP TABLE IF EXISTS logs;
    CREATE TABLE logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      userId TEXT,
      username TEXT,
      action TEXT,
      details TEXT,
      targetId TEXT,
      targetType TEXT,
      oldValue TEXT,
      newValue TEXT
    );
  `);
}
