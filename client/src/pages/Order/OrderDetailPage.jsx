import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderById } from '../../services/api';
import styles from './OrderDetailPage.module.css';
import placeholder from '../../assets/placeholder.png';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getOrderById(orderId);
        setOrder(response.data.data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className={styles.orderDetailContainer}>Loading order...</div>;
  if (error) return <div className={styles.orderDetailContainer}>{error}</div>;
  if (!order) return null;

  // Normalize order fields for frontend compatibility
  const normalizedOrder = {
    ...order,
    status: order.status || order.order_status || 'processing',
    total:
      order.total !== undefined
        ? order.total
        : order.total_amount !== undefined
        ? order.total_amount
        : 0,
    items: order.items || order.orderItems || [],
  };

  return (
    <div className={styles.orderDetailContainer}>
      <h1 className={styles.orderTitle}>Order #{normalizedOrder.id}</h1>
      <div className={styles.orderInfo}>
        <div>
          Status: <b>{normalizedOrder.status}</b>
        </div>
        <div>Placed: {new Date(normalizedOrder.createdAt).toLocaleString()}</div>
        <div>
          Total: <b>${normalizedOrder.total.toFixed(2)}</b>
        </div>
        <div>Shipping: {normalizedOrder.shippingAddress}</div>
      </div>
      <div className={styles.orderItems}>
        {normalizedOrder.items.map((item) => (
          <div key={item.id} className={styles.orderItem}>
            <img
              src={item.product.preview_image_url || placeholder}
              alt={item.product.name}
              className={styles.itemImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholder;
              }}
            />
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{item.product.name}</div>
              <div className={styles.itemPrice}>${item.product.price.toFixed(2)}</div>
              <div className={styles.itemQty}>Qty: {item.quantity}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.orderSummary}>Total Paid: ${normalizedOrder.total.toFixed(2)}</div>
    </div>
  );
};

export default OrderDetailPage;
