// File: client/src/pages/HomePage.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../../services/productApi';
import ProductList from '../../components/Product/ProductList';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import styles from './HomePage.module.css';
import logger from '../../utils/logger';

import VersaceLogo from '../../assets/Versace-logo.png';
import ZaraLogo from '../../assets/zara-logo-1 1.png';
import GucciLogo from '../../assets/gucci-logo-1 1.png';
import PradaLogo from '../../assets/prada-logo-1 1.png';
import CalvinKleinLogo from '../../assets/Calvin-Klein-logo.png';

const fetchProductSet = async (params, setter, errorSetter, loadingSetter) => {
  loadingSetter(true);
  try {
    const response = await getProducts(params);
    if (!response?.data?.products) {
      throw new Error('No products found in response');
    }
    setter(response.data.products);
    logger.debug(`HomePage: Fetched products for params: ${JSON.stringify(params)}`);
  } catch (err) {
    logger.error(
      `HomePage: Failed to fetch products for params ${JSON.stringify(params)}:`,
      err.message,
    );
    errorSetter(err.response?.data?.message || `Could not load products. Please try again.`);
    setter([]);
  } finally {
    loadingSetter(false);
  }
};

const HomePage = () => {
  const [newArrivals, setNewArrivals] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const [loadingTopSelling, setLoadingTopSelling] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesError, setCategoriesError] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const testimonials = [
    {
      text: 'ShopFusion made it so easy to find what I needed. Fast shipping and great support!',
      author: 'Alex P.',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      text: 'The new arrivals are always on trend. I love browsing every week!',
      author: 'Jamie L.',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      text: 'Best online shopping experience I’ve had. Highly recommend ShopFusion!',
      author: 'Morgan S.',
      image: 'https://randomuser.me/api/portraits/men/65.jpg',
    },
    {
      text: 'Great selection and easy checkout. My go-to for gifts!',
      author: 'Taylor R.',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  ];
  const handleTestimonialNav = (dir) => {
    setTestimonialIndex((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  const brandLogos = [
    {
      name: 'Nike',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/nike.svg',
      alt: 'Nike',
    },
    {
      name: 'Apple',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg',
      alt: 'Apple',
    },
    {
      name: 'Samsung',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/samsung.svg',
      alt: 'Samsung',
    },
    {
      name: 'Sony',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/sony.svg',
      alt: 'Sony',
    },
    {
      name: 'Adidas',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/adidas.svg',
      alt: 'Adidas',
    },
    {
      name: 'LG',
      src: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/lg.svg',
      alt: 'LG',
    },
    { name: 'Versace', src: VersaceLogo, alt: 'Versace' },
    { name: 'Zara', src: ZaraLogo, alt: 'Zara' },
    { name: 'Gucci', src: GucciLogo, alt: 'Gucci' },
    { name: 'Prada', src: PradaLogo, alt: 'Prada' },
    { name: 'Calvin Klein', src: CalvinKleinLogo, alt: 'Calvin Klein' },
  ];
  const [brandScroll, setBrandScroll] = useState(0);
  const brandListRef = useRef();
  const scrollBrands = (dir) => {
    if (!brandListRef.current) return;
    const scrollAmount = 220;
    brandListRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    logger.info('HomePage mounted. Fetching initial data.');
    fetchProductSet(
      { limit: 14, sort: 'createdAt:desc' },
      setNewArrivals,
      setError,
      setLoadingNewArrivals,
    );
    fetchProductSet(
      { limit: 4, sort: 'popularity:desc' },
      setTopSelling,
      setError,
      setLoadingTopSelling,
    );    (async () => {
      setLoadingCategories(true);      try {
        const { data } = await getCategories();
        setCategories(data.categories?.slice(0, 6) || []);
        setCategoriesError(null);
      } catch (err) {
        setCategoriesError('Could not load categories. Please try again later.');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus('');
    setNewsletterLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      setNewsletterStatus('Thank you for subscribing!');
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus('Subscription failed. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setSearchError('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const validateSearch = () => {
    if (!search.trim()) {
      setSearchError('Please enter a search term');
      return false;
    }
    if (search.trim().length < 2) {
      setSearchError('Search term must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!validateSearch()) {
      return;
    }
    setIsSearching(true);
    try {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    } catch (error) {
      setSearchError('An error occurred. Please try again.');
      logger.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className={styles.homePageContainer}>
      <section className={styles.heroSection} aria-label="ShopFusion hero">
        <div className={styles.heroLeft}>
          <div className={styles.heroHeadline}>
            FIND CLOTHES
            <br />
            THAT MATCHES
            <br />
            YOUR STYLE
          </div>
          <div className={styles.heroSubheadline}>
            Browse through our diverse range of meticulously crafted garments, designed to bring out
            your individuality and cater to your sense of style.
          </div>
          <Link to="/products">
            <button className={styles.heroButton} aria-label="Shop Now">
              Shop Now
            </button>
          </Link>
          <div className={styles.heroStatsRow}>
            <div className={styles.heroStat}>
              <span>200+</span>
              <span>International Brands</span>
            </div>
            <div className={styles.heroStat}>
              <span>2,000+</span>
              <span>High-Quality Products</span>
            </div>
            <div className={styles.heroStat}>
              <span>30,000+</span>
              <span>Happy Customers</span>
            </div>
          </div>
          <form onSubmit={handleSearchSubmit} className={styles.heroSearchForm} role="search">
            <input
              type="search"
              className={styles.heroSearchInput}
              placeholder="Search for clothes..."
              value={search}
              onChange={handleSearchChange}
              disabled={isSearching}
              aria-label="Search products"
              minLength={2}
              required
            />
            <button
              type="submit"
              className={styles.heroSearchButton}
              disabled={isSearching}
              aria-label={isSearching ? 'Searching...' : 'Search'}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchError && (
            <div className={styles.searchError} role="alert">
              {searchError}
            </div>
          )}
        </div>
      </section>
      <section className={styles.brandLogosSection} aria-label="Featured Brands">
        <button
          className={styles.brandScrollBtn}
          onClick={() => scrollBrands(-1)}
          aria-label="Scroll brands left"
        >
          &#8592;
        </button>
        <ul
          className={styles.brandLogosList}
          ref={brandListRef}
          tabIndex={0}
          aria-label="Brand logos carousel"
        >
          {brandLogos.map((brand) => (
            <li key={brand.name} className={styles.brandLogoItem}>
              <img src={brand.src} alt={brand.alt} className={styles.brandLogoImg} loading="lazy" />
            </li>
          ))}
        </ul>
        <button
          className={styles.brandScrollBtn}
          onClick={() => scrollBrands(1)}
          aria-label="Scroll brands right"
        >
          &#8594;
        </button>
      </section>
      <section className={styles.section} aria-labelledby="categories-title">
        <h2 id="categories-title" className={styles.sectionTitle}>
          Featured Categories
        </h2>
        {loadingCategories ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading categories...
          </div>
        ) : categoriesError ? (
          <div className={styles.statusMsg} role="alert">
            {categoriesError}
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyState}>No categories found.</div>
        ) : (
          <ul className={styles.categoriesList}>
            {categories.map((cat) => (
              <li key={cat.id} className={styles.categoryCard}>
                <Link
                  to={`/products?category=${cat.id}`}
                  className={styles.categoryLink}
                  aria-label={`Browse ${cat.name}`}
                >
                  {cat.thumbnail_url ? (
                    <img
                      src={cat.thumbnail_url}
                      alt={cat.name}
                      className={styles.categoryIconImg}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.categoryIcon} aria-hidden="true">
                      📦
                    </span>
                  )}
                  <span className={styles.categoryName}>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className={styles.section} aria-labelledby="new-arrivals-title">
        <div className={styles.sectionHeader}>
          <h2 id="new-arrivals-title" className={styles.sectionTitle}>
            New Arrivals
          </h2>
          <Link to="/products?sort=createdAt:desc" className={styles.viewAllLink}>
            View All
          </Link>
        </div>
        {loadingNewArrivals ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading new arrivals...
          </div>
        ) : error ? (
          <div className={styles.statusMsg} role="alert">
            {error}
          </div>
        ) : newArrivals.length === 0 ? (
          <div className={styles.emptyState}>No new arrivals found.</div>
        ) : (
          <ProductList
            products={newArrivals}
            itemsPerRow={4}
            layout="carousel"
            className={styles.newArrivalsGrid}
          />
        )}
      </section>
      <section className={styles.section} aria-labelledby="top-selling-title">
        <div className={styles.sectionHeader}>
          <h2 id="top-selling-title" className={styles.sectionTitle}>
            Top Selling
          </h2>
          <Link to="/products?sort=popularity:desc" className={styles.viewAllLink}>
            View All
          </Link>
        </div>
        {loadingTopSelling ? (
          <div className={styles.skeletonLoader} aria-busy="true" aria-live="polite">
            Loading top selling...
          </div>
        ) : error ? (
          <div className={styles.statusMsg} role="alert">
            {error}
          </div>
        ) : topSelling.length === 0 ? (
          <div className={styles.emptyState}>No top selling products found.</div>
        ) : (
          <ProductList
            products={topSelling}
            itemsPerRow={3}
            gridGap="2rem"
            className={styles.topSellingGrid}
          />
        )}
      </section>
      <section className={styles.section} aria-labelledby="dress-style-title">
        <h2 id="dress-style-title" className={styles.sectionTitle}>
          Browse by Dress Style
        </h2>
        <div className={styles.dressStyleGrid}>
          <div className={styles.dressStyleCard}>
            <img
              src="https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&w=400&q=80"
              alt="Casual dress style"
              className={styles.dressStyleImg}
            />
            <div className={styles.dressStyleLabel}>Casual</div>
          </div>
          <div className={styles.dressStyleCard}>
            <img
              src="https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&w=400&q=80"
              alt="Formal dress style"
              className={styles.dressStyleImg}
            />
            <div className={styles.dressStyleLabel}>Formal</div>
          </div>
          <div className={styles.dressStyleCard}>
            <img
              src="https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&w=400&q=80"
              alt="Party dress style"
              className={styles.dressStyleImg}
            />
            <div className={styles.dressStyleLabel}>Party</div>
          </div>
          <div className={styles.dressStyleCard}>
            <img
              src="https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&w=400&q=80"
              alt="Gym dress style"
              className={styles.dressStyleImg}
            />
            <div className={styles.dressStyleLabel}>Gym</div>
          </div>
        </div>
      </section>
      <section className={styles.section} aria-labelledby="testimonials-title">
        <h2 id="testimonials-title" className={styles.sectionTitle}>
          Our Happy Customers
        </h2>
        <div className={styles.testimonialCarousel}>
          <button
            className={styles.testimonialNavBtn}
            onClick={() =>
              setTestimonialIndex(
                (testimonialIndex - 1 + testimonials.length) % testimonials.length,
              )
            }
            aria-label="Previous testimonials"
            type="button"
          >
            <span aria-hidden="true">&#8592;</span>
          </button>
          <div className={styles.testimonialCardsWrapper}>
            {testimonials
              .slice(testimonialIndex, testimonialIndex + 3)
              .concat(
                testimonials.slice(0, Math.max(0, testimonialIndex + 3 - testimonials.length)),
              )
              .map((testimonial, idx) => (
                <figure className={styles.testimonialCard} key={testimonial.author + idx}>
                  <div className={styles.testimonialStars}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} aria-label="star" role="img">
                        ⭐
                      </span>
                    ))}
                  </div>
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className={styles.testimonialAvatar}
                  />
                  <figcaption className={styles.testimonialAuthor}>{testimonial.author}</figcaption>
                  <blockquote className={styles.testimonialText}>“{testimonial.text}”</blockquote>
                </figure>
              ))}
          </div>
          <button
            className={styles.testimonialNavBtn}
            onClick={() => setTestimonialIndex((testimonialIndex + 1) % testimonials.length)}
            aria-label="Next testimonials"
            type="button"
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>
      </section>
      <section className={styles.newsletterSection} aria-labelledby="newsletter-title">
        <div className={styles.newsletterInner}>
          <h2 id="newsletter-title" className={styles.newsletterTitle}>
            STAY UP TO DATE ABOUT
            <br />
            OUR LATEST OFFERS
          </h2>
          <form
            className={styles.newsletterForm}
            onSubmit={handleNewsletterSubmit}
            autoComplete="off"
          >
            <div className={styles.newsletterInputCol}>
              <div className={styles.newsletterInputRow}>
                <span className={styles.newsletterIcon} aria-hidden="true">
                  ✉️
                </span>
                <Input
                  id="newsletter-email"
                  className={styles.newsletterInput}
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  aria-label="Email address"
                  disabled={newsletterLoading}
                />
              </div>
              <button
                className={styles.newsletterButton}
                type="submit"
                disabled={newsletterLoading || !newsletterEmail}
                aria-label="Subscribe to Newsletter"
              >
                {newsletterLoading ? <LoadingSpinner size="sm" /> : 'Subscribe to Newsletter'}
              </button>
            </div>
          </form>
        </div>
        {newsletterStatus && (
          <div className={styles.newsletterStatusMsg} role="status">
            {newsletterStatus}
          </div>
        )}
      </section>
    </main>
  );
};

export default HomePage;
