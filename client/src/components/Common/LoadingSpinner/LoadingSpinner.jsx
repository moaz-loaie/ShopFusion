import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  overlay = false,
  text = 'Loading...',
  color = 'primary'
}) => {
  const spinnerClasses = `
    ${styles.spinner} 
    ${styles[size]} 
    ${styles[color]}
    ${overlay ? styles.overlay : ''}
  `;

  return (
    <div className={spinnerClasses}>
      <div className={styles.spinnerInner}>
        <div className={styles.ring}></div>
        {text && <p className={styles.text}>{text}</p>}
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  overlay: PropTypes.bool,
  text: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'white'])
};

export default LoadingSpinner;
