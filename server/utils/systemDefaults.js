/**
 * Default system settings configuration
 */
exports.defaultSettings = {
  general: {
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60, // minutes
  },
  security: {
    emailVerificationRequired: true,
    automaticModeration: false,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
  },
  business: {
    disputeAutoClose: 30, // days
    minimumOrderAmount: 10,
    platformFeePercentage: 5,
    lowStockThreshold: 5,
  }
};
