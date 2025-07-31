import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword, enable2FA, disable2FA } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import Toast from '../Common/Toast';
import styles from './SecuritySettings.module.css';

const SecuritySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [show2FASetup, setShow2FASetup] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      Toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAToggle = async () => {
    setLoading(true);
    try {
      if (user?.twoFactorEnabled) {
        await disable2FA(user.id);
        Toast.success('2FA disabled successfully');
      } else {
        const response = await enable2FA(user.id);
        setShow2FASetup(true);
        // Show QR code or setup instructions from response
      }
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Failed to update 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.securitySettings}>
      <h1>Security Settings</h1>

      <section className={styles.section}>
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Two-Factor Authentication</h2>
        <div className={styles.twoFactorSection}>
          <p className={styles.description}>
            Two-factor authentication adds an extra layer of security to your account.
            When enabled, you'll need to enter a code from your authenticator app when signing in.
          </p>

          <button
            onClick={handle2FAToggle}
            className={`${styles.toggleButton} ${user?.twoFactorEnabled ? styles.danger : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Processing...
              </>
            ) : user?.twoFactorEnabled ? (
              'Disable 2FA'
            ) : (
              'Enable 2FA'
            )}
          </button>

          {show2FASetup && (
            <div className={styles.setupInstructions}>
              {/* 2FA setup instructions and QR code would go here */}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
