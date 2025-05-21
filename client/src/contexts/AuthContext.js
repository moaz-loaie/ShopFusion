// File: client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api'; // Your centralized API service
import logger from '../utils/logger'; // Simple frontend logger

// Create the authentication context
const AuthContext = createContext(null);

/**
 * AuthProvider component manages authentication state (user, token, loading status)
 * and provides auth functions (login, logout, register) to its children.
 */
export const AuthProvider = ({ children }) => {
  // State for the authenticated user object
  const [user, setUser] = useState(null);
  // State for the JWT authentication token
  const [token, setToken] = useState(() => localStorage.getItem('authToken')); // Initialize token from localStorage
  // State to indicate if initial authentication check is in progress
  const [loading, setLoading] = useState(true);
  // State to store any authentication-related errors
  const [authError, setAuthError] = useState(null);

  /**
   * Clears authentication data from state and localStorage.
   * Resets the Authorization header in the API service instance.
   */
  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    // Remove Authorization header from future API requests
    if (api.defaults.headers.common['Authorization']) {
        delete api.defaults.headers.common['Authorization'];
    }
    logger.info('Authentication data cleared (user, token, localStorage, API header).');
  }, []);

  /**
   * Effect hook to verify authentication status on initial app load or when the token changes.
   * If a token exists in localStorage, it attempts to fetch the user's profile to validate the token.
   */
  useEffect(() => {
    const verifyAuthStatus = async () => {
      const currentToken = localStorage.getItem('authToken'); // Re-check localStorage for robustness
      if (currentToken) {
        logger.debug('AuthContext: Verifying token from localStorage.');
        setLoading(true);
        setAuthError(null);
        // Set Authorization header for the verification API call
        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        try {
          // Attempt to fetch the current user's profile to validate the token
          const response = await api.getCurrentUserProfile(); // Or a dedicated /auth/verify endpoint
          setUser(response.data.data.user); // Set user data on successful verification
          setToken(currentToken); // Confirm token in state
          logger.info(`AuthContext: User ${response.data.data.user.email} authenticated successfully via stored token.`);
        } catch (error) {
          logger.warn('AuthContext: Token verification failed (likely expired or invalid). Clearing auth data.', error.message);
          clearAuthData(); // Clear invalid token and user data
          // Optionally set an authError message to inform the user
          // setAuthError('Your session may have expired. Please log in again.');
        } finally {
          setLoading(false); // End loading state
        }
      } else {
        // No token found, ensure user state is cleared and finish loading
        logger.debug('AuthContext: No token found in localStorage. User is not authenticated.');
        clearAuthData(); // Ensure clean state if no token
        setLoading(false);
      }
    };
    verifyAuthStatus();
  }, [token, clearAuthData]); // Rerun if token state variable changes (e.g., after login/logout) or clearAuthData changes.

  /**
   * Logs in a user with the provided credentials.
   * On success, stores the token, sets the user state, and updates API headers.
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const login = useCallback(async (credentials) => {
    setLoading(true); // Indicate login process started
    setAuthError(null); // Clear previous errors
    try {
      const response = await api.loginUser(credentials); // Call login API endpoint
      const { token: newToken, data } = response.data;
      localStorage.setItem('authToken', newToken); // Store token in localStorage
      setUser(data.user); // Set authenticated user state
      setToken(newToken); // Update token state, triggering useEffect to confirm auth status
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Set token for subsequent API calls
      logger.info(`AuthContext: User ${data.user.email} logged in successfully.`);
      setLoading(false);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      logger.error('AuthContext: Login failed.', message, error);
      setAuthError(message); // Set error message for UI display
      clearAuthData(); // Ensure any partial auth state is cleared on login failure
      setLoading(false);
      return { success: false, message };
    }
  }, [clearAuthData]);

  /**
   * Registers a new user with the provided data.
   * On success, logs in the new user by storing token and setting user state.
   * @param {object} userData - { full_name, email, password, role? }
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const register = useCallback(async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.registerUser(userData); // Call register API endpoint
      const { token: newToken, data } = response.data;
      localStorage.setItem('authToken', newToken);
      setUser(data.user);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      logger.info(`AuthContext: User ${data.user.email} registered and logged in successfully.`);
      setLoading(false);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      logger.error('AuthContext: Registration failed.', message, error);
      setAuthError(message);
      clearAuthData();
      setLoading(false);
      return { success: false, message };
    }
  }, [clearAuthData]);

  /**
   * Logs out the current user.
   * Clears authentication data and optionally calls a backend logout endpoint.
   */
  const logout = useCallback(async () => {
    logger.info(`AuthContext: User ${user?.email || 'Unknown'} logging out.`);
    // Optional: Call a backend /logout endpoint if it performs server-side session invalidation
    // try {
    //   await api.logoutUser();
    //   logger.debug('AuthContext: Backend logout successful.');
    // } catch (error) {
    //   logger.warn('AuthContext: Backend logout call failed or not implemented.', error.message);
    // }
    clearAuthData(); // Clear local authentication data
    // Navigation to login page or home page is typically handled by the component calling logout
  }, [user, clearAuthData]);

  // Memoized context value to prevent unnecessary re-renders of consumers
  const contextValue = React.useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token, // True if both user and token exist
    loading, // True during initial auth check or active login/register process
    authError,
    login,
    logout,
    register,
    clearAuthError: () => setAuthError(null) // Function to manually clear auth errors
  }), [user, token, loading, authError, login, logout, register]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily consume the AuthContext.
 * Throws an error if used outside of an AuthProvider.
 * @returns {object} The authentication context value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider. Ensure your component is wrapped by AuthProvider.');
  }
  return context;
};