import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <div className={styles.notFoundContainer}>
    <h1 className={styles.title}>404 - Not Found</h1>
    <p className={styles.message}>The page you are looking for does not exist.</p>
    <Link className={styles.homeLink} to="/">Go to Home</Link>
  </div>
);

export default NotFoundPage;
