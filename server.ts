import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Proxy Routes
  app.post('/api/proxy/woocommerce', async (req, res) => {
    try {
      const { storeUrl, apiKey, apiSecret } = req.body;
      if (!storeUrl || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      const baseUrl = storeUrl.replace(/\/$/, '');
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      
      console.log(`Proxying WooCommerce request to: ${baseUrl}/wp-json/wc/v3/orders`);

      const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=20`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`WooCommerce API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: `WooCommerce API Error: ${response.statusText}`, details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('WooCommerce Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/proxy/shopify', async (req, res) => {
    try {
      const { storeUrl, apiKey, apiSecret } = req.body;
      if (!storeUrl || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      const baseUrl = storeUrl.replace(/\/$/, '');
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      console.log(`Proxying Shopify request to: ${baseUrl}/admin/api/2023-10/orders.json`);

      const response = await fetch(`${baseUrl}/admin/api/2023-10/orders.json?status=any&limit=20`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: `Shopify API Error: ${response.statusText}`, details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Shopify Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/proxy/youcan', async (req, res) => {
    try {
      const { storeUrl, apiKey } = req.body;
      if (!storeUrl || !apiKey) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      const baseUrl = storeUrl.replace(/\/$/, '');
      
      console.log(`Proxying YouCan request to: ${baseUrl}/api/orders`);

      const response = await fetch(`${baseUrl}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`YouCan API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: `YouCan API Error: ${response.statusText}`, details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('YouCan Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files (if built)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
