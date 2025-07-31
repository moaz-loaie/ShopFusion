import React, { useState, useEffect } from 'react';
import { 
  SettingsPage, 
  SettingsGrid, 
  SettingsCard,
  SettingsToggle,
  SettingsSelect,
  SettingsInput,
  SettingsButton,
  SettingsMessage
} from '../../components/Settings/SettingsComponents';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import { SecurityIcon, BusinessIcon, GlobeIcon } from '../../components/Icons';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    emailVerificationRequired: true,
    automaticModeration: false,
    disputeAutoClose: 30,
    minimumOrderAmount: 10,
    platformFeePercentage: 5,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await getSystemSettings();
        setSettings(response.data.data.settings);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      await updateSystemSettings(settings);
      setSuccessMessage('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (category, setting, value) => {
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
    <SettingsPage title="System Settings">
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsGrid>
        <SettingsCard title="General Settings" icon={<GlobeIcon />}>
          <SettingsToggle
            label="Maintenance Mode"
            checked={settings.maintenanceMode}
            onChange={() => handleChange('general', 'maintenanceMode', !settings.maintenanceMode)}
          />
          <SettingsToggle
            label="Allow New Registrations"
            checked={settings.allowNewRegistrations}
            onChange={() => handleChange('general', 'allowNewRegistrations', !settings.allowNewRegistrations)}
          />
          <SettingsInput
            label="Session Timeout (minutes)"
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => handleChange('general', 'sessionTimeout', parseInt(e.target.value))}
            min="15"
            max="180"
          />
        </SettingsCard>

        <SettingsCard title="Security Settings" icon={<SecurityIcon />}>
          <SettingsInput
            label="Maximum Login Attempts"
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => handleChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            min="1"
            max="10"
          />
          <SettingsToggle
            label="Require Email Verification"
            checked={settings.emailVerificationRequired}
            onChange={() => handleChange('security', 'emailVerificationRequired', !settings.emailVerificationRequired)}
          />
          <SettingsToggle
            label="Automatic Content Moderation"
            checked={settings.automaticModeration}
            onChange={() => handleChange('security', 'automaticModeration', !settings.automaticModeration)}
          />
        </SettingsCard>

        <SettingsCard title="Business Rules" icon={<BusinessIcon />}>
          <SettingsInput
            label="Auto-close Disputes After (days)"
            type="number"
            value={settings.disputeAutoClose}
            onChange={(e) => handleChange('business', 'disputeAutoClose', parseInt(e.target.value))}
            min="1"
            max="90"
          />
          <SettingsInput
            label="Minimum Order Amount ($)"
            type="number"
            value={settings.minimumOrderAmount}
            onChange={(e) => handleChange('business', 'minimumOrderAmount', parseFloat(e.target.value))}
            min="0"
            step="0.01"
          />
          <SettingsInput
            label="Platform Fee Percentage (%)"
            type="number"
            value={settings.platformFeePercentage}
            onChange={(e) => handleChange('business', 'platformFeePercentage', parseFloat(e.target.value))}
            min="0"
            max="100"
            step="0.1"
          />
        </SettingsCard>
      </SettingsGrid>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </SettingsPage>
  );
};

export default AdminSettingsPage;
