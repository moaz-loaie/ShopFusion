import React, { useState, useEffect } from 'react';
import { SettingsCard, SettingsButton } from './SettingsComponents';
import api from '../../services/api';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/user/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await api.post(`/user/subscriptions/${selectedSubscription.id}/cancel`);
      setShowCancelDialog(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Active Subscriptions">
        <div className="space-y-4">
          {subscriptions
            .filter((sub) => sub.status === 'active')
            .map((subscription) => (
              <div key={subscription.id} className="p-4 border rounded space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{subscription.plan.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${subscription.plan.price}/{subscription.plan.interval}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeColor(
                      subscription.status,
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>

                <div className="text-sm">
                  <p>
                    Next billing date:{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-red-600">Cancels at end of billing period</p>
                  )}
                </div>

                {!subscription.cancelAtPeriodEnd && (
                  <div className="flex justify-end">
                    <SettingsButton
                      variant="danger"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setShowCancelDialog(true);
                      }}
                    >
                      Cancel Subscription
                    </SettingsButton>
                  </div>
                )}
              </div>
            ))}

          {subscriptions.filter((sub) => sub.status === 'active').length === 0 && (
            <p className="text-gray-500">No active subscriptions</p>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title="Past Subscriptions">
        <div className="space-y-4">
          {subscriptions
            .filter((sub) => sub.status !== 'active')
            .map((subscription) => (
              <div key={subscription.id} className="p-4 border rounded space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{subscription.plan.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${subscription.plan.price}/{subscription.plan.interval}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeColor(
                      subscription.status,
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>

                <div className="text-sm">
                  <p>Ended: {new Date(subscription.endedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}

          {subscriptions.filter((sub) => sub.status !== 'active').length === 0 && (
            <p className="text-gray-500">No past subscriptions</p>
          )}
        </div>
      </SettingsCard>

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-medium mb-4">Cancel Subscription</h3>
            <p className="mb-4">
              Are you sure you want to cancel your {selectedSubscription?.plan.name} subscription?
              You'll continue to have access until the end of your current billing period.
            </p>
            <div className="flex justify-end gap-3">
              <SettingsButton
                variant="secondary"
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedSubscription(null);
                }}
              >
                Keep Subscription
              </SettingsButton>
              <SettingsButton variant="danger" onClick={handleCancelSubscription}>
                Yes, Cancel
              </SettingsButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;