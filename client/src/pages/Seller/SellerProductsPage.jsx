import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProducts, deleteProduct, bulkUpdateProducts, getProductStats } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import Pagination from '../../components/Common/Pagination';
import Toast from '../../components/Common/Toast';
import classNames from 'classnames';
import styles from './SellerProductsPage.module.css';

const SellerProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    rejected: 0,
    approved: 0,
    lowStock: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 10,
  });

  const filter = searchParams.get('filter') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchProducts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setStatusMsg('');

    try {
      const params = {
        page: currentPage,
        limit: pagination.limit,
        sort,
        search,
      };

      // Handle different filter types
      switch (filter) {
        case 'low-stock':
          params.seller_id = user.id;
          params.stock_below = 5;
          break;
        case 'pending':
          params.seller_id = user.id;
          params.status = 'pending';
          break;
        case 'rejected':
          params.seller_id = user.id;
          params.status = 'rejected';
          break;
        case 'approved':
          params.status = 'approved';
          params.exclude_seller = user.id; // Show only other sellers' approved products
          break;
        case 'mine':
          params.seller_id = user.id; // Show all own products
          break;
        case 'all':
        default:
          // Default behavior: show all own products + other sellers' approved products
          break;
      }

      const res = await getProducts(params);
      
      if (!res.data?.data?.products) {
        throw new Error('Invalid response format');
      }

      setProducts(res.data.data.products);
      setPagination(prev => ({
        ...prev,
        currentPage,
        totalPages: Math.ceil(res.data.data.totalProducts / prev.limit),
        totalProducts: res.data.data.totalProducts,
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load products';
      logger.error('Error fetching products:', err);
      setError(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, sort, search, currentPage, pagination.limit]);

  const fetchProductStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get detailed stats from server
      const res = await getProductStats(user.id);
      
      if (!res.data?.data) {
        throw new Error('Invalid response format from API');
      }

      // Process and validate stats with proper error checking
      const rawStats = res.data.data;
      const validatedStats = {
        pending: Math.max(0, parseInt(rawStats.pendingCount) || 0),
        rejected: Math.max(0, parseInt(rawStats.rejectedCount) || 0),
        approved: Math.max(0, parseInt(rawStats.approvedCount) || 0),
        lowStock: Math.max(0, parseInt(rawStats.lowStockCount) || 0),
        total: Math.max(0, parseInt(rawStats.total) || 0),
        awaitingApproval: Math.max(0, parseInt(rawStats.pendingCount) || 0),
        needsAttention: Math.max(0, parseInt(rawStats.rejectedCount) || 0) + Math.max(0, parseInt(rawStats.lowStockCount) || 0)
      };

      // Update state only if we have valid data
      setStats(validatedStats);
    } catch (err) {
      logger.error('Error fetching product stats:', err);
      Toast.error('Failed to load product statistics');
      // Keep existing stats on error instead of resetting to 0
      setError('Failed to load product statistics');
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProducts();
    fetchProductStats();
  }, [fetchProducts, fetchProductStats]);

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleFilterChange = (newFilter) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter !== 'all') {
      params.set('filter', newFilter);
    } else {
      params.delete('filter');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    const searchValue = e.target.search.value;
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(productId);
    setStatusMsg('');
    try {
      await deleteProduct(productId);
      Toast.success('Product deleted successfully.');
      fetchProducts();
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedProducts.length) return;

    const actionLabels = {
      restock: 'restock',
      delete: 'delete',
      update: 'update'
    };

    if (!window.confirm(`Are you sure you want to ${actionLabels[action]} the selected products?`)) {
      return;
    }

    setStatusMsg('');
    try {
      let value = null;
      if (action === 'restock') {
        const amount = prompt('Enter the amount to add to current stock:', '10');
        if (!amount || isNaN(amount)) return;
        value = parseInt(amount, 10);
      }

      await bulkUpdateProducts(selectedProducts, { action, value });
      Toast.success(`Bulk ${action} completed successfully.`);
      fetchProducts();
      setSelectedProducts([]);
    } catch (err) {
      Toast.error(err.response?.data?.message || `Failed to ${action} products.`);
    }
  };

  const handleSelectAll = (e) => {
    setSelectedProducts(e.target.checked ? products.map(p => p.id) : []);
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleFeedback = (productId, feedback) => {
    if (!feedback) return;
    
    const tooltipContent = feedback.length > 100 
      ? feedback.substring(0, 97) + '...'
      : feedback;

    return (
      <span
        className={styles.feedbackIcon}
        data-tip={tooltipContent}
        data-for={`feedback-${productId}`}
        title={feedback}
      >
        ℹ️
      </span>
    );
  };

  const filters = [
    { value: 'all', label: 'All Products' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: `Pending Review (${stats?.pending || 0})` },
    { value: 'rejected', label: `Needs Attention (${stats?.rejected || 0})` },
    { value: 'low-stock', label: `Low Stock (${stats?.lowStock || 0})` },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'stock-low', label: 'Stock: Low to High' },
    { value: 'stock-high', label: 'Stock: High to Low' },
  ];

  const statusBadgeClass = (status) => {
    return classNames(styles.statusBadge, {
      [styles.pending]: status === 'pending',
      [styles.approved]: status === 'approved',
      [styles.rejected]: status === 'rejected',
    });
  };

  // Stats display component
  const StatsSection = () => (
    <div className={styles.statsSection}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => handleFilterChange('all')}>
          <h3>Total Products</h3>
          <p className={styles.statNumber}>{stats.total}</p>
          <Link to="/seller/products/new" className={styles.addNewLink}>
            + Add New Product
          </Link>
        </div>
        <div 
          className={classNames(styles.statCard, { [styles.highlight]: filter === 'pending' })}
          onClick={() => handleFilterChange('pending')}
        >
          <h3>Awaiting Approval</h3>
          <p className={styles.statNumber}>{stats.awaitingApproval}</p>
          {stats.awaitingApproval > 0 && (
            <span className={styles.statusBadge}>Needs Review</span>
          )}
        </div>
        <div 
          className={classNames(styles.statCard, { [styles.highlight]: filter === 'rejected' || filter === 'low-stock' })}
          onClick={() => handleFilterChange(stats.needsAttention > 0 ? 'rejected' : null)}
        >
          <h3>Needs Attention</h3>
          <p className={styles.statNumber}>{stats.needsAttention}</p>
          {stats.rejected > 0 && (
            <span className={styles.statusBadge}>Rejected: {stats.rejected}</span>
          )}
          {stats.lowStock > 0 && (
            <span className={styles.statusBadge}>Low Stock: {stats.lowStock}</span>
          )}
        </div>
        <div 
          className={classNames(styles.statCard, { [styles.highlight]: filter === 'approved' })}
          onClick={() => handleFilterChange('approved')}
        >
          <h3>Approved Products</h3>
          <p className={styles.statNumber}>{stats.approved}</p>
        </div>
      </div>
    </div>
  );

  if (loading && !products.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>My Products</h1>
        <div className={styles.actions}>
          <Link to="/seller/products/new" className={styles.addButton}>
            Add New Product
          </Link>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search products..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              🔍
            </button>
          </form>
        </div>
      </header>

      <StatsSection />

      <div className={styles.controls}>
        <div className={styles.tabNav}>
          {filters.map(({ value, label }) => (
            <button
              key={value}
              className={classNames(styles.tab, {
                [styles.activeTab]: filter === value,
              })}
              onClick={() => handleFilterChange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.sortContainer}>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className={styles.sortSelect}
          >
            {sortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.bulkActions}>
        <div className={styles.selectedCount}>
          {selectedProducts.length} products selected
        </div>
        <div className={styles.bulkButtons}>
          <button
            onClick={() => handleBulkAction('restock')}
            disabled={!selectedProducts.length}
            className={styles.bulkButton}
          >
            Add Stock
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={!selectedProducts.length}
            className={`${styles.bulkButton} ${styles.deleteButton}`}
          >
            Delete Selected
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading products...</div>
        ) : (
          <>
            {statusMsg && (
              <div className={`${styles.statusMsg} ${styles.success}`}>{statusMsg}</div>
            )}

            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedProducts.length === products.length && products.length > 0}
                      disabled={products.length === 0}
                    />
                  </th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>
                      No products found for this view.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                      </td>
                      <td>
                        <Link to={`/products/${product.id}`}>#{product.id}</Link>
                      </td>
                      <td>
                        <Link to={`/products/${product.id}`}>{product.name}</Link>
                      </td>
                      <td>
                        <div className={styles.statusCell}>
                          <span className={statusBadgeClass(product.moderationStatus?.status)}>
                            {product.moderationStatus?.status || 'pending'}
                          </span>
                          {product.moderationStatus?.feedback && handleFeedback(product.id, product.moderationStatus.feedback)}
                        </div>
                      </td>
                      <td className={product.stock_quantity <= 5 ? styles.lowStock : ''}>
                        {product.stock_quantity}
                      </td>
                      <td>${product.price?.toFixed(2)}</td>
                      <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className={styles.editBtn}
                          >
                            Edit
                          </Link>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
              <div className={styles.pageInfo}>
                Showing {products.length} of {pagination.totalProducts} products
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerProductsPage;
