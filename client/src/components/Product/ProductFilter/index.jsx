import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import { 
  USER_ROLES, 
  PRODUCT_STATUS, 
  STATUS_LABELS,
  SELLER_STATUS_LABELS 
} from '../../../constants/productConstants';
import LoadingSpinner from '../../Common/LoadingSpinner';
import styles from './ProductFilter.module.css';

/**
 * @typedef {Object} FilterProps
 * @property {Object} currentFilters - Current filter values
 * @property {string} currentFilters.status - Current status filter
 * @property {string} currentFilters.category - Current category filter
 * @property {string} currentFilters.search - Current search term
 * @property {Array<{id: string|number, name: string}>} categories - Available categories
 * @property {Function} onFilterChange - Callback when filters change
 * @property {string} role - User role (admin, seller, customer)
 * @property {boolean} [loading] - Loading state
 */

const ProductFilter = ({
  currentFilters = {},
  categories = [],
  onFilterChange,
  role,
  loading = false,
}) => {
  const [filters, setFilters] = useState({
    status: currentFilters.status || PRODUCT_STATUS.ALL,
    category: currentFilters.category || '',
    search: currentFilters.search || '',
  });
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setFilters({
      status: currentFilters.status || PRODUCT_STATUS.ALL,
      category: currentFilters.category || '',
      search: currentFilters.search || '',
    });
  }, [currentFilters]);

  // Debounce filter changes to prevent rapid API calls
  const debouncedFilterChange = useCallback(
    debounce((newFilters) => {
      onFilterChange(newFilters);
      setLocalLoading(false);
    }, 300),
    [onFilterChange]
  );

  const handleFilterChange = (field) => (e) => {
    const newValue = e.target.value;
    const newFilters = { ...filters, [field]: newValue };
    setFilters(newFilters);
    setLocalLoading(true);
    debouncedFilterChange(newFilters);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLocalLoading(true);
    debouncedFilterChange(filters);
  };

  const renderStatusOptions = () => {
    if (role === USER_ROLES.ADMIN) {
      return (
        <>
          <option value={PRODUCT_STATUS.ALL}>{STATUS_LABELS[PRODUCT_STATUS.ALL]}</option>
          <option value={PRODUCT_STATUS.PENDING}>{STATUS_LABELS[PRODUCT_STATUS.PENDING]}</option>
          <option value={PRODUCT_STATUS.APPROVED}>{STATUS_LABELS[PRODUCT_STATUS.APPROVED]}</option>
          <option value={PRODUCT_STATUS.REJECTED}>{STATUS_LABELS[PRODUCT_STATUS.REJECTED]}</option>
        </>
      );
    }
    
    if (role === USER_ROLES.SELLER) {
      return (
        <>
          <option value={PRODUCT_STATUS.ALL}>{SELLER_STATUS_LABELS[PRODUCT_STATUS.ALL]}</option>
          <option value={PRODUCT_STATUS.MINE}>{SELLER_STATUS_LABELS[PRODUCT_STATUS.MINE]}</option>
          <option value={PRODUCT_STATUS.APPROVED}>{SELLER_STATUS_LABELS[PRODUCT_STATUS.APPROVED]}</option>
          <option value={PRODUCT_STATUS.PENDING}>{SELLER_STATUS_LABELS[PRODUCT_STATUS.PENDING]}</option>
          <option value={PRODUCT_STATUS.REJECTED}>{SELLER_STATUS_LABELS[PRODUCT_STATUS.REJECTED]}</option>
        </>
      );
    }

    return null;
  };

  const renderFilterFeedback = () => {
    if (loading || localLoading) return null;
    
    const activeCat = categories.find(c => c.id.toString() === filters.category)?.name;
    const filterDesc = [];
    
    if (filters.status !== PRODUCT_STATUS.ALL) {
      filterDesc.push(role === USER_ROLES.SELLER 
        ? SELLER_STATUS_LABELS[filters.status]
        : STATUS_LABELS[filters.status]
      );
    }
    
    if (activeCat) {
      filterDesc.push(`in ${activeCat}`);
    }

    if (filters.search) {
      filterDesc.push(`matching "${filters.search}"`);
    }

    return filterDesc.length > 0 && (
      <p className={styles.filterFeedback} role="status">
        Showing {filterDesc.join(' ')}
      </p>
    );
  };

  return (
    <div className={styles.filterContainer} data-testid="product-filter">
      {(role === USER_ROLES.ADMIN || role === USER_ROLES.SELLER) && (
        <div className={styles.filterGroup}>
          <label htmlFor="status" className={styles.filterLabel}>
            Status
            {(loading || localLoading) && <LoadingSpinner size="small" className={styles.filterSpinner} />}
          </label>
          <select
            id="status"
            className={`${styles.filterSelect} ${(loading || localLoading) ? styles.disabled : ''}`}
            value={filters.status}
            onChange={handleFilterChange('status')}
            disabled={loading || localLoading}
            data-testid="status-filter"
          >
            {renderStatusOptions()}
          </select>
        </div>
      )}

      <div className={styles.filterGroup}>
        <label htmlFor="category" className={styles.filterLabel}>
          Category
          {(loading || localLoading) && <LoadingSpinner size="small" className={styles.filterSpinner} />}
        </label>
        <select
          id="category"
          className={`${styles.filterSelect} ${(loading || localLoading) ? styles.disabled : ''}`}
          value={filters.category}
          onChange={handleFilterChange('category')}
          disabled={loading || localLoading}
          data-testid="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <label htmlFor="search" className={styles.filterLabel}>
            Search
            {(loading || localLoading) && <LoadingSpinner size="small" className={styles.filterSpinner} />}
          </label>
          <input
            id="search"
            type="search"
            className={`${styles.searchInput} ${(loading || localLoading) ? styles.disabled : ''}`}
            value={filters.search}
            onChange={handleFilterChange('search')}
            placeholder="Search products..."
            disabled={loading || localLoading}
            data-testid="search-filter"
          />
          <button 
            type="submit" 
            className={styles.searchButton}
            disabled={loading || localLoading}
          >
            Search
          </button>
        </form>
      </div>

      {renderFilterFeedback()}
    </div>
  );
};

ProductFilter.propTypes = {
  currentFilters: PropTypes.shape({
    status: PropTypes.string,
    category: PropTypes.string,
    search: PropTypes.string,
  }),
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  })),
  onFilterChange: PropTypes.func.isRequired,
  role: PropTypes.oneOf(Object.values(USER_ROLES)),
  loading: PropTypes.bool,
};

export default ProductFilter;
