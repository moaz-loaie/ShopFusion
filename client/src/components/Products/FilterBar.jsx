import React, { useCallback } from 'react';
import { debounce } from 'lodash';
import styles from './FilterBar.module.css';

const FilterBar = ({ filters, onFilterChange, showStatusFilter }) => {
  const handleInputChange = (name, value) => {
    onFilterChange({ [name]: value });
  };

  // Debounce search and price inputs
  const debouncedSearch = useCallback(
    debounce((value) => handleInputChange('search', value), 500),
    []
  );

  const debouncedPrice = useCallback(
    debounce((name, value) => handleInputChange(name, value), 500),
    []
  );

  return (
    <div className={styles.filterBar}>
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => debouncedSearch(e.target.value)}
        className={styles.searchInput}
      />

      {showStatusFilter && (
        <select
          value={filters.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className={styles.select}
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      )}

      <select
        value={filters.category}
        onChange={(e) => handleInputChange('category', e.target.value)}
        className={styles.select}
      >
        <option value="">All Categories</option>
        {/* Categories will be dynamically populated */}
      </select>

      <div className={styles.priceFilter}>
        <input
          type="number"
          placeholder="Min Price"
          onChange={(e) => debouncedPrice('minPrice', e.target.value)}
          className={styles.priceInput}
        />
        <span>-</span>
        <input
          type="number"
          placeholder="Max Price"
          onChange={(e) => debouncedPrice('maxPrice', e.target.value)}
          className={styles.priceInput}
        />
      </div>
    </div>
  );
};

export default FilterBar;
