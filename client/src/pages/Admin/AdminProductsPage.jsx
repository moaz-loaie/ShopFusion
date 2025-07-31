import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  adminGetProductsForModeration,
  adminModerateProduct,
  adminUpdateModerationFeedback,
  adminGetAllUsers,
} from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import styles from './AdminProductsPage.module.css';

const statusBadgeClass = (status) => `${styles.statusBadge} ${styles[status] || ''}`;

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [moderatingId, setModeratingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'pending';
  const sellerId = searchParams.get('seller_id');
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Stats for the dashboard cards
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const fetchSellers = useCallback(async () => {
    try {
      const res = await adminGetAllUsers({ role: 'seller' });
      setSellers(res.data.data.users || []);
    } catch (err) {
      console.error('Failed to load sellers:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const promises = ['pending', 'approved', 'rejected'].map((status) =>
        adminGetProductsForModeration({
          status,
          limit: 1,
          ...(sellerId && { seller_id: sellerId }), // Include seller filter in stats
        }).then((res) => ({
          status,
          count: res.data.totalItems || 0,
        })),
      );

      const results = await Promise.all(promises);
      const newStats = results.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {});

      newStats.total = Object.values(newStats).reduce((sum, count) => sum + count, 0);
      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [sellerId]); // Add sellerId dependency

  useEffect(() => {
    fetchSellers();
    fetchStats();
  }, [fetchSellers, fetchStats]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusMsg('');
    try {
      const params = {
        page,
        limit: pagination.limit,
        status,
        ...(sellerId && { seller_id: sellerId }),
      };

      const res = await adminGetProductsForModeration(params);
      setProducts(res.data.data.moderationItems || []);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(res.data.totalItems / pagination.limit),
        totalItems: res.data.totalItems,
        limit: params.limit,
      });
    } catch (err) {
      setError(err.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, status, sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = (newStatus) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', newStatus);
    params.delete('page');
    setSearchParams(params);
  };

  const handleSellerFilter = (e) => {
    const newSellerId = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (newSellerId) {
      params.set('seller_id', newSellerId);
    } else {
      params.delete('seller_id');
    }
    params.delete('page');
    setSearchParams(params);
    // Refetch stats when seller filter changes
    fetchStats();
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleModerate = async (moderationId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this product?`)) return;
    setModeratingId(moderationId);
    setStatusMsg('');
    try {
      await adminModerateProduct(moderationId, { status });
      setStatusMsg(`Product ${status} successfully.`);
      fetchProducts(pagination.currentPage);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || `Failed to ${status} product.`);
    } finally {
      setModeratingId(null);
    }
  };

  const handleEditFeedback = (item) => {
    setEditingFeedbackId(item.id);
    setFeedbackDraft(item.feedback || '');
  };

  const handleSaveFeedback = async (item) => {
    setFeedbackLoading(true);
    try {
      await adminUpdateModerationFeedback(item.id, { feedback: feedbackDraft });
      setEditingFeedbackId(null);
      setFeedbackDraft('');
      fetchProducts(pagination.currentPage);
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to update feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleCancelFeedback = () => {
    setEditingFeedbackId(null);
    setFeedbackDraft('');
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Product Moderation Dashboard</h1>
        <p>Review and manage product submissions from sellers</p>
      </header>

      <section className={styles.statsGrid}>
        <div
          className={`${styles.card} ${styles.pendingCard}`}
          onClick={() => handleStatusChange('pending')}
        >
          <div className={styles.icon}>⏳</div>
          <div className={styles.value}>{stats.pending}</div>
          <div className={styles.label}>Pending Review</div>
        </div>
        <div
          className={`${styles.card} ${styles.approvedCard}`}
          onClick={() => handleStatusChange('approved')}
        >
          <div className={styles.icon}>✅</div>
          <div className={styles.value}>{stats.approved}</div>
          <div className={styles.label}>Approved</div>
        </div>
        <div
          className={`${styles.card} ${styles.rejectedCard}`}
          onClick={() => handleStatusChange('rejected')}
        >
          <div className={styles.icon}>❌</div>
          <div className={styles.value}>{stats.rejected}</div>
          <div className={styles.label}>Rejected</div>
        </div>
        <div className={`${styles.card} ${styles.totalCard}`}>
          <div className={styles.icon}>📊</div>
          <div className={styles.value}>{stats.total}</div>
          <div className={styles.label}>Total Products</div>
        </div>
      </section>

      <section className={styles.filtersSection}>
        <div className={styles.statusTabs}>
          <button
            className={status === 'pending' ? styles.activeTab : styles.tab}
            onClick={() => handleStatusChange('pending')}
          >
            Pending Review
          </button>
          <button
            className={status === 'approved' ? styles.activeTab : styles.tab}
            onClick={() => handleStatusChange('approved')}
          >
            Approved
          </button>
          <button
            className={status === 'rejected' ? styles.activeTab : styles.tab}
            onClick={() => handleStatusChange('rejected')}
          >
            Rejected
          </button>
        </div>

        <div className={styles.sellerFilter}>
          <select
            value={sellerId || ''}
            onChange={handleSellerFilter}
            className={styles.sellerSelect}
          >
            <option value="">All Sellers</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.full_name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.tableSection}>
        {loading ? (
          <div className={styles.loading}>Loading products...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.icon}>🔍</div>
            <h3>No products found</h3>
            <p>There are no products matching your current filters</p>
          </div>
        ) : (
          <>
            {statusMsg && <div className={styles.statusMessage}>{statusMsg}</div>}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/products/${item.product?.id}`} className={styles.productLink}>
                          {item.product?.id}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/products/${item.product?.id}`} className={styles.productLink}>
                          {item.product?.name}
                        </Link>
                      </td>
                      <td>{item.product?.Seller?.full_name}</td>
                      <td>
                        <span className={statusBadgeClass(item.status)}>{item.status}</span>
                      </td>
                      <td>{item.product?.stock_quantity ?? '-'}</td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleModerate(item.id, 'approved')}
                          disabled={moderatingId === item.id || item.status === 'approved'}
                          title="Approve product"
                        >
                          Approve
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleModerate(item.id, 'rejected')}
                          disabled={moderatingId === item.id || item.status === 'rejected'}
                          title="Reject product"
                        >
                          Reject
                        </button>
                        <div className={styles.feedbackSection}>
                          {editingFeedbackId === item.id ? (
                            <>
                              <textarea
                                className={styles.feedbackInput}
                                value={feedbackDraft}
                                onChange={(e) => setFeedbackDraft(e.target.value)}
                                rows={2}
                                placeholder="Enter feedback for seller..."
                              />
                              <button
                                onClick={() => handleSaveFeedback(item)}
                                disabled={feedbackLoading}
                                className={styles.saveBtn}
                              >
                                Save
                              </button>
                              <button onClick={handleCancelFeedback} className={styles.cancelBtn}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={styles.feedbackText}>
                                {item.feedback || <em>No feedback</em>}
                              </div>
                              <button
                                onClick={() => handleEditFeedback(item)}
                                className={styles.editBtn}
                              >
                                Edit Feedback
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
              <div className={styles.pageInfo}>
                Showing {products.length} of {pagination.totalItems} products
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminProductsPage;
