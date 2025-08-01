import React from 'react';
import PropTypes from 'prop-types';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({ message }) => {
  return (
    <div className={styles.errorContainer} role="alert">
      <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
      <span className={styles.errorText}>{message}</span>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorMessage;
