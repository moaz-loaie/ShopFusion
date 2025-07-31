import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../services/api';
import { useAuth } from './AuthContext.jsx'; // To react to login/logout
import logger from '../utils/logger'; // Simple frontend logger

// Create the cart context
const CartContext = createContext(null);

/**
 * Helper function to calculate subtotal and item count from cart items.
 * @param {Array} items - Array of cart items.
 * @returns {object} - { subtotal: number, itemCount: number }
 */
const calculateCartTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => {
    // Ensure product and price exist to avoid NaN issues
    const price = item?.product?.price ?? 0;
    return sum + item.quantity * price;
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    subtotal: parseFloat(subtotal.toFixed(2)), // Ensure two decimal places
    itemCount,
  };
};

/**
 * CartProvider component manages the shopping cart state (items, loading status, errors)
 * and provides functions to interact with the cart (add, update, remove, fetch, clear).
 */
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // Stores the array of items in the cart
  const [cartId, setCartId] = useState(null); // Stores the ID of the cart from the backend
  const [loading, setLoading] = useState(false); // Indicates if a cart operation is in progress
  const [error, setError] = useState(null); // Stores any errors from cart operations
  const { isAuthenticated, loading: authLoading, user } = useAuth(); // Get auth status

  /**
   * Fetches the user's cart from the backend.
   * Clears local cart state if the user is not authenticated.
   */
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      logger.debug('CartContext: User not authenticated, clearing local cart state.');
      setCartItems([]);
      setCartId(null);
      // TODO: Implement guest cart logic using localStorage if required by project specification.
      return;
    }
    setLoading(true);
    setError(null);
    try {
      logger.debug(`CartContext: Fetching cart for user ${user?.id}.`);
      const response = await getCart(); // API call to get the cart
      const cartData = response.data.data.cart;
      if (cartData) {
        setCartItems(cartData.items || []);
        setCartId(cartData.id);
        logger.info(
          `CartContext: Cart fetched successfully. ID: ${cartData.id}, Items: ${
            cartData.items?.length || 0
          }.`,
        );
      } else {
        // If backend returns no cart (e.g., new user), initialize with empty state
        setCartItems([]);
        setCartId(null); // Or expect backend to create and return an empty cart
        logger.info(
          'CartContext: No active cart found on backend, initialized empty cart locally.',
        );
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load your shopping cart.';
      logger.error('CartContext: Failed to fetch cart.', message, err);
      setError(message);
      setCartItems([]); // Reset cart on error to maintain a consistent state
      setCartId(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Depends on authentication status and user ID

  /**
   * Effect hook to fetch the cart when authentication status changes (e.g., after login/logout)
   * or when the component mounts (if already authenticated).
   */
  useEffect(() => {
    if (!authLoading) {
      // Only proceed once authentication status is determined
      logger.debug(
        `CartContext: Auth status resolved (isAuthenticated: ${isAuthenticated}). Triggering fetchCart.`,
      );
      fetchCart();
    } else {
      logger.debug('CartContext: Authentication check in progress, delaying initial cart fetch.');
    }
  }, [isAuthenticated, authLoading, fetchCart]); // Dependencies ensure cart is fetched correctly

  /**
   * Helper to update the local cart state based on API response.
   * @param {object} responseData - The data object from an API response.
   */
  const updateCartStateFromResponse = (responseData) => {
    const cartData = responseData?.data?.cart;
    if (cartData) {
      setCartItems(cartData.items || []);
      setCartId(cartData.id);
    } else {
      // If the API response for an update doesn't return the full cart, refetch for consistency.
      logger.warn(
        'CartContext: Cart operation response did not contain full cart data. Refetching cart.',
      );
      fetchCart();
    }
  };

  /**
   * Adds a product to the shopping cart.
   * @param {number|string} productId - The ID of the product to add.
   * @param {number} quantity - The quantity of the product to add (default: 1).
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        setError('Please log in to add items to your cart.'); // Inform user
        return { success: false, message: 'User not authenticated.' };
      }
      setLoading(true);
      setError(null);
      try {
        logger.debug(
          `CartContext: Adding to cart - Product ID: ${productId}, Quantity: ${quantity}.`,
        );
        const response = await addItemToCart(productId, quantity);
        updateCartStateFromResponse(response.data);
        logger.info(
          `CartContext: Product ${productId} (Qty: ${quantity}) added to cart successfully.`,
        );
        return { success: true, message: 'Item added to cart!' };
      } catch (err) {
        const message =
          err.response?.data?.message || 'Could not add item to cart. Please try again.';
        logger.error('CartContext: Failed to add item to cart.', message, err);
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart],
  ); // fetchCart included if updateCartStateFromResponse uses it

  /**
   * Updates the quantity of an existing item in the cart.
   * If quantity becomes less than 1, it removes the item.
   * @param {number|string} itemId - The ID of the cart item to update.
   * @param {number} quantity - The new quantity for the item.
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const updateCartItemQuantity = useCallback(
    async (itemId, quantity) => {
      if (!isAuthenticated) return { success: false, message: 'User not authenticated.' };
      if (quantity < 1) {
        // If new quantity is 0 or less, remove the item instead
        logger.debug(`CartContext: Quantity for item ${itemId} set to ${quantity}, removing item.`);
        return removeCartItem(itemId);
      }
      setLoading(true);
      setError(null);
      try {
        logger.debug(`CartContext: Updating cart item ${itemId} quantity to ${quantity}.`);
        const response = await updateCartItemQuantity(itemId, quantity);
        updateCartStateFromResponse(response.data);
        logger.info(`CartContext: Cart item ${itemId} quantity updated successfully.`);
        return { success: true, message: 'Cart updated.' };
      } catch (err) {
        const message = err.response?.data?.message || 'Could not update item quantity.';
        logger.error('CartContext: Failed to update cart item quantity.', message, err);
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart],
  ); // fetchCart dependency

  /**
   * Removes an item from the shopping cart.
   * @param {number|string} itemId - The ID of the cart item to remove.
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const removeCartItem = useCallback(
    async (itemId) => {
      if (!isAuthenticated) return { success: false, message: 'User not authenticated.' };
      setLoading(true);
      setError(null);
      try {
        logger.debug(`CartContext: Removing cart item ${itemId}.`);
        const response = await removeCartItem(itemId);
        updateCartStateFromResponse(response.data);
        logger.info(`CartContext: Cart item ${itemId} removed successfully.`);
        return { success: true, message: 'Item removed from cart.' };
      } catch (err) {
        const message = err.response?.data?.message || 'Could not remove item from cart.';
        logger.error('CartContext: Failed to remove cart item.', message, err);
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart],
  ); // fetchCart dependency

  /**
   * Clears all items from the shopping cart.
   * Optimistically clears local state, then calls the backend API.
   * @returns {Promise<object>} - { success: boolean, message?: string }
   */
  const clearCart = useCallback(async () => {
    logger.info('CartContext: Attempting to clear cart.');
    setCartItems([]); // Optimistically clear local state
    // cartId remains for a brief moment until API confirms or on logout.
    setError(null);
    if (!isAuthenticated) {
      logger.debug('CartContext: User not authenticated, cart cleared locally (no backend call).');
      return { success: true }; // No backend cart to clear
    }
    setLoading(true);
    try {
      await clearCart(); // API call to clear cart on the backend
      setCartId(null); // Also clear cartId after successful backend operation
      logger.info('CartContext: Cart cleared successfully on backend and locally.');
      return { success: true, message: 'Cart cleared.' };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not clear cart on server.';
      logger.error('CartContext: Failed to clear cart.', message, err);
      setError(message);
      fetchCart(); // Refetch cart on error to ensure local state consistency with backend
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  // Memoize calculated cart totals (subtotal, item count) to optimize performance
  const cartTotals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  // Memoize the context value to prevent unnecessary re-renders of consuming components
  const contextValue = useMemo(
    () => ({
      cartId,
      cartItems,
      itemCount: cartTotals.itemCount,
      subtotal: cartTotals.subtotal,
      loading, // True if any cart operation is in progress
      error, // Stores error messages from cart operations
      fetchCart,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
      clearCartError: () => setError(null), // Function to manually clear cart errors
    }),
    [
      cartId,
      cartItems,
      cartTotals.itemCount,
      cartTotals.subtotal,
      loading,
      error,
      fetchCart,
      addToCart,
      updateCartItemQuantity,
      removeCartItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

/**
 * Custom hook to easily consume the CartContext.
 * Throws an error if used outside of a CartProvider.
 * @returns {object} The cart context value.
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error(
      'useCart must be used within a CartProvider. Ensure your component is wrapped by CartProvider.',
    );
  }
  return context;
};

export default CartProvider;
