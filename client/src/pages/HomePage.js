// File: client/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api'; // Import all functions from api service
import ProductList from '../components/Product/ProductList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Button from '../components/Common/Button';
import styles from './HomePage.module.css';
import logger from '../utils/logger';

// Helper to fetch products with specific parameters
const fetchProductSet = async (params, setter, errorSetter, loadingSetter) => {
  loadingSetter(true);
  try {
    const response = await api.getProducts(params);
    setter(response.data.data.products || []);
    logger.debug(`HomePage: Fetched products for params: ${JSON.stringify(params)}`);
  } catch (err) {
    logger.error(`HomePage: Failed to fetch products for params ${JSON.stringify(params)}:`, err.message);
    errorSetter(err.response?.data?.message || `Could not load products. Please try again.`);
    setter([]); // Clear products on error
  } finally {
    loadingSetter(false);
  }
};

const HomePage = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const [loadingTopSelling, setLoadingTopSelling] = useState(true);
  const [error, setError] = useState(null); // Shared error state for simplicity

  useEffect(() => {
    logger.info('HomePage mounted. Fetching initial data.');
    // Fetch new arrivals (e.g., sorted by creation date, limit 8)
    fetchProductSet(
      { limit: 8, sort: 'createdAt:desc' },
      setNewArrivals,
      setError,
      setLoadingNewArrivals
    );

    // Fetch top selling (e.g., based on popularity or sales metric, limit 4)
    // Assuming backend supports a 'popularity' sort or a specific flag/filter
    fetchProductSet(
      { limit: 4, sort: 'popularity:desc' }, // Replace 'popularity' with actual backend sort field
      setTopSelling,
      setError, // Use the same error state, or separate if needed
      setLoadingTopSelling
    );
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className={styles.homePageContainer}>
      {/* Hero Section - Based on Wireframe */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <p className={styles.heroSubtitle}>LIMITED TIME OFFER</p>
          <h1 className={styles.heroTitle}>FIND CLOTHES THAT MATCHES YOUR STYLE</h1>
          <p className={styles.heroDescription}>
            Browse through our diverse range of meticulously crafted garments, designed to bring out
            your individuality and cater to your sense of style.
          </p>
          <Button as={Link} to="/products" variant="primary" size="large" className={styles.heroButton}>
            Shop Now
          </Button>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>200+</span>
            <span className={styles.statLabel}>International Brands</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>2,000+</span>
            <span className={styles.statLabel}>High-Quality Products</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>30,000+</span>
            <span className={styles.statLabel}>Happy Customers</span>
          </div>
        </div>
        {/* TODO: Add Brand Logos section as per wireframe */}
      </section>

      {error && <p className={styles.errorMessage}>Error: {error}</p>}

      {/* New Arrivals Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>NEW ARRIVALS</h2>
          <Link to="/products?sort=createdAt:desc" className={styles.viewAllLink}>View All</Link>
        </div>
        {loadingNewArrivals ? (
          <div className={styles.loadingContainer}><LoadingSpinner /></div>
        ) : newArrivals.length > 0 ? (
          <ProductList products={newArrivals} />
        ) : (
          <p>No new arrivals to display at the moment.</p>
        )}
      </section>

      {/* Dress Style Section - Based on Wireframe */}
      <section className={`${styles.section} ${styles.dressStyleSection}`}>
        <h2 className={styles.sectionTitle}>BROWSE BY DRESS STYLE</h2>
        <div className={styles.styleGrid}>
          {/* These would ideally link to filtered product pages */}
          <Link to="/products?category=casual" className={styles.styleCard}>
            {/* <img src="/path/to/casual-image.jpg" alt="Casual Style" /> */}
            <span>Casual</span>
          </Link>
          <Link to="/products?category=formal" className={styles.styleCard}>
            {/* <img src="/path/to/formal-image.jpg" alt="Formal Style" /> */}
            <span>Formal</span>
          </Link>
          <Link to="/products?category=party" className={styles.styleCard}>
            {/* <img src="/path/to/party-image.jpg" alt="Party Style" /> */}
            <span>Party</span>
          </Link>
          <Link to="/products?category=gym" className={styles.styleCard}>
            {/* <img src="/path/to/gym-image.jpg" alt="Gym Style" /> */}
            <span>Gym</span>
          </Link>
        </div>
      </section>

      {/* Top Selling Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>TOP SELLING</h2>
          <Link to="/products?sort=popularity:desc" className={styles.viewAllLink}>View All</Link>
        </div>
        {loadingTopSelling ? (
          <div className={styles.loadingContainer}><LoadingSpinner /></div>
        ) : topSelling.length > 0 ? (
          <ProductList products={topSelling} />
        ) : (
          <p>No top selling products to display at the moment.</p>
        )}
      </section>

      {/* Customer Testimonials Section - Based on Wireframe */}
      <section className={`${styles.section} ${styles.testimonialsSection}`}>
        <h2 className={styles.sectionTitle}>OUR HAPPY CUSTOMERS</h2>
        <div className={styles.testimonialGrid}>
          {/* Placeholder for testimonial components/content */}
          <div className={styles.testimonialCard}>"Great quality and fast shipping!" - Alex K.</div>
          <div className={styles.testimonialCard}>"Love the styles, will shop again!" - Sarah M.</div>
          <div className={styles.testimonialCard}>"Found exactly what I was looking for." - James L.</div>
        </div>
      </section>

      {/* Newsletter/Subscription Section - Based on Wireframe */}
      <section className={`${styles.section} ${styles.newsletterSection}`}>
        <h2 className={styles.sectionTitle}>STAY UPTO DATE ABOUT OUR LATEST OFFERS</h2>
        <form className={styles.newsletterForm} onSubmit={(e) => { e.preventDefault(); alert('Newsletter subscription placeholder.'); }}>
          <Input type="email" placeholder="Enter your email address" name="newsletterEmail" required />
          <Button type="submit" variant="secondary">Subscribe to Newsletter</Button>
        </form>
      </section>
    </div>
  );
};

export default HomePage;