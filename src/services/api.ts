import { Order, Product, Client, User, LogEntry } from '../../types';
import { API_BASE_URL, USE_MOCK_DATA } from '../config';

// Helper to handle fetch responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

export const api = {
  // Orders
  getOrders: async (): Promise<Order[]> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('orders');
        return stored ? JSON.parse(stored) : [];
    }
    const response = await fetch(`${API_BASE_URL}/orders.php`);
    return handleResponse<Order[]>(response);
  },

  createOrder: async (order: Order): Promise<Order> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('orders');
        const orders = stored ? JSON.parse(stored) : [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        return order;
    }
    const response = await fetch(`${API_BASE_URL}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return handleResponse<Order>(response);
  },

  updateOrder: async (order: Order): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('orders');
        let orders = stored ? JSON.parse(stored) : [];
        orders = orders.map((o: Order) => o.id === order.id ? order : o);
        localStorage.setItem('orders', JSON.stringify(orders));
        return;
    }
    await fetch(`${API_BASE_URL}/orders.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  },

  deleteOrder: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('orders');
        let orders = stored ? JSON.parse(stored) : [];
        orders = orders.filter((o: Order) => o.id !== id);
        localStorage.setItem('orders', JSON.stringify(orders));
        return;
    }
    await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('products');
        return stored ? JSON.parse(stored) : [];
    }
    const response = await fetch(`${API_BASE_URL}/products.php`);
    return handleResponse<Product[]>(response);
  },

  createProduct: async (product: Product): Promise<Product> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('products');
        const products = stored ? JSON.parse(stored) : [];
        products.push(product);
        localStorage.setItem('products', JSON.stringify(products));
        return product;
    }
    const response = await fetch(`${API_BASE_URL}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return handleResponse<Product>(response);
  },

  updateProduct: async (product: Product): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('products');
        let products = stored ? JSON.parse(stored) : [];
        products = products.map((p: Product) => p.id === product.id ? product : p);
        localStorage.setItem('products', JSON.stringify(products));
        return;
    }
    await fetch(`${API_BASE_URL}/products.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('products');
        let products = stored ? JSON.parse(stored) : [];
        products = products.filter((p: Product) => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        return;
    }
    await fetch(`${API_BASE_URL}/products.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Clients
  getClients: async (): Promise<Client[]> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('clients');
        return stored ? JSON.parse(stored) : [];
    }
    const response = await fetch(`${API_BASE_URL}/clients.php`);
    return handleResponse<Client[]>(response);
  },

  createClient: async (client: Client): Promise<Client> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
        return client;
    }
    const response = await fetch(`${API_BASE_URL}/clients.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    return handleResponse<Client>(response);
  },

  updateClient: async (client: Client): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('clients');
        let clients = stored ? JSON.parse(stored) : [];
        clients = clients.map((c: Client) => c.id === client.id ? client : c);
        localStorage.setItem('clients', JSON.stringify(clients));
        return;
    }
    await fetch(`${API_BASE_URL}/clients.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
  },

  deleteClient: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('clients');
        let clients = stored ? JSON.parse(stored) : [];
        clients = clients.filter((c: Client) => c.id !== id);
        localStorage.setItem('clients', JSON.stringify(clients));
        return;
    }
    await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Settings
  getSettings: async (): Promise<any> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('settings');
        return stored ? JSON.parse(stored) : {};
    }
    const response = await fetch(`${API_BASE_URL}/settings.php`);
    return handleResponse<any>(response);
  },

  updateSettings: async (settings: any): Promise<void> => {
    if (USE_MOCK_DATA) {
        localStorage.setItem('settings', JSON.stringify(settings));
        return;
    }
    await fetch(`${API_BASE_URL}/settings.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },
  
  // Users
  getUsers: async (): Promise<User[]> => {
      if (USE_MOCK_DATA) {
          const stored = localStorage.getItem('users');
          return stored ? JSON.parse(stored) : [];
      }
      const response = await fetch(`${API_BASE_URL}/users.php`);
      return handleResponse<User[]>(response);
  },
  
  createUser: async (user: User): Promise<User> => {
      if (USE_MOCK_DATA) {
          const stored = localStorage.getItem('users');
          const users = stored ? JSON.parse(stored) : [];
          users.push(user);
          localStorage.setItem('users', JSON.stringify(users));
          return user;
      }
      const response = await fetch(`${API_BASE_URL}/users.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
      });
      return handleResponse<User>(response);
  },
  
  updateUser: async (user: User): Promise<void> => {
      if (USE_MOCK_DATA) {
          const stored = localStorage.getItem('users');
          let users = stored ? JSON.parse(stored) : [];
          users = users.map((u: User) => u.id === user.id ? user : u);
          localStorage.setItem('users', JSON.stringify(users));
          return;
      }
      await fetch(`${API_BASE_URL}/users.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
      });
  },
  
  deleteUser: async (id: string): Promise<void> => {
      if (USE_MOCK_DATA) {
          const stored = localStorage.getItem('users');
          let users = stored ? JSON.parse(stored) : [];
          users = users.filter((u: User) => u.id !== id);
          localStorage.setItem('users', JSON.stringify(users));
          return;
      }
      await fetch(`${API_BASE_URL}/users.php?id=${id}`, {
          method: 'DELETE',
      });
  },

  // Logs
  getLogs: async (): Promise<LogEntry[]> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('systemLogs');
        return stored ? JSON.parse(stored) : [];
    }
    const response = await fetch(`${API_BASE_URL}/logs.php`);
    return handleResponse<LogEntry[]>(response);
  },

  createLog: async (log: LogEntry): Promise<void> => {
    if (USE_MOCK_DATA) {
        const stored = localStorage.getItem('systemLogs');
        const logs = stored ? JSON.parse(stored) : [];
        logs.unshift(log);
        localStorage.setItem('systemLogs', JSON.stringify(logs));
        return;
    }
    await fetch(`${API_BASE_URL}/logs.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  }
};
