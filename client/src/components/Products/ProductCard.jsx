import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, showStatus }) => {
  const statusColors = {
    approved: '#4caf50',
    pending: '#ff9800',
    rejected: '#f44336'
  };

  return (
    <div className={styles.card}>
      {showStatus && (
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: statusColors[product.status] }}
        >
          {product.status}
        </div>
      )}
      
      <div className={styles.imageContainer}>
        <img 
          src={product.image_url || '/placeholder.png'} 
          alt={product.name}
          className={styles.image}
        />
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.price}>${product.price.toFixed(2)}</p>
        
        {product.seller && (
          <p className={styles.seller}>by {product.seller.full_name}</p>
        )}
        
        {product.averageRating && (
          <div className={styles.rating}>
            ★ {product.averageRating.toFixed(1)} ({product.reviewCount})
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <Link 
          to={`/products/${product.id}`}
          className={styles.viewButton}
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['approved', 'pending', 'rejected']),
    image_url: PropTypes.string,
    seller: PropTypes.shape({
      id: PropTypes.number,
      full_name: PropTypes.string
    }),
    averageRating: PropTypes.number,
    reviewCount: PropTypes.number
  }).isRequired,
  showStatus: PropTypes.bool
};

ProductCard.defaultProps = {
  showStatus: false
};

export default ProductCard;
