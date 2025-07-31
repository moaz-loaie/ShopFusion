import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import styles from './ErrorPage.module.css';

const ErrorPage = ({ 
  code, 
  title, 
  message, 
  action = 'Go Home',
  actionPath = '/',
  illustration,
  retry = null
}) => {
  const getDefaultIllustration = () => {
    switch (code) {
      case '404':
        return '/assets/illustrations/404.svg';
      case '500':
        return '/assets/illustrations/500.svg';
      case '403':
        return '/assets/illustrations/403.svg';
      case 'network':
        return '/assets/illustrations/network-error.svg';
      default:
        return null;
    }
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.content}>
        {illustration || getDefaultIllustration() ? (
          <img 
            src={illustration || getDefaultIllustration()} 
            alt={`${code} error illustration`} 
            className={styles.illustration}
          />
        ) : (
          <div className={styles.errorCode}>{code}</div>
        )}
        
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        
        <div className={styles.actions}>
          {retry && (
            <button 
              onClick={retry} 
              className={styles.retryButton}
              aria-label="Retry the failed action"
            >
              Try Again
            </button>
          )}
          <Link 
            to={actionPath} 
            className={styles.actionButton}
            aria-label={`Navigate to ${actionPath}`}
          >
            {action}
          </Link>
        </div>
      </div>
    </div>
  );
};

ErrorPage.propTypes = {
  code: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  action: PropTypes.string,
  actionPath: PropTypes.string,
  illustration: PropTypes.string,
  retry: PropTypes.func
};

export default ErrorPage;
