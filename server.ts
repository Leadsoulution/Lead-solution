import express from 'express';
import cors from 'cors';
import apiRouter from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mount the database API routes
  app.use('/api', apiRouter);

  // Global error handler for API routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // API Proxy Routes
  app.get('/api/auth/shopify/url', (req, res) => {
    const { storeUrl, redirectUri } = req.query;
    if (!storeUrl || typeof storeUrl !== 'string') {
      return res.status(400).json({ error: 'storeUrl is required' });
    }
    if (!redirectUri || typeof redirectUri !== 'string') {
      return res.status(400).json({ error: 'redirectUri is required' });
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'SHOPIFY_CLIENT_ID is not configured' });
    }

    const baseUrl = storeUrl.replace(/\/$/, '');
    
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'read_orders,read_products,read_customers',
      redirect_uri: redirectUri,
      state: Math.random().toString(36).substring(7),
    });

    const authUrl = `${baseUrl}/admin/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get(['/api/auth/shopify/callback', '/api/auth/shopify/callback/'], async (req, res) => {
    const { code, shop } = req.query;
    
    if (!code || !shop || typeof code !== 'string' || typeof shop !== 'string') {
      return res.status(400).send('Missing code or shop parameter');
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send('Shopify OAuth credentials are not configured');
    }

    try {
      const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify token exchange error:', errorText);
        return res.status(response.status).send(`Failed to exchange token: ${errorText}`);
      }

      const data = await response.json();
      const accessToken = data.access_token;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  platform: 'Shopify',
                  accessToken: '${accessToken}',
                  storeUrl: 'https://${shop}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Shopify OAuth Error:', error);
      res.status(500).send(`OAuth Error: ${error.message}`);
    }
  });

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
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (apiSecret === 'oauth-token') {
        headers['X-Shopify-Access-Token'] = apiKey;
      } else {
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      console.log(`Proxying Shopify request to: ${baseUrl}/admin/api/2023-10/orders.json`);

      const response = await fetch(`${baseUrl}/admin/api/2023-10/orders.json?status=any&limit=20`, {
        headers
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

  app.post('/api/proxy/googlesheets', async (req, res) => {
    try {
      const { spreadsheetId, clientEmail, privateKey } = req.body;
      if (!spreadsheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      // Import dynamically to avoid issues if package is missing during dev
      const { google } = await import('googleapis') as any;

      const auth = new google.auth.JWT(
        clientEmail,
        undefined,
        privateKey.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );

      const sheets = google.sheets({ version: 'v4', auth });

      // Assume data is in the first sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A1:Z1000', // Fetch first 1000 rows
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.json({ headers: [], rows: [] });
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      res.json({ headers, rows: dataRows });

    } catch (error: any) {
      console.error('Google Sheets Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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
