// Thin fetch client for the IECHM C backend. Every screen goes through this
// module instead of touching fetch() directly, so the base URL / error
// handling / JSON parsing lives in exactly one place.
const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8787';

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `${method} ${path} failed (${res.status})`);
  return data;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body ?? {});
const patch = (path, body) => request('PATCH', path, body ?? {});
const del = (path) => request('DELETE', path);

export const api = {
  health: () => get('/api/health'),

  categories: () => get('/api/categories'),

  products: ({ category, q } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const qs = params.toString();
    return get('/api/products' + (qs ? `?${qs}` : ''));
  },
  product: (id) => get(`/api/products/${id}`),
  similarProducts: (id) => get(`/api/products/${id}/similar`),

  projects: () => get('/api/projects'),
  project: (id) => get(`/api/projects/${id}`),
  createProject: (data) => post('/api/projects', data),
  updateRequirement: (projectId, reqId, data) => patch(`/api/projects/${projectId}/requirements/${reqId}`, data),
  deleteRequirement: (projectId, reqId) => del(`/api/projects/${projectId}/requirements/${reqId}`),

  customRequests: () => get('/api/custom-requests'),
  customRequest: (id) => get(`/api/custom-requests/${id}`),
  createCustomRequest: (data) => post('/api/custom-requests', data),
  updateCustomRequest: (id, data) => patch(`/api/custom-requests/${id}`, data),

  deals: () => get('/api/deals'),
  deal: (id) => get(`/api/deals/${id}`),
  createDeal: (data) => post('/api/deals', data),
  updateDeal: (id, data) => patch(`/api/deals/${id}`, data),

  notifications: () => get('/api/notifications'),
  orders: () => get('/api/orders'),
  createOrder: (data) => post('/api/orders', data),

  cart: () => get('/api/cart'),
  addToCart: (productId, qty) => post('/api/cart', { productId, qty }),
  removeFromCart: (productId) => del(`/api/cart/${productId}`),

  user: () => get('/api/user'),
  updateUser: (data) => patch('/api/user', data),

  aiSearch: (text) => post('/api/ai/search', { text }),
  aiParseBuild: (text) => post('/api/ai/parse-build', { text }),
  aiParseCustomRequest: (text) => post('/api/ai/parse-custom-request', { text }),
  scanCatalogue: (fileName) => post('/api/catalogue/scan', { fileName }),
};

export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export function timeAgo(ms) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
