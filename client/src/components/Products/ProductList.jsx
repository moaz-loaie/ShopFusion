import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts } from '../../services/productApi';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';
import { ProductStatusFilter } from './ProductStatusFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import styles from './ProductList.module.css';

const ProductList = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12
  });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status
      };

      // Use different endpoints based on user role
      let endpoint = '/products';
      if (user?.role === 'admin') {
        endpoint = '/admin/products';
      } else if (user?.role === 'seller') {
        endpoint = '/seller/products';
        params.sellerId = user.id;
      }

      const response = await getProducts(params, endpoint);
      const { products, totalItems, totalPages } = response.data.data;
      setProducts(products);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages,
        totalItems
      }));
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={styles.container}>
      {(user?.role === 'admin' || user?.role === 'seller') && (
        <ProductStatusFilter
          currentStatus={filters.status}
          onStatusChange={handleStatusChange}
          userRole={user?.role}
        />
      )}
      
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange}
      />
      
      {products.length === 0 ? (
        <p className={styles.noProducts}>No products found</p>
      ) : (
        <>
          <div className={styles.grid}>
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
                showStatus={user?.role === 'admin' || 
                  (user?.role === 'seller' && product.seller_id === user.id)}
              />
            ))}
          </div>
          
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={styles.pageButton}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;
