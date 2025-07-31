import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductFilter from '../../../components/Product/ProductFilter';
import { USER_ROLES, PRODUCT_STATUS, STATUS_LABELS, SELLER_STATUS_LABELS } from '../../../constants/productConstants';

const mockCategories = [
  { id: 1, name: 'Category 1' },
  { id: 2, name: 'Category 2' }
];

describe('ProductFilter', () => {
  const defaultProps = {
    currentFilters: {},
    categories: mockCategories,
    onFilterChange: jest.fn(),
    role: USER_ROLES.CUSTOMER,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with category filter for all users', () => {
      render(<ProductFilter {...defaultProps} />);
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    it('renders with search for all users', () => {
      render(<ProductFilter {...defaultProps} />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Role-based status filter', () => {
    it('does not render status filter for customers', () => {
      render(<ProductFilter {...defaultProps} role={USER_ROLES.CUSTOMER} />);
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });

    it('renders all status options for admin', () => {
      render(<ProductFilter {...defaultProps} role={USER_ROLES.ADMIN} />);
      
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
      
      Object.values(PRODUCT_STATUS).forEach(status => {
        expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
      });
    });

    it('renders seller-specific status options', () => {
      render(<ProductFilter {...defaultProps} role={USER_ROLES.SELLER} />);
      
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
      
      Object.values(PRODUCT_STATUS).forEach(status => {
        expect(screen.getByText(SELLER_STATUS_LABELS[status])).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner and disables inputs when loading', () => {
      render(<ProductFilter {...defaultProps} loading={true} />);
      
      const spinners = screen.getAllByTestId('loading-spinner');
      expect(spinners.length).toBeGreaterThan(0);
      
      const inputs = screen.getAllByRole('combobox');
      inputs.forEach(input => expect(input).toBeDisabled());
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeDisabled();
    });

    it('shows local loading state during debounced changes', async () => {
      jest.useFakeTimers();
      render(<ProductFilter {...defaultProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      await userEvent.type(searchInput, 'test');
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      jest.runAllTimers();
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });
  });

  describe('Filter Feedback', () => {
    it('shows feedback message for active filters', () => {
      render(
        <ProductFilter 
          {...defaultProps} 
          currentFilters={{ 
            status: PRODUCT_STATUS.APPROVED,
            category: '1',
            search: 'test'
          }}
          role={USER_ROLES.SELLER}
        />
      );
      
      const feedback = screen.getByRole('status');
      expect(feedback).toHaveTextContent(/showing.*approved.*category 1.*matching "test"/i);
    });

    it('hides feedback when no filters are active', () => {
      render(<ProductFilter {...defaultProps} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Filter Changes', () => {
    it('debounces search input changes', async () => {
      jest.useFakeTimers();
      render(<ProductFilter {...defaultProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      await userEvent.type(searchInput, 'test');
      
      expect(defaultProps.onFilterChange).not.toHaveBeenCalled();
      
      jest.runAllTimers();
      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test' })
        );
      });
      
      jest.useRealTimers();
    });

    it('handles status changes immediately', () => {
      render(<ProductFilter {...defaultProps} role={USER_ROLES.ADMIN} />);
      
      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: PRODUCT_STATUS.PENDING } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: PRODUCT_STATUS.PENDING })
      );
    });

    it('handles category changes immediately', () => {
      render(<ProductFilter {...defaultProps} />);
      
      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.change(categorySelect, { target: { value: '1' } });
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ category: '1' })
      );
    });
  });
});
