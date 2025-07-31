import React from 'react';
import { Link } from 'react-router-dom';
import styles from './MaintenancePage.module.css';

const MaintenancePage = ({ showAdminLogin = true }) => {
  return (
    <div className={styles.maintenancePage}>
      <div className={styles.maintenanceIcon}>🛠️</div>
      <h1 className={styles.maintenanceTitle}>Site Under Maintenance</h1>
      <p className={styles.maintenanceMessage}>
        We're performing scheduled maintenance to improve your experience.
        Please check back soon. We appreciate your patience.
      </p>
      {showAdminLogin && (
        <Link to="/login" className={styles.adminLoginLink}>
          Admin Login
        </Link>
      )}
    </div>
  );
};

export default MaintenancePage;
