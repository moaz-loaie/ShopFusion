// File: client/src/__tests__/components/ProductCard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom'; // Import useNavigate
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import ProductCard from '../../components/Product/ProductCard';
import placeholderImage from '../../assets/placeholder.png'; // Ensure path is correct

// Mock the logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


describe('<ProductCard /> Component', () => {
  const mockProduct = {
    id: 1,
    name: 'Elegant Watch',
    price: 199.99,
    preview_image_url: 'http://example.com/watch.jpg',
    Category: { name: 'Accessories' },
    averageRating: 4.5,
    reviewCount: 25,
    stock_quantity: 10,
  };

  const mockProductOutOfStock = {
    ...mockProduct,
    id: 2,
    name: 'Sold Out Shirt',
    stock_quantity: 0,
  };

  const mockProductNoImage = {
    ...mockProduct,
    id: 3,
    name: 'Mysterious Item',
    preview_image_url: null,
  };

  let mockAddToCart;
  let mockAuthContextValue;

  // Helper to render with context
  const renderWithContext = (product, cartContextValue, authContextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authContextValue}>
          <CartContext.Provider value={cartContextValue}>
            <ProductCard product={product} />
          </CartContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockAddToCart = jest.fn();
    mockAuthContextValue = {
      isAuthenticated: true, // Default to authenticated for cart actions
      user: { id: 1, role: 'customer' }, // Mock user
    };
    // Reset mocks
    mockNavigate.mockClear();
    if (global.alert) jest.spyOn(global, 'alert').mockImplementation(() => {}); // Mock alert
  });

  afterEach(() => {
    if (global.alert && global.alert.mockRestore) global.alert.mockRestore(); // Restore alert
  });


  test('renders product details correctly', () => {
    renderWithContext(mockProduct, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);

    expect(screen.getByRole('heading', { name: /Elegant Watch/i })).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument(); // Exact price
    expect(screen.getByText('Accessories')).toBeInTheDocument(); // Category name
    expect(screen.getByRole('img', { name: /Elegant Watch/i })).toHaveAttribute('src', mockProduct.preview_image_url);
    expect(screen.getByText('25 reviews')).toBeInTheDocument(); // Check review count text
    // Check for rating component implicitly by its output if it has an aria-label or specific text
    expect(screen.getByRole('button', { name: 'Add Elegant Watch to cart' })).toBeEnabled();
  });

  test('uses placeholder image if preview_image_url is null', () => {
    renderWithContext(mockProductNoImage, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);
    expect(screen.getByRole('img', { name: /Mysterious Item/i })).toHaveAttribute('src', placeholderImage);
  });

  test('displays "Out of Stock" badge and disables button if stock_quantity is 0', () => {
    renderWithContext(mockProductOutOfStock, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Add ${mockProductOutOfStock.name} to cart` })).toBeDisabled();
    expect(screen.getByRole('button', { name: `Add ${mockProductOutOfStock.name} to cart` })).toHaveTextContent('Out of Stock');
  });

  test('navigates to product detail page on card link click', () => {
    renderWithContext(mockProduct, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);
    // The card itself is a link
    const cardLink = screen.getByRole('link', { name: `View details for ${mockProduct.name}` });
    fireEvent.click(cardLink);
    expect(window.location.pathname).toBe(`/products/${mockProduct.id}`); // Assuming BrowserRouter updates window.location
  });

  test('calls addToCart when "Add to Cart" button is clicked for authenticated user', async () => {
    mockAddToCart.mockResolvedValue({ success: true, message: "Item added!" }); // Simulate successful add
    renderWithContext(mockProduct, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);

    const addToCartButton = screen.getByRole('button', { name: `Add ${mockProduct.name} to cart` });
    fireEvent.click(addToCartButton);

    expect(addToCartButton).toBeDisabled(); // Should be disabled while adding ("Adding...")
    expect(screen.getByText('Adding...')).toBeInTheDocument();


    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id, 1);
    });
     // After await, button text should revert if state is managed properly
    await waitFor(() => {
        expect(screen.getByRole('button', { name: `Add ${mockProduct.name} to cart` })).toHaveTextContent('Add to Cart');
    });
    // Optionally check for a success message if your component shows one
  });


  test('redirects to login if "Add to Cart" is clicked by unauthenticated user', async () => {
    const unauthenticatedAuthContext = { ...mockAuthContextValue, isAuthenticated: false, user: null };
    renderWithContext(mockProduct, { addToCart: mockAddToCart, loading: false }, unauthenticatedAuthContext);

    const addToCartButton = screen.getByRole('button', { name: `Add ${mockProduct.name} to cart` });
    fireEvent.click(addToCartButton);

    expect(mockAddToCart).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: `/products/${mockProduct.id}`, message: 'Please log in to add items to your cart.' }
    });
  });

  test('shows error message if addToCart fails', async () => {
    const errorMessage = "Network Error";
    mockAddToCart.mockResolvedValue({ success: false, message: errorMessage });
    renderWithContext(mockProduct, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);

    const addToCartButton = screen.getByRole('button', { name: `Add ${mockProduct.name} to cart` });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct.id, 1);
    });
    // Check if error message is displayed (assuming ProductCard handles this)
    expect(await screen.findByText(errorMessage)).toBeInTheDocument(); // Assuming error is rendered in the card
    expect(screen.getByRole('button', { name: `Add ${mockProduct.name} to cart` })).not.toBeDisabled(); // Re-enabled after error
  });

  test('renders gracefully if product prop is null', () => {
    renderWithContext(null, { addToCart: mockAddToCart, loading: false }, mockAuthContextValue);
    expect(screen.getByText('Product Data Unavailable')).toBeInTheDocument();
  });
});