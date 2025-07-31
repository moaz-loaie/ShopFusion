import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../components/Dashboard/StatCard';

describe('StatCard', () => {
  const defaultProps = {
    title: 'Test Card',
    value: '100',
    icon: <span>📊</span>,
    color: 'primary'
  };

  it('renders with basic props', () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays trend information when provided', () => {
    render(
      <StatCard
        {...defaultProps}
        trend="up"
        trendValue="+15"
        trendLabel="vs last month"
      />
    );
    expect(screen.getByText('+15')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('applies correct color class based on color prop', () => {
    const { container } = render(
      <StatCard {...defaultProps} color="success" />
    );
    expect(container.firstChild).toHaveClass('success');
  });

  it('renders icon when provided', () => {
    render(<StatCard {...defaultProps} icon={<span data-testid="test-icon">🔍</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('handles missing trend information gracefully', () => {
    render(<StatCard {...defaultProps} trend={null} />);
    expect(screen.queryByText('vs last month')).not.toBeInTheDocument();
  });
});
