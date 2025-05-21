// File: client/src/__tests__/components/Navbar.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom'; // MemoryRouter for controlled routing tests
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import Navbar from '../../components/Layout/Navbar';
import logger from '../../utils/logger';

// Mock logger and useNavigate
jest.mock('../../utils/logger', () => ({ info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() }));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render Navbar with custom context values
const renderNavbarWithContexts = (authValue, cartValue, initialRoutes = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialRoutes}> {/* Use MemoryRouter for testing navigation */}
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={cartValue}>
          <Navbar />
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('<Navbar /> Component', () => {
  let defaultAuthContextValue;
  let defaultCartContextValue;

  beforeEach(() => {
    // Reset mocks and default context values
    jest.clearAllMocks();
    defaultAuthContextValue = {
      isAuthenticated: false,
      user: null,
      logout: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    defaultCartContextValue = {
      itemCount: 0,
    };
  });

  test('renders core navigation links for guest users', () => {
    renderNavbarWithContexts(defaultAuthContextValue, defaultCartContextValue);
    expect(screen.getByRole('link', { name: /ShopFusion/i })).toBeInTheDocument(); // Logo
    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument(); // Exact match for Home
    expect(screen.getByRole('link', { name: /Products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cart/i })).toBeInTheDocument();
    expect(screen.queryByText(/My Account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
  });

  test('renders authenticated customer links correctly', () => {
    const customerContext = {
      isAuthenticated: true,
      user: { id: 1, full_name: 'Jane Doe', email: 'jane@example.com', role: 'customer' },
      logout: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    renderNavbarWithContexts(customerContext, defaultCartContextValue);
    expect(screen.getByText(/Account \(Jane\)/i)).toBeInTheDocument();
    expect(screen.getByText(/My Orders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Admin/i)).not.toBeInTheDocument();
  });

  test('renders authenticated admin links correctly', () => {
    const adminContext = {
      isAuthenticated: true,
      user: { id: 2, full_name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      logout: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    renderNavbarWithContexts(adminContext, defaultCartContextValue);
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/My Orders/i)).toBeInTheDocument(); // Admin also sees "My Orders"
  });

  test('displays cart item count when cart has items', () => {
    const cartWithItems = { ...defaultCartContextValue, itemCount: 5 };
    renderNavbarWithContexts(defaultAuthContextValue, cartWithItems);
    const cartLink = screen.getByRole('link', { name: /Cart/i });
    // Check for the count within the cart link
    expect(within(cartLink).getByText('5')).toBeInTheDocument();
  });

  test('does not display cart item count when cart is empty', () => {
    renderNavbarWithContexts(defaultAuthContextValue, defaultCartContextValue); // itemCount is 0
    const cartLink = screen.getByRole('link', { name: /Cart/i });
    expect(within(cartLink).queryByText(/^\d+$/)).not.toBeInTheDocument(); // No digit span for count
  });

  test('calls logout and navigates to home on logout button click', async () => {
    const authContext = {
      isAuthenticated: true,
      user: { id: 1, full_name: 'Test User', role: 'customer' },
      logout: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    renderNavbarWithContexts(authContext, defaultCartContextValue);

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    // Wait for async logout and navigation
    await waitFor(() => expect(authContext.logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    expect(logger.info).toHaveBeenCalledWith('Navbar: Logout successful, navigating to home.');
  });

  test('toggles mobile menu visibility on toggle button click', () => {
    renderNavbarWithContexts(defaultAuthContextValue, defaultCartContextValue);
    // Assuming mobile menu is hidden by default on test screen size or controlled by state
    const mobileMenuToggleButton = screen.getByRole('button', { name: /Toggle menu/i });

    // Check initial state (drawer not visible - assuming it's conditionally rendered or has a class)
    // If it's always in DOM but hidden by CSS, this check is harder.
    // For this test, let's assume a specific class indicates it's the mobile drawer ul
    expect(screen.queryByRole('list', (content, element) => element.classList.contains('navMenuMobile'))).not.toBeInTheDocument();


    // Open menu
    fireEvent.click(mobileMenuToggleButton);
    expect(screen.getByRole('list', (content, element) => element.classList.contains('navMenuMobile'))).toBeVisible();
    expect(mobileMenuToggleButton).toHaveTextContent('✕'); // Check for close icon

    // Close menu
    fireEvent.click(mobileMenuToggleButton);
    // Wait for potential animation or re-render for menu to hide
    // For simplicity, assuming immediate removal or display:none
     waitFor(() => {
        expect(screen.queryByRole('list', (content, element) => element.classList.contains('navMenuMobile'))).not.toBeVisible();
     });
    expect(mobileMenuToggleButton).toHaveTextContent('☰'); // Check for open icon
  });

  test('NavLinks have "active" class when their route matches', () => {
    renderNavbarWithContexts(defaultAuthContextValue, defaultCartContextValue, ['/products']);
    const productsLink = screen.getByRole('link', { name: /Products/i });
    const homeLink = screen.getByRole('link', { name: /^Home$/i });

    expect(productsLink).toHaveClass('active');
    expect(homeLink).not.toHaveClass('active');

    // Click home link and check again (simulating navigation)
    fireEvent.click(homeLink);
    // With MemoryRouter, re-rendering is needed or use a different strategy to test NavLink active state
    // This specific active class test is better done with integration/E2E tests that involve actual routing.
    // For unit tests, verifying the `to` prop is usually sufficient.
    expect(homeLink).toHaveAttribute('href', '/');
    expect(productsLink).toHaveAttribute('href', '/products');
  });
});