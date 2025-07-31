// File: client/src/pages/Product/ProductDetailPage.js (Refactored Example)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {  getProductById,
  getReviewsForProduct,
  addReviewForProduct,
  voteOnReview,
} from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Rating from '../../components/Common/Rating';
import ReviewList from '../../components/Product/ReviewList';
import ReviewForm from '../../components/Product/ReviewForm';
import Button from '../../components/Common/Button';
import ProductImages from '../../components/Product/ProductImages'; // Assuming component exists
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProductDetailPage.module.css';
import logger from '../../utils/logger';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [submitReviewError, setSubmitReviewError] = useState('');
  const [addCartError, setAddCartError] = useState('');
  const [addCartSuccess, setAddCartSuccess] = useState('');

  const fetchProductAndReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      logger.debug(`Workspaceing product details for ID: ${productId}`);
      // Fetch product and reviews concurrently
      const [productResponse, reviewsResponse] = await Promise.all([
        getProductById(productId),
        getReviewsForProduct(productId), // Assuming reviews are fetched separately
      ]);

      if (!productResponse.data?.data?.product) {
        throw new Error('Product data not found in response.');
      }

      setProduct(productResponse.data.data.product);
      // Assuming product response includes images, otherwise fetch separately
      // setImages(productResponse.data.data.product.Images || []);
      setReviews(reviewsResponse.data.data.reviews || []);
      logger.info(`Product ${productId} details and reviews fetched.`);
    } catch (err) {
      logger.error(`Failed to fetch product ${productId}:`, err.message);
      const errorMsg =
        err.response?.status === 404
          ? 'Product not found.'
          : err.response?.data?.message || 'Could not load product details. Please try again.';
      setError(errorMsg);
      if (err.response?.status === 404) {
        // Optionally redirect after a delay if product not found
        // setTimeout(() => navigate('/products'), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]); // Dependency: productId

  useEffect(() => {
    if (productId) {
      fetchProductAndReviews();
    } else {
      setError('Invalid Product ID.');
      setLoading(false);
    }
    // Reset quantity/selections when product ID changes
    setQuantity(1);
    setAddCartError('');
    setAddCartSuccess('');
    setSubmitReviewError('');
  }, [productId, fetchProductAndReviews]); // Re-fetch if productId changes

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change)); // Ensure quantity is at least 1
  };

  const handleAddToCart = async () => {
    setAddCartError('');
    setAddCartSuccess('');
    // Basic validation examples (add more as needed)
    // if (!selectedSize) return setAddCartError("Please select a size.");
    // if (!selectedColor) return setAddCartError("Please select a color.");

    const result = await addToCart(productId, quantity);
    if (result.success) {
      setAddCartSuccess(`${quantity} x ${product.name} added to cart!`);
      // Optionally navigate to cart or show modal
    } else {
      setAddCartError(result.message || 'Failed to add item to cart.');
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setSubmitReviewError('');
    try {
      logger.debug(`Submitting review for Product ${productId}`);
      const response = await addReviewForProduct(productId, reviewData);
      // Optimistically add review or refetch reviews
      setReviews((prevReviews) => [response.data.data.review, ...prevReviews]); // Add new review to top
      logger.info(`Review submitted successfully for Product ${productId}`);
      return true; // Indicate success to ReviewForm
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit review.';
      logger.error('Review submission failed:', message);
      setSubmitReviewError(message);
      return false; // Indicate failure
    }
  };

  // Voting handler 
  const handleVote = async (reviewId, voteType) => {
    if (!isAuthenticated) return;
    try {
      await voteOnReview(reviewId, voteType);
      // Refetch reviews to update vote counts and user vote
      const reviewsResponse = await getReviewsForProduct(productId);
      setReviews(reviewsResponse.data.data.reviews || []);
    } catch (err) {
      logger.error('Failed to vote on review:', err);
      // Optionally show an error message to the user
      setError(err.response?.data?.message || 'Failed to vote on review.');
    }
  };

  return (
    <main className={styles.container}>
      <nav className={styles.breadcrumbs} aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <span className={styles.separator}>/</span>
        <Link to="/products">Products</Link>
        <span className={styles.separator}>/</span>
        <span aria-current="page">{product?.name || 'Loading...'}</span>
      </nav>

      {/* Add structured data for SEO */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.Images?.[0]?.url,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'USD',
              availability: product.stock_quantity > 0 ? 'InStock' : 'OutOfStock',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.averageRating || 0,
              reviewCount: product.reviewCount || 0,
            },
          })}
        </script>
      )}

      <section className={styles.productDetailPage} aria-label="Product details">
        {loading ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading product details...
          </div>
        ) : error ? (
          <div className={styles.statusMsg} role="alert">
            {error}
          </div>
        ) : product ? (
          <div className={styles.productDetailLayout}>
            <div className={styles.imageSection}>
              <ProductImages images={product.Images || []} productName={product.name} />
              {/* Show moderation status for admin/seller */}
              {user &&
                (user.role === 'admin' ||
                  (user.role === 'seller' && product.seller_id === user.id)) && (
                  <div className={styles.moderationStatus}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[product.moderationStatus?.status]
                      }`}
                    >
                      {product.moderationStatus?.status || 'pending'}
                    </span>
                    {product.moderationStatus?.feedback && (
                      <div className={styles.moderationFeedback}>
                        <strong>Admin Feedback:</strong>
                        <p>{product.moderationStatus.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
            </div>
            <div className={styles.infoSection}>
              <h1 className={styles.productName}>{product.name}</h1>
              <div className={styles.productMeta}>
                <span className={styles.productPrice}>${product.price?.toFixed(2)}</span>
                <span className={styles.productCategory}>{product.Category?.name}</span>
                <Rating value={product.averageRating || 0} size="md" />
                <span className={styles.reviewCount}>({product.reviewCount || 0} reviews)</span>
              </div>
              {product.Seller && (
                <div className={styles.sellerSection}>
                  <h2 className={styles.sectionLabel}>Seller</h2>
                  <div className={styles.sellerInfo}>
                    <span className={styles.sellerName}>{product.Seller.full_name}</span>
                    {/* Add more seller info if available */}
                  </div>
                </div>
              )}
              <div className={styles.stockSection}>
                <h2 className={styles.sectionLabel}>Availability</h2>
                <div className={styles.stockInfo}>
                  <span
                    className={`${styles.stockStatus} ${
                      product.stock_quantity <= 5 ? styles.lowStock : styles.inStock
                    }`}
                  >
                    {product.stock_quantity === 0
                      ? 'Out of Stock'
                      : product.stock_quantity <= 5
                      ? `Only ${product.stock_quantity} left in stock!`
                      : `${product.stock_quantity} in stock`}
                  </span>
                </div>
              </div>
              <div className={styles.productDesc}>{product.description}</div>
              <div className={styles.cartActions}>
                <label htmlFor="quantity" className={styles.quantityLabel}>
                  Quantity:
                </label>
                <div className={styles.quantityControls}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(-1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    id="quantity"
                    className={styles.qtyInput}
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  />
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                  disabled={cartLoading || product.stock_quantity === 0}
                  aria-label="Add to cart"
                >
                  {cartLoading
                    ? 'Adding...'
                    : product.stock_quantity === 0
                    ? 'Out of Stock'
                    : 'Add to Cart'}
                </button>
              </div>
              {addCartError && (
                <div className={styles.statusMsg} role="alert">
                  {addCartError}
                </div>
              )}
              {addCartSuccess && <div className={styles.successMsg}>{addCartSuccess}</div>}
            </div>
          </div>
        ) : null}
      </section>
      <section className={styles.reviewsSection} aria-labelledby="reviews-title">
        <h2 id="reviews-title" className={styles.sectionTitle}>
          Reviews
        </h2>
        <ReviewList reviews={reviews} userId={user?.id} onVote={handleVote} />
        <ReviewForm onSubmit={handleReviewSubmit} />
        {submitReviewError && (
          <div className={styles.statusMsg} role="alert">
            {submitReviewError}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProductDetailPage;
