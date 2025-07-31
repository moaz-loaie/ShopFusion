import React, { useEffect, useState } from 'react';
import styles from './SellerAnalyticsPage.module.css';
import { getProducts, getMyOrders } from '../../services/api';

const SellerAnalyticsPage = () => {
  const [stats, setStats] = useState({
    productCount: 0,
    orderCount: 0,
    revenue: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products and orders for seller
        const [productsRes, ordersRes] = await Promise.all([getProducts(), getMyOrders()]);
        const products = productsRes.data.data.products || [];
        const orders = ordersRes.data.orders || ordersRes.data.data.orders || [];
        const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const lowStock = products.filter((p) => p.stock_quantity <= 5).length;
        setStats({
          productCount: products.length,
          orderCount: orders.length,
          revenue,
          lowStock,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className={styles.pageContainer}>Loading analytics...</div>;
  if (error) return <div className={styles.pageContainer}>{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.header}>Sales Analytics</h1>
      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>My Products</div>
          <div className={styles.analyticsValue}>{stats.productCount}</div>
          <div className={styles.analyticsDesc}>Total products listed</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Orders</div>
          <div className={styles.analyticsValue}>{stats.orderCount}</div>
          <div className={styles.analyticsDesc}>Orders received</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Revenue</div>
          <div className={styles.analyticsValue}>${stats.revenue.toFixed(2)}</div>
          <div className={styles.analyticsDesc}>Total sales revenue</div>
        </div>
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsTitle}>Low Stock</div>
          <div className={styles.analyticsValue}>{stats.lowStock}</div>
          <div className={styles.analyticsDesc}>Products low in stock (&le; 5)</div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
