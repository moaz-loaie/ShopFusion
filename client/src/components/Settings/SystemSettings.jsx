import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsToggle,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import { GearIcon, ShieldIcon, CurrencyIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      maintenanceMode: false,
      allowNewRegistrations: true,
      sessionTimeout: 60
    },
    security: {
      emailVerificationRequired: true,
      automaticModeration: false,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      passwordRequireSpecialChar: true
    },
    business: {
      disputeAutoClose: 30,
      minimumOrderAmount: 10.00,
      platformFeePercentage: 5.00,
      lowStockThreshold: 5,
      maxItemsPerOrder: 100
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getSystemSettings();
        if (response.data?.data?.settings) {
          setSettings(response.data.data.settings);
        }
      } catch (err) {
        setError('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      await updateSystemSettings(settings);
      setSuccessMessage('System settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>System Settings</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="General Settings" icon={<GearIcon />}>
        <SettingsToggle
          label="Maintenance Mode"
          checked={settings.general.maintenanceMode}
          onChange={() => handleChange('general', 'maintenanceMode', !settings.general.maintenanceMode)}
        />
        <SettingsToggle
          label="Allow New Registrations"
          checked={settings.general.allowNewRegistrations}
          onChange={() => handleChange('general', 'allowNewRegistrations', !settings.general.allowNewRegistrations)}
        />
        <SettingsInput
          label="Session Timeout (minutes)"
          type="number"
          value={settings.general.sessionTimeout}
          onChange={(e) => handleChange('general', 'sessionTimeout', parseInt(e.target.value))}
          min="15"
          max="180"
        />
      </SettingsCard>

      <SettingsCard title="Security Settings" icon={<ShieldIcon />}>
        <SettingsToggle
          label="Email Verification Required"
          checked={settings.security.emailVerificationRequired}
          onChange={() => handleChange('security', 'emailVerificationRequired', !settings.security.emailVerificationRequired)}
        />
        <SettingsToggle
          label="Automatic Content Moderation"
          checked={settings.security.automaticModeration}
          onChange={() => handleChange('security', 'automaticModeration', !settings.security.automaticModeration)}
        />
        <SettingsInput
          label="Maximum Login Attempts"
          type="number"
          value={settings.security.maxLoginAttempts}
          onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
          min="1"
          max="10"
        />
        <SettingsInput
          label="Minimum Password Length"
          type="number"
          value={settings.security.passwordMinLength}
          onChange={(e) => handleChange('security', 'passwordMinLength', parseInt(e.target.value))}
          min="8"
          max="32"
        />
        <SettingsToggle
          label="Require Special Characters in Password"
          checked={settings.security.passwordRequireSpecialChar}
          onChange={() => handleChange('security', 'passwordRequireSpecialChar', !settings.security.passwordRequireSpecialChar)}
        />
      </SettingsCard>

      <SettingsCard title="Business Rules" icon={<CurrencyIcon />}>
        <SettingsInput
          label="Auto-close Disputes After (days)"
          type="number"
          value={settings.business.disputeAutoClose}
          onChange={(e) => handleChange('business', 'disputeAutoClose', parseInt(e.target.value))}
          min="1"
          max="90"
        />
        <SettingsInput
          label="Minimum Order Amount ($)"
          type="number"
          value={settings.business.minimumOrderAmount}
          onChange={(e) => handleChange('business', 'minimumOrderAmount', parseFloat(e.target.value))}
          min="0"
          step="0.01"
        />
        <SettingsInput
          label="Platform Fee Percentage (%)"
          type="number"
          value={settings.business.platformFeePercentage}
          onChange={(e) => handleChange('business', 'platformFeePercentage', parseFloat(e.target.value))}
          min="0"
          max="100"
          step="0.1"
        />
        <SettingsInput
          label="Low Stock Threshold"
          type="number"
          value={settings.business.lowStockThreshold}
          onChange={(e) => handleChange('business', 'lowStockThreshold', parseInt(e.target.value))}
          min="1"
          max="100"
        />
        <SettingsInput
          label="Maximum Items Per Order"
          type="number"
          value={settings.business.maxItemsPerOrder}
          onChange={(e) => handleChange('business', 'maxItemsPerOrder', parseInt(e.target.value))}
          min="1"
          max="1000"
        />
      </SettingsCard>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </div>
  );
};

export default SystemSettings;
