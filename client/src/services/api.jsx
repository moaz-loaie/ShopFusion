// File: client/src/services/api.js
import axios from 'axios';
import logger from '../utils/logger'; // Assuming a simple frontend logger exists

// Get the API base URL from environment variables, with a fallback for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';
logger.info(`API Service initialized. Base URL: ${API_BASE_URL}`);

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json', // Optional: Be explicit about accepted response type
  },
  withCredentials: true // Important for sending cookies if backend uses httpOnly cookies for session/refresh tokens
});

// --- Request Interceptor ---
// This interceptor runs before each request is sent.
// It's used here to automatically add the JWT Authorization header if a token exists.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
    if (token && !config.headers.Authorization) { // Only add if not already set
      config.headers['Authorization'] = `Bearer ${token}`; // Add Bearer token to header
      logger.debug('API Request Interceptor: Authorization token added to request headers.');
    } else {
      logger.debug('API Request Interceptor: No token found, request sent without Authorization header.');
    }
    return config; // Return the modified config
  },
  (error) => {
    // Handle errors that occur during request setup
    logger.error('API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This interceptor runs after a response is received from the server.
// It's used here to handle common API errors globally (e.g., 401 Unauthorized).
api.interceptors.response.use(
  (response) => response, // Pass through successful responses directly
  (error) => {
    const { response, request, message } = error;

    if (response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = response;
      const errorMessage = data?.message || message || 'An unknown API error occurred.';
      logger.warn(`API Response Error (Status: ${status}): ${errorMessage}`, { requestPath: response.config.url, responseData: data });
    if (status === 401) {
        // Handle Unauthorized errors (e.g., token expired, invalid token)
        logger.warn('API Response Interceptor: Received 401 Unauthorized. Token may be invalid or expired.');
        
        // Don't clear auth data on login attempts
        if (!config.url.includes('/auth/login')) {
          // Clear stored authentication data
          localStorage.removeItem('authToken');
          delete api.defaults.headers.common['Authorization']; // Remove from future requests
          
          // Only redirect to login if not already on auth pages and not verifying token
          const currentPath = window.location.pathname.toLowerCase();
          const isAuthPath = currentPath.includes('/login') || currentPath.includes('/register');
          const isVerifying = config.url.includes('/auth/verify');
          
          if (!isAuthPath && !isVerifying) {
            logger.info('API Response Interceptor: Redirecting to login due to 401.');
            window.location.href = '/login?sessionExpired=true';
          }
        }
      } else if (status === 403) {
        // Handle Forbidden errors (user authenticated but lacks permission)
        logger.warn('API Response Interceptor: Received 403 Forbidden. User lacks permissions for this resource.');
        // Optionally, redirect to an "Access Denied" page or show a global notification.
        // For now, let the calling component handle displaying the error.
      }
      // Other errors (400, 404, 409, 500) will typically be handled by the specific
      // component/hook that made the API call, allowing for context-specific error messages.

    } else if (request) {
      // The request was made but no response was received
      // (e.g., network error, server down, CORS issue not caught by browser preflight)
      logger.error('API Network Error: No response received from server.', message, { requestDetails: request });
      // Modify the error object to provide a more user-friendly message for network issues
      error.message = 'Network error: Could not connect to the server. Please check your internet connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('API Request Setup Error (before sending):', message);
    }

    // Return the original error so it can be caught and handled by the calling code
    return Promise.reject(error);
  }
);


// --- API Service Functions (Organized by resource) ---

// Authentication
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const logoutUser = () => api.get('/auth/logout');
export const verifyAuthToken = () => api.get('/auth/verify');

// User Profile
export const getCurrentUserProfile = () => api.get('/users/me');
export const updateUserProfile = (profileData) => api.patch('/users/me', profileData);
export const changeUserPassword = (passwordData) => api.post('/users/change-password', passwordData);

// User Settings
export const getUserSettings = async () => {
  const response = await api.get('/users/settings');
  return response;
};

export const updateUserSettings = async (settings) => {
  const response = await api.put('/users/settings', settings);
  return response;
};

// Products
/**
 * Get products with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {string} [params.search] - Search term
 * @param {string} [params.sort] - Sort order
 * @param {string} [params.seller_id] - Filter by seller
 * @returns {Promise<Object>} Paginated products response
 */
export const getProducts = async (params = {}) => {
  try {
    logger.debug('Fetching products...', { params });
    const response = await api.get('/products', { params });
    return response.data;
  } catch (error) {
    logger.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post('/products', productData); // Seller/Admin
export const updateProduct = (id, productData) => api.patch(`/products/${id}`, productData); // Seller/Admin

/**
 * Delete a product
 * @param {string} productId - ID of the product to delete
 * @returns {Promise<Object>} Response from the server
 */
export const deleteProduct = async (productId) => {
  try {
    logger.debug('Deleting product:', productId);
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

// Product Categories
export const getCategories = () => api.get('/categories');

// Attach all methods to the api instance for internal use
Object.assign(api, {
  // Auth
  loginUser,
  registerUser,
  logoutUser,
  verifyAuthToken,
  // User
  getCurrentUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserSettings,
  updateUserSettings,
  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  // Categories
  getCategories,
});
export const getCategoryById = (id) => api.get(`/categories/${id}`); // Admin/Public
export const createCategory = (categoryData) => api.post('/categories', categoryData); // Admin
export const updateCategory = (id, categoryData) => api.patch(`/categories/${id}`, categoryData); // Admin
export const deleteCategory = (id) => api.delete(`/categories/${id}`); // Admin

// Reviews (for a specific product)
export const getReviewsForProduct = (productId, params) => api.get(`/products/${productId}/reviews`, { params });
export const addReviewForProduct = (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData);
// Review-specific actions (e.g., update, delete, vote)
export const updateReview = (reviewId, reviewData) => api.patch(`/reviews/${reviewId}`, reviewData);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
export const voteOnReview = (reviewId, voteType) => api.post(`/reviews/${reviewId}/vote`, { vote_type: voteType });

// Shopping Cart
export const getCart = () => api.get('/cart');
export const addItemToCart = (productId, quantity) => api.post('/cart/items', { productId, quantity });
export const updateCartItemQuantity = (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity });
export const removeCartItem = (itemId) => api.delete(`/cart/items/${itemId}`);
export const clearCart = () => api.delete('/cart');

// Orders
export const createOrder = (orderDetails) => api.post('/orders', orderDetails);
export const getMyOrders = (params) => api.get('/orders', { params }); // For current user
export const getOrderById = (id) => api.get(`/orders/${id}`); // For current user (controller checks ownership)
export const cancelMyOrder = (id) => api.patch(`/orders/${id}/cancel`); // For current user

// Seller specific actions
export const getSellerOrders = (params) => api.get('/orders/seller', { params });

// Admin specific actions (prefixed for clarity, routes are under /admin/)
export const adminGetDashboardStats = () => api.get('/admin/dashboard/stats');

export const adminGetAllUsers = (params) => api.get('/admin/users', { params });
export const adminGetUserById = (userId) => api.get(`/admin/users/${userId}`);
export const adminUpdateUser = (userId, userData) => api.patch(`/admin/users/${userId}`, userData);
export const adminDeleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// --- Admin API Functions ---

// Sellers
export const adminGetAllSellers = async (params = {}) => {
  try {
    const response = await api.get('/admin/sellers', { 
      params,
      paramsSerializer: params => {
        // Filter out undefined and null values
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        return new URLSearchParams(cleanParams).toString();
      }
    });
    return response;
  } catch (error) {
    logger.error('Error fetching sellers:', error);
    throw error;
  }
};

export const adminUpdateSellerStatus = async (sellerId, isActive) => {
  try {
    logger.debug(`Updating seller ${sellerId} status to ${isActive}`);
    return await api.patch(`/admin/sellers/${sellerId}/status`, { is_active: isActive });
  } catch (error) {
    logger.error(`Error updating seller ${sellerId} status:`, error);
    throw error;
  }
};

export const adminGetSellerStats = async () => {
  const response = await api.get('/admin/sellers/stats');
  return response;
};

// System Settings
export const getSystemSettings = async () => {
  const response = await api.get('/settings/public');
  return response;
};

export const updateSystemSettings = async (settings) => {
  const response = await api.put('/settings', settings);
  return response;
};

// Search functionality
export const searchProducts = (query) => api.get('/products/search', { params: { query } });
export const searchCategories = (query) => api.get('/categories/search', { params: { query } });
export const searchSuggestions = (query) => api.get('/search/suggestions', { params: { query } });

export const adminGetProductsForModeration = (params) => api.get('/admin/products/moderation', { params });
export const adminModerateProduct = (moderationId, decisionData) => api.patch(`/admin/products/moderation/${moderationId}`, decisionData);
export const adminUpdateModerationFeedback = (moderationId, data) => api.patch(`/admin/products/moderation/${moderationId}/feedback`, data);

export const adminGetAllOrders = (params) => api.get('/admin/orders', { params });
export const adminGetOrderById = (orderId) => api.get(`/admin/orders/${orderId}`); // Admin specific endpoint if different from user's
export const adminUpdateOrderStatus = (orderId, statusData) => api.patch(`/admin/orders/${orderId}/status`, statusData);

export const adminGetAllDisputes = (params) => api.get('/admin/disputes', { params });
export const adminGetDisputeById = (disputeId) => api.get(`/admin/disputes/${disputeId}`);
export const adminUpdateDispute = (disputeId, updateData) => api.patch(`/admin/disputes/${disputeId}`, updateData);

// Seller Dashboard and Analytics
export const getSellerDashboardStats = () => api.get('/seller/dashboard/stats');

/**
 * Get statistics for the products
 * @param {Object} params - Query parameters
 * @param {string} [params.sellerId] - Optional seller ID to filter stats
 * @param {string} [params.timeframe] - Optional timeframe (e.g., 'week', 'month', 'year')
 * @returns {Promise<Object>} Product statistics including total count, status breakdown, etc.
 */
export const getProductStats = async (params = {}) => {
  try {
    logger.debug('Fetching product statistics...', { params });
    const response = await api.get('/products/stats', { params });
    return response.data;
  } catch (error) {
    logger.error('Error fetching product statistics:', error);
    throw error;
  }
};

/**
 * Update multiple products in bulk
 * @param {Array<string>} productIds - Array of product IDs to update
 * @param {Object} actionData - Action to perform
 * @param {string} actionData.action - The action to perform ('activate', 'deactivate', 'restock', etc.)
 * @param {*} [actionData.value] - Optional value for the action (e.g., amount for restock)
 * @returns {Promise<Object>} Response with updated products
 */
export const bulkUpdateProducts = async (productIds, actionData) => {
  try {
    logger.debug('Bulk updating products:', { productIds, actionData });
    const response = await api.patch('/products/bulk', { productIds, ...actionData });
    return response.data;
  } catch (error) {
    logger.error('Error performing bulk update on products:', error);
    throw error;
  }
};

// --- Product Related API Functions ---

// Security-related API functions
export const updatePassword = async (userId, { currentPassword, newPassword }) => {
  try {
    const response = await api.post('/users/change-password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    logger.error('Error updating password:', error);
    throw error;
  }
};

export const enable2FA = async (userId) => {
  try {
    const response = await api.post('/users/2fa/enable');
    return response.data;
  } catch (error) {
    logger.error('Error enabling 2FA:', error);
    throw error;
  }
};

export const disable2FA = async (userId) => {
  try {
    const response = await api.post('/users/2fa/disable');
    return response.data;
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    throw error;
  }
};

// Add to the api instance
Object.assign(api, {
  // Auth
  loginUser,
  registerUser,
  logoutUser,
  verifyAuthToken,
  // User
  getCurrentUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserSettings,
  updateUserSettings,
  // Security
  updatePassword,
  enable2FA,
  disable2FA
});

// Export the api instance to allow direct access to its configuration
export default api;