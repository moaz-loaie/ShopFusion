import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerDashboardStats } from '../../services/api';
import { Link } from 'react-router-dom';
import styles from './SellerDashboardPage.module.css';
import logger from '../../utils/logger';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorBoundary from '../../components/Common/ErrorBoundary/ErrorBoundary';

const SellerDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    pending: 0,
    rejected: 0,
    orders: 0,
    revenue: 0,
    lowStock: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      logger.debug('Fetching seller dashboard stats...');

      const response = await getSellerDashboardStats();

      if (!response?.data?.data) {
        throw new Error('Invalid response format from API');
      }

      const rawStats = response.data.data;
      
      // Validate stats and provide defaults with proper type casting
      const validatedStats = {
        products: parseInt(rawStats.total) || 0,
        pending: parseInt(rawStats.pendingCount) || 0,
        rejected: parseInt(rawStats.rejectedCount) || 0,
        approved: parseInt(rawStats.approvedCount) || 0,
        orders: parseInt(rawStats.orderCount) || 0,
        revenue: parseFloat(rawStats.revenue) || 0,
        lowStock: parseInt(rawStats.lowStockCount) || 0,
        averageRating: parseFloat(rawStats.averageRating) || 0,
        totalReviews: parseInt(rawStats.reviewCount) || 0
      };

      logger.debug('Seller dashboard stats:', validatedStats);
      setStats(validatedStats);
    } catch (err) {
      const errorMsg = 'Failed to load dashboard stats. Please try again.';
      logger.error('Error fetching seller stats:', err);
      setError(errorMsg);
      setStats({
        products: 0,
        pending: 0,
        rejected: 0,
        approved: 0,
        orders: 0,
        revenue: 0,
        lowStock: 0,
        averageRating: 0,
        totalReviews: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);
  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <LoadingSpinner 
          size="large" 
          text="Loading your dashboard..."
          overlay={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <h1>Dashboard Error</h1>
          <p className={styles.error}>{error}</p>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className={styles.retryButton}
          >
            Retry
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <ErrorBoundary
        fallback={(error, retry) => (
          <div className={styles.errorSection}>
            <h3>Failed to load dashboard header</h3>
            <button onClick={retry} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1>Seller Dashboard</h1>
              <p>
                Welcome back, <b>{user?.full_name}</b>! Here's your store overview.
              </p>
            </div>
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className={styles.refreshButton}
              title="Refresh stats"
            >
              🔄 Refresh
            </button>
          </div>
          {stats.averageRating > 0 && (
            <div className={styles.ratingInfo}>
              <span className={styles.stars}>{'★'.repeat(Math.round(stats.averageRating))}</span>
              <span className={styles.ratingText}>
                {stats.averageRating.toFixed(1)} average rating from {stats.totalReviews} reviews
              </span>
            </div>
          )}
        </header>
      </ErrorBoundary>

      <ErrorBoundary
        fallback={(error, retry) => (
          <div className={styles.errorSection}>
            <h3>Failed to load statistics</h3>
            <button onClick={retry} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}
      >
        <section className={styles.statsGrid}>
          <Link to="/seller/products" className={styles.card} title="View all products">
            <div className={styles.icon}>📦</div>
            <div className={styles.value}>{stats.products}</div>
            <div className={styles.label}>Total Products</div>
          </Link>
          <Link
            to="/seller/products?filter=pending"
            className={styles.card}
            title="View pending products"
          >
            <div className={styles.icon}>⌛</div>
            <div className={styles.value}>{stats.pending}</div>
            <div className={styles.label}>Awaiting Approval</div>
          </Link>
          <Link
            to="/seller/products?filter=rejected"
            className={styles.card}
            title="View rejected products"
          >
            <div className={styles.icon}>⚠️</div>
            <div className={styles.value}>{stats.rejected}</div>
            <div className={styles.label}>Needs Attention</div>
          </Link>
          <Link to="/seller/orders" className={styles.card} title="View all orders">
            <div className={styles.icon}>🛍️</div>
            <div className={styles.value}>{stats.orders}</div>
            <div className={styles.label}>Total Orders</div>
          </Link>
          <Link to="/seller/analytics" className={styles.card} title="View revenue details">
            <div className={styles.icon}>💰</div>
            <div className={styles.value}>${stats.revenue.toLocaleString()}</div>
            <div className={styles.label}>Total Revenue</div>
          </Link>
          <Link
            to="/seller/products?filter=low-stock"
            className={styles.card}
            title="View low stock products"
          >
            <div className={styles.icon}>📉</div>
            <div className={styles.value}>{stats.lowStock}</div>
            <div className={styles.label}>Low Stock Items</div>
          </Link>
        </section>
      </ErrorBoundary>

      <ErrorBoundary
        fallback={(error, retry) => (
          <div className={styles.errorSection}>
            <h3>Failed to load quick actions</h3>
            <button onClick={retry} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}
      >
        <section className={styles.quickLinks}>
          <h2>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <Link to="/seller/products/new" className={styles.actionBtn}>
              <span className={styles.actionIcon}>➕</span>
              Add New Product
            </Link>
            <Link to="/seller/orders?status=pending" className={styles.actionBtn}>
              <span className={styles.actionIcon}>📋</span>
              Pending Orders
            </Link>
            <Link to="/seller/products?filter=low-stock" className={styles.actionBtn}>
              <span className={styles.actionIcon}>🔄</span>
              Restock Items
            </Link>
            <Link to="/seller/analytics" className={styles.actionBtn}>
              <span className={styles.actionIcon}>📊</span>
              View Reports
            </Link>
          </div>
        </section>
      </ErrorBoundary>
    </div>
  );
};

export default SellerDashboardPage;
