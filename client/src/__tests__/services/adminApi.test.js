import { adminGetAllSellers, adminUpdateSellerStatus } from '../../services/adminApi';
import api from '../../services/api';

// Mock the api module
jest.mock('../../services/api');
jest.mock('../../utils/logger');

describe('adminApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('adminGetAllSellers', () => {
    it('fetches sellers with default parameters', async () => {
      const mockResponse = {
        data: {
          sellers: [],
          totalSellers: 0,
          activeSellers: 0
        }
      };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await adminGetAllSellers();

      expect(api.get).toHaveBeenCalledWith('/admin/sellers', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('fetches sellers with custom parameters', async () => {
      const params = {
        page: 2,
        limit: 20,
        search: 'john',
        status: 'active'
      };
      const mockResponse = {
        data: {
          sellers: [],
          totalSellers: 0,
          activeSellers: 0
        }
      };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await adminGetAllSellers(params);

      expect(api.get).toHaveBeenCalledWith('/admin/sellers', { params });
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValueOnce(error);

      await expect(adminGetAllSellers()).rejects.toThrow('Network error');
    });
  });

  describe('adminUpdateSellerStatus', () => {
    it('updates seller status successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Status updated successfully'
        }
      };
      api.patch.mockResolvedValueOnce(mockResponse);

      const result = await adminUpdateSellerStatus(1, true);

      expect(api.patch).toHaveBeenCalledWith('/admin/sellers/1/status', {
        isActive: true
      });
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors during status update', async () => {
      const error = new Error('Failed to update status');
      api.patch.mockRejectedValueOnce(error);

      await expect(adminUpdateSellerStatus(1, true)).rejects.toThrow('Failed to update status');
    });

    it('validates sellerId parameter', async () => {
      await expect(adminUpdateSellerStatus(null, true)).rejects.toThrow();
      await expect(adminUpdateSellerStatus(undefined, true)).rejects.toThrow();
    });
  });
});
