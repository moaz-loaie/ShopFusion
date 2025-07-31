import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getDisputeStats } from '../../services/adminApi';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import StatsCard from '../../components/Common/StatsCard';
import TrendIndicator from '../../components/Common/TrendIndicator';
import styles from './AdminDashboardPage.module.css';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    sellers: {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
      newLastWeek: 0
    },
    products: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      lowStock: 0
    },
    disputes: {
      total: 0,
      open: 0,
      urgent: 0,
      averageResolutionTime: 0
    },
    revenue: {
      total: 0,
      lastWeek: 0,
      growth: 0
    }
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [adminStats, disputeStats] = await Promise.all([
        getAdminStats(),
        getDisputeStats()
      ]);

      setStats(prev => ({
        ...prev,
        sellers: {
          total: parseInt(adminStats.data.sellers.total) || 0,
          active: parseInt(adminStats.data.sellers.active) || 0,
          pending: parseInt(adminStats.data.sellers.pending) || 0,
          suspended: parseInt(adminStats.data.sellers.suspended) || 0,
          newLastWeek: parseInt(adminStats.data.sellers.newLastWeek) || 0
        },
        products: {
          total: parseInt(adminStats.data.products.total) || 0,
          pending: parseInt(adminStats.data.products.pending) || 0,
          approved: parseInt(adminStats.data.products.approved) || 0,
          rejected: parseInt(adminStats.data.products.rejected) || 0,
          lowStock: parseInt(adminStats.data.products.lowStock) || 0
        },
        revenue: {
          total: parseFloat(adminStats.data.revenue.total) || 0,
          lastWeek: parseFloat(adminStats.data.revenue.lastWeek) || 0,
          growth: parseFloat(adminStats.data.revenue.growth) || 0
        },
        disputes: {
          total: parseInt(disputeStats.data.total) || 0,
          open: parseInt(disputeStats.data.open) || 0,
          urgent: parseInt(disputeStats.data.urgent) || 0,
          averageResolutionTime: parseFloat(disputeStats.data.averageResolutionTime) || 0
        }
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
      
      {/* Sellers Section */}
      <section className={styles.statsSection}>
        <h2>Seller Management</h2>
        <div className={styles.statsGrid}>
          <Link to="/admin/sellers" className={styles.statCard}>
            <h3>Active Sellers</h3>
            <p className={styles.statNumber}>{stats.sellers.active}</p>
            <span className={styles.statLabel}>of {stats.sellers.total} Total</span>
            {stats.sellers.newLastWeek > 0 && (
              <span className={styles.badge} data-type="success">
                +{stats.sellers.newLastWeek} New this week
              </span>
            )}
            <span className={styles.statSubtext}>
              {((stats.sellers.active / stats.sellers.total) * 100).toFixed(1)}% Active Rate
            </span>
          </Link>

          <Link to="/admin/sellers?status=pending" className={styles.statCard}>
            <h3>Pending Sellers</h3>
            <p className={styles.statNumber}>{stats.sellers.pending}</p>
            <span className={styles.statLabel}>Awaiting First Product</span>
            {stats.sellers.pending > 0 && (
              <span className={styles.badge} data-type="warning">Needs Attention</span>
            )}
          </Link>

          <Link to="/admin/sellers?status=inactive" className={styles.statCard}>
            <h3>Suspended Sellers</h3>
            <p className={styles.statNumber}>{stats.sellers.suspended}</p>
            <span className={styles.statLabel}>Account Review Required</span>
            {stats.sellers.suspended > 0 && (
              <span className={styles.badge} data-type="danger">Action Needed</span>
            )}
          </Link>

          <Link to="/admin/analytics/sellers" className={styles.statCard}>
            <h3>Seller Performance</h3>
            <p className={styles.statNumber}>
              {stats.products.approved}
              <span className={styles.statUnit}>products</span>
            </p>
            <span className={styles.statLabel}>
              Avg {(stats.products.approved / (stats.sellers.active || 1)).toFixed(1)} per seller
            </span>
            <TrendIndicator
              value={stats.sellers.newLastWeek}
              type="growth"
              label="New Sellers"
            />
          </Link>
        </div>
      </section>

      {/* Products Section */}
      <section className={styles.statsSection}>
        <h2>Product Management</h2>
        <div className={styles.statsGrid}>
          <Link to="/admin/products" className={styles.statCard}>
            <h3>Total Products</h3>
            <p className={styles.statNumber}>{stats.products.total}</p>
            <div className={styles.statsBreakdown}>
              <span className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Approved:</span>
                <span className={styles.breakdownValue}>{stats.products.approved}</span>
              </span>
              <span className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Pending:</span>
                <span className={styles.breakdownValue}>{stats.products.pending}</span>
              </span>
            </div>
          </Link>

          <Link to="/admin/products?status=pending" className={styles.statCard}>
            <h3>Pending Review</h3>
            <p className={styles.statNumber}>{stats.products.pending}</p>
            {stats.products.pending > 0 && (
              <span className={styles.badge} data-type="warning">Needs Review</span>
            )}
          </Link>

          <Link to="/admin/products?filter=low-stock" className={styles.statCard}>
            <h3>Low Stock</h3>
            <p className={styles.statNumber}>{stats.products.lowStock}</p>
            {stats.products.lowStock > 0 && (
              <span className={styles.badge} data-type="warning">Monitor</span>
            )}
          </Link>

          <Link to="/admin/products?status=rejected" className={styles.statCard}>
            <h3>Rejected Products</h3>
            <p className={styles.statNumber}>{stats.products.rejected}</p>
            <span className={styles.statLabel}>Need Revision</span>
          </Link>
        </div>
      </section>

      {/* Revenue Section */}
      <section className={styles.statsSection}>
        <h2>Revenue Overview</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Revenue</h3>
            <p className={styles.statNumber}>
              ${stats.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className={styles.statCard}>
            <h3>Weekly Revenue</h3>
            <p className={styles.statNumber}>
              ${stats.revenue.lastWeek.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <TrendIndicator
              value={stats.revenue.growth}
              type="percentage"
              label="vs last week"
            />
          </div>

          <Link to="/admin/disputes" className={styles.statCard}>
            <h3>Open Disputes</h3>
            <p className={styles.statNumber}>{stats.disputes.open}</p>
            {stats.disputes.urgent > 0 && (
              <span className={styles.badge} data-type="danger">
                {stats.disputes.urgent} Urgent
              </span>
            )}
          </Link>

          <div className={styles.statCard}>
            <h3>Resolution Time</h3>
            <p className={styles.statNumber}>
              {stats.disputes.averageResolutionTime.toFixed(1)}
              <span className={styles.statUnit}>days</span>
            </p>
            <span className={styles.statLabel}>Average</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
