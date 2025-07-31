import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ServerErrorPage } from '../ErrorPages';
import logger from '../../../utils/logger';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
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

    // Log the error
    logger.error('Error Boundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // First try custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry, errorInfo);
      }

      // Default to ServerErrorPage
      return <ServerErrorPage retry={this.handleRetry} />;
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func
};

export default ErrorBoundary;
