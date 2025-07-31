import React, { useEffect, useState } from 'react';
import { adminGetDashboardStats } from '../../services/api';
import styles from './AdminAnalyticsPage.module.css';

const AdminAnalyticsPage = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    productPendingCount: 0,
    orderCount: 0,
    disputeCount: 0,
    totalRevenue: 0,
    activeSellerCount: 0,
    urgentDisputes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminGetDashboardStats();
        setStats(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className={styles.dashboardContainer}>Loading analytics...</div>;
  if (error) return <div className={styles.dashboardContainer}>{error}</div>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Platform Analytics</h1>
        <p>Detailed metrics and performance analysis</p>
      </header>

      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>User Growth</div>
          <div className={styles.analyticsValue}>{stats.userCount}</div>
          <div className={styles.analyticsDesc}>Total registered users</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Seller Performance</div>
          <div className={styles.analyticsValue}>{stats.activeSellerCount}</div>
          <div className={styles.analyticsDesc}>Active sellers with products</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Revenue</div>
          <div className={styles.analyticsValue}>${stats.totalRevenue?.toLocaleString()}</div>
          <div className={styles.analyticsDesc}>Total platform revenue</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Orders</div>
          <div className={styles.analyticsValue}>{stats.orderCount}</div>
          <div className={styles.analyticsDesc}>Total active orders</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Product Moderation</div>
          <div className={styles.analyticsValue}>{stats.productPendingCount}</div>
          <div className={styles.analyticsDesc}>Products awaiting review</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Customer Support</div>
          <div className={styles.analyticsValue}>{stats.disputeCount}</div>
          <div className={styles.analyticsDesc}>Open support tickets</div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
