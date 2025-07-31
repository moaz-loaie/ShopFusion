import React, { useEffect } from 'react';
import styles from './Toast.module.css';

const Toast = ({ message, type = 'success', show, onDismiss }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onDismiss} aria-label="Close">
        ×
      </button>
    </div>
  );
};

export default Toast;
