import React, { useEffect, useState, useCallback } from 'react';
import { getSellerOrders } from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import styles from './SellerOrdersPage.module.css';

const statusBadgeClass = (status) => `${styles.statusBadge} ${styles[status] || ''}`;

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: pagination.limit };
        const res = await getSellerOrders(params);
        setOrders(res.data.data.orders || []);
        setPagination({
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          totalOrders: res.data.totalOrders || 0,
          limit: params.limit,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit],
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handlePageChange = (page) => {
    fetchOrders(page);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>My Orders</h1>
        <p>View and manage orders containing your products.</p>
      </header>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div>Loading orders...</div>
        ) : error ? (
          <div className={styles.statusMsg}>{error}</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>No orders found.</div>
        ) : (
          <>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Your Items</th>
                  <th>Your Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer?.full_name}</td>
                    <td>
                      <span className={statusBadgeClass(order.order_status)}>
                        {order.order_status}
                      </span>
                    </td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>{order.orderItems?.length || 0}</td>
                    <td>${order.seller_total?.toFixed(2)}</td>
                    <td>
                      <button className={styles.actionBtn}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SellerOrdersPage;
