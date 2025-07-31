import React from 'react';
import PropTypes from 'prop-types';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}) => {
  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirm();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    onCancel();
  };

  return (
    <div className={styles.overlay}>      <div 
        className={styles.dialog} 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className={styles.header}>
          <h2 id="dialog-title" className={styles.title}>{title}</h2>
        </div>
        
        <div className={styles.content}>
          <p id="dialog-message" className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleCancel}
            className={`${styles.button} ${styles.cancelButton}`}
            type="button"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            type="button"
            className={`${styles.button} ${styles[variant]}`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['warning', 'danger', 'info'])
};

export default ConfirmDialog;
