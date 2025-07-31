import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStatus } from '../../services/productApi';
import api from '../../services/api';

// Mock the api module
jest.mock('../../services/api');
jest.mock('../../utils/logger');

describe('productApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    const mockResponse = {
      data: {
        products: [],
        totalItems: 0,
        totalPages: 0
      }
    };

    it('fetches products with default parameters', async () => {
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await getProducts();
      
      expect(api.get).toHaveBeenCalledWith('/products', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('fetches products with filter parameters', async () => {
      const params = {
        status: 'approved',
        category: '1',
        search: 'test',
        minPrice: '10',
        maxPrice: '100',
        page: 1,
        limit: 12
      };

      api.get.mockResolvedValueOnce(mockResponse);

      const result = await getProducts(params);
      
      expect(api.get).toHaveBeenCalledWith('/products', { params });
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValueOnce(error);

      await expect(getProducts()).rejects.toThrow('Network error');
    });
  });

  describe('getProductById', () => {
    it('fetches a single product', async () => {
      const mockProduct = { id: 1, name: 'Test Product' };
      api.get.mockResolvedValueOnce({ data: { product: mockProduct } });

      const result = await getProductById(1);
      
      expect(api.get).toHaveBeenCalledWith('/products/1');
      expect(result.data.product).toEqual(mockProduct);
    });

    it('handles non-existent product', async () => {
      api.get.mockRejectedValueOnce(new Error('Product not found'));

      await expect(getProductById(999)).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    const mockProductData = {
      name: 'New Product',
      price: 99.99,
      description: 'Test description'
    };

    it('creates a new product', async () => {
      const mockResponse = {
        data: {
          product: { id: 1, ...mockProductData }
        }
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await createProduct(mockProductData);
      
      expect(api.post).toHaveBeenCalledWith('/products', mockProductData);
      expect(result).toEqual(mockResponse);
    });

    it('handles validation errors', async () => {
      const error = new Error('Validation failed');
      api.post.mockRejectedValueOnce(error);

      await expect(createProduct({})).rejects.toThrow('Validation failed');
    });
  });

  describe('updateProduct', () => {
    const mockUpdateData = {
      name: 'Updated Name',
      price: 149.99
    };

    it('updates an existing product', async () => {
      const mockResponse = {
        data: {
          product: { id: 1, ...mockUpdateData }
        }
      };
      api.patch.mockResolvedValueOnce(mockResponse);

      const result = await updateProduct(1, mockUpdateData);
      
      expect(api.patch).toHaveBeenCalledWith('/products/1', mockUpdateData);
      expect(result).toEqual(mockResponse);
    });

    it('handles non-existent product update', async () => {
      api.patch.mockRejectedValueOnce(new Error('Product not found'));

      await expect(updateProduct(999, mockUpdateData)).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('deletes a product', async () => {
      api.delete.mockResolvedValueOnce();

      await deleteProduct(1);
      
      expect(api.delete).toHaveBeenCalledWith('/products/1');
    });

    it('handles deletion of non-existent product', async () => {
      api.delete.mockRejectedValueOnce(new Error('Product not found'));

      await expect(deleteProduct(999)).rejects.toThrow('Product not found');
    });
  });

  describe('updateProductStatus', () => {
    it('updates product status', async () => {
      const mockResponse = {
        data: {
          product: { id: 1, status: 'approved' }
        }
      };
      api.patch.mockResolvedValueOnce(mockResponse);

      const result = await updateProductStatus(1, 'approved');
      
      expect(api.patch).toHaveBeenCalledWith('/products/1/status', { status: 'approved' });
      expect(result).toEqual(mockResponse);
    });

    it('handles invalid status update', async () => {
      api.patch.mockRejectedValueOnce(new Error('Invalid status'));

      await expect(updateProductStatus(1, 'invalid')).rejects.toThrow('Invalid status');
    });
  });
});
