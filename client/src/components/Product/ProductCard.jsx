// filepath: d:\ShopFusion\client\src\components\Product\ProductCard.jsx
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Rating from '../Common/Rating';
import Button from '../Common/Button';
import styles from './ProductCard.module.css';
import placeholderImage from '../../assets/placeholder.png';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const ProductCard = ({ product, user: propUser }) => {
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated, user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false); // Local loading state for this specific card
  const [addError, setAddError] = useState('');

  if (!product) {
    logger.warn('ProductCard: Received null or undefined product prop.');
    return (
      <article className={styles.productCard} aria-labelledby="product-name-unavailable">
        <h3 id="product-name-unavailable" className={styles.productName}>
          Product Data Unavailable
        </h3>
        <p>Details for this product could not be loaded.</p>
      </article>
    );
  }

  const {
    id,
    name,
    price,
    preview_image_url,
    Category,
    averageRating = 0, // Default to 0 if not provided
    reviewCount = 0, // Default to 0 if not provided
    stock_quantity = 0, // Default to 0
    Seller, // Add this
  } = product;

  const handleAddToCart = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setAddError('');

      if (!isAuthenticated) {
        logger.info(
          `ProductCard: User not authenticated. Redirecting to login to add product ${id}.`,
        );
        navigate('/login', {
          state: {
            from: `/products/${id}`,
            message: 'Please log in to add items to your cart.',
          },
        });
        return;
      }

      if (stock_quantity === 0) {
        setAddError('This item is out of stock.');
        return;
      }

      setIsAdding(true);
      logger.debug(`ProductCard: Adding product ${id} ('${name}') to cart.`);

      try {
        const result = await addToCart(id, 1);
        if (result.success) {
          logger.info(`ProductCard: Product ${id} added to cart successfully.`);
          // Success is implied by cart icon update
        } else {
          logger.error(`ProductCard: Failed to add product ${id} to cart: ${result.message}`);
          setAddError(result.message || 'Could not add to cart.');
        }
      } catch (error) {
        logger.error(`ProductCard: Exception while adding product ${id} to cart:`, error);
        setAddError('An unexpected error occurred.');
      } finally {
        setIsAdding(false);
      }
    },
    [isAuthenticated, navigate, id, name, stock_quantity, addToCart, setIsAdding, setAddError],
  );

  const displayPrice = typeof price === 'number' ? `$${price.toFixed(2)}` : 'Price unavailable';
  const imageUrl = preview_image_url || product.Images?.[0]?.url || placeholderImage;
  const productNameId = `product-name-${id}`;  // Determine stock label
  const stockLabel =
    stock_quantity === 0
      ? 'Out of Stock'
      : stock_quantity <= 5
      ? `Only ${stock_quantity} left!`
      : `${stock_quantity} in stock`;

  // Determine moderation status badge for admin/seller
  const getModerationBadge = () => {
    if (!user || (user.role !== 'admin' && user.role !== 'seller')) {
      return null;
    }

    // For sellers, only show status of their own products
    if (user.role === 'seller' && user.id !== product.seller_id) {
      return null;
    }    const status = product.moderationStatus?.status || 'pending';
    return (
      <span 
        className={`${styles.badge} ${styles.statusBadge} ${styles[status]}`}
        title={`Moderation Status: ${status.charAt(0).toUpperCase() + status.slice(1)}${
          product.moderationStatus?.feedback ? '\n\nFeedback: ' + product.moderationStatus.feedback : ''
        }`}
      >
        {status}
        {product.moderationStatus?.feedback && (
          <span className={styles.feedbackIcon}>ℹ</span>
        )}
      </span>
    );
  };

  const moderationBadge = getModerationBadge();

  return (
    <article className={styles.productCard} aria-labelledby={productNameId}>
      <Link
        to={`/products/${id}`}
        className={styles.cardLink}
        aria-label={`View details for ${name}`}
      >
        <div className={styles.imageContainer}>
          <img
            src={imageUrl}
            alt={name}
            className={styles.productImage}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage;
            }}          />
          <div className={styles.badgeContainer}>
            {/* Show moderation status badge for admin/seller */}
            {moderationBadge}
            {/* Stock badge */}
            <span
              className={`${styles.badge} ${
                stock_quantity === 0 
                  ? styles.outOfStock 
                  : stock_quantity <= 5 
                  ? styles.lowStock 
                  : styles.inStock
              }`}
              title={stockLabel}
            >
              {stockLabel}
            </span>
          </div>
        </div>
        <div className={styles.cardContent}>
          {Category && (
            <span className={styles.categoryName} aria-label="Product category">
              {Category.name}
            </span>
          )}
          <h3 id={productNameId} className={styles.productName}>
            {name}
          </h3>
          {Seller && (
            <span className={styles.sellerInfo} aria-label="Seller name">
              by {Seller.full_name}
            </span>
          )}
          <div className={styles.ratingContainer}>
            <Rating value={averageRating || 0} size="sm" />
            <span className={styles.reviewCount}>
              {reviewCount || 0} {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          <div className={styles.productInfo}>
            <div className={styles.priceContainer}>
              <span className={styles.currentPrice} aria-label="Product price">
                {displayPrice}
              </span>
            </div>
          </div>
          {addError && (
            <div className={styles.addCartError} role="alert">
              {addError}
            </div>
          )}
        </div>
      </Link>
      <div className={styles.cardActions}>
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || cartLoading || stock_quantity === 0}
          className={styles.addToCartButton}
          aria-label={`Add ${name} to cart`}
        >
          {isAdding ? 'Adding...' : stock_quantity === 0 ? 'Out of Stock' : stock_quantity <= 5 ? 'Add to Cart - Low Stock' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;

