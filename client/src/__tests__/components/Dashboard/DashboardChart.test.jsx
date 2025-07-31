import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardChart } from '../../../components/Dashboard/DashboardChart';

describe('DashboardChart', () => {
  const mockData = [
    { date: '2025-06-01', revenue: 1200, orders: 50 },
    { date: '2025-06-02', revenue: 1500, orders: 65 }
  ];

  const defaultProps = {
    data: mockData,
    xKey: 'date',
    yKey: 'revenue',
    title: 'Test Chart',
    subtitle: 'Test Period',
    height: 300
  };

  it('renders with basic props', () => {
    render(<DashboardChart {...defaultProps} />);
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test Period')).toBeInTheDocument();
  });

  it('renders line chart when type is line', () => {
    const { container } = render(
      <DashboardChart {...defaultProps} type="line" />
    );
    expect(container.querySelector('.recharts-line')).toBeInTheDocument();
  });

  it('renders bar chart when type is bar', () => {
    const { container } = render(
      <DashboardChart {...defaultProps} type="bar" />
    );
    expect(container.querySelector('.recharts-bar')).toBeInTheDocument();
  });

  it('displays secondary axis when secondaryYKey is provided', () => {
    render(
      <DashboardChart
        {...defaultProps}
        type="line"
        secondaryYKey="orders"
      />
    );
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(
      <DashboardChart {...defaultProps} height={400} />
    );
    expect(container.querySelector('.recharts-wrapper')).toHaveStyle({ height: '400px' });
  });
});
