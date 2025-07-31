import React, { useState, useEffect } from 'react';
import { 
  SettingsPage, 
  SettingsGrid, 
  SettingsCard,
  SettingsToggle,
  SettingsSelect,
  SettingsButton,
  SettingsMessage
} from '../../components/Settings/SettingsComponents';
import { getUserSettings, updateUserSettings } from '../../services/api';
import { BellIcon, ShieldIcon, GlobeIcon, TruckIcon } from '../../components/Icons';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const SellerSettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletter: true,
      inventoryAlerts: true,
      orderNotifications: true
    },
    privacy: {
      profileVisibility: 'public',
      showReviews: true
    },
    preferences: {
      language: 'en',
      currency: 'USD',
      theme: 'light',
      defaultShippingMethod: 'standard',
      autoConfirmOrders: false
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
        if (response.data?.data?.settings) {
          setSettings(response.data.data.settings);
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      await updateUserSettings(settings);
      setSuccessMessage('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleSelect = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SettingsPage title="Seller Settings">
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsGrid>
        <SettingsCard title="Notifications" icon={<BellIcon />}>
          <SettingsToggle
            label="Order Updates"
            checked={settings.notifications.orderUpdates}
            onChange={() => handleToggle('notifications', 'orderUpdates')}
          />
          <SettingsToggle
            label="Inventory Alerts"
            checked={settings.notifications.inventoryAlerts}
            onChange={() => handleToggle('notifications', 'inventoryAlerts')}
          />
          <SettingsToggle
            label="Order Notifications"
            checked={settings.notifications.orderNotifications}
            onChange={() => handleToggle('notifications', 'orderNotifications')}
          />
          <SettingsToggle
            label="Promotional Updates"
            checked={settings.notifications.promotions}
            onChange={() => handleToggle('notifications', 'promotions')}
          />
        </SettingsCard>

        <SettingsCard title="Privacy" icon={<ShieldIcon />}>
          <SettingsSelect
            label="Profile Visibility"
            value={settings.privacy.profileVisibility}
            options={[
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
              { value: 'verified', label: 'Verified Buyers Only' }
            ]}
            onChange={(e) => handleSelect('privacy', 'profileVisibility', e.target.value)}
          />
          <SettingsToggle
            label="Show Reviews"
            checked={settings.privacy.showReviews}
            onChange={() => handleToggle('privacy', 'showReviews')}
          />
        </SettingsCard>

        <SettingsCard title="Store Preferences" icon={<GlobeIcon />}>
          <SettingsSelect
            label="Language"
            value={settings.preferences.language}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' }
            ]}
            onChange={(e) => handleSelect('preferences', 'language', e.target.value)}
          />
          <SettingsSelect
            label="Currency"
            value={settings.preferences.currency}
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' }
            ]}
            onChange={(e) => handleSelect('preferences', 'currency', e.target.value)}
          />
        </SettingsCard>

        <SettingsCard title="Shipping" icon={<TruckIcon />}>
          <SettingsSelect
            label="Default Shipping Method"
            value={settings.preferences.defaultShippingMethod}
            options={[
              { value: 'standard', label: 'Standard Shipping' },
              { value: 'express', label: 'Express Shipping' },
              { value: 'overnight', label: 'Overnight Shipping' }
            ]}
            onChange={(e) => handleSelect('preferences', 'defaultShippingMethod', e.target.value)}
          />
          <SettingsToggle
            label="Auto-confirm Orders"
            checked={settings.preferences.autoConfirmOrders}
            onChange={() => handleToggle('preferences', 'autoConfirmOrders')}
          />
        </SettingsCard>
      </SettingsGrid>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </SettingsPage>
  );
};

export default SellerSettingsPage;
