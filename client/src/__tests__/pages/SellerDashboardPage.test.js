import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import SellerDashboardPage from '../../pages/SellerDashboardPage';
import { getSellerDashboardStats } from '../../services/api';

// Mock the API function
jest.mock('../../services/api');
jest.mock('../../utils/logger');

const mockStats = {
  data: {
    data: {
      total: 25,
      pendingCount: 5,
      rejectedCount: 2,
      approvedCount: 18,
      orderCount: 150,
      revenue: 12500.00,
      lowStockCount: 3,
      averageRating: 4.2,
      reviewCount: 75
    }
  }
};

describe('SellerDashboardPage', () => {
  const mockUser = { id: 1, full_name: 'Seller User', role: 'seller' };

  beforeEach(() => {
    getSellerDashboardStats.mockResolvedValue(mockStats);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays dashboard data', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByText(/Loading your dashboard/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
    });

    // Verify stats are displayed
    expect(screen.getByText('25')).toBeInTheDocument(); // Total products
    expect(screen.getByText('5')).toBeInTheDocument(); // Pending products
    expect(screen.getByText('$12,500.00')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('4.2')).toBeInTheDocument(); // Average rating
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to load dashboard stats';
    getSellerDashboardStats.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard stats/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('refreshes data on retry button click', async () => {
    getSellerDashboardStats
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockStats);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(getSellerDashboardStats).toHaveBeenCalledTimes(2);
    });
  });

  it('has correct navigation links', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Products')).toBeInTheDocument();
    });

    // Check navigation links
    expect(screen.getByText('Add New Product').closest('a')).toHaveAttribute('href', '/seller/products/new');
    expect(screen.getByText('View Reports').closest('a')).toHaveAttribute('href', '/seller/analytics');
  });

  it('auto-refreshes data on interval', async () => {
    jest.useFakeTimers();

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <SellerDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(getSellerDashboardStats).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    expect(getSellerDashboardStats).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
