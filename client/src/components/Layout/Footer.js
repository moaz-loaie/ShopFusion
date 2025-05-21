// File: client/src/components/Layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import logger from '../../utils/logger'; // Assuming simple frontend logger

// Example: Placeholder social media icons if not using a library
const SocialIcon = ({ platform, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={platform} className={styles.socialLinkItem}>
    {platform.substring(0, 2).toUpperCase()} {/* Simple text placeholder */}
  </a>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  logger.debug("Footer component rendered.");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = e.target.elements.newsletterEmail.value;
    if (email) {
      logger.info(`Newsletter subscription attempt: ${email}`);
      // Here, you would typically call an API to subscribe the email
      // For this example, we'll just show an alert.
      alert(`Thank you for subscribing, ${email}! (This is a placeholder)`);
      e.target.reset(); // Clear the form
    } else {
      alert("Please enter a valid email address.");
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Section 1: Brand Info & Social Media */}
        <div className={styles.footerSection}>
          <h4 className={styles.footerLogo}>ShopFusion</h4>
          <p className={styles.footerAbout}>
            Discover your style with ShopFusion. We offer a curated selection of high-quality
            fashion and lifestyle products to enhance your everyday.
          </p>
          <div className={styles.socialLinks}>
            <SocialIcon platform="Facebook" url="https://facebook.com/shopfusion" />
            <SocialIcon platform="Twitter" url="https://twitter.com/shopfusion" />
            <SocialIcon platform="Instagram" url="https://instagram.com/shopfusion" />
            <SocialIcon platform="LinkedIn" url="https://linkedin.com/company/shopfusion" />
          </div>
        </div>

        {/* Section 2: Company Links */}
        <div className={styles.footerSection}>
          <h5 className={styles.footerTitle}>Company</h5>
          <ul className={styles.footerLinks}>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/careers">Careers</Link></li> {/* Example additional link */}
            <li><Link to="/press">Press & Media</Link></li> {/* Example additional link */}
            <li><Link to="/blog">Our Blog</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
          </ul>
        </div>

        {/* Section 3: Help & Support */}
        <div className={styles.footerSection}>
          <h5 className={styles.footerTitle}>Help & Support</h5>
          <ul className={styles.footerLinks}>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/shipping-returns">Shipping & Returns</Link></li>
            <li><Link to="/orders">Order Tracking</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Section 4: Newsletter Subscription & Contact */}
        <div className={styles.footerSection}>
          <h5 className={styles.footerTitle}>Stay Updated</h5>
          <p>Get the latest on new arrivals, sales, and exclusive offers by subscribing to our newsletter.</p>
          <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
            <input type="email" name="newsletterEmail" placeholder="Enter your email" required aria-label="Newsletter email input"/>
            <button type="submit">Subscribe</button>
          </form>
          <div className={styles.contactDetails}>
            <p><strong>Email:</strong> <a href="mailto:support@shopfusion.com">support@shopfusion.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+1234567890">(123) 456-7890</a></p>
            {/* Add address if applicable */}
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className={styles.footerBottom}>
        <p>&copy; {currentYear} ShopFusion Inc. All Rights Reserved.</p>
        <div className={styles.paymentMethods}>
          <span>Payments Secured By: </span>
          {/* Placeholder text for payment icons */}
          <span className={styles.paymentIconText}>VISA</span>
          <span className={styles.paymentIconText}>MasterCard</span>
          <span className={styles.paymentIconText}>PayPal</span>
          <span className={styles.paymentIconText}>Amex</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;