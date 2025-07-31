import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../../components/Products/ProductCard';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99.99,
  status: 'approved',
  image_url: 'test.jpg',
  seller: {
    id: 1,
    full_name: 'Test Seller'
  },
  averageRating: 4.5,
  reviewCount: 10
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  it('renders basic product information', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText(/test seller/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('shows status badge when showStatus is true', () => {
    renderWithRouter(<ProductCard product={mockProduct} showStatus={true} />);
    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  it('hides status badge when showStatus is false', () => {
    renderWithRouter(<ProductCard product={mockProduct} showStatus={false} />);
    expect(screen.queryByText('approved')).not.toBeInTheDocument();
  });

  it('uses placeholder image when no image_url is provided', () => {
    const productWithoutImage = { ...mockProduct, image_url: null };
    renderWithRouter(<ProductCard product={productWithoutImage} />);

    const img = screen.getByAltText('Test Product');
    expect(img.src).toContain('placeholder.png');
  });

  it('includes correct link to product details', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link.getAttribute('href')).toBe('/products/1');
  });

  it('displays different status colors correctly', () => {
    const statuses = {
      approved: '#4caf50',
      pending: '#ff9800',
      rejected: '#f44336'
    };

    Object.entries(statuses).forEach(([status, color]) => {
      const productWithStatus = { ...mockProduct, status };
      const { container } = renderWithRouter(
        <ProductCard product={productWithStatus} showStatus={true} />
      );

      const statusBadge = container.querySelector(`.statusBadge`);
      expect(statusBadge).toHaveStyle({ backgroundColor: color });
    });
  });

  it('handles missing optional data gracefully', () => {
    const minimalProduct = {
      id: 1,
      name: 'Minimal Product',
      price: 10.00
    };

    renderWithRouter(<ProductCard product={minimalProduct} />);

    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument(); // No rating stars
  });

  it('formats prices correctly', () => {
    const productsWithPrices = [
      { ...mockProduct, price: 1000 },
      { ...mockProduct, price: 10.1 },
      { ...mockProduct, price: 0.99 }
    ];

    productsWithPrices.forEach(product => {
      renderWithRouter(<ProductCard product={product} />);
      expect(screen.getByText(`$${product.price.toFixed(2)}`)).toBeInTheDocument();
    });
  });
});
