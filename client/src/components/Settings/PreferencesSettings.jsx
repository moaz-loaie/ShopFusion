import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsSelect,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import { getUserSettings, updateUserSettings } from '../../services/api';
import { GlobeIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const PreferencesSettings = () => {
  const [settings, setSettings] = useState({
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
        if (response.data?.data?.settings?.preferences) {
          setSettings(prev => ({
            ...prev,
            preferences: response.data.data.settings.preferences
          }));
        }
      } catch (err) {
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSelect = (setting, value) => {
    setSettings(prev => ({
      preferences: {
        ...prev.preferences,
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
      setSuccessMessage('Preferences updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>Preferences</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="Display Settings" icon={<GlobeIcon />}>
        <SettingsSelect
          label="Language"
          value={settings.preferences.language}
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' }
          ]}
          onChange={(e) => handleSelect('language', e.target.value)}
        />
        <SettingsSelect
          label="Currency"
          value={settings.preferences.currency}
          options={[
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' }
          ]}
          onChange={(e) => handleSelect('currency', e.target.value)}
        />
        <SettingsSelect
          label="Theme"
          value={settings.preferences.theme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System Default' }
          ]}
          onChange={(e) => handleSelect('theme', e.target.value)}
        />
      </SettingsCard>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </div>
  );
};

export default PreferencesSettings;
