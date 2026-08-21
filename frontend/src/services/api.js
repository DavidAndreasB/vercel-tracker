import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request Interceptor: Attach Bearer Token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 Unauthorized ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/register', data),
  login:    (data) => api.post('/login', data),
  logout:   ()     => api.post('/logout'),
};

// ═══════════════════════════════════════════════════════════
// WALLETS API
// ═══════════════════════════════════════════════════════════
export const walletsAPI = {
  getAll:  ()           => api.get('/wallets'),
  getOne:  (id)         => api.get(`/wallets/${id}`),
  create:  (data)       => api.post('/wallets', data),
  update:  (id, data)   => api.put(`/wallets/${id}`, data),
  delete:  (id)         => api.delete(`/wallets/${id}`),
};

// ═══════════════════════════════════════════════════════════
// CATEGORIES API
// ═══════════════════════════════════════════════════════════
export const categoriesAPI = {
  getAll:  ()           => api.get('/categories'),
  getOne:  (id)         => api.get(`/categories/${id}`),
  create:  (data)       => api.post('/categories', data),
  update:  (id, data)   => api.put(`/categories/${id}`, data),
  delete:  (id)         => api.delete(`/categories/${id}`),
};

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS API
// ═══════════════════════════════════════════════════════════
export const transactionsAPI = {
  getAll:  (page = 1)   => api.get(`/transactions?page=${page}`),
  getOne:  (id)         => api.get(`/transactions/${id}`),
  create:  (data)       => api.post('/transactions', data),
  update:  (id, data)   => api.put(`/transactions/${id}`, data),
  delete:  (id)         => api.delete(`/transactions/${id}`),
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD API
// ═══════════════════════════════════════════════════════════
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
