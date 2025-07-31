// File: client/src/pages/Product/ProductListPage.js (Final Example)
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '../../components/Product/ProductList';
import ProductFilter from '../../components/Product/ProductFilter'; // Assuming this component exists
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Pagination from '../../components/Common/Pagination'; // Assuming this component exists
import { getCategories } from '../../services/api';
import { getProducts } from '../../services/productApi'; // Adjust the import path as needed
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProductListPage.module.css'; // Example CSS module
import logger from '../../utils/logger';

const ITEMS_PER_PAGE = 12; // Define your items per page constant

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]); // For filter options
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: authLoading, user } = useAuth();

  // Function to fetch products based on current search params
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: ITEMS_PER_PAGE,
      };

      // Add category filter if present
      const category = searchParams.get('category');
      if (category) {
        params.category = category;
      }

      // Add search filter if present
      const search = searchParams.get('search');
      if (search) {
        params.search = search;
      }

      const status = searchParams.get('status');

      // Handle visibility based on user role
      if (user?.role === 'admin') {
        // Admin: can see and filter all products
        if (status && status !== 'all') {
          params.status = status;
        }
      } else if (user?.role === 'seller') {
        // Seller: different views based on status filter
        if (status === 'mine') {
          params.seller_id = user.id;
        } else if (status === 'approved') {
          params.status = 'approved';
          params.exclude_seller = user.id; // Exclude own products
        } else if (status === 'pending' || status === 'rejected') {
          params.status = status;
          params.seller_id = user.id;
        }
        // Default ('all'): server will handle showing all own products + others' approved
      } else {
        // Customers/guests: only see approved products
        params.status = 'approved';
      }

      logger.debug('Fetching products with params:', params);
      const response = await getProducts(params);
      
      setProducts(response.data.data.products || []);
      setPagination({
        currentPage: parseInt(response.data.currentPage, 10),
        totalPages: Math.ceil(response.data.totalProducts / ITEMS_PER_PAGE),
        totalProducts: response.data.totalProducts
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load products.';
      logger.error('Error fetching products:', { error: err, params: searchParams.toString() });
      setError(errorMessage);
      setProducts([]);
      setPagination({ currentPage: 1, totalPages: 1, totalProducts: 0 });
    } finally {
      setLoading(false);
    }
  }, [searchParams, user]);

  // Fetch categories for the filter component
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories(); // Use named import
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Handle category fetch error silently or show a message
    }
  }, []);

  // Effect to fetch data when the component mounts or search params change
  useEffect(() => {
    if (!authLoading) {
      fetchProducts();
      fetchCategories(); // Fetch categories once on mount
    }
  }, [fetchProducts, fetchCategories, authLoading]); // Add authLoading to dependencies
  // Handler for filter changes (updates URL search params)
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    // Update filters, handling special cases for category and status
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');
    setSearchParams(params);
  };

  // Handler for pagination changes
  const handlePageChange = (newPage) => {
    // Update the 'page' search param
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', newPage.toString());
      return params;
    });
  };

  // Handler for sort changes
  const handleSortChange = (sortValue) => {
    const params = new URLSearchParams(searchParams);
    if (sortValue) {
      params.set('sort', sortValue);
    } else {
      params.delete('sort');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <main className={styles.container}>      <header className={styles.header}>
        <h1>Browse Products</h1>
        <div className={styles.filterInfo}>
          {user?.role === 'admin' && (
            <p className={styles.roleInfo}>
              {!searchParams.get('status') || searchParams.get('status') === 'all'
                ? 'Viewing all products'
                : `Viewing ${searchParams.get('status')} products`}
              {searchParams.get('category') && searchParams.get('category') !== 'all' && 
                ` in category "${categories.find(c => c.id.toString() === searchParams.get('category'))?.name || ''}"`}
            </p>
          )}
          {user?.role === 'seller' && (
            <p className={styles.roleInfo}>
              {(() => {
                const status = searchParams.get('status');
                if (status === 'mine') return 'Viewing all your products';
                if (status === 'approved') return 'Viewing all approved products';
                if (status === 'pending') return 'Viewing your pending products';
                if (status === 'rejected') return 'Viewing your rejected products';
                return 'Viewing your products and approved products from others';
              })()}
              {searchParams.get('category') && searchParams.get('category') !== 'all' && 
                ` in category "${categories.find(c => c.id.toString() === searchParams.get('category'))?.name || ''}"`}
            </p>
          )}
          {(!user || user.role === 'customer') && (
            <p className={styles.filterInfo}>
              {searchParams.get('category') && searchParams.get('category') !== 'all'
                ? `Viewing products in category "${categories.find(c => c.id.toString() === searchParams.get('category'))?.name || ''}"`
                : 'Browse all products'}
            </p>
          )}
        </div>
      </header>
      <section className={styles.filterBar} aria-label="Product filters">        <ProductFilter
          categories={categories}
          currentFilters={Object.fromEntries(searchParams.entries())}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          role={user?.role}
          loading={loading}
          error={error}
        />
      </section>{' '}
      <section className={styles.productsSection} aria-labelledby="product-list-title">
        <h2 id="product-list-title" className={styles.visuallyHidden}>
          Product List
        </h2>
        {loading ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading products...
          </div>
        ) : error ? (
          <div className={styles.statusMsg} role="alert">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <ProductList
            products={products}
            itemsPerRow={4}
            gridGap="2rem"
            className={styles.productGrid}
            user={user}
          />
        )}
      </section>
      <nav className={styles.pagination} aria-label="Product pagination">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </nav>
    </main>
  );
};

export default ProductListPage;
