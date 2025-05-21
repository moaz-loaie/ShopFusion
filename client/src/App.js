// File: client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// --- Layout ---
import MainLayout from './components/Layout/MainLayout';
import LoadingSpinner from './components/Common/LoadingSpinner';
import logger from './utils/logger';

// --- Page Imports (Direct Imports as per instruction) ---
import HomePage from './pages/HomePage';
import ProductListPage from './pages/Product/ProductListPage';
import ProductDetailPage from './pages/Product/ProductDetailPage';
import CartPage from './pages/CartCheckout/CartPage';
import CheckoutPage from './pages/CartCheckout/CheckoutPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AccountPage from './pages/User/AccountPage';
import OrderHistoryPage from './pages/Order/OrderHistoryPage';
import OrderDetailPage from './pages/Order/OrderDetailPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// --- Protected Route Component ---
// This component guards routes that require authentication and optionally role-based access.
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth(); // Get auth state

  // Show loading spinner while authentication status is being determined
  if (authLoading) {
    logger.debug("ProtectedRoute: Auth check in progress...");
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // If not authenticated, redirect to login page
  // Preserve the intended location so user can be redirected back after login
  if (!isAuthenticated) {
    logger.info("ProtectedRoute: User not authenticated. Redirecting to login.");
    return <Navigate to="/login" state={{ from: window.location.pathname + window.location.search }} replace />;
  }

  // If roles are specified, check if the authenticated user has one of the required roles
  if (roles && roles.length > 0) {
    if (!user?.role || !roles.includes(user.role)) {
      logger.warn(`ProtectedRoute: User role (${user?.role}) unauthorized. Required: ${roles.join(', ')}. Redirecting to home.`);
      // Redirect to home page or a dedicated 'Unauthorized' page if user's role is not permitted
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  logger.debug(`ProtectedRoute: Access granted for user ${user?.id} with role ${user?.role}.`);
  return children; // Render the protected component
};

// --- Main Application Component ---
function App() {
  logger.info("App component rendering. Application initializing.");
  return (
    <AuthProvider> {/* Provides authentication context to the entire application */}
      <CartProvider> {/* Provides shopping cart context */}
        <Router> {/* Enables client-side routing */}
          <MainLayout> {/* Common layout structure (Navbar, Footer) */}
            <Routes> {/* Defines all application routes */}
              {/* Public Routes - Accessible to all users */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/products/:productId" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/cart" element={<CartPage />} /> {/* Cart can be viewed, actions within may require auth */}

              {/* Protected Routes - Require user to be logged in */}
              <Route
                path="/checkout"
                element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
              />
              <Route
                path="/account"
                element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
              />
              <Route
                path="/orders"
                element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>}
              />
              <Route
                path="/orders/:orderId"
                element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>}
              />

              {/* Admin Routes - Require user to be logged in AND have 'admin' role */}
              <Route
                path="/admin/*" // Using "/*" allows for nested routing within the AdminDashboardPage
                element={
                  <ProtectedRoute roles={['admin']}> {/* Restrict access to users with 'admin' role */}
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              {/* Specific admin sub-routes can be defined within AdminDashboardPage's component
                  or listed here if they are top-level admin pages not nested in a dashboard layout.
                  Example:
                  <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProductListPage /></ProtectedRoute>} />
              */}

              {/* Catch-all Route for 404 Not Found pages */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;