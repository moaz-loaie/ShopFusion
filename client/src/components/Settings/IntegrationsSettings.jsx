import React, { useState, useEffect } from 'react';
import { SettingsCard, SettingsToggle, SettingsButton } from './SettingsComponents';
import api from '../../services/api';

const IntegrationsSettings = () => {
  const [integrations, setIntegrations] = useState({
    stripe: { enabled: false, connected: false },
    paypal: { enabled: false, connected: false },
    googleAnalytics: { enabled: false, connected: false },
    mailchimp: { enabled: false, connected: false },
  });

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await api.get('/admin/integrations');
        setIntegrations(response.data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      }
    };
    fetchIntegrations();
  }, []);

  const handleIntegrationToggle = async (integration) => {
    try {
      const response = await api.patch('/admin/integrations', {
        integration,
        enabled: !integrations[integration].enabled,
      });
      setIntegrations((prev) => ({
        ...prev,
        [integration]: response.data,
      }));
    } catch (error) {
      console.error('Error updating integration:', error);
    }
  };

  const handleConnect = async (integration) => {
    try {
      const response = await api.post(`/admin/integrations/${integration}/connect`);
      window.location.href = response.data.redirectUrl;
    } catch (error) {
      console.error('Error connecting integration:', error);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Payment Integrations">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Stripe</h3>
              <p className="text-sm text-gray-500">Accept credit card payments</p>
            </div>
            <div className="flex items-center gap-4">
              {!integrations.stripe.connected && (
                <SettingsButton onClick={() => handleConnect('stripe')}>Connect</SettingsButton>
              )}
              <SettingsToggle
                checked={integrations.stripe.enabled}
                onChange={() => handleIntegrationToggle('stripe')}
                disabled={!integrations.stripe.connected}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">PayPal</h3>
              <p className="text-sm text-gray-500">Accept PayPal payments</p>
            </div>
            <div className="flex items-center gap-4">
              {!integrations.paypal.connected && (
                <SettingsButton onClick={() => handleConnect('paypal')}>Connect</SettingsButton>
              )}
              <SettingsToggle
                checked={integrations.paypal.enabled}
                onChange={() => handleIntegrationToggle('paypal')}
                disabled={!integrations.paypal.connected}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Analytics & Marketing">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Google Analytics</h3>
              <p className="text-sm text-gray-500">Track website analytics</p>
            </div>
            <div className="flex items-center gap-4">
              {!integrations.googleAnalytics.connected && (
                <SettingsButton onClick={() => handleConnect('googleAnalytics')}>
                  Connect
                </SettingsButton>
              )}
              <SettingsToggle
                checked={integrations.googleAnalytics.enabled}
                onChange={() => handleIntegrationToggle('googleAnalytics')}
                disabled={!integrations.googleAnalytics.connected}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Mailchimp</h3>
              <p className="text-sm text-gray-500">Email marketing automation</p>
            </div>
            <div className="flex items-center gap-4">
              {!integrations.mailchimp.connected && (
                <SettingsButton onClick={() => handleConnect('mailchimp')}>Connect</SettingsButton>
              )}
              <SettingsToggle
                checked={integrations.mailchimp.enabled}
                onChange={() => handleIntegrationToggle('mailchimp')}
                disabled={!integrations.mailchimp.connected}
              />
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default IntegrationsSettings;