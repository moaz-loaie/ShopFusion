import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsToggle,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import { getUserSettings, updateUserSettings } from '../../services/api';
import { BellIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const NotificationsSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletter: true,
      securityAlerts: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getUserSettings();
        if (response.data?.data?.settings?.notifications) {
          setSettings(prev => ({
            ...prev,
            notifications: response.data.data.settings.notifications
          }));
        }
      } catch (err) {
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      notifications: {
        ...prev.notifications,
        [setting]: !prev.notifications[setting]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      await updateUserSettings(settings);
      setSuccessMessage('Notification settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>Notification Settings</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="Email Notifications" icon={<BellIcon />}>
        <SettingsToggle
          label="Order Updates"
          checked={settings.notifications.orderUpdates}
          onChange={() => handleToggle('orderUpdates')}
        />
        <SettingsToggle
          label="Promotional Updates"
          checked={settings.notifications.promotions}
          onChange={() => handleToggle('promotions')}
        />
        <SettingsToggle
          label="Newsletter"
          checked={settings.notifications.newsletter}
          onChange={() => handleToggle('newsletter')}
        />
        <SettingsToggle
          label="Security Alerts"
          checked={settings.notifications.securityAlerts}
          onChange={() => handleToggle('securityAlerts')}
        />
      </SettingsCard>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </div>
  );
};

export default NotificationsSettings;
