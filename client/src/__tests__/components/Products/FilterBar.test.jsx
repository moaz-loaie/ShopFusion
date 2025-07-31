import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../../components/Products/FilterBar';

describe('FilterBar', () => {
  const mockFilters = {
    status: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  };

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter inputs when showStatusFilter is true', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/max price/i)).toBeInTheDocument();
  });

  it('hides status filter when showStatusFilter is false', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={false}
      />
    );

    expect(screen.queryByRole('combobox', { name: /status/i })).not.toBeInTheDocument();
  });

  it('debounces search input', async () => {
    jest.useFakeTimers();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'test');

    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'test' });
    });

    jest.useRealTimers();
  });

  it('handles status filter change immediately', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(statusSelect, { target: { value: 'approved' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'approved' });
  });

  it('debounces price filter inputs', async () => {
    jest.useFakeTimers();
    
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    const minPriceInput = screen.getByPlaceholderText(/min price/i);
    const maxPriceInput = screen.getByPlaceholderText(/max price/i);

    await userEvent.type(minPriceInput, '10');
    await userEvent.type(maxPriceInput, '100');

    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({ minPrice: '10' });
      expect(mockOnFilterChange).toHaveBeenCalledWith({ maxPrice: '100' });
    });

    jest.useRealTimers();
  });

  it('validates price inputs to be non-negative', async () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    const minPriceInput = screen.getByPlaceholderText(/min price/i);
    await userEvent.type(minPriceInput, '-10');

    expect(minPriceInput.value).toBe('10');
  });

  it('ensures maxPrice cannot be less than minPrice', async () => {
    const filtersWithMin = { ...mockFilters, minPrice: '100' };
    
    render(
      <FilterBar
        filters={filtersWithMin}
        onFilterChange={mockOnFilterChange}
        showStatusFilter={true}
      />
    );

    const maxPriceInput = screen.getByPlaceholderText(/max price/i);
    await userEvent.type(maxPriceInput, '50');

    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });
});
