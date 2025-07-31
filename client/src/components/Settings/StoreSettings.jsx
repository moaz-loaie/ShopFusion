import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsToggle,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import { getUserSettings, updateUserSettings } from '../../services/api';
import { StoreIcon, TruckIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const StoreSettings = () => {
  const [settings, setSettings] = useState({
    store: {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      shippingMethods: ['standard'],
      returnPolicy: '',
      autoConfirmOrders: false,
      minOrderValue: 0,
      maxOrderItems: 50
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
        if (response.data?.data?.settings?.store) {
          setSettings(prev => ({
            ...prev,
            store: response.data.data.settings.store
          }));
        }
      } catch (err) {
        setError('Failed to load store settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (setting, value) => {
    setSettings(prev => ({
      store: {
        ...prev.store,
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      await updateUserSettings(settings);
      setSuccessMessage('Store settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>Store Settings</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="Store Information" icon={<StoreIcon />}>
        <SettingsInput
          label="Store Name"
          type="text"
          value={settings.store.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
        <SettingsInput
          label="Store Description"
          type="textarea"
          value={settings.store.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        <SettingsInput
          label="Contact Email"
          type="email"
          value={settings.store.contactEmail}
          onChange={(e) => handleChange('contactEmail', e.target.value)}
          required
        />
        <SettingsInput
          label="Contact Phone"
          type="tel"
          value={settings.store.contactPhone}
          onChange={(e) => handleChange('contactPhone', e.target.value)}
        />
      </SettingsCard>

      <SettingsCard title="Shipping & Orders" icon={<TruckIcon />}>
        <SettingsSelect
          label="Shipping Methods"
          value={settings.store.shippingMethods}
          options={[
            { value: 'standard', label: 'Standard Shipping' },
            { value: 'express', label: 'Express Shipping' },
            { value: 'overnight', label: 'Overnight Shipping' }
          ]}
          multiple
          onChange={(e) => handleChange('shippingMethods', Array.from(e.target.selectedOptions, option => option.value))}
        />
        <SettingsInput
          label="Return Policy (days)"
          type="number"
          value={settings.store.returnPeriod}
          onChange={(e) => handleChange('returnPeriod', parseInt(e.target.value))}
          min="0"
          max="365"
        />
        <SettingsToggle
          label="Auto-confirm Orders"
          checked={settings.store.autoConfirmOrders}
          onChange={() => handleChange('autoConfirmOrders', !settings.store.autoConfirmOrders)}
        />
        <SettingsInput
          label="Minimum Order Value ($)"
          type="number"
          value={settings.store.minOrderValue}
          onChange={(e) => handleChange('minOrderValue', parseFloat(e.target.value))}
          min="0"
          step="0.01"
        />
        <SettingsInput
          label="Maximum Items Per Order"
          type="number"
          value={settings.store.maxOrderItems}
          onChange={(e) => handleChange('maxOrderItems', parseInt(e.target.value))}
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

export default StoreSettings;
