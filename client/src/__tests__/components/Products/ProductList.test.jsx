import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from '../../components/Products/ProductList';
import { AuthContext } from '../../contexts/AuthContext';
import { getProducts } from '../../services/productApi';

// Mock the API functions
jest.mock('../../services/productApi');

const mockProducts = {
  data: {
    data: {
      products: [
        {
          id: 1,
          name: 'Test Product 1',
          price: 99.99,
          status: 'approved',
          seller_id: 1
        },
        {
          id: 2,
          name: 'Test Product 2',
          price: 149.99,
          status: 'pending',
          seller_id: 2
        }
      ],
      totalItems: 2,
      totalPages: 1
    }
  }
};

describe('ProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProducts.mockResolvedValue(mockProducts);
  });

  it('renders loading state initially', () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <ProductList />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays products after loading', async () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('shows status filter for admin users', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('shows status filter for seller users', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'seller', id: 1 } }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('hides status filter for customers', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'customer' } }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('combobox', { name: /status/i })).not.toBeInTheDocument();
  });

  it('applies filters correctly', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Apply status filter
    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    // Apply price filter
    const minPrice = screen.getByPlaceholderText('Min Price');
    const maxPrice = screen.getByPlaceholderText('Max Price');
    
    await userEvent.type(minPrice, '50');
    await userEvent.type(maxPrice, '200');

    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: '50',
          maxPrice: '200'
        })
      );
    });
  });

  it('handles pagination correctly', async () => {
    const mockPaginatedProducts = {
      data: {
        data: {
          products: mockProducts.data.data.products,
          totalItems: 4,
          totalPages: 2
        }
      }
    };
    getProducts.mockResolvedValueOnce(mockPaginatedProducts);

    render(
      <AuthContext.Provider value={{ user: null }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to load products';
    getProducts.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <AuthContext.Provider value={{ user: null }}>
        <ProductList />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
