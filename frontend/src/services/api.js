import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

// Book Service
export const bookService = {
  async getAllBooks(params = {}) {
    const response = await apiClient.get('/books', { params });
    return response.data;
  },

  async getBook(id) {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  async createBook(bookData) {
    const response = await apiClient.post('/books', bookData);
    return response.data;
  },

  async updateBook(id, bookData) {
    const response = await apiClient.put(`/books/${id}`, bookData);
    return response.data;
  },

  async deleteBook(id) {
    const response = await apiClient.delete(`/books/${id}`);
    return response.data;
  },

  async getMyListings() {
    const response = await apiClient.get('/books/my/listings');
    return response.data;
  }
};

// Order Service
export const orderService = {
  async createOrder(orderData) {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  async getCustomerOrders() {
    const response = await apiClient.get('/orders/my/customer');
    return response.data;
  },

  async getBuyerOrders() {
    const response = await apiClient.get('/orders/my/buyer');
    return response.data;
  },

  async getSellerOrders() {
    const response = await apiClient.get('/orders/my/seller');
    return response.data;
  },

  async updateOrderStatus(orderId, statusData) {
    const response = await apiClient.put(`/orders/${orderId}/status`, statusData);
    return response.data;
  }
};

// GeoJSON Service
export const geoJsonService = {
  async generateExport(exportData) {
    const response = await apiClient.post('/geojson/generate', exportData);
    return response.data;
  },

  async getMyExports() {
    const response = await apiClient.get('/geojson/my-exports');
    return response.data;
  },

  async previewExport(exportId) {
    const response = await apiClient.get(`/geojson/preview/${exportId}`);
    return response.data;
  },

  async downloadExport(exportId) {
    const response = await apiClient.get(`/geojson/download/${exportId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async deleteExport(exportId) {
    const response = await apiClient.delete(`/geojson/${exportId}`);
    return response.data;
  }
};

export default apiClient;
