// File: client/src/components/Product/ProductCard.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Rating from '../Common/Rating';
import Button from '../Common/Button';
import styles from './ProductCard.module.css';
import placeholderImage from '../../assets/placeholder.png';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const ProductCard = ({ product }) => {
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false); // Local loading state for this specific card
  const [addError, setAddError] = useState('');

  if (!product) {
    logger.warn('ProductCard: Received null or undefined product prop.');
    return (
      <article className={styles.productCard} aria-labelledby="product-name-unavailable">
        <h3 id="product-name-unavailable" className={styles.productName}>Product Data Unavailable</h3>
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
    reviewCount = 0,   // Default to 0 if not provided
    stock_quantity = 0, // Default to 0
  } = product;

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent link navigation if button is part of the link area
    e.stopPropagation(); // Prevent event bubbling
    setAddError('');

    if (!isAuthenticated) {
        logger.info(`ProductCard: User not authenticated. Redirecting to login to add product ${id}.`);
        navigate('/login', { state: { from: `/products/${id}`, message: 'Please log in to add items to your cart.' } });
        return;
    }

    setIsAdding(true);
    logger.debug(`ProductCard: Adding product ${id} ('${name}') to cart.`);
    try {
        const result = await addToCart(id, 1); // Add one item
        if (result.success) {
            logger.info(`ProductCard: Product ${id} added to cart successfully. Message: ${result.message}`);
            // Optionally show a success toast/notification here
            // For now, success is implied by cart icon update
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
  };

  const displayPrice = typeof price === 'number' ? `$${price.toFixed(2)}` : 'Price unavailable';
  const imageUrl = preview_image_url || placeholderImage;
  const productNameId = `product-name-${id}`;

  return (
    <article className={styles.productCard} aria-labelledby={productNameId}>
      <Link to={`/products/${id}`} className={styles.cardLink} aria-label={`View details for ${name}`}>
        <div className={styles.imageContainer}>
          <img src={imageUrl} alt={name || 'Product image'} className={styles.productImage} loading="lazy" />
          {stock_quantity === 0 && (
            <span className={styles.outOfStockBadge}>Out of Stock</span>
          )}
        </div>
        <div className={styles.cardContent}>
          {Category && <p className={styles.categoryName}>{Category.name}</p>}
          <h3 id={productNameId} className={styles.productName}>{name || 'Unnamed Product'}</h3>
          <div className={styles.ratingContainer}>
            <Rating value={averageRating} text={`${reviewCount} reviews`} starSize="small" />
          </div>
          <div className={styles.priceContainer}>
            <span className={styles.currentPrice}>{displayPrice}</span>
          </div>
        </div>
      </Link>
      <div className={styles.cardActions}>
        {stock_quantity > 0 ? (
          <Button
            onClick={handleAddToCart}
            variant="primary"
            className={styles.addToCartButton}
            disabled={isAdding || cartLoading} // Disable if this card is adding OR global cart is loading
            aria-label={`Add ${name} to cart`}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </Button>
        ) : (
          <Button variant="secondary" className={styles.addToCartButton} disabled>
            Out of Stock
          </Button>
        )}
         {addError && <p className={styles.addCartError}>{addError}</p>}
      </div>
    </article>
  );
};

export default ProductCard;