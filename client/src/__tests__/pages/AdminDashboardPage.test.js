import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AdminDashboardPage from '../../pages/Admin/AdminDashboardPage';
import { getAdminStats, getDisputeStats } from '../../services/api';

// Mock the API functions
jest.mock('../../services/api');

const mockAdminStats = {
  data: {
    sellers: {
      total: 150,
      active: 120,
      pending: 20,
      suspended: 10,
      newLastWeek: 5
    },
    products: {
      total: 1000,
      pending: 50,
      approved: 900,
      rejected: 50,
      lowStock: 30
    },
    revenue: {
      total: 250000.50,
      lastWeek: 12500.75,
      growth: 15.5
    }
  }
};

const mockDisputeStats = {
  data: {
    total: 105,
    open: 25,
    resolved: 75,
    escalated: 5,
    urgent: 8,
    averageResolutionTime: 2.5
  }
};

describe('AdminDashboardPage', () => {
  const mockUser = { id: 1, full_name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    getAdminStats.mockResolvedValue({ data: mockAdminStats });
    getDisputeStats.mockResolvedValue({ data: mockDisputeStats });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays all dashboard sections', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      // Seller stats
      expect(screen.getByText('120')).toBeInTheDocument(); // Active sellers
      expect(screen.getByText('of 150 Total')).toBeInTheDocument();
      expect(screen.getByText('+5 New this week')).toBeInTheDocument();

      // Product stats
      expect(screen.getByText('1000')).toBeInTheDocument(); // Total products
      expect(screen.getByText('900')).toBeInTheDocument(); // Approved products
      expect(screen.getByText('50')).toBeInTheDocument(); // Pending products

      // Revenue stats
      expect(screen.getByText('$250,000.50')).toBeInTheDocument();
      expect(screen.getByText('$12,500.75')).toBeInTheDocument();
      expect(screen.getByText('+15.5%')).toBeInTheDocument();

      // Dispute stats
      expect(screen.getByText('25')).toBeInTheDocument(); // Open disputes
      expect(screen.getByText('5 Escalated')).toBeInTheDocument();
      expect(screen.getByText('2.5 days')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch dashboard statistics';
    getAdminStats.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('has correct navigation links', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Seller management links
      expect(screen.getByRole('link', { name: /active sellers/i }))
        .toHaveAttribute('href', '/admin/sellers');
      expect(screen.getByRole('link', { name: /pending sellers/i }))
        .toHaveAttribute('href', '/admin/sellers?status=pending');
      
      // Product management links
      expect(screen.getByRole('link', { name: /total products/i }))
        .toHaveAttribute('href', '/admin/products');
      expect(screen.getByRole('link', { name: /rejected products/i }))
        .toHaveAttribute('href', '/admin/products?status=rejected');

      // Dispute management links
      expect(screen.getByRole('link', { name: /open disputes/i }))
        .toHaveAttribute('href', '/admin/disputes');
    });
  });

  it('fetches both admin and dispute stats on load', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(getAdminStats).toHaveBeenCalledTimes(1);
      expect(getDisputeStats).toHaveBeenCalledTimes(1);
    });
  });

  it('shows warning indicators for critical metrics', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for warning badges when metrics exceed thresholds
      if (mockAdminStats.data.products.pending > 0) {
        expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      }
      if (mockDisputeStats.data.urgent > 0) {
        expect(screen.getByText('Action Needed')).toBeInTheDocument();
      }
    });
  });
});
