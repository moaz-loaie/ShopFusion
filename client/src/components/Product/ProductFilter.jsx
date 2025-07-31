import React, { useState, useEffect } from 'react';
import styles from './ProductFilter.module.css';

/**
 * ProductFilter provides category, price, and sort filtering for the product list.
 * @param {Array} categories - List of category objects from API.
 * @param {Object} currentFilters - Current filter values from URL/search params.
 * @param {Function} onFilterChange - Callback to update filters.
 * @param {Function} onSortChange - Callback to update sort order.
 * @param {string} role - User role (admin, seller, or null for guests/customers)
 */
const ProductFilter = ({
  categories = [],
  currentFilters = {},
  onFilterChange,
  onSortChange,
  role,
  loading = false,
  error = null
}) => {
  const [status, setStatus] = useState(currentFilters.status || 'all');
  const [category, setCategory] = useState(currentFilters.category || 'all');
  const [sort, setSort] = useState(currentFilters.sort || '');
  const [priceRange, setPriceRange] = useState({
    min: currentFilters.minPrice || '',
    max: currentFilters.maxPrice || ''
  });

  useEffect(() => {
    setStatus(currentFilters.status || 'all');
    setCategory(currentFilters.category || 'all');
    setSort(currentFilters.sort || '');
    setPriceRange({
      min: currentFilters.minPrice || '',
      max: currentFilters.maxPrice || ''
    });
  }, [currentFilters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    
    const filters = {
      ...currentFilters,
      ...(priceRange.min ? { minPrice: priceRange.min } : { minPrice: null }),
      ...(priceRange.max ? { maxPrice: priceRange.max } : { maxPrice: null })
    };
    
    if (!filters.minPrice) delete filters.minPrice;
    if (!filters.maxPrice) delete filters.maxPrice;
    
    onFilterChange(filters);
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({
      ...prev,
      [name === 'minPrice' ? 'min' : 'max']: value.trim() === '' ? '' : value
    }));
  };

  const handleResetPriceRange = () => {
    setPriceRange({ min: '', max: '' });
    onFilterChange({
      ...currentFilters,
      minPrice: null,
      maxPrice: null
    });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    if (!loading) {
      const updatedFilters = {
        ...currentFilters,
        page: '1'
      };

      if (newStatus === 'all') {
        delete updatedFilters.status;
      } else {
        updatedFilters.status = newStatus;
      }
      
      onFilterChange(updatedFilters);
    }
  };

  const handleCategoryChange = (e) => {
    const newValue = e.target.value;
    setCategory(newValue);
    if (!loading) {
      onFilterChange({
        ...currentFilters,
        category: newValue === 'all' ? null : newValue,
        page: '1'
      });
    }
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSort(newSort);
    if (!loading) {
      onSortChange(newSort);
    }
  };

  const getStatusOptions = () => {
    if (role === 'admin') {
      return (
        <>
          <option value="all">All Products</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved Products</option>
          <option value="rejected">Rejected Products</option>
        </>
      );
    } else if (role === 'seller') {
      return (
        <>
          <option value="all">All Products (Mine + Others' Approved)</option>
          <option value="mine">My Products Only</option>
          <option value="approved">Other Sellers' Approved Products</option>
          <option value="pending">My Pending Products</option>
          <option value="rejected">My Rejected Products</option>
        </>
      );
    }
    // Customers don't see status filter
    return null;
  };

  return (
    <div className={styles.filterWrapper}>
      <form onSubmit={handleSubmit} className={styles.filterContainer}>
        {/* Status filter only for admin/seller */}
        {(role === 'admin' || role === 'seller') && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={styles.filterSelect}
              value={status}
              onChange={handleStatusChange}
              disabled={loading}
            >
              {getStatusOptions()}
            </select>
          </div>
        )}

        {/* Category filter for all users */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className={styles.filterSelect}
            value={category}
            onChange={handleCategoryChange}
            disabled={loading}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price range filter for all users */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Price Range</label>
          <div className={styles.priceInputs}>
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={priceRange.min}
              onChange={handlePriceChange}
              className={styles.priceInput}
              min="0"
              disabled={loading}
            />
            <span className={styles.priceSeparator}>to</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={priceRange.max}
              onChange={handlePriceChange}
              className={styles.priceInput}
              min="0"
              disabled={loading}
            />
            <div className={styles.priceActions}>
              <button 
                type="submit" 
                className={styles.applyButton}
                disabled={loading || (!priceRange.min && !priceRange.max)}
              >
                {loading ? 'Applying...' : 'Apply'}
              </button>
              {(priceRange.min || priceRange.max) && (
                <button
                  type="button"
                  onClick={handleResetPriceRange}
                  className={styles.resetButton}
                  disabled={loading}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sort filter for all users */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="sort">
            Sort By
          </label>
          <select
            id="sort"
            className={styles.filterSelect}
            value={sort}
            onChange={handleSortChange}
            disabled={loading}
          >
            <option value="">Latest</option>
            <option value="price:asc">Price: Low to High</option>
            <option value="price:desc">Price: High to Low</option>
            <option value="createdAt:desc">Newest</option>
            <option value="popularity:desc">Most Popular</option>
          </select>
        </div>

        {loading && (
          <div className={styles.loadingOverlay} role="status">
            <div className={styles.loadingSpinner}></div>
            <span className={styles.visuallyHidden}>Loading...</span>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductFilter;
