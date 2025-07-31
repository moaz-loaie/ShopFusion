import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import SecuritySettings from '../../components/Settings/SecuritySettings';
import NotificationsSettings from '../../components/Settings/NotificationsSettings';
import PreferencesSettings from '../../components/Settings/PreferencesSettings';
import ShippingAddresses from '../../components/Settings/ShippingAddresses';
import PaymentMethods from '../../components/Settings/PaymentMethods';
import Subscriptions from '../../components/Settings/Subscriptions';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const CustomerSettingsPage = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="notifications" element={<NotificationsSettings />} />
        <Route path="preferences" element={<PreferencesSettings />} />
        <Route path="addresses" element={<ShippingAddresses />} />
        <Route path="payment" element={<PaymentMethods />} />
        <Route path="subscriptions" element={<Subscriptions />} />
      </Route>
    </Routes>
  );
};

export default CustomerSettingsPage;
