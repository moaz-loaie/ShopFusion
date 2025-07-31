import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import ProductListPage from '../../../pages/Product/ProductListPage';
import { getProducts, getCategories } from '../../../services/api';

jest.mock('../../../services/api');

const mockProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    price: 99.99,
    status: 'approved',
    seller_id: 1,
  },
  {
    id: 2,
    name: 'Test Product 2',
    price: 149.99,
    status: 'pending',
    seller_id: 2,
  },
];

const mockCategories = [
  { id: 1, name: 'Category 1' },
  { id: 2, name: 'Category 2' },
];

describe('ProductListPage Role-based Tests', () => {
  beforeEach(() => {
    getCategories.mockResolvedValue({ data: { categories: mockCategories } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows only approved products for customers', async () => {
    const approvedProducts = mockProducts.filter(p => p.status === 'approved');
    getProducts.mockResolvedValue({
      data: {
        data: { products: approvedProducts },
        currentPage: 1,
        totalPages: 1,
        totalProducts: approvedProducts.length,
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { role: 'customer' } }}>
          <ProductListPage />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Should only see approved products
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
      // Status filter should not be visible
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });
  });

  it('shows all status options for admin', async () => {
    getProducts.mockResolvedValue({
      data: {
        data: { products: mockProducts },
        currentPage: 1,
        totalPages: 1,
        totalProducts: mockProducts.length,
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { role: 'admin' } }}>
          <ProductListPage />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Admin should see all products
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      // Status filter should be visible with all options
      const statusFilter = screen.getByLabelText(/status/i);
      expect(statusFilter).toBeInTheDocument();
      expect(screen.getByText(/pending review/i)).toBeInTheDocument();
      expect(screen.getByText(/approved products/i)).toBeInTheDocument();
      expect(screen.getByText(/rejected products/i)).toBeInTheDocument();
    });
  });

  it('shows correct status options for seller', async () => {
    const sellerProducts = mockProducts.filter(
      p => p.seller_id === 1 || p.status === 'approved',
    );
    getProducts.mockResolvedValue({
      data: {
        data: { products: sellerProducts },
        currentPage: 1,
        totalPages: 1,
        totalProducts: sellerProducts.length,
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { role: 'seller', id: 1 } }}>
          <ProductListPage />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      // Status filter should show seller-specific options
      const statusFilter = screen.getByLabelText(/status/i);
      expect(statusFilter).toBeInTheDocument();
      expect(screen.getByText(/my products only/i)).toBeInTheDocument();
      expect(screen.getByText(/other sellers' approved products/i)).toBeInTheDocument();
      expect(screen.getByText(/my pending products/i)).toBeInTheDocument();
    });
  });

  it('applies correct filters when seller switches views', async () => {
    const mockApiCall = jest.fn().mockResolvedValue({
      data: {
        data: { products: [] },
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
      },
    });
    getProducts.mockImplementation(mockApiCall);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { role: 'seller', id: 1 } }}>
          <ProductListPage />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    // Test different seller view filters
    const statusFilter = screen.getByLabelText(/status/i);

    // View own products only
    fireEvent.change(statusFilter, { target: { value: 'mine' } });
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        seller_id: 1,
      }),
    );

    // View other sellers' approved products
    fireEvent.change(statusFilter, { target: { value: 'approved' } });
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        exclude_seller: 1,
      }),
    );

    // View pending products
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        seller_id: 1,
      }),
    );
  });
});
