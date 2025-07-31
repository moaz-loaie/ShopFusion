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
import { TaxIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const TaxSettings = () => {
  const [settings, setSettings] = useState({
    tax: {
      businessNumber: '',
      taxId: '',
      vatNumber: '',
      taxRate: 0,
      taxInclusive: false,
      taxExempt: false,
      taxCalculationMethod: 'line_item',
      taxJurisdiction: 'US',
      taxDocuments: []
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
        if (response.data?.data?.settings?.tax) {
          setSettings(prev => ({
            ...prev,
            tax: response.data.data.settings.tax
          }));
        }
      } catch (err) {
        setError('Failed to load tax settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (setting, value) => {
    setSettings(prev => ({
      tax: {
        ...prev.tax,
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
      setSuccessMessage('Tax settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tax settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>Tax Settings</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="Tax Information" icon={<TaxIcon />}>
        <SettingsInput
          label="Business Number"
          type="text"
          value={settings.tax.businessNumber}
          onChange={(e) => handleChange('businessNumber', e.target.value)}
        />
        <SettingsInput
          label="Tax ID"
          type="text"
          value={settings.tax.taxId}
          onChange={(e) => handleChange('taxId', e.target.value)}
        />
        <SettingsInput
          label="VAT Number"
          type="text"
          value={settings.tax.vatNumber}
          onChange={(e) => handleChange('vatNumber', e.target.value)}
        />
      </SettingsCard>

      <SettingsCard title="Tax Configuration" icon={<TaxIcon />}>
        <SettingsInput
          label="Tax Rate (%)"
          type="number"
          value={settings.tax.taxRate}
          onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
          min="0"
          max="100"
          step="0.01"
        />
        <SettingsToggle
          label="Prices Include Tax"
          checked={settings.tax.taxInclusive}
          onChange={() => handleChange('taxInclusive', !settings.tax.taxInclusive)}
        />
        <SettingsToggle
          label="Tax Exempt"
          checked={settings.tax.taxExempt}
          onChange={() => handleChange('taxExempt', !settings.tax.taxExempt)}
        />
        <SettingsSelect
          label="Tax Calculation Method"
          value={settings.tax.taxCalculationMethod}
          options={[
            { value: 'line_item', label: 'Line Item' },
            { value: 'total', label: 'Order Total' },
            { value: 'unit', label: 'Per Unit' }
          ]}
          onChange={(e) => handleChange('taxCalculationMethod', e.target.value)}
        />
        <SettingsSelect
          label="Tax Jurisdiction"
          value={settings.tax.taxJurisdiction}
          options={[
            { value: 'US', label: 'United States' },
            { value: 'EU', label: 'European Union' },
            { value: 'UK', label: 'United Kingdom' },
            { value: 'CA', label: 'Canada' }
          ]}
          onChange={(e) => handleChange('taxJurisdiction', e.target.value)}
        />
      </SettingsCard>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </div>
  );
};

export default TaxSettings;
