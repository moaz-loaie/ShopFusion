import React, { useEffect, useState } from 'react';
import { adminGetAllSellers, adminUpdateSellerStatus } from '../../services/adminApi';
import Pagination from '../../components/Common/Pagination';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import Toast from '../../components/Common/Toast';
import useDebounce from '../../hooks/useDebounce';
import logger from '../../utils/logger';
import styles from './AdminSellersPage.module.css';

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    productCount: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [stats, setStats] = useState({
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    suspendedSellers: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: null,
  });
  const [actionLoading, setActionLoading] = useState({});
  
  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchSellers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        search: debouncedSearch
      };
      logger.debug('Fetching sellers with params:', params);
      const res = await adminGetAllSellers(params);
      
      const responseData = res.data.data;
      setSellers(responseData.sellers || []);
      setStats({
        totalSellers: responseData.totalSellers || 0,
        activeSellers: responseData.activeSellers || 0,
        pendingSellers: (responseData.sellers || [])
          .filter(s => s.is_active && !s.products_count).length,
        suspendedSellers: (responseData.sellers || [])
          .filter(s => !s.is_active).length
      });
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages: Math.ceil((responseData.totalSellers || 0) / prev.limit),
        totalItems: responseData.totalSellers || 0
      }));
    } catch (err) {
      const errorMsg = err.message || 'Failed to load sellers.';
      logger.error('Error fetching sellers:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers(1);
  }, [filters.status, filters.productCount, debouncedSearch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setSelectedSellers([]); // Clear selections when filters change
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    fetchSellers(newPage);
  };

  const handleSellerSelect = (sellerId) => {
    setSelectedSellers(prev => {
      if (prev.includes(sellerId)) {
        return prev.filter(id => id !== sellerId);
      }
      return [...prev, sellerId];
    });
  };

  const handleSelectAll = () => {
    setSelectedSellers(prev => 
      prev.length === sellers.length ? [] : sellers.map(s => s.id)
    );
  };
  const confirmStatusUpdate = (sellerId, newStatus, isBulk = false) => {
    const sellerIds = isBulk ? selectedSellers : [sellerId];
    const message = `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${
      isBulk ? `${sellerIds.length} sellers` : 'this seller'
    }?\n\n${
      newStatus 
        ? 'This will allow them to list products and make sales.' 
        : 'This will hide all their products from the marketplace.'
    }`;
    logger.debug('Opening confirm dialog:', { message, newStatus, isBulk, sellerIds });

    setConfirmDialog({
      isOpen: true,
      title: `${newStatus ? 'Activate' : 'Deactivate'} ${isBulk ? 'Sellers' : 'Seller'}`,
      message,
      confirmAction: () => handleStatusUpdate(sellerIds, newStatus)
    });
  };

  const handleStatusUpdate = async (sellerIds, isActive) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setActionLoading(prev => 
      sellerIds.reduce((acc, id) => ({ ...acc, [id]: true }), prev)
    );

    try {
      await Promise.all(
        sellerIds.map(id => adminUpdateSellerStatus(id, isActive))
      );
      
      await fetchSellers(pagination.currentPage);
      setSelectedSellers([]);
      
      Toast.success(
        `Successfully ${isActive ? 'activated' : 'deactivated'} ${
          sellerIds.length > 1 ? 'sellers' : 'seller'
        }`
      );
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setActionLoading(prev => 
        sellerIds.reduce((acc, id) => ({ ...acc, [id]: false }), prev)
      );
    }
  };

  if (loading && !sellers.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.sellersContainer}>
      <header className={styles.pageHeader}>
        <h1>Manage Sellers</h1>
        <p>View and manage all sellers on the platform</p>
      </header>

      <div className={styles.statsContainer}>
        <div className={styles.statCard} title="Total number of registered sellers">
          <h3>Total Sellers</h3>
          <p className={styles.statNumber}>{stats.totalSellers}</p>
        </div>
        <div className={styles.statCard} title="Sellers with approved products who are actively selling">
          <h3>Active Sellers</h3>
          <p className={styles.statNumber}>{stats.activeSellers}</p>
          <p className={styles.statPercentage}>
            {stats.totalSellers ? 
              `${Math.round((stats.activeSellers / stats.totalSellers) * 100)}%` 
              : '0%'}
          </p>
        </div>
        <div className={styles.statCard} title="Sellers who have registered but haven't listed any products">
          <h3>Pending Sellers</h3>
          <p className={styles.statNumber}>{stats.pendingSellers}</p>
        </div>
        <div className={styles.statCard} title="Sellers who have been deactivated">
          <h3>Suspended</h3>
          <p className={styles.statNumber}>{stats.suspendedSellers}</p>
        </div>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchForm}>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name or email..."
            className={styles.searchInput}
            aria-label="Search sellers"
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            name="productCount"
            value={filters.productCount}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            aria-label="Filter by product count"
          >
            <option value="">All Product Counts</option>
            <option value="=:0">No Products</option>
            <option value=">:0">Has Products</option>
            <option value=">=:10">10+ Products</option>
            <option value=">=:50">50+ Products</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSellers.length > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.selectedCount}>
            {selectedSellers.length} sellers selected
          </span>
          <button
            onClick={() => confirmStatusUpdate(null, true, true)}
            className={`${styles.bulkActionButton} ${styles.activateBtn}`}
          >
            Activate Selected
          </button>
          <button
            onClick={() => confirmStatusUpdate(null, false, true)}
            className={`${styles.bulkActionButton} ${styles.deactivateBtn}`}
          >
            Deactivate Selected
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <div className={styles.tableContainer}>
        <table className={styles.sellersTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedSellers.length === sellers.length}
                  onChange={handleSelectAll}
                  aria-label="Select all sellers"
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Products</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map(seller => (
              <tr key={seller.id} className={styles.sellerRow}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSellers.includes(seller.id)}
                    onChange={() => handleSellerSelect(seller.id)}
                    aria-label={`Select ${seller.full_name}`}
                  />
                </td>
                <td>{seller.id}</td>
                <td>{seller.full_name}</td>
                <td>{seller.email}</td>
                <td>
                  <span 
                    className={`${styles.statusBadge} ${
                      seller.is_active ? styles.statusActive : styles.statusInactive
                    }`}
                  >
                    {seller.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <span className={seller.products_count === 0 ? styles.noProducts : ''}>
                    {seller.products_count || 0}
                  </span>
                </td>
                <td>{new Date(seller.createdAt).toLocaleDateString()}</td>
                <td>                  <button 
                    className={`${styles.actionButton} ${
                      seller.is_active ? styles.deactivateBtn : styles.activateBtn
                    }`}
                    onClick={() => {
                      logger.debug('Action button clicked:', { 
                        sellerId: seller.id, 
                        currentStatus: seller.is_active 
                      });
                      confirmStatusUpdate(seller.id, !seller.is_active);
                    }}
                    disabled={actionLoading[seller.id]}
                  >
                    {actionLoading[seller.id] ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      seller.is_active ? 'Deactivate' : 'Activate'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        className={styles.pagination}
      />

      {confirmDialog.isOpen && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.confirmAction}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default AdminSellersPage;
