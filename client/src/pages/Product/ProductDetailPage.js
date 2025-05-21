// File: client/src/pages/Product/ProductDetailPage.js (Final Example)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
    const [selectedSize, setSelectedSize] = useState(''); // Example state for variants
    const [selectedColor, setSelectedColor] = useState(''); // Example state for variants
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
                api.getProductById(productId),
                api.getReviewsForProduct(productId) // Assuming reviews are fetched separately
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
            const errorMsg = err.response?.status === 404
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
            setError("Invalid Product ID.");
            setLoading(false);
        }
        // Reset quantity/selections when product ID changes
        setQuantity(1);
        setSelectedColor('');
        setSelectedSize('');
        setAddCartError('');
        setAddCartSuccess('');
        setSubmitReviewError('');

    }, [productId, fetchProductAndReviews]); // Re-fetch if productId changes

    const handleQuantityChange = (change) => {
        setQuantity(prev => Math.max(1, prev + change)); // Ensure quantity is at least 1
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
             const response = await api.addReview(productId, reviewData);
             // Optimistically add review or refetch reviews
             setReviews(prevReviews => [response.data.data.review, ...prevReviews]); // Add new review to top
             logger.info(`Review submitted successfully for Product ${productId}`);
             return true; // Indicate success to ReviewForm
         } catch (err) {
             const message = err.response?.data?.message || 'Failed to submit review.';
             logger.error("Review submission failed:", message);
             setSubmitReviewError(message);
             return false; // Indicate failure
         }
     };


    if (loading) return <div className={styles.centered}><LoadingSpinner /></div>;
    if (error) return <p className={styles.error}>{error}</p>;
    if (!product) return <p>Product details are currently unavailable.</p>; // Should be caught by error state generally

    // Determine if user can review (is logged in, hasn't reviewed yet, maybe purchased?)
    const canReview = isAuthenticated && !reviews.some(r => r.User?.id === user?.id);

    return (
        <div className={styles.productDetailPage}>
            <div className={styles.productDetailLayout}>
                {/* Product Images Section */}
                 <div className={styles.imageSection}>
                     <ProductImages images={product.Images || [{ url: product.preview_image_url, image_type: 'preview' }]} productName={product.name} />
                 </div>


                {/* Product Info Section */}
                <div className={styles.infoSection}>
                    <h1 className={styles.productName}>{product.name}</h1>
                     <div className={styles.ratingPrice}>
                         <Rating value={product.averageRating || 0} text={`${product.reviewCount || 0} reviews`} />
                         <span className={styles.price}>${product.price?.toFixed(2)}</span>
                     </div>
                    <p className={styles.description}>{product.description}</p>

                     {/* TODO: Add Size/Color Selection components based on product variants */}
                     {/* <div className={styles.variantSelector}> Size Selector... </div> */}
                     {/* <div className={styles.variantSelector}> Color Selector... </div> */}


                    <div className={styles.actions}>
                        <div className={styles.quantitySelector}>
                            <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)}>+</button>
                             {/* TODO: Add stock check against quantity */}
                        </div>
                        <Button onClick={handleAddToCart} disabled={cartLoading || product.stock_quantity < quantity} className={styles.addToCartBtn}>
                            {cartLoading ? 'Adding...' : (product.stock_quantity < quantity ? 'Out of Stock' : 'Add to Cart')}
                        </Button>
                    </div>
                     {product.stock_quantity > 0 && product.stock_quantity < 5 && <p className={styles.lowStock}>Only {product.stock_quantity} left in stock!</p>}
                     {addCartError && <p className={`${styles.message} ${styles.errorMessage}`}>{addCartError}</p>}
                     {addCartSuccess && <p className={`${styles.message} ${styles.successMessage}`}>{addCartSuccess}</p>}


                     {/* Optional: Product details tabs (Description, Specs, Reviews) */}
                     {/* ... */}
                </div>
            </div>


            {/* Reviews Section */}
            <div className={styles.reviewsSection}>
                <h2>Ratings & Reviews</h2>
                 {isAuthenticated && canReview && (
                    <>
                        <h3>Write a Customer Review</h3>
                        <ReviewForm onSubmit={handleReviewSubmit} />
                         {submitReviewError && <p className={`${styles.message} ${styles.errorMessage}`}>{submitReviewError}</p>}

                    </>
                 )}
                 {!isAuthenticated && <p>Please <a href="/login">log in</a> to write a review.</p>}
                 {isAuthenticated && !canReview && reviews.some(r => r.User?.id === user?.id) && <p>You have already reviewed this product.</p>}


                <ReviewList reviews={reviews} />
            </div>


             {/* TODO: Add "You Might Also Like" / Related Products Section */}
             {/* ... */}


        </div>
    );
};

export default ProductDetailPage;