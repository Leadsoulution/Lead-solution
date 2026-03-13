import express from 'express';
import { db } from '../db';

const router = express.Router();

// Helper to handle async route errors
const asyncHandler = (fn: express.RequestHandler) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await fn(req, res, next);
  } catch (error: any) {
    if (error.message && error.message.includes('no such table')) {
      console.warn(`Table missing: ${error.message}`);
      if (req.method === 'GET') res.json([]); else next(error);
    } else {
      next(error);
    }
  }
};

// Helper to convert objects to SQLite compatible formats
const prepareForDb = (obj: any) => {
  const result: any = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = JSON.stringify(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
};

const parseFromDb = (obj: any) => {
  const result: any = {};
  for (const key in obj) {
    try {
      result[key] = JSON.parse(obj[key]);
    } catch {
      result[key] = obj[key];
    }
  }
  return result;
};

// --- Orders ---
router.get(['/orders', '/orders.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY date DESC').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/orders', '/orders.php'], asyncHandler(async (req, res) => {
  const order = prepareForDb(req.body);
  const keys = Object.keys(order);
  const values = Object.values(order);
  const placeholders = keys.map(() => '?').join(', ');
  
  db.prepare(`INSERT INTO orders (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  res.status(201).json(req.body);
}));

router.put(['/orders/:id', '/orders.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id || req.body.id;
  const order = prepareForDb(req.body);
  const keys = Object.keys(order);
  const values = Object.values(order);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  db.prepare(`UPDATE orders SET ${setClause} WHERE id = ?`).run(...values, id);
  res.json(req.body);
}));

router.delete(['/orders/:id', '/orders.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.status(204).send();
}));

// --- Products ---
router.get(['/products', '/products.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM products').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/products', '/products.php'], asyncHandler(async (req, res) => {
  const product = prepareForDb(req.body);
  const keys = Object.keys(product);
  const values = Object.values(product);
  const placeholders = keys.map(() => '?').join(', ');
  
  db.prepare(`INSERT INTO products (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  res.status(201).json(req.body);
}));

router.put(['/products/:id', '/products.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id || req.body.id;
  const product = prepareForDb(req.body);
  const keys = Object.keys(product);
  const values = Object.values(product);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`).run(...values, id);
  res.json(req.body);
}));

router.delete(['/products/:id', '/products.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.status(204).send();
}));

// --- Clients ---
router.get(['/clients', '/clients.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM clients').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/clients', '/clients.php'], asyncHandler(async (req, res) => {
  const client = prepareForDb(req.body);
  const keys = Object.keys(client);
  const values = Object.values(client);
  const placeholders = keys.map(() => '?').join(', ');
  
  db.prepare(`INSERT INTO clients (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  res.status(201).json(req.body);
}));

router.put(['/clients/:id', '/clients.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id || req.body.id;
  const client = prepareForDb(req.body);
  const keys = Object.keys(client);
  const values = Object.values(client);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  db.prepare(`UPDATE clients SET ${setClause} WHERE id = ?`).run(...values, id);
  res.json(req.body);
}));

router.delete(['/clients/:id', '/clients.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  res.status(204).send();
}));

// --- Users ---
router.get(['/users', '/users.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM users').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/users', '/users.php'], asyncHandler(async (req, res) => {
  const user = prepareForDb(req.body);
  const keys = Object.keys(user);
  const values = Object.values(user);
  const placeholders = keys.map(() => '?').join(', ');
  
  db.prepare(`INSERT INTO users (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  res.status(201).json(req.body);
}));

router.put(['/users/:id', '/users.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id || req.body.id;
  const user = prepareForDb(req.body);
  const keys = Object.keys(user);
  const values = Object.values(user);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
  res.json(req.body);
}));

router.delete(['/users/:id', '/users.php'], asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).send();
}));

// --- Settings ---
router.get(['/settings', '/settings.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/settings', '/settings.php'], asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (key && value !== undefined) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    db.prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?').run(key, stringValue, stringValue);
    res.status(200).json({ key, value });
  } else {
    res.status(400).json({ error: 'Invalid settings payload' });
  }
}));

router.put(['/settings', '/settings.php'], asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (key && value !== undefined) {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    db.prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?').run(key, stringValue, stringValue);
    res.status(200).json({ key, value });
  } else {
    res.status(400).json({ error: 'Invalid settings payload' });
  }
}));

// --- Logs ---
router.get(['/logs', '/logs.php'], asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
  res.json(rows.map(parseFromDb));
}));

router.post(['/logs', '/logs.php'], asyncHandler(async (req, res) => {
  const log = prepareForDb(req.body);
  const keys = Object.keys(log).filter(k => k !== 'id'); // id is AUTOINCREMENT
  const values = keys.map(k => log[k]);
  const placeholders = keys.map(() => '?').join(', ');
  
  const result = db.prepare(`INSERT INTO logs (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  res.status(201).json({ ...req.body, id: result.lastInsertRowid });
}));

// --- Login ---
router.post(['/login', '/login.php'], asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (user) {
    res.json(parseFromDb(user));
  } else {
    // If no users exist, allow admin/admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0 && username === 'admin' && password === 'admin') {
      res.json({
        id: 'admin',
        username: 'admin',
        role: 'admin',
        permissions: ['all'],
        assignedProductIds: []
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
}));

// --- Proxies ---
router.post(['/proxy_woocommerce.php', '/proxy/woocommerce'], asyncHandler(async (req, res) => {
  const { storeUrl, apiKey, apiSecret } = req.body;
  if (!storeUrl || !apiKey || !apiSecret) return res.status(400).json({ error: 'Missing parameters' });
  
  const url = `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/orders`;
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    return res.status(response.status).json({ error });
  }
  
  const data = await response.json();
  res.json(data);
}));

router.post(['/proxy_shopify.php', '/proxy/shopify'], asyncHandler(async (req, res) => {
  const { storeUrl, accessToken } = req.body;
  if (!storeUrl || !accessToken) return res.status(400).json({ error: 'Missing parameters' });
  
  const url = `${storeUrl.replace(/\/$/, '')}/admin/api/2024-01/orders.json?status=any`;
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    return res.status(response.status).json({ error });
  }
  
  const data = await response.json();
  res.json(data);
}));

router.post(['/proxy_youcan.php', '/proxy/youcan'], asyncHandler(async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Missing parameters' });
  
  const url = 'https://api.youcan.shop/orders';
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    return res.status(response.status).json({ error });
  }
  
  const data = await response.json();
  res.json(data);
}));

router.post(['/proxy_googlesheets.php', '/proxy/googlesheets'], asyncHandler(async (req, res) => {
  const { spreadsheetId, apiKey } = req.body;
  if (!spreadsheetId || !apiKey) return res.status(400).json({ error: 'Missing parameters' });
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z?key=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    return res.status(response.status).json({ error });
  }
  
  const data = await response.json();
  res.json(data);
}));

export default router;
