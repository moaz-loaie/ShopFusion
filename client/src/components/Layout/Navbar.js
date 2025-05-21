// File: client/src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from './Navbar.module.css';
import logger from '../../utils/logger'; // Assuming a simple frontend logger

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null); // Ref for the mobile menu for click outside detection

  const handleLogout = async () => {
    logger.info(`Navbar: User ${user?.email || 'Guest'} attempting logout.`);
    await logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    logger.info('Navbar: Logout successful, navigating to home.');
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        // Also check if the click was on the toggle button to prevent immediate re-closing
        const toggleButton = document.querySelector(`.${styles.mobileMenuToggle}`);
        if (toggleButton && !toggleButton.contains(event.target)) {
          closeMobileMenu();
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);


  const commonLinks = (
    <>
      <li className={styles.navItem}>
        <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} end onClick={closeMobileMenu}>
          Home
        </NavLink>
      </li>
      <li className={styles.navItem}>
        <NavLink to="/products" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
          Products
        </NavLink>
      </li>
    </>
  );

  const authLinks = isAuthenticated ? (
    <>
      <li className={styles.navItem}>
        <NavLink to="/account" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
          Account {user?.full_name ? `(${user.full_name.split(' ')[0]})` : ''}
        </NavLink>
      </li>
      {(user?.role === 'customer' || user?.role === 'admin') && (
        <li className={styles.navItem}>
          <NavLink to="/orders" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
            My Orders
          </NavLink>
        </li>
      )}
      {user?.role === 'admin' && (
        <li className={styles.navItem}>
          <NavLink to="/admin" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
            Admin
          </NavLink>
        </li>
      )}
      {user?.role === 'seller' && (
        <li className={styles.navItem}>
          <NavLink to="/seller/dashboard" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
            Seller Dashboard
          </NavLink>
        </li>
      )}
      <li className={styles.navItem}>
        <button onClick={handleLogout} className={`${styles.navLink} ${styles.navButton}`}>
          Logout
        </button>
      </li>
    </>
  ) : (
    <>
      <li className={styles.navItem}>
        <NavLink to="/login" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} onClick={closeMobileMenu}>
          Login
        </NavLink>
      </li>
      <li className={styles.navItem}>
        <NavLink to="/register" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active} ${styles.registerButton}` : `${styles.navLink} ${styles.registerButton}`} onClick={closeMobileMenu}>
          Register
        </NavLink>
      </li>
    </>
  );

  const cartLink = (
    <li className={styles.navItem}>
      <NavLink to="/cart" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active} ${styles.cartLink}` : `${styles.navLink} ${styles.cartLink}`} onClick={closeMobileMenu}>
        {/* Using a simple cart icon placeholder, replace with actual icon */}
        <span className={styles.cartIcon}>🛒</span>
        Cart
        {itemCount > 0 && <span className={styles.cartCount}>{itemCount}</span>}
      </NavLink>
    </li>
  );

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.navLogo} onClick={closeMobileMenu}>
          ShopFusion
        </Link>

        {/* Desktop Menu */}
        <ul className={`${styles.navMenu} ${styles.desktopMenu}`}>
          {commonLinks}
          {authLinks}
          {cartLink}
        </ul>

        {/* Mobile Menu Toggle Button */}
        <button className={styles.mobileMenuToggle} onClick={toggleMobileMenu} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
          {isMobileMenuOpen ? '✕' : '☰'} {/* Close icon / Hamburger icon */}
        </button>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuDrawer} ref={mobileMenuRef}>
            <ul className={styles.navMenuMobile}>
              {commonLinks}
              {authLinks}
              {cartLink}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;