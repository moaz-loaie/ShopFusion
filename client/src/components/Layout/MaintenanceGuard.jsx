import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MaintenancePage from './MaintenancePage';

const MaintenanceGuard = ({ inMaintenance, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (inMaintenance && (!user || user.role !== 'admin')) {
    return <MaintenancePage showAdminLogin={!isAuthenticated} />;
  }

  return children;
};

export default MaintenanceGuard;
