import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import SellerProductsPage from '../../pages/Seller/SellerProductsPage';
import { getProducts, getProductStats } from '../../services/api';

jest.mock('../../services/api');

const mockStats = {
  total: 25,
  pendingCount: 5,
  rejectedCount: 3,
  approvedCount: 17,
  lowStockCount: 4,
  newProducts: 8,
  newLowStock: 2,
  totalOrders: 150,
  totalUnitsSold: 450
};

const mockProducts = [
  {
    id: 1,
    name: "Test Product 1",
    price: 99.99,
    status: "approved",
    stock_quantity: 10
  },
  {
    id: 2,
    name: "Test Product 2",
    price: 149.99,
    status: "pending",
    stock_quantity: 5
  }
];

describe('SellerProductsPage', () => {
  const mockUser = { id: 1, role: 'seller' };

  beforeEach(() => {
    getProducts.mockResolvedValue({
      data: {
        data: {
          products: mockProducts,
          totalProducts: mockProducts.length,
          currentPage: 1,
          totalPages: 1
        }
      }
    });

    getProductStats.mockResolvedValue({
      data: {
        data: mockStats
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders and loads stats correctly', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check stats are displayed
      expect(screen.getByText('Total Products')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // Total count
      expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending count
      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument(); // Rejected + Low Stock count
    });
  });

  it('handles filter changes correctly', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
    });

    // Click on Awaiting Approval card
    fireEvent.click(screen.getByText('Awaiting Approval'));

    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          seller_id: mockUser.id,
          status: 'pending'
        })
      );
    });
  });

  it('displays loading state while fetching data', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    const errorMessage = 'Failed to load product statistics';
    getProductStats.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('allows adding new products', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const addNewLink = screen.getByText('+ Add New Product');
      expect(addNewLink).toBeInTheDocument();
      expect(addNewLink.getAttribute('href')).toBe('/seller/products/new');
    });
  });

  it('refreshes data when filters change', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerProductsPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
    });

    // Click different filter cards and verify API calls
    fireEvent.click(screen.getByText('Approved Products'));
    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          exclude_seller: mockUser.id
        })
      );
    });

    fireEvent.click(screen.getByText('Needs Attention'));
    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          seller_id: mockUser.id,
          status: 'rejected'
        })
      );
    });
  });
});
