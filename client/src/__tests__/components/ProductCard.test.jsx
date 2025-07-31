import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../../components/Product/ProductCard';
import * as CartContext from '../../contexts/CartContext';
import * as AuthContext from '../../contexts/AuthContext';

const product = {
  id: 'p1',
  name: 'T-Shirt',
  price: 20,
  preview_image_url: '',
  Category: { name: 'Casual' },
  averageRating: 4,
  reviewCount: 10,
  stock_quantity: 5,
};

describe('ProductCard', () => {
  beforeEach(() => {
    jest.spyOn(CartContext, 'useCart').mockReturnValue({
      addToCart: jest.fn().mockResolvedValue({ success: true }),
      loading: false,
    });
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
    });
  });

  it('renders product details', () => {
    render(
      <BrowserRouter>
        <ProductCard product={product} />
      </BrowserRouter>,
    );
    expect(screen.getByText('T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('shows out of stock if stock_quantity is 0', () => {
    render(
      <BrowserRouter>
        <ProductCard product={{ ...product, stock_quantity: 0 }} />
      </BrowserRouter>,
    );
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('calls addToCart when Add to Cart is clicked', async () => {
    const addToCart = jest.fn().mockResolvedValue({ success: true });
    jest.spyOn(CartContext, 'useCart').mockReturnValue({
      addToCart,
      loading: false,
    });
    render(
      <BrowserRouter>
        <ProductCard product={product} />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(addToCart).toHaveBeenCalledWith('p1', 1);
  });
});
