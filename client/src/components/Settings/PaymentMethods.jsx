import React, { useState, useEffect } from 'react';
import { SettingsCard, SettingsButton } from './SettingsComponents';
import api from '../../services/api';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/user/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    try {
      // Get stripe setup intent from your backend
      const {
        data: { clientSecret },
      } = await api.post('/payments/setup-intent');

      // Here you would typically open Stripe Elements or redirect to Stripe
      // For this example, we'll simulate success

    } catch (error) {
      console.error('Error setting up payment:', error);
    }
  };

  const handleDelete = async (paymentMethodId) => {
    try {
      await api.delete(`/user/payment-methods/${paymentMethodId}`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      await api.patch(`/user/payment-methods/${paymentMethodId}/default`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  if (loading) {
    return <div>Loading payment methods...</div>;
  }

  return (
    <SettingsCard title="Payment Methods">
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="p-4 border rounded flex items-center justify-between">
            <div className="flex items-center gap-4">
              {method.type === 'card' && (
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                  {method.brand}
                </div>
              )}
              <div>
                <p className="font-medium">
                  {method.type === 'card' ? `•••• •••• •••• ${method.last4}` : method.type}
                </p>
                <p className="text-sm text-gray-500">
                  Expires {method.expiryMonth}/{method.expiryYear}
                </p>
                {method.isDefault && <span className="text-sm text-green-600">Default Method</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {!method.isDefault && (
                <SettingsButton onClick={() => handleSetDefault(method.id)} variant="secondary">
                  Set as Default
                </SettingsButton>
              )}
              <SettingsButton onClick={() => handleDelete(method.id)} variant="danger">
                Remove
              </SettingsButton>
            </div>
          </div>
        ))}

        <SettingsButton onClick={handleAddCard}>Add New Payment Method</SettingsButton>
      </div>
    </SettingsCard>
  );
};

export default PaymentMethods;
