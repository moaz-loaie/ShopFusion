import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './ErrorPage.module.css';

const ErrorPage = ({ 
  code = 404,
  title = 'Page Not Found',
  message = 'The page you are looking for does not exist.',
  actionText = 'Go Back Home',
  actionLink = '/'
}) => {
  const illustrations = {
    404: '🔍',
    500: '🔧',
    403: '🔒',
    default: '❌'
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.illustration}>
          {illustrations[code] || illustrations.default}
        </div>
        
        <h1 className={styles.errorCode}>{code}</h1>
        <h2 className={styles.errorTitle}>{title}</h2>
        <p className={styles.errorMessage}>{message}</p>
        
        <Link to={actionLink} className={styles.actionButton}>
          {actionText}
        </Link>
      </div>
    </div>
  );
};

ErrorPage.propTypes = {
  code: PropTypes.number,
  title: PropTypes.string,
  message: PropTypes.string,
  actionText: PropTypes.string,
  actionLink: PropTypes.string
};

export default ErrorPage;
