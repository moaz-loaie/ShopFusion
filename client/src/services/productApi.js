import api from './api';
import logger from '../utils/logger';

/**
 * @typedef {Object} ProductFilters
 * @property {string} [status] - Filter by product status (approved, pending, rejected)
 * @property {string} [category] - Filter by category ID
 * @property {string} [search] - Search term
 * @property {string} [minPrice] - Minimum price
 * @property {string} [maxPrice] - Maximum price
 * @property {number} [page] - Page number
 * @property {number} [limit] - Items per page
 */

/**
 * Get products with filtering and pagination
 * @param {ProductFilters} params - Query parameters
 * @param {string} endpoint - API endpoint based on user role
 * @returns {Promise<{data: {products: Array, totalItems: number, totalPages: number}}>}
 */
export const getProducts = async (params = {}, endpoint = '/products') => {
  try {
    const response = await api.get(endpoint, { params });
    if (!response?.data) {
      throw new Error('Invalid response format from server');
    }

    const { data } = response.data;
    
    if (!data) {
      // If no data field, try using the response directly
      if (Array.isArray(response.data)) {
        return {
          data: {
            products: response.data,
            total: response.data.length
          }
        };
      }
      throw new Error('Invalid response format from server');
    }

    // Normalize the response to a consistent format
    const products = Array.isArray(data) ? data : data.products || data.data?.products || [];
    const total = typeof data.total === 'number' ? data.total : 
                 typeof data.totalProducts === 'number' ? data.totalProducts :
                 products.length;
    
    return {
      data: {
        products,
        total,
        currentPage: parseInt(params.page || 1, 10),
        totalPages: Math.ceil(total / (parseInt(params.limit || 12, 10)))
      }
    };
  } catch (error) {
    logger.error('Error fetching products:', error, { params, endpoint });
    throw error;
  }
};

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<{data: {product: Object}}>}
 */
export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response;
  } catch (error) {
    logger.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new product (seller only)
 * @param {Object} productData - Product data
 * @returns {Promise<{data: {product: Object}}>}
 */
export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response;
  } catch (error) {
    logger.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update a product (seller only - own products)
 * @param {number} id - Product ID
 * @param {Object} updateData - Updated product data
 * @returns {Promise<{data: {product: Object}}>}
 */
export const updateProduct = async (id, updateData) => {
  try {
    const response = await api.patch(`/products/${id}`, updateData);
    return response;
  } catch (error) {
    logger.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a product (seller only - own products)
 * @param {number} id - Product ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
  } catch (error) {
    logger.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

/**
 * Update product status (admin only)
 * @param {number} id - Product ID
 * @param {string} status - New status (approved, rejected)
 * @returns {Promise<{data: {product: Object}}>}
 */
export const updateProductStatus = async (id, status) => {
  try {
    const response = await api.patch(`/products/${id}/status`, { status });
    return response;
  } catch (error) {
    logger.error(`Error updating product ${id} status:`, error);
    throw error;
  }
};

/**
 * Get all product categories
 * @returns {Promise<{data: {categories: Array}}>}
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return {
      data: {
        categories: response.data.data?.categories || []
      }
    };
  } catch (error) {
    logger.error('Error fetching categories:', error);
    throw error;
  }
};
