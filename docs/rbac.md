# Role-Based Access Control (RBAC) in ShopFusion

## Overview

ShopFusion implements RBAC to ensure that only users with the appropriate roles can access specific features and routes. The main roles are:

- **Customer**: Can browse, purchase, and review products.
- **Seller**: Can manage their own product listings, view their orders, and access seller analytics.
- **Admin**: Has full access to user management, product moderation, order oversight, dispute resolution, and analytics.

## Backend Enforcement

- The `User` model includes a `role` field (`customer`, `seller`, `admin`).
- The `authMiddleware.js` provides a `restrictTo(...roles)` middleware to protect routes by role.
- Example usage:

  ```js
  router.post("/admin", protect, restrictTo("admin"), adminController.action);
  router.post(
    "/products",
    protect,
    restrictTo("seller", "admin"),
    productController.createProduct
  );
  ```

- Admin and seller features are implemented in their respective controllers and routes, with RBAC enforced.

## Frontend Enforcement

- The React app uses a `ProtectedRoute` component in `App.js` to guard routes by authentication and role.
- Example:

  ```jsx
  <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
  <Route path="/seller/*" element={<ProtectedRoute roles={['seller']}><SellerDashboardPage /></ProtectedRoute>} />
  ```

- The UI conditionally renders dashboard links and features based on the user's role.

## Testing RBAC

- Unit and integration tests verify that unauthorized users cannot access protected endpoints or UI components.
- Example test (frontend):

  ```js
  // See __tests__/pages/AdminDashboardPage.test.js
  expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  ```

## Summary

RBAC is enforced at both the API and UI levels, ensuring secure and appropriate access for all user types in ShopFusion.
