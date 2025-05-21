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
    if (token) {
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
        // Clear stored authentication data
        localStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization']; // Remove from future requests

        // Redirect to login page, unless already on login or register page to avoid loops.
        // The 'sessionExpired=true' query param can be used by LoginPage to show a message.
        const currentPath = window.location.pathname.toLowerCase();
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          logger.info('API Response Interceptor: Redirecting to login due to 401.');
          window.location.href = '/login?sessionExpired=true';
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
export const logoutUser = () => api.get('/auth/logout'); // Ensure backend has this (even if just for consistency)
export const verifyAuthToken = () => api.get('/auth/verify'); // To check token validity

// User Profile
export const getCurrentUserProfile = () => api.get('/users/me');
export const updateUserProfile = (profileData) => api.patch('/users/me', profileData);
export const changeUserPassword = (passwordData) => api.post('/users/change-password', passwordData);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post('/products', productData); // Seller/Admin
export const updateProduct = (id, productData) => api.patch(`/products/${id}`, productData); // Seller/Admin
export const deleteProduct = (id) => api.delete(`/products/${id}`); // Seller/Admin

// Product Categories
export const getCategories = () => api.get('/categories');
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

// Admin specific actions (prefixed for clarity, routes are under /admin/)
export const adminGetAllUsers = (params) => api.get('/admin/users', { params });
export const adminGetUserById = (userId) => api.get(`/admin/users/${userId}`);
export const adminUpdateUser = (userId, userData) => api.patch(`/admin/users/${userId}`, userData);
export const adminDeleteUser = (userId) => api.delete(`/admin/users/${userId}`);

export const adminGetProductsForModeration = (params) => api.get('/admin/products/moderation', { params });
export const adminModerateProduct = (moderationId, decisionData) => api.patch(`/admin/products/moderation/${moderationId}`, decisionData);

export const adminGetAllOrders = (params) => api.get('/admin/orders', { params });
export const adminGetOrderById = (orderId) => api.get(`/admin/orders/${orderId}`); // Admin specific endpoint if different from user's
export const adminUpdateOrderStatus = (orderId, statusData) => api.patch(`/admin/orders/${orderId}/status`, statusData);

export const adminGetAllDisputes = (params) => api.get('/admin/disputes', { params });
export const adminGetDisputeById = (disputeId) => api.get(`/admin/disputes/${disputeId}`);
export const adminUpdateDispute = (disputeId, updateData) => api.patch(`/admin/disputes/${disputeId}`, updateData);

export default api; // Export the configured Axios instance