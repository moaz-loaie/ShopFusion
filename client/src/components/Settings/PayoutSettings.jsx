import React, { useState, useEffect } from 'react';
import { 
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsButton,
  SettingsMessage
} from './SettingsComponents';
import { getUserSettings, updateUserSettings } from '../../services/api';
import { CurrencyIcon, BankIcon } from '../Icons';
import LoadingSpinner from '../Common/LoadingSpinner';
import styles from './Settings.module.css';

const PayoutSettings = () => {
  const [settings, setSettings] = useState({
    payouts: {
      method: 'bank',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
      currency: 'USD',
      minimumPayout: 100,
      payoutSchedule: 'monthly'
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
        if (response.data?.data?.settings?.payouts) {
          setSettings(prev => ({
            ...prev,
            payouts: response.data.data.settings.payouts
          }));
        }
      } catch (err) {
        setError('Failed to load payout settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (setting, value) => {
    setSettings(prev => ({
      payouts: {
        ...prev.payouts,
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
      setSuccessMessage('Payout settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payout settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>Payout Settings</h1>
      
      {error && <SettingsMessage type="error">{error}</SettingsMessage>}
      {successMessage && <SettingsMessage type="success">{successMessage}</SettingsMessage>}

      <SettingsCard title="Payout Method" icon={<CurrencyIcon />}>
        <SettingsSelect
          label="Payout Method"
          value={settings.payouts.method}
          options={[
            { value: 'bank', label: 'Bank Transfer' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'stripe', label: 'Stripe' }
          ]}
          onChange={(e) => handleChange('method', e.target.value)}
        />
        <SettingsSelect
          label="Payout Schedule"
          value={settings.payouts.payoutSchedule}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'monthly', label: 'Monthly' }
          ]}
          onChange={(e) => handleChange('payoutSchedule', e.target.value)}
        />
        <SettingsInput
          label="Minimum Payout Amount ($)"
          type="number"
          value={settings.payouts.minimumPayout}
          onChange={(e) => handleChange('minimumPayout', parseFloat(e.target.value))}
          min="0"
          step="0.01"
        />
      </SettingsCard>

      <SettingsCard title="Bank Information" icon={<BankIcon />}>
        <SettingsInput
          label="Bank Name"
          type="text"
          value={settings.payouts.bankName}
          onChange={(e) => handleChange('bankName', e.target.value)}
        />
        <SettingsInput
          label="Account Number"
          type="text"
          value={settings.payouts.accountNumber}
          onChange={(e) => handleChange('accountNumber', e.target.value)}
        />
        <SettingsInput
          label="Routing Number"
          type="text"
          value={settings.payouts.routingNumber}
          onChange={(e) => handleChange('routingNumber', e.target.value)}
        />
        <SettingsInput
          label="Account Holder Name"
          type="text"
          value={settings.payouts.accountHolderName}
          onChange={(e) => handleChange('accountHolderName', e.target.value)}
        />
        <SettingsSelect
          label="Currency"
          value={settings.payouts.currency}
          options={[
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' }
          ]}
          onChange={(e) => handleChange('currency', e.target.value)}
        />
      </SettingsCard>

      <SettingsButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SettingsButton>
    </div>
  );
};

export default PayoutSettings;
