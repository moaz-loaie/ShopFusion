import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary/ErrorBoundary';
import MaintenanceGuard from './components/Layout/MaintenanceGuard';
import MainLayout from './components/Layout/MainLayout';
import { 
  NotFoundPage, 
  ServerErrorPage, 
  ForbiddenPage, 
  UnauthorizedPage,
  NetworkErrorPage 
} from './components/Common/ErrorPages';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Settings Components
import SettingsLayout from './components/Settings/SettingsLayout';
import ProfileSettings from './components/Settings/ProfileSettings';
import SecuritySettings from './components/Settings/SecuritySettings';
import NotificationsSettings from './components/Settings/NotificationsSettings';
import PreferencesSettings from './components/Settings/PreferencesSettings';
import StoreSettings from './components/Settings/StoreSettings';
import PayoutSettings from './components/Settings/PayoutSettings';
import TaxSettings from './components/Settings/TaxSettings';
import SystemSettings from './components/Settings/SystemSettings';
import RoleManagement from './components/Settings/RoleManagement';
import IntegrationsSettings from './components/Settings/IntegrationsSettings';
import ShippingAddresses from './components/Settings/ShippingAddresses';
import PaymentMethods from './components/Settings/PaymentMethods';
import Subscriptions from './components/Settings/Subscriptions';

// Page Imports
import HomePage from './pages/Home/HomePage';
import ProductListPage from './pages/Product/ProductListPage';
import ProductDetailPage from './pages/Product/ProductDetailPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AccountPage from './pages/Account/AccountPage';
import OrderHistoryPage from './pages/Order/OrderHistoryPage';
import OrderDetailPage from './pages/Order/OrderDetailPage';

// Admin Pages
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import AdminProductsPage from './pages/Admin/AdminProductsPage';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import AdminDisputesPage from './pages/Admin/AdminDisputesPage';
import AdminAnalyticsPage from './pages/Admin/AdminAnalyticsPage';
import AdminSellersPage from './pages/Admin/AdminSellersPage';

// Seller Pages
import SellerDashboardPage from './pages/Seller/SellerDashboardPage';
import SellerProductsPage from './pages/Seller/SellerProductsPage';
import SellerOrdersPage from './pages/Seller/SellerOrdersPage';
import SellerAnalyticsPage from './pages/Seller/SellerAnalyticsPage';

import { getSystemSettings } from './services/api';
import logger from './utils/logger';
import { initializeTheme } from './utils/themeUtils';

// --- Main Application Component ---
function App() {
  const [inMaintenance, setInMaintenance] = useState(false);

  useEffect(() => {
    // Initialize theme system
    initializeTheme();

    const checkMaintenanceStatus = async () => {
      try {
        const response = await getSystemSettings();
        const settings = response.data.data.settings;
        // Check if maintenanceMode exists in the returned settings
        if (settings?.general?.maintenanceMode !== undefined) {
          setInMaintenance(settings.general.maintenanceMode);
        }
      } catch (err) {
        // Silently handle errors for non-admin users
        logger.debug('Unable to fetch maintenance status:', err);
        logger.error('Failed to check maintenance status:', err);
        // Default to not in maintenance if we can't check
        setInMaintenance(false);
      }
    };
    checkMaintenanceStatus();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <MaintenanceGuard inMaintenance={inMaintenance}>
            <AppRoutes />
          </MaintenanceGuard>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to="/login" state={{ from: currentPath }} replace />;
  }

  if (roles && roles.length > 0) {
    if (user?.role === 'admin') {
      if (window.location.pathname.startsWith('/seller') && !roles.includes('seller')) {
        logger.warn('Admin accessing seller route for moderation');
      }
      return children;
    }

    if (!user?.role || !roles.includes(user.role)) {
      logger.warn(`Access denied: User role ${user?.role} not in allowed roles: ${roles.join(', ')}`);
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Settings Routes Component
const SettingsRoutes = ({ role }) => {
  const routes = [
    { path: "profile", element: <ProfileSettings /> },
    { path: "security", element: <SecuritySettings /> },
    { path: "notifications", element: <NotificationsSettings /> },
    { path: "preferences", element: <PreferencesSettings /> }
  ];

  if (role === 'seller') {
    routes.push(
      { path: "store", element: <StoreSettings /> },
      { path: "payouts", element: <PayoutSettings /> },
      { path: "tax", element: <TaxSettings /> }
    );
  } else if (role === 'admin') {
    routes.push(
      { path: "system", element: <SystemSettings /> },
      { path: "roles", element: <RoleManagement /> },
      { path: "integrations", element: <IntegrationsSettings /> }
    );
  } else {
    routes.push(
      { path: "addresses", element: <ShippingAddresses /> },
      { path: "payment", element: <PaymentMethods /> },
      { path: "subscriptions", element: <Subscriptions /> }
    );
  }

  return (
    <Route element={<SettingsLayout />}>
      <Route index element={<Navigate to="profile" replace />} />
      {routes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  );
};

// Main Routes Component
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Protected Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Settings Routes */}
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <Routes>
                {SettingsRoutes({ role: user?.role })}
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Seller Routes */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/analytics"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDisputesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sellers"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminSellersPage />
            </ProtectedRoute>
          }
        />

        {/* Error Pages */}
        <Route path="/error/500" element={<ServerErrorPage />} />
        <Route path="/error/403" element={<ForbiddenPage />} />
        <Route path="/error/401" element={<UnauthorizedPage />} />
        <Route path="/error/network" element={<NetworkErrorPage />} />
        
        {/* Catch-all Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

export default App;
