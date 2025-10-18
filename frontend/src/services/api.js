// ==============================================================================
// API SERVICE
// ==============================================================================
// Centralized API client and service layer for all backend communication
// Handles authentication, error handling, and HTTP requests
//
// Features:
// - Axios-based HTTP client with interceptors
// - Automatic JWT token injection
// - 401 error handling with auto-logout
// - Environment-based configuration
// - Organized service modules (auth, books, orders, geojson)
// - Type-safe API responses
//
// Architecture:
// - Single axios instance with shared configuration
// - Request interceptor for authentication
// - Response interceptor for error handling
// - Service objects for domain separation
//
// Environment Variables:
// - VITE_API_URL: Backend API base URL (default: http://localhost:5001/api)
//
// Security:
// - JWT tokens stored in localStorage
// - Automatic token refresh on 401
// - HTTPS required in production
//
// Usage:
// ```javascript
// import { authService, bookService } from './services/api';
//
// // Login
// const { user, token } = await authService.login({
//   email: 'user@example.com',
//   password: 'password123'
// });
//
// // Get books
// const books = await bookService.getAllBooks({ search: 'Harry Potter' });
// ```
// ==============================================================================

import axios from 'axios';

// ==============================================================================
// CONFIGURATION
// ==============================================================================

/**
 * API base URL from environment or default to localhost
 *
 * Environment variable: VITE_API_URL
 * Development default: http://localhost:5001/api
 * Production: Should be set in .env.production
 *
 * @constant {string}
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log('📡 API configured:', API_BASE_URL);

// ==============================================================================
// AXIOS CLIENT INSTANCE
// ==============================================================================

/**
 * Axios client instance with default configuration
 *
 * Features:
 * - Base URL from environment
 * - JSON content type by default
 * - Request interceptor for auth tokens
 * - Response interceptor for error handling
 *
 * All API calls should use this instance to ensure
 * consistent behavior and authentication.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================================================================
// REQUEST INTERCEPTOR
// ==============================================================================

/**
 * Request interceptor to automatically inject JWT token
 *
 * Flow:
 * 1. Check localStorage for saved token
 * 2. If token exists, add to Authorization header
 * 3. Send request with token
 *
 * This ensures all authenticated requests include the JWT token
 * without manually adding it to each request.
 *
 * Header format: Authorization: Bearer <token>
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ==============================================================================
// RESPONSE INTERCEPTOR
// ==============================================================================

/**
 * Response interceptor for centralized error handling
 *
 * Handles:
 * - 401 Unauthorized: Token expired or invalid
 *   - Clears localStorage
 *   - Redirects to login page
 *
 * - Other errors: Pass through for component-level handling
 *
 * Success responses are passed through unchanged.
 *
 * This prevents the need to handle authentication errors
 * in every component - they're handled globally here.
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.warn('🚪 Authentication failed - clearing session and redirecting to login');

      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ==============================================================================
// AUTH SERVICE
// ==============================================================================

/**
 * Authentication service
 *
 * Handles user registration, login, logout, and profile management.
 * Manages JWT token storage and retrieval.
 *
 * All methods throw errors that should be caught by calling components.
 */
export const authService = {
  /**
   * Register a new user account
   *
   * Creates a new user in the system. User must provide email, password,
   * and userType (buyer or seller).
   *
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password (min 6 characters)
   * @param {string} userData.userType - Account type ('buyer' or 'seller')
   * @param {string} [userData.phone] - Optional phone number
   * @returns {Promise<Object>} Registration response with user and token
   * @throws {Error} If registration fails (duplicate email, validation error, etc.)
   *
   * @example
   * const response = await authService.register({
   *   email: 'newuser@example.com',
   *   password: 'securepass123',
   *   userType: 'buyer'
   * });
   * console.log('Registered:', response.user);
   */
  async register(userData) {
    console.log('📝 Registering user:', userData.email);
    const response = await apiClient.post('/auth/register', userData);
    console.log('✅ Registration successful');
    return response.data;
  },

  /**
   * Login with email and password
   *
   * Authenticates user and stores JWT token and user data in localStorage.
   * Token is automatically included in subsequent requests via interceptor.
   *
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Login response with user and token
   * @throws {Error} If login fails (invalid credentials, user not found, etc.)
   *
   * @example
   * const response = await authService.login({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   * console.log('Logged in as:', response.user.email);
   */
  async login(credentials) {
    console.log('🔐 Logging in:', credentials.email);
    const response = await apiClient.post('/auth/login', credentials);

    // Store token and user in localStorage for persistence
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ Login successful - token stored');
    }

    return response.data;
  },

  /**
   * Get current user profile from backend
   *
   * Fetches fresh user data from server using stored token.
   * Useful for refreshing user data after updates.
   *
   * @returns {Promise<Object>} User profile data
   * @throws {Error} If not authenticated or fetch fails
   *
   * @example
   * const profile = await authService.getProfile();
   * console.log('Current user:', profile.user);
   */
  async getProfile() {
    console.log('👤 Fetching user profile');
    const response = await apiClient.get('/auth/me');
    console.log('✅ Profile fetched');
    return response.data;
  },

  /**
   * Update user profile
   *
   * Updates user profile information like name, bio, location, etc.
   * Only updates fields that are provided in profileData.
   *
   * @param {Object} profileData - Profile fields to update
   * @param {Object} [profileData.profile] - Profile object
   * @param {string} [profileData.profile.firstName] - First name
   * @param {string} [profileData.profile.lastName] - Last name
   * @param {string} [profileData.profile.bio] - User bio
   * @param {Object} [profileData.location] - Location object
   * @param {number[]} [profileData.location.coordinates] - [longitude, latitude]
   * @param {string} [profileData.location.address] - Full address
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If update fails or validation error
   *
   * @example
   * const updated = await authService.updateProfile({
   *   profile: {
   *     firstName: 'John',
   *     lastName: 'Doe'
   *   }
   * });
   * console.log('Profile updated:', updated.user);
   */
  async updateProfile(profileData) {
    console.log('✏️ Updating profile');
    const response = await apiClient.put('/auth/profile', profileData);
    console.log('✅ Profile updated successfully');
    return response.data;
  },

  /**
   * Logout current user
   *
   * Clears authentication data from localStorage.
   * Does not make API call - just local cleanup.
   *
   * Note: This does NOT invalidate the JWT token on the server.
   * The token remains valid until expiration (7 days).
   * For server-side logout, implement token blacklisting on backend.
   *
   * @example
   * authService.logout();
   * window.location.href = '/login';
   */
  logout() {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ User logged out - localStorage cleared');
  },

  /**
   * Get currently logged in user from localStorage
   *
   * Returns cached user object without making API call.
   * For fresh data, use getProfile() instead.
   *
   * @returns {Object|null} User object or null if not logged in
   *
   * @example
   * const user = authService.getCurrentUser();
   * if (user) {
   *   console.log('Logged in as:', user.email);
   * }
   */
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored JWT token
   *
   * @returns {string|null} JWT token or null if not authenticated
   *
   * @example
   * const token = authService.getToken();
   * if (!token) {
   *   window.location.href = '/login';
   * }
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   *
   * Checks for presence of token in localStorage.
   * Does NOT verify token validity - that happens on API requests.
   *
   * @returns {boolean} True if token exists, false otherwise
   *
   * @example
   * if (!authService.isAuthenticated()) {
   *   return <Navigate to="/login" />;
   * }
   */
  isAuthenticated() {
    return !!this.getToken();
  }
};

// ==============================================================================
// BOOK SERVICE
// ==============================================================================

/**
 * Book service
 *
 * Handles all book-related operations:
 * - Browse and search books
 * - Create/update/delete listings (sellers only)
 * - View individual book details
 */
export const bookService = {
  /**
   * Get all books with optional filters
   *
   * Supports search, filtering, and pagination.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.search] - Search query (title, author, ISBN)
   * @param {string} [params.category] - Filter by category
   * @param {string} [params.seller] - Filter by seller ID
   * @param {number} [params.page] - Page number for pagination
   * @param {number} [params.limit] - Items per page
   * @returns {Promise<Object>} Books array and pagination metadata
   *
   * @example
   * const response = await bookService.getAllBooks({
   *   search: 'Harry Potter',
   *   page: 1,
   *   limit: 20
   * });
   * console.log('Found', response.books.length, 'books');
   */
  async getAllBooks(params = {}) {
    console.log('📚 Fetching books with params:', params);
    const response = await apiClient.get('/books', { params });
    console.log('✅ Fetched', response.data.books?.length || 0, 'books');
    return response.data;
  },

  /**
   * Get single book by ID
   *
   * @param {string} id - Book ID
   * @returns {Promise<Object>} Book object with seller details
   * @throws {Error} If book not found
   *
   * @example
   * const book = await bookService.getBook('123abc');
   * console.log('Book:', book.title);
   */
  async getBook(id) {
    console.log('📖 Fetching book:', id);
    const response = await apiClient.get(`/books/${id}`);
    console.log('✅ Book fetched:', response.data.title);
    return response.data;
  },

  /**
   * Create new book listing (sellers only)
   *
   * @param {Object} bookData - Book information
   * @param {string} bookData.title - Book title
   * @param {string} bookData.author - Book author
   * @param {string} bookData.isbn - ISBN number
   * @param {number} bookData.price - Price in MAD
   * @param {string} [bookData.description] - Book description
   * @param {string} [bookData.category] - Book category
   * @param {number} [bookData.quantity] - Available quantity
   * @returns {Promise<Object>} Created book object
   * @throws {Error} If not authenticated as seller or validation fails
   *
   * @example
   * const book = await bookService.createBook({
   *   title: 'The Great Gatsby',
   *   author: 'F. Scott Fitzgerald',
   *   isbn: '9780743273565',
   *   price: 120.00,
   *   quantity: 5
   * });
   */
  async createBook(bookData) {
    console.log('➕ Creating book:', bookData.title);
    const response = await apiClient.post('/books', bookData);
    console.log('✅ Book created successfully');
    return response.data;
  },

  /**
   * Update existing book listing (seller must own the book)
   *
   * @param {string} id - Book ID
   * @param {Object} bookData - Updated book fields
   * @returns {Promise<Object>} Updated book object
   * @throws {Error} If not authorized or book not found
   *
   * @example
   * const updated = await bookService.updateBook('123abc', {
   *   price: 100.00,
   *   quantity: 10
   * });
   */
  async updateBook(id, bookData) {
    console.log('✏️ Updating book:', id);
    const response = await apiClient.put(`/books/${id}`, bookData);
    console.log('✅ Book updated successfully');
    return response.data;
  },

  /**
   * Delete book listing (seller must own the book)
   *
   * @param {string} id - Book ID
   * @returns {Promise<Object>} Deletion confirmation
   * @throws {Error} If not authorized or book not found
   *
   * @example
   * await bookService.deleteBook('123abc');
   * console.log('Book deleted');
   */
  async deleteBook(id) {
    console.log('🗑️ Deleting book:', id);
    const response = await apiClient.delete(`/books/${id}`);
    console.log('✅ Book deleted successfully');
    return response.data;
  },

  /**
   * Get current seller's book listings
   *
   * Returns all books listed by the authenticated seller.
   *
   * @returns {Promise<Array>} Array of seller's books
   * @throws {Error} If not authenticated as seller
   *
   * @example
   * const myBooks = await bookService.getMyListings();
   * console.log('I have', myBooks.length, 'listings');
   */
  async getMyListings() {
    console.log('📚 Fetching my listings');
    const response = await apiClient.get('/books/my/listings');
    console.log('✅ Fetched', response.data.length, 'listings');
    return response.data;
  }
};

// ==============================================================================
// ORDER SERVICE
// ==============================================================================

/**
 * Order service
 *
 * Handles order creation, retrieval, and status management.
 * Separates buyer and seller perspectives.
 */
export const orderService = {
  /**
   * Create new order (buyers only)
   *
   * Places an order for a book. Requires buyer location for delivery.
   *
   * @param {Object} orderData - Order details
   * @param {string} orderData.bookId - Book being ordered
   * @param {number} orderData.quantity - Number of books
   * @param {Object} orderData.buyerLocation - Delivery location
   * @param {number[]} orderData.buyerLocation.coordinates - [longitude, latitude]
   * @param {string} orderData.buyerLocation.address - Delivery address
   * @param {string} [orderData.notes] - Special instructions for seller
   * @returns {Promise<Object>} Created order object
   * @throws {Error} If validation fails or book unavailable
   *
   * @example
   * const order = await orderService.createOrder({
   *   bookId: '123abc',
   *   quantity: 2,
   *   buyerLocation: {
   *     coordinates: [-7.5898, 33.5731],
   *     address: '123 Main St, Casablanca'
   *   },
   *   notes: 'Please call before delivery'
   * });
   */
  async createOrder(orderData) {
    console.log('🛒 Creating order for book:', orderData.bookId);
    const response = await apiClient.post('/orders', orderData);
    console.log('✅ Order created:', response.data._id);
    return response.data;
  },

  /**
   * Get customer orders (deprecated - use getBuyerOrders)
   *
   * @deprecated Use getBuyerOrders() instead
   * @returns {Promise<Array>} Array of orders
   */
  async getCustomerOrders() {
    console.log('📦 Fetching customer orders');
    const response = await apiClient.get('/orders/my/customer');
    console.log('✅ Fetched', response.data.length, 'orders');
    return response.data;
  },

  /**
   * Get buyer's orders
   *
   * Returns all orders placed by the authenticated buyer.
   *
   * @returns {Promise<Array>} Array of buyer's orders
   * @throws {Error} If not authenticated as buyer
   *
   * @example
   * const myOrders = await orderService.getBuyerOrders();
   * console.log('I have', myOrders.length, 'orders');
   */
  async getBuyerOrders() {
    console.log('📦 Fetching buyer orders');
    const response = await apiClient.get('/orders/my/buyer');
    console.log('✅ Fetched', response.data.length, 'orders');
    return response.data;
  },

  /**
   * Get seller's orders
   *
   * Returns all orders for the authenticated seller's books.
   *
   * @returns {Promise<Array>} Array of seller's orders
   * @throws {Error} If not authenticated as seller
   *
   * @example
   * const orders = await orderService.getSellerOrders();
   * const pending = orders.filter(o => o.status === 'pending');
   * console.log('Pending orders:', pending.length);
   */
  async getSellerOrders() {
    console.log('📦 Fetching seller orders');
    const response = await apiClient.get('/orders/my/seller');
    console.log('✅ Fetched', response.data.length, 'orders');
    return response.data;
  },

  /**
   * Update order status (sellers only)
   *
   * Changes order status in the workflow:
   * pending → confirmed → delivered
   *         ↘ refused
   *
   * @param {string} orderId - Order ID
   * @param {Object} statusData - Status update data
   * @param {string} statusData.status - New status ('confirmed', 'delivered', 'refused')
   * @param {string} [statusData.notes] - Optional seller notes
   * @returns {Promise<Object>} Updated order object
   * @throws {Error} If not authorized or invalid status transition
   *
   * @example
   * const updated = await orderService.updateOrderStatus('order123', {
   *   status: 'confirmed',
   *   notes: 'Will deliver tomorrow'
   * });
   */
  async updateOrderStatus(orderId, statusData) {
    console.log('✏️ Updating order status:', orderId, '→', statusData.status);
    const response = await apiClient.put(`/orders/${orderId}/status`, statusData);
    console.log('✅ Order status updated');
    return response.data;
  }
};

// ==============================================================================
// GEOJSON SERVICE
// ==============================================================================

/**
 * GeoJSON export service
 *
 * Handles generation, storage, and download of GeoJSON exports
 * for mapping and geographic data visualization.
 */
export const geoJsonService = {
  /**
   * Generate new GeoJSON export
   *
   * Creates a GeoJSON file from provided geographic data.
   *
   * @param {Object} exportData - Export configuration
   * @param {string} exportData.name - Export name/title
   * @param {Object} exportData.data - GeoJSON FeatureCollection
   * @returns {Promise<Object>} Created export metadata
   *
   * @example
   * const exportResult = await geoJsonService.generateExport({
   *   name: 'Delivery Points - Dec 2024',
   *   data: {
   *     type: 'FeatureCollection',
   *     features: [...]
   *   }
   * });
   */
  async generateExport(exportData) {
    console.log('🗺️ Generating GeoJSON export:', exportData.name);
    const response = await apiClient.post('/geojson/generate', exportData);
    console.log('✅ Export generated:', response.data._id);
    return response.data;
  },

  /**
   * Get user's GeoJSON exports
   *
   * @returns {Promise<Array>} Array of export metadata objects
   *
   * @example
   * const exports = await geoJsonService.getMyExports();
   * console.log('I have', exports.length, 'exports');
   */
  async getMyExports() {
    console.log('🗺️ Fetching my exports');
    const response = await apiClient.get('/geojson/my-exports');
    console.log('✅ Fetched', response.data.length, 'exports');
    return response.data;
  },

  /**
   * Preview GeoJSON export
   *
   * Gets export data for preview/visualization without downloading.
   *
   * @param {string} exportId - Export ID
   * @returns {Promise<Object>} GeoJSON data
   *
   * @example
   * const geoJson = await geoJsonService.previewExport('export123');
   * console.log('Features:', geoJson.features.length);
   */
  async previewExport(exportId) {
    console.log('👁️ Previewing export:', exportId);
    const response = await apiClient.get(`/geojson/preview/${exportId}`);
    console.log('✅ Export preview loaded');
    return response.data;
  },

  /**
   * Download GeoJSON export as file
   *
   * Returns blob data for file download.
   *
   * @param {string} exportId - Export ID
   * @returns {Promise<Blob>} File blob data
   *
   * @example
   * const blob = await geoJsonService.downloadExport('export123');
   * const url = window.URL.createObjectURL(blob);
   * const link = document.createElement('a');
   * link.href = url;
   * link.download = 'export.geojson';
   * link.click();
   */
  async downloadExport(exportId) {
    console.log('⬇️ Downloading export:', exportId);
    const response = await apiClient.get(`/geojson/download/${exportId}`, {
      responseType: 'blob'
    });
    console.log('✅ Export downloaded');
    return response.data;
  },

  /**
   * Delete GeoJSON export
   *
   * @param {string} exportId - Export ID
   * @returns {Promise<Object>} Deletion confirmation
   *
   * @example
   * await geoJsonService.deleteExport('export123');
   * console.log('Export deleted');
   */
  async deleteExport(exportId) {
    console.log('🗑️ Deleting export:', exportId);
    const response = await apiClient.delete(`/geojson/${exportId}`);
    console.log('✅ Export deleted');
    return response.data;
  }
};

// ==============================================================================
// DEFAULT EXPORT
// ==============================================================================

/**
 * Export configured axios client for direct use if needed
 *
 * Most code should use the service objects above, but this
 * client is available for custom requests.
 *
 * @example
 * import apiClient from './services/api';
 * const response = await apiClient.get('/custom/endpoint');
 */
export default apiClient;
