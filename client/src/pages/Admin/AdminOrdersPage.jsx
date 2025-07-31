import React, { useEffect, useState, useCallback } from 'react';
import { adminGetAllOrders, adminUpdateOrderStatus } from '../../services/api';
import Pagination from '../../components/Common/Pagination';
import styles from './AdminOrdersPage.module.css';

const statusBadgeClass = (status) => `${styles.statusBadge} ${styles[status] || ''}`;

const ORDER_STATUSES = ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });
  const [actionLoading, setActionLoading] = useState({});

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: pagination.limit };
        const res = await adminGetAllOrders(params);
        setOrders(res.data.data.orders);
        setPagination({
          currentPage: res.data.currentPage,
          totalPages: res.data.totalPages,
          totalOrders: res.data.totalOrders,
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

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await adminUpdateOrderStatus(orderId, { status: newStatus });
      await fetchOrders(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelOrder = async (orderId) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await adminUpdateOrderStatus(orderId, { status: 'cancelled' });
      await fetchOrders(pagination.currentPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Manage Orders</h1>
        <p>
          View and update all orders placed on the platform. Change status and review order details.
        </p>
      </header>
      <div className={styles.tableWrapper}>
        {loading ? (
          <div>Loading orders...</div>
        ) : error ? (
          <div className={styles.statusMsg}>{error}</div>
        ) : (
          <>
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Total</th>
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
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={actionLoading[order.id]}
                        style={{ marginLeft: 8 }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>${order.total_amount?.toFixed(2)}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={order.order_status === 'cancelled' || actionLoading[order.id]}
                      >
                        Cancel
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

export default AdminOrdersPage;
