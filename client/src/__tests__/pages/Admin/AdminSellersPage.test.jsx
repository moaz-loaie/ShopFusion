import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../../../contexts/AuthContext';
import AdminSellersPage from '../../../pages/Admin/AdminSellersPage';
import { adminGetAllSellers, adminUpdateSellerStatus } from '../../../services/adminApi';

// Mock the API functions
jest.mock('../../../services/adminApi');
jest.mock('../../../utils/logger');

const mockSellersData = {
  data: {
    data: {
      sellers: [
        { id: 1, full_name: 'John Doe', email: 'john@example.com', is_active: true, product_count: 5 },
        { id: 2, full_name: 'Jane Smith', email: 'jane@example.com', is_active: false, product_count: 3 }
      ],
      totalSellers: 2,
      activeSellers: 1
    }
  }
};

describe('AdminSellersPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    adminGetAllSellers.mockResolvedValue(mockSellersData);
  });

  it('renders loading state initially', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays sellers after loading', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters sellers by status', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    await waitFor(() => {
      expect(adminGetAllSellers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });
  });

  it('searches sellers by name or email', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'john');

    // Wait for debounce
    await waitFor(() => {
      expect(adminGetAllSellers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' })
      );
    }, { timeout: 1000 });
  });

  it('handles pagination', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    const nextPageButton = screen.getByLabelText(/next page/i);
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(adminGetAllSellers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('handles seller status update', async () => {
    adminUpdateSellerStatus.mockResolvedValueOnce({ data: { message: 'Status updated successfully' } });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click status toggle for first seller    // Click deactivate button for first seller
    const deactivateButton = screen.getByText('Deactivate');
    fireEvent.click(deactivateButton);

    // Should show confirmation dialog and check its content
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to deactivate/i)).toBeInTheDocument();
    expect(screen.getByText(/this will hide all their products/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();

    // Confirm the action
    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminUpdateSellerStatus).toHaveBeenCalledWith(1, false);
      expect(screen.getByText(/successfully/i)).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to load sellers';
    adminGetAllSellers.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays correct seller statistics', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/total sellers: 2/i)).toBeInTheDocument();
      expect(screen.getByText(/active sellers: 1/i)).toBeInTheDocument();
    });
  });

  it('handles bulk selection of sellers', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click select all checkbox
    const selectAllCheckbox = screen.getByLabelText(/select all sellers/i);
    fireEvent.click(selectAllCheckbox);

    // Verify all sellers are selected
    const sellerCheckboxes = screen.getAllByRole('checkbox').slice(1); // Exclude select-all checkbox
    sellerCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });

    // Deselect all
    fireEvent.click(selectAllCheckbox);
    sellerCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('handles bulk status updates', async () => {
    adminUpdateSellerStatus.mockResolvedValue({ data: { message: 'Status updated successfully' } });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' } }}>
        <AdminSellersPage />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Select both sellers
    const selectAllCheckbox = screen.getByLabelText(/select all sellers/i);
    fireEvent.click(selectAllCheckbox);

    // Click bulk action button
    const bulkActionButton = screen.getByText(/bulk actions/i);
    fireEvent.click(bulkActionButton);

    // Select "Deactivate" from dropdown
    const deactivateOption = screen.getByText(/deactivate selected/i);
    fireEvent.click(deactivateOption);

    // Confirm the action
    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminUpdateSellerStatus).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/successfully updated/i)).toBeInTheDocument();
    });
  });
});
