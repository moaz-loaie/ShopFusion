import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import AdminDashboardPage from '../../pages/Admin/AdminDashboardPage';
import { getAdminStats, getDisputeStats } from '../../services/api';

jest.mock('../../services/api');

const mockAdminStats = {
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
};

const mockDisputeStats = {
  open: 25,
  resolved: 75,
  escalated: 5,
  averageResolutionTime: 2.5
};

describe('AdminDashboardPage', () => {
  const mockUser = { id: 1, role: 'admin' };

  beforeEach(() => {
    getAdminStats.mockResolvedValue({ data: mockAdminStats });
    getDisputeStats.mockResolvedValue({ data: mockDisputeStats });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all dashboard sections with correct data', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check seller stats
      expect(screen.getByText('120')).toBeInTheDocument(); // Active sellers
      expect(screen.getByText('of 150 Total')).toBeInTheDocument();
      expect(screen.getByText('+5 New')).toBeInTheDocument();

      // Check product stats
      expect(screen.getByText('1000')).toBeInTheDocument(); // Total products
      expect(screen.getByText('Approved: 900')).toBeInTheDocument();
      expect(screen.getByText('Pending: 50')).toBeInTheDocument();

      // Check dispute stats
      expect(screen.getByText('25')).toBeInTheDocument(); // Open disputes
      expect(screen.getByText('5 Escalated')).toBeInTheDocument();
      expect(screen.getByText('2.5 days')).toBeInTheDocument();

      // Check revenue stats
      expect(screen.getByText('$250,000.50')).toBeInTheDocument();
      expect(screen.getByText('$12,500.75')).toBeInTheDocument();
      expect(screen.getByText('+15.5%')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to load dashboard statistics';
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

  it('formats numbers correctly', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check revenue formatting
      expect(screen.getByText('$250,000.50')).toBeInTheDocument();
      expect(screen.getByText('$12,500.75')).toBeInTheDocument();
      
      // Check percentage formatting
      expect(screen.getByText('+15.5%')).toBeInTheDocument();
    });
  });

  it('includes all required navigation links', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser }}>
          <AdminDashboardPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check navigation links
      expect(screen.getByRole('link', { name: /active sellers/i })).toHaveAttribute('href', '/admin/sellers');
      expect(screen.getByRole('link', { name: /pending approval/i })).toHaveAttribute('href', '/admin/sellers?status=pending');
      expect(screen.getByRole('link', { name: /open disputes/i })).toHaveAttribute('href', '/admin/disputes');
    });
  });
});
