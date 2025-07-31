import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
    gray: 'text-gray-600'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  const overlayClasses = overlay || fullScreen
    ? 'bg-white bg-opacity-75'
    : '';

  return (
    <div
      data-testid="loading-spinner"
      className={`${containerClasses} ${overlayClasses} ${className}`}
    >
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'white', 'gray']),
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingSpinner;
