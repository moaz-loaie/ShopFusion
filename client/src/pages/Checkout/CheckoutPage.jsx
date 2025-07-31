import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../services/api';
import styles from './CheckoutPage.module.css';

const CheckoutPage = () => {
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    postal: '',
    country: '',
    payment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { cartItems, subtotal, clearCart } = useCart();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.postal.trim() ||
      !form.country.trim()
    ) {
      return 'All shipping fields are required.';
    }
    if (form.address.length + form.city.length + form.postal.length + form.country.length < 10) {
      return 'Shipping address must be at least 10 characters.';
    }
    if (!form.payment) {
      return 'Please select a payment method.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    // Validate client-side
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }
    try {
      // Concatenate shipping fields into a single string
      const shipping_address = `${form.name}, ${form.address}, ${form.city}, ${form.postal}, ${form.country}`;
      const orderDetails = {
        shipping_address,
        payment_method: form.payment,
        // Optionally send total if backend uses it
        total: subtotal,
      };
      await createOrder(orderDetails);
      await clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.checkoutTitle}>Checkout</h1>
      {success ? (
        <div>Thank you for your order! You will receive a confirmation email soon.</div>
      ) : (
        <form className={styles.checkoutForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <input
              className={styles.formInput}
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Address</label>
            <input
              className={styles.formInput}
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>City</label>
            <input
              className={styles.formInput}
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Postal Code</label>
            <input
              className={styles.formInput}
              name="postal"
              value={form.postal}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Country</label>
            <input
              className={styles.formInput}
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              className={styles.formInput}
              name="payment"
              value={form.payment}
              onChange={handleChange}
              required
              disabled={submitting}
            >
              <option value="">Select...</option>
              <option value="card">Credit/Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.checkoutButton} type="submit" disabled={submitting}>
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
