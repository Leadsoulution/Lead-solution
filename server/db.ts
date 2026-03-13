import Database from 'better-sqlite3';

export const db = new Database('database.sqlite');

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    date TEXT,
    clientName TEXT,
    phone TEXT,
    city TEXT,
    address TEXT,
    product TEXT,
    quantity INTEGER,
    price REAL,
    status TEXT,
    trackingNumber TEXT,
    deliveryCompany TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    sku TEXT,
    price REAL,
    stock INTEGER,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    city TEXT,
    address TEXT,
    totalOrders INTEGER,
    totalSpent REAL
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
    userName TEXT,
    action TEXT,
    details TEXT
  );
`);
