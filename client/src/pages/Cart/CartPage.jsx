import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCart, removeCartItem, updateCartItemQuantity } from '../../services/api';
import styles from './CartPage.module.css';
import placeholder from '../../assets/placeholder.png';

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCart();
        setCart(response.data.data.cart);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load cart.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleRemove = async (itemId) => {
    setUpdating(true);
    try {
      await removeCartItem(itemId);
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
    } catch (err) {
      setError('Failed to remove item.');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuantityChange = async (itemId, quantity) => {
    setUpdating(true);
    try {
      await updateCartItemQuantity(itemId, quantity);
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      }));
    } catch (err) {
      setError('Failed to update quantity.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading cart...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h1>Your Cart is Empty</h1>
        <Link className={styles.shopLink} to="/products">
          Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <h1 className={styles.title}>Your Shopping Cart</h1>
      <ul className={styles.cartList}>
        {cart.items.map((item) => (
          <li key={item.id} className={styles.cartItem}>
            <div className={styles.itemInfo}>
              <img
                src={item.product.preview_image_url || placeholder}
                alt={item.product.name}
                className={styles.itemImage}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholder;
                }}
              />
              <div>
                <div className={styles.itemName}>{item.product.name}</div>
                <div className={styles.itemPrice}>${item.product.price.toFixed(2)}</div>
              </div>
            </div>
            <div className={styles.itemActions}>
              <input
                type="number"
                min="1"
                value={item.quantity}
                className={styles.quantityInput}
                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                disabled={updating}
              />
              <button
                className={styles.removeButton}
                onClick={() => handleRemove(item.id)}
                disabled={updating}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.cartSummary}>
        <div>
          Total: ${cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0).toFixed(2)}
        </div>
        <Link className={styles.checkoutButton} to="/checkout">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
