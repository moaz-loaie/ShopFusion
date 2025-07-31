import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SellerDashboard from '../../../components/Seller/SellerDashboard';

const mockStats = {
  products: {
    total: 25,
    approved: 18,
    pending: 5,
    rejected: 2,
    lowStock: 3
  },
  orders: {
    count: 150,
    revenue: "12500.00",
    completed: 130,
    cancelled: 5
  },
  reviews: {
    count: 75,
    averageRating: "4.2",
    distribution: {
      1: 2,
      2: 3,
      3: 10,
      4: 25,
      5: 35
    },
    positiveRating: 60
  },
  recentOrders: [
    {
      id: 1,
      total: "150.00",
      status: "completed",
      createdAt: "2025-06-08T10:00:00Z"
    },
    {
      id: 2,
      total: "200.00",
      status: "processing",
      createdAt: "2025-06-08T11:00:00Z"
    }
  ],
  performance: {
    conversionRate: "65.5",
    conversionTrend: {
      direction: "up",
      percentage: "2.5"
    },
    avgOrderValue: "83.33",
    orderValueTrend: {
      direction: "up",
      percentage: "5.2"
    },
    satisfactionRate: "80.0"
  },
  revenueChart: [
    {
      date: "2025-06-01T00:00:00Z",
      revenue: "1200.00"
    },
    {
      date: "2025-06-02T00:00:00Z",
      revenue: "1500.00"
    }
  ]
};

const renderDashboard = (props = {}) => {
  return render(
    <BrowserRouter>
      <SellerDashboard
        stats={mockStats}
        loading={false}
        error={null}
        onRefresh={jest.fn()}
        {...props}
      />
    </BrowserRouter>
  );
};

describe('SellerDashboard', () => {
  it('renders loading state correctly', () => {
    renderDashboard({ loading: true });
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const error = 'Failed to load data';
    renderDashboard({ error, loading: false });
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays product statistics correctly', () => {
    renderDashboard();
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument(); // Approved products
  });

  it('displays revenue information correctly', () => {
    renderDashboard();
    expect(screen.getByText('$12,500.00')).toBeInTheDocument();
    expect(screen.getByText('5.2%')).toBeInTheDocument(); // Growth percentage
  });

  it('shows customer rating information', () => {
    renderDashboard();
    expect(screen.getByText('4.2★')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // Total reviews
  });

  it('displays recent orders', () => {
    renderDashboard();
    expect(screen.getByText('Order #1')).toBeInTheDocument();
    expect(screen.getByText('Order #2')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('handles refresh action', () => {
    const onRefresh = jest.fn();
    renderDashboard({ onRefresh });
    fireEvent.click(screen.getByTitle('Refresh dashboard'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('displays performance metrics', () => {
    renderDashboard();
    expect(screen.getByText('65.5%')).toBeInTheDocument(); // Conversion rate
    expect(screen.getByText('$83.33')).toBeInTheDocument(); // Avg order value
  });

  it('shows correct navigation links', () => {
    renderDashboard();
    expect(screen.getByText('View All Orders')).toHaveAttribute('href', '/seller/orders');
    expect(screen.getByText('+ Add Product')).toHaveAttribute('href', '/seller/products/new');
  });

  it('displays alerts for attention needed items', () => {
    renderDashboard();
    if (mockStats.products.lowStock > 0) {
      expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
    }
    if (mockStats.products.pending > 0) {
      expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
    }
  });
});
