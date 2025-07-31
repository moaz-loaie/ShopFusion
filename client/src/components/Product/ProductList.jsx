import React, { useMemo, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';
import styles from './ProductList.module.css';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProductList displays a grid of ProductCard components with responsive layout.
 * @param {Object} props
 * @param {Array} props.products - Array of product objects from API.
 * @param {number} props.itemsPerRow - Number of items per row for desktop view (default: 4)
 * @param {string} props.gridGap - Gap between grid items (default: '2rem')
 * @param {string} props.layout - Layout style ('grid' or 'carousel', default: 'grid')
 * @param {string} props.className - Additional CSS class for the container
 */
const ProductList = ({
  products,
  itemsPerRow = 4,
  gridGap = '2rem',
  layout = 'grid',
  className = '',
}) => {
  const { user } = useAuth();
  const carouselRef = useRef(null);

  // Handle carousel navigation
  const scrollCarousel = useCallback((direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = direction * 280; // Width of one card
    carouselRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }, []);
  // Calculate dynamic column widths based on container width
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
      gap: gridGap,
      alignItems: 'stretch',
    }),
    [gridGap],
  );

  return (
    <div className={`${styles.productListGrid} ${className}`}>
      {layout === 'carousel' && (
        <button
          onClick={() => scrollCarousel(-1)}
          className={`${styles.carouselButton} ${styles.prev}`}
          aria-label="Previous items"
        >
          ‹
        </button>
      )}
      <div
        ref={carouselRef}
        className={layout === 'carousel' ? styles.carousel : undefined}
        style={layout === 'grid' ? gridStyle : undefined}
      >
        {products && products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className={styles.productCardWrapper}>
              <ProductCard product={product} user={user} />
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🛍️</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
      {layout === 'carousel' && (
        <button
          onClick={() => scrollCarousel(1)}
          className={`${styles.carouselButton} ${styles.next}`}
          aria-label="Next items"
        >
          ›
        </button>
      )}
    </div>
  );
};

export default ProductList;
