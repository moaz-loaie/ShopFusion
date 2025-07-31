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
import { BellIcon, ShieldIcon, GlobeIcon } from '../../components/Icons';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AccountSettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletter: true
    },
    privacy: {
      profileVisibility: 'public',
      showReviews: true
    },
    preferences: {
      language: 'en',
      currency: 'USD',
      theme: 'light'
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
    <SettingsPage title="Account Settings">
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
            label="Promotional Updates"
            checked={settings.notifications.promotions}
            onChange={() => handleToggle('notifications', 'promotions')}
          />
          <SettingsToggle
            label="Newsletter"
            checked={settings.notifications.newsletter}
            onChange={() => handleToggle('notifications', 'newsletter')}
          />
        </SettingsCard>

        <SettingsCard title="Privacy" icon={<ShieldIcon />}>
          <SettingsSelect
            label="Profile Visibility"
            value={settings.privacy.profileVisibility}
            options={[
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
              { value: 'friends', label: 'Friends Only' }
            ]}
            onChange={(e) => handleSelect('privacy', 'profileVisibility', e.target.value)}
          />
          <SettingsToggle
            label="Show Reviews"
            checked={settings.privacy.showReviews}
            onChange={() => handleToggle('privacy', 'showReviews')}
          />
        </SettingsCard>

        <SettingsCard title="Preferences" icon={<GlobeIcon />}>
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
          <SettingsSelect
            label="Theme"
            value={settings.preferences.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System Default' }
            ]}
            onChange={(e) => handleSelect('preferences', 'theme', e.target.value)}
          />
        </SettingsCard>
      </SettingsGrid>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </SettingsPage>
  );
};

export default AccountSettingsPage;
