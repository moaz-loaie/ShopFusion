// File: client/src/components/Cart/CartSummary.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../Common/Button';
import styles from './CartSummary.module.css';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const CartSummary = () => {
  const { subtotal, itemCount, loading: cartLoading, error: cartError } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Example: Basic shipping cost and discount calculation (can be more complex)
  const shippingCost = subtotal > 50 || subtotal === 0 ? 0 : 7.99; // Free shipping over $50
  const discountAmount = 0; // Placeholder for future discount logic (e.g., promo codes)
  const total = subtotal + shippingCost - discountAmount;

  const handleCheckout = () => {
    logger.info("CartSummary: Proceeding to checkout.");
    if (!isAuthenticated) {
        logger.warn("CartSummary: User not authenticated, redirecting to login for checkout.");
        // Redirect to login, passing intended destination
        navigate('/login', { state: { from: '/checkout', message: "Please log in to proceed to checkout." } });
    } else if (itemCount === 0) {
        logger.warn("CartSummary: Checkout attempt with an empty cart.");
        // This should ideally be prevented by disabling the button, but double-check
        alert("Your cart is empty. Please add some products before checking out.");
    }
    else {
        navigate('/checkout');
    }
  };

  if (cartError) {
      return (
          <div className={`${styles.cartSummary} ${styles.summaryError}`}>
              <p>Error calculating cart summary: {cartError}</p>
          </div>
      );
  }

  return (
    <div className={styles.cartSummary}>
      <h2 className={styles.summaryTitle}>Order Summary</h2>
      <div className={styles.summaryRow}>
        <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''}):</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span>Estimated Shipping:</span>
        <span>{shippingCost === 0 && subtotal > 0 ? 'FREE' : (subtotal === 0 ? '$0.00' : `$${shippingCost.toFixed(2)}`)}</span>
      </div>
      {discountAmount > 0 && (
        <div className={`${styles.summaryRow} ${styles.discountRow}`}>
          <span>Discount:</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      {/* TODO: Add Promo Code Input Field */}
      {/* <div className={styles.promoCodeSection}>
        <input type="text" placeholder="Enter promo code" className={styles.promoInput} />
        <Button variant="secondary" size="small">Apply</Button>
      </div> */}
      <hr className={styles.summaryDivider} />
      <div className={`${styles.summaryRow} ${styles.totalRow}`}>
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <Button
        onClick={handleCheckout}
        variant="primary"
        size="large"
        className={styles.checkoutButton}
        disabled={cartLoading || itemCount === 0} // Disable if cart is loading or empty
      >
        {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
      </Button>
      {!isAuthenticated && itemCount > 0 && (
          <p className={styles.loginPrompt}>
              <Link to="/login" state={{ from: '/checkout' }}>Log In</Link> or <Link to="/register" state={{ from: '/checkout' }}>Register</Link> to complete your purchase.
          </p>
      )}
      <Link to="/products" className={styles.continueShopping}>
        &larr; Continue Shopping
      </Link>
    </div>
  );
};

export default CartSummary;