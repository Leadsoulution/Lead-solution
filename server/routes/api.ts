import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Helper to handle async route errors
const asyncHandler = (fn: express.RequestHandler) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await fn(req, res, next);
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn(`Table missing: ${error.message}`);
      if (req.method === 'GET') res.json([]); else next(error);
    } else if (['ECONNREFUSED', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(error.code)) {
      console.warn(`Database connection failed: ${error.message}`);
      if (req.method === 'GET') res.json([]); else next(error);
    } else {
      next(error);
    }
  }
};

// --- Orders ---
router.get('/orders', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY date DESC');
  res.json(rows);
}));

router.post('/orders', asyncHandler(async (req, res) => {
  const order = req.body;
  const [result] = await pool.query('INSERT INTO orders SET ?', [order]);
  res.status(201).json({ ...order, id: (result as any).insertId });
}));

router.put('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = req.body;
  await pool.query('UPDATE orders SET ? WHERE id = ?', [order, id]);
  res.json(order);
}));

router.delete('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  res.status(204).send();
}));

// --- Products ---
router.get('/products', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products');
  res.json(rows);
}));

router.post('/products', asyncHandler(async (req, res) => {
  const product = req.body;
  const [result] = await pool.query('INSERT INTO products SET ?', [product]);
  res.status(201).json({ ...product, id: (result as any).insertId });
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = req.body;
  await pool.query('UPDATE products SET ? WHERE id = ?', [product, id]);
  res.json(product);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  res.status(204).send();
}));

// --- Clients ---
router.get('/clients', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients');
  res.json(rows);
}));

router.post('/clients', asyncHandler(async (req, res) => {
  const client = req.body;
  const [result] = await pool.query('INSERT INTO clients SET ?', [client]);
  res.status(201).json({ ...client, id: (result as any).insertId });
}));

router.put('/clients/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = req.body;
  await pool.query('UPDATE clients SET ? WHERE id = ?', [client, id]);
  res.json(client);
}));

router.delete('/clients/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM clients WHERE id = ?', [id]);
  res.status(204).send();
}));

// --- Users ---
router.get('/users', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM users');
  res.json(rows);
}));

router.post('/users', asyncHandler(async (req, res) => {
  const user = req.body;
  const [result] = await pool.query('INSERT INTO users SET ?', [user]);
  res.status(201).json({ ...user, id: (result as any).insertId });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.body;
  await pool.query('UPDATE users SET ? WHERE id = ?', [user, id]);
  res.json(user);
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.status(204).send();
}));

// --- Settings ---
router.get('/settings', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings');
  res.json(rows);
}));

router.post('/settings', asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (key && value !== undefined) {
    // Upsert the setting
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value]
    );
    res.status(200).json({ key, value });
  } else {
    res.status(400).json({ error: 'Invalid settings payload' });
  }
}));

// --- Logs ---
router.get('/logs', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM logs ORDER BY timestamp DESC');
  res.json(rows);
}));

router.post('/logs', asyncHandler(async (req, res) => {
  const log = req.body;
  const [result] = await pool.query('INSERT INTO logs SET ?', [log]);
  res.status(201).json({ ...log, id: (result as any).insertId });
}));

export default router;
