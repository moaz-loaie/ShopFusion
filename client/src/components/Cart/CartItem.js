// File: client/src/components/Cart/CartItem.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CartItem.module.css';
import placeholderImage from '../../assets/placeholder.png';
import { useCart } from '../../contexts/CartContext';
import logger from '../../utils/logger';

const CartItem = ({ item }) => {
  const { updateCartItemQuantity, removeCartItem, loading: cartLoading } = useCart();

  if (!item || !item.product) {
    logger.warn('CartItem: Rendered with missing item or item.product data.', { itemData: item });
    return (
      <div className={`${styles.cartItem} ${styles.cartItemErrorState}`}>
        <p>Information for this cart item is currently unavailable.</p>
      </div>
    );
  }

  const { product, quantity, id: cartItemId, unit_price } = item; // unit_price is price at time of adding

  const handleQuantityChange = async (newQuantity) => {
    if (cartLoading) return; // Prevent multiple updates if already loading

    if (newQuantity < 1) {
      logger.debug(`CartItem: Quantity for item ${cartItemId} would be < 1. Triggering removal.`);
      await removeCartItem(cartItemId); // Remove item if quantity is less than 1
      return;
    }
    // Defensive check against stock if available, though primary check is on backend
    if (product.stock_quantity !== undefined && newQuantity > product.stock_quantity) {
        logger.warn(`CartItem: Attempted to set quantity (${newQuantity}) for item ${cartItemId} above stock (${product.stock_quantity}). Clamping to max stock.`);
        await updateCartItemQuantity(cartItemId, product.stock_quantity);
        // Optionally, provide user feedback about clamping
        alert(`Quantity adjusted to available stock: ${product.stock_quantity}`);
        return;
    }

    logger.debug(`CartItem: Updating quantity for item ${cartItemId} from ${quantity} to ${newQuantity}.`);
    await updateCartItemQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async () => {
    if (cartLoading) return;
    logger.debug(`CartItem: Removing item ${cartItemId} ('${product.name}').`);
    await removeCartItem(cartItemId);
  };

  const imageUrl = product.preview_image_url || placeholderImage;
  const currentItemPrice = unit_price || product.price; // Use stored unit_price, fallback to current product price
  const itemSubtotal = (currentItemPrice * quantity).toFixed(2);

  return (
    <div className={styles.cartItem} data-testid={`cart-item-${product.id}`}>
      <div className={styles.productInfo}>
        <Link to={`/products/${product.id}`} className={styles.productImageLink}>
          <img src={imageUrl} alt={product.name} className={styles.productImage} loading="lazy"/>
        </Link>
        <div className={styles.productDetails}>
          <Link to={`/products/${product.id}`} className={styles.productNameLink}>
            <h3 className={styles.productName}>{product.name}</h3>
          </Link>
          <p className={styles.productPrice}>Unit Price: ${parseFloat(currentItemPrice).toFixed(2)}</p>
          {/* Optional: Display product SKU or other short identifiers */}
          {/* <p className={styles.productSku}>SKU: {product.sku || 'N/A'}</p> */}
          {product.stock_quantity !== undefined && product.stock_quantity < quantity && product.stock_quantity > 0 && (
            <p className={styles.stockWarning}>Low stock! Only {product.stock_quantity} available. Quantity adjusted.</p>
          )}
           {product.stock_quantity === 0 && ( // Assuming stock_quantity is always present for products in cart
            <p className={styles.stockError}>Currently out of stock. Please remove or your order may be adjusted.</p>
          )}
        </div>
      </div>

      <div className={styles.quantityControl}>
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={cartLoading} // Disable while any cart operation is loading
          className={styles.quantityButton}
          aria-label={`Decrease quantity of ${product.name}`}
        >
          &ndash;
        </button>
        <input
            type="number"
            className={styles.quantityInput}
            value={quantity}
            onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) handleQuantityChange(val);
                else if (e.target.value === '') { /* allow clearing for typing */ }
            }}
            onBlur={(e) => { // Handle case where input is left empty or invalid
                if (isNaN(parseInt(e.target.value,10)) || parseInt(e.target.value,10) < 1) {
                    handleQuantityChange(1); // Reset to 1 if invalid on blur
                }
            }}
            min="1"
            max={product.stock_quantity !== undefined ? product.stock_quantity : 99} // Max based on stock
            aria-label={`Quantity for ${product.name}`}
            disabled={cartLoading}
        />
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={cartLoading || (product.stock_quantity !== undefined && quantity >= product.stock_quantity)}
          className={styles.quantityButton}
          aria-label={`Increase quantity of ${product.name}`}
        >
          +
        </button>
      </div>

      <div className={styles.itemSubtotal} aria-label={`Subtotal for ${product.name}`}>
        <p>${itemSubtotal}</p>
      </div>

      <div className={styles.removeItemCell}>
        <button onClick={handleRemoveItem} disabled={cartLoading} className={styles.removeButton} aria-label={`Remove ${product.name} from cart`}>
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;