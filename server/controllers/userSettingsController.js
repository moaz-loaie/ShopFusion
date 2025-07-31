'use strict';

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { SystemSetting } = require('../db');
const logger = require('../utils/logger');

// Get settings for the current user
exports.getUserSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const settings = await SystemSetting.findOne({
    where: { id: `user_${userId}_settings` },
  });

  // Default settings based on role
  const defaultSettings = {
    notifications: {
      orderUpdates: true,
      promotions: true,
      newsletter: true
    },
    privacy: {
      profileVisibility: 'public',
      showReviews: true
    },
    preferences: {
      language: 'en',
      currency: 'USD',
      theme: 'light'
    }
  };

  // Add seller-specific settings
  if (userRole === 'seller') {
    defaultSettings.notifications.inventoryAlerts = true;
    defaultSettings.notifications.orderNotifications = true;
    defaultSettings.preferences.defaultShippingMethod = 'standard';
    defaultSettings.preferences.autoConfirmOrders = false;
  }

  // Merge saved settings with defaults
  const userSettings = settings ? { ...defaultSettings, ...settings.value } : defaultSettings;

  res.status(200).json({
    status: 'success',
    data: { settings: userSettings }
  });
});

// Update settings for the current user
exports.updateUserSettings = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const newSettings = req.body;

  // Validate settings based on user role
  validateUserSettings(newSettings, req.user.role);

  await SystemSetting.upsert({
    id: `user_${userId}_settings`,
    value: newSettings,
    category: 'user_settings',
    updated_by: userId
  });

  logger.info(`User settings updated for user ${userId}`);

  res.status(200).json({
    status: 'success',
    data: { settings: newSettings }
  });
});

// Helper function to validate settings based on role
function validateUserSettings(settings, role) {
  const allowedKeys = {
    notifications: ['orderUpdates', 'promotions', 'newsletter'],
    privacy: ['profileVisibility', 'showReviews'],
    preferences: ['language', 'currency', 'theme']
  };

  if (role === 'seller') {
    allowedKeys.notifications.push('inventoryAlerts', 'orderNotifications');
    allowedKeys.preferences.push('defaultShippingMethod', 'autoConfirmOrders');
  }

  // Validate that only allowed settings are being updated
  Object.keys(settings).forEach(category => {
    if (!allowedKeys[category]) {
      throw new AppError(`Invalid settings category: ${category}`, 400);
    }

    Object.keys(settings[category]).forEach(key => {
      if (!allowedKeys[category].includes(key)) {
        throw new AppError(`Invalid setting: ${category}.${key}`, 400);
      }
    });
  });
}
