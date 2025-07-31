import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from './MainLayout.module.css';

/**
 * MainLayout - Sophisticated layout for ShopFusion React app.
 * Features:
 *  - Responsive sticky header (Navbar)
 *  - Main content area with max-width, padding, and min-height
 *  - Optional sidebar slot for future extensibility
 *  - Footer always at the bottom (sticky footer)
 *  - Handles mobile, tablet, and desktop breakpoints
 *  - Accessible landmarks (header, main, footer)
 */
const MainLayout = ({ children, sidebar }) => (
  <div className={styles.layoutRoot}>
    <header className={styles.header}>
      <Navbar />
    </header>
    <div className={styles.contentWrapper}>
      {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
      <main className={styles.mainContent} tabIndex={-1}>
        {children}
      </main>
    </div>
    <footer className={styles.footer}>
      <Footer />
    </footer>
  </div>
);

export default MainLayout;
