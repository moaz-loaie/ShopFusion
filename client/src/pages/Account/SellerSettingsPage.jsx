import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import SecuritySettings from '../../components/Settings/SecuritySettings';
import NotificationsSettings from '../../components/Settings/NotificationsSettings';
import PreferencesSettings from '../../components/Settings/PreferencesSettings';
import StoreSettings from '../../components/Settings/StoreSettings';
import PayoutSettings from '../../components/Settings/PayoutSettings';
import TaxSettings from '../../components/Settings/TaxSettings';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const SellerSettingsPage = () => {
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
        <Route path="store" element={<StoreSettings />} />
        <Route path="payouts" element={<PayoutSettings />} />
        <Route path="tax" element={<TaxSettings />} />
      </Route>
    </Routes>
  );
};

export default SellerSettingsPage;
