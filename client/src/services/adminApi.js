import api from './api';
import logger from '../utils/logger';

/**
 * @typedef {Object} GetSellersParams
 * @property {number} [page=1] - Current page number
 * @property {number} [limit=10] - Number of items per page
 * @property {string} [search] - Search term for filtering sellers
 * @property {string} [status] - Filter by seller status ('active' or 'inactive')
 * @property {string} [productCount] - Filter by number of products
 */

/**
 * @typedef {Object} Seller
 * @property {number} id - Seller's unique identifier
 * @property {string} full_name - Seller's full name
 * @property {string} email - Seller's email address
 * @property {boolean} is_active - Seller's active status
 * @property {number} product_count - Number of products by seller
 */

/**
 * Get all sellers with pagination and filters
 * @param {GetSellersParams} params - Query parameters
 * @returns {Promise<{data: { sellers: Seller[], totalSellers: number, activeSellers: number }}>}
 */
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
    
    // Validate response structure
    if (!response?.data?.data?.sellers) {
      throw new Error('Invalid response format from server');
    }
    
    return response;
  } catch (error) {
    logger.error('Error fetching sellers:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch sellers. Please try again.'
    );
  }
};

/**
 * Update seller active status
 * @param {number} sellerId - The ID of the seller to update
 * @param {boolean} isActive - The new active status
 * @returns {Promise<{data: { message: string }}>}
 * @throws {Error} If sellerId is invalid or API request fails
 */
export const adminUpdateSellerStatus = async (sellerId, isActive) => {
  try {
    // Validate parameters
    if (!sellerId || typeof sellerId !== 'number') {
      throw new Error('Invalid seller ID');
    }
    if (typeof isActive !== 'boolean') {
      throw new Error('isActive must be a boolean');
    }

    const response = await api.patch(`/admin/sellers/${sellerId}/status`, {
      isActive
    });

    if (!response?.data?.data?.seller) {
      throw new Error('Invalid response format from server');
    }

    logger.info(
      `Successfully ${isActive ? 'activated' : 'deactivated'} seller ${sellerId}`
    );
    return response;
  } catch (error) {
    logger.error(`Error updating seller ${sellerId} status:`, error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to update seller status. Please try again.'
    );
  }
};

/**
 * Get seller statistics for admin dashboard
 * @returns {Promise} Response with seller stats
 */
export const adminGetSellerStats = async () => {
  try {
    const response = await api.get('/admin/sellers/stats');
    
    if (!response?.data?.data) {
      throw new Error('Invalid response format from server');
    }
    
    return response;
  } catch (error) {
    logger.error('Error fetching seller stats:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch seller statistics. Please try again.'
    );
  }
};

/**
 * Get all disputes with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise} Response with disputes data
 */
export const adminGetAllDisputes = async (params = {}) => {
  try {
    const response = await api.get('/admin/disputes', { 
      params,
      paramsSerializer: params => {
        // Filter out undefined and null values
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== '')
        );
        return new URLSearchParams(cleanParams).toString();
      }
    });
    
    if (!response?.data?.data?.disputes) {
      throw new Error('Invalid response format from server');
    }
    
    return response;
  } catch (error) {
    logger.error('Error fetching disputes:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch disputes. Please try again.'
    );
  }
};

/**
 * Resolve or reject a dispute
 * @param {number} disputeId The ID of the dispute
 * @param {Object} updateData The update data (status, resolution_details)
 * @returns {Promise} Response with updated dispute
 */
export const adminUpdateDisputeStatus = async (disputeId, updateData) => {
  try {
    const response = await api.patch(`/admin/disputes/${disputeId}`, updateData);
    
    if (!response?.data?.data?.dispute) {
      throw new Error('Invalid response format from server');
    }
    
    return response;
  } catch (error) {
    logger.error('Error updating dispute:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to update dispute. Please try again.'
    );
  }
};

/**
 * Get a dispute by ID
 * @param {number} disputeId The ID of the dispute
 * @returns {Promise} Response with dispute details
 */
export const adminGetDisputeById = async (disputeId) => {
  try {
    const response = await api.get(`/admin/disputes/${disputeId}`);
    
    if (!response?.data?.data?.dispute) {
      throw new Error('Invalid response format from server');
    }
    
    return response;
  } catch (error) {
    logger.error('Error fetching dispute:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch dispute details. Please try again.'
    );
  }
};

/**
 * Get admin dashboard statistics
 * @returns {Promise<{data: { sellers: Object, products: Object, revenue: Object }}>}
 */
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    throw error;
  }
};

/**
 * Get dispute statistics
 * @returns {Promise<{data: { total: number, open: number, urgent: number, averageResolutionTime: number }}>}
 */
export const getDisputeStats = async () => {
  try {
    const response = await api.get('/admin/disputes/stats');
    return response.data;
  } catch (error) {
    logger.error('Error fetching dispute stats:', error);
    throw error;
  }
};
