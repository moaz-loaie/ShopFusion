import React from 'react';
import logger from '../../../utils/logger';
import styles from './ErrorBoundary.module.css';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error details
    logger.error('Error caught by boundary:', {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // If a retry handler is provided, call it
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      // Default behavior: reload the page
      window.location.reload();
    }
  };

  render() {
    const { fallback } = this.props;

    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className={styles.errorActions}>
              <button 
                onClick={this.handleRetry}
                className={styles.retryButton}
              >
                Try Again
              </button>
              <Link to="/" className={styles.homeButton}>
                Back to Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.errorDetails}>
                <summary>Error Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
