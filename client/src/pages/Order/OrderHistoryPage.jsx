import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/api';
import classNames from 'classnames';
import styles from './OrderHistoryPage.module.css';

const statusColors = {
  pending: styles.statusPending,
  paid: styles.statusPaid,
  shipped: styles.statusShipped,
  delivered: styles.statusDelivered,
  cancelled: styles.statusCancelled,
  refunded: styles.statusRefunded,
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyOrders();
        setOrders(response.data.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order history.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Normalize order fields for frontend compatibility
  const normalizedOrders = orders.map((order) => ({
    ...order,
    status: order.status || order.order_status || 'processing',
    total:
      order.total !== undefined
        ? order.total
        : order.total_amount !== undefined
        ? order.total_amount
        : 0,
  }));

  if (loading) return <div className={styles.orderHistoryContainer}>Loading orders...</div>;
  if (error) return <div className={styles.orderHistoryContainer}>{error}</div>;

  return (
    <div className={styles.orderHistoryContainer}>
      <h1 className={styles.orderHistoryTitle}>Order History</h1>
      {normalizedOrders.length === 0 ? (
        <div className={styles.emptyState}>You have no orders yet.</div>
      ) : (
        <table className={styles.orderTable}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {normalizedOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <span
                    className={classNames(
                      styles.statusBadge,
                      statusColors[order.status] || styles.statusDefault,
                    )}
                  >
                    {order.status
                      ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                      : 'Unknown'}
                  </span>
                </td>
                <td>
                  <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                </td>
                <td>
                  <Link className={styles.orderLink} to={`/orders/${order.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderHistoryPage;
