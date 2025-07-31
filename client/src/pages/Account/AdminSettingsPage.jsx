import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SettingsLayout from '../../components/Settings/SettingsLayout';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import SecuritySettings from '../../components/Settings/SecuritySettings';
import NotificationsSettings from '../../components/Settings/NotificationsSettings';
import PreferencesSettings from '../../components/Settings/PreferencesSettings';
import SystemSettings from '../../components/Settings/SystemSettings';
import RoleManagement from '../../components/Settings/RoleManagement';
import IntegrationsSettings from '../../components/Settings/IntegrationsSettings';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdminSettingsPage = () => {
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
        <Route path="system" element={<SystemSettings />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="integrations" element={<IntegrationsSettings />} />
      </Route>
    </Routes>
  );
};

export default AdminSettingsPage;
