import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';
import styles from './LoadingState.module.css';

const LoadingState = ({
  loading,
  error,
  children,
  spinnerSize = 'medium',
  spinnerText = 'Loading...',
  errorText = 'An error occurred',
  onRetry = null,
  skeleton = null
}) => {
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <p className={styles.errorMessage}>{error.message || errorText}</p>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    if (skeleton) {
      return skeleton;
    }
    return <LoadingSpinner size={spinnerSize} text={spinnerText} />;
  }

  return children;
};

LoadingState.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.bool
  ]),
  children: PropTypes.node.isRequired,
  spinnerSize: PropTypes.oneOf(['small', 'medium', 'large']),
  spinnerText: PropTypes.string,
  errorText: PropTypes.string,
  onRetry: PropTypes.func,
  skeleton: PropTypes.node
};

export default LoadingState;
