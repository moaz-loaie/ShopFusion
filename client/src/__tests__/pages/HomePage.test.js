// File: client/src/__tests__/pages/HomePage.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import HomePage from '../../pages/HomePage';
import * as api from '../../services/api'; // To mock getProducts

// Mock the logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock the api service, specifically getProducts
jest.mock('../../services/api', () => ({
  getProducts: jest.fn(),
  // Mock other API functions if HomePage uses them
}));

// Mock child components to simplify HomePage testing and focus on its logic
jest.mock('../../components/Product/ProductList', () => () => <div data-testid="product-list">Product List Mock</div>);
jest.mock('../../components/Common/LoadingSpinner', () => () => <div data-testid="loading-spinner">Loading...</div>);

// Helper to render HomePage with necessary contexts
const renderHomePage = (authContextValue, cartContextValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authContextValue || { isAuthenticated: false, user: null, loading: false }}>
        <CartContext.Provider value={cartContextValue || { itemCount: 0 }}>
          <HomePage />
        </CartContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('<HomePage /> Page', () => {
  const mockProductsNewArrivals = [
    { id: 1, name: 'New Arrival 1', price: 29.99, Category: { name: 'Apparel' } },
    { id: 2, name: 'New Arrival 2', price: 39.99, Category: { name: 'Apparel' } },
  ];
  const mockProductsTopSelling = [
    { id: 3, name: 'Top Seller 1', price: 99.99, Category: { name: 'Electronics' } },
    { id: 4, name: 'Top Seller 2', price: 49.99, Category: { name: 'Electronics' } },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    api.getProducts.mockReset();
    // Mock successful API calls by default
    api.getProducts
      .mockImplementation(async (params) => {
        if (params.sort === 'createdAt:desc') {
          return Promise.resolve({ data: { data: { products: mockProductsNewArrivals } } });
        }
        if (params.sort === 'popularity:desc') {
          return Promise.resolve({ data: { data: { products: mockProductsTopSelling } } });
        }
        return Promise.resolve({ data: { data: { products: [] } } }); // Default empty
      });
  });

  test('renders hero section and section titles', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { name: /FIND CLOTHES THAT MATCHES YOUR STYLE/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /NEW ARRIVALS/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /BROWSE BY DRESS STYLE/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /TOP SELLING/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /OUR HAPPY CUSTOMERS/i })).toBeInTheDocument();
  });

  test('displays loading spinners initially while fetching data', () => {
    // Temporarily make API calls simulate loading
    api.getProducts.mockImplementation(() => new Promise(() => {})); // Pending promise
    renderHomePage();
    // Expect two loading spinners if sections load independently
    const loadingSpinners = screen.getAllByTestId('loading-spinner');
    expect(loadingSpinners.length).toBeGreaterThanOrEqual(1); // At least one initially
  });

  test('fetches and displays new arrivals and top selling products successfully', async () => {
    renderHomePage();

    // Wait for ProductList mocks to appear, indicating data has been processed
    await waitFor(() => {
      // ProductList mock is rendered multiple times (for new arrivals and top selling)
      const productLists = screen.getAllByTestId('product-list');
      expect(productLists.length).toBe(2); // One for New Arrivals, one for Top Selling
    });

    // Check if getProducts was called correctly for both sections
    expect(api.getProducts).toHaveBeenCalledWith(expect.objectContaining({ sort: 'createdAt:desc' }));
    expect(api.getProducts).toHaveBeenCalledWith(expect.objectContaining({ sort: 'popularity:desc' }));
    // Note: Verifying specific products are passed to ProductList is harder with this mock
    // A more detailed test would check props of the mocked ProductList.
  });

  test('displays an error message if fetching products fails', async () => {
    const errorMessage = 'Network Error: Failed to fetch';
    api.getProducts.mockRejectedValueOnce({ response: { data: { message: errorMessage } } }); // Simulate error for one of the calls
    // Or: api.getProducts.mockRejectedValue(new Error(errorMessage));

    renderHomePage();

    // Wait for the error message to be displayed
    expect(await screen.findByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    // Ensure loading spinners are gone
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(0);
    // ProductList mocks should ideally not be rendered if data fetching fails
    // or it might render with "no products found" message.
    // This depends on how ProductList handles empty or error states.
    // For this test, we check the HomePage's error message.
  });

  test('displays "no products" message when API returns empty arrays', async () => {
    api.getProducts.mockResolvedValue({ data: { data: { products: [] } } }); // Both calls return empty
    renderHomePage();

    await waitFor(() => {
      // Check for messages indicating no products
      expect(screen.getByText(/No new arrivals to display/i)).toBeInTheDocument();
      expect(screen.getByText(/No top selling products to display/i)).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId('product-list').length).toBe(0); // No ProductList should be rendered
  });

  test('View All links navigate correctly', () => {
    renderHomePage();
    const viewAllNewArrivals = screen.getByRole('link', { name: /View All/i, current: false }); // Get first View All
    // More specific selector may be needed if multiple View All links exist
    // E.g., const newArrivalsHeader = screen.getByRole('heading', { name: /NEW ARRIVALS/i });
    // const viewAllNew = within(newArrivalsHeader.closest('section')).getByRole('link', { name: /View All/i });
    fireEvent.click(viewAllNewArrivals);
    expect(window.location.search).toContain('sort=createdAt%3Adesc'); // Check URL params

    // Similary test for Top Selling "View All"
    // This requires more distinct selectors for the "View All" links
  });
});