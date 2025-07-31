'use strict';

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { getAllSettings, getPublicSettings, updateSettings } = require('../utils/settingsUtils');
const logger = require('../utils/logger');

// Get public system settings (no auth required)
exports.getPublicSettings = catchAsync(async (req, res) => {
  const settings = await getPublicSettings();
  
  res.status(200).json({
    status: 'success',
    data: { settings }
  });
});

// Get all system settings (Admin only)
exports.getSystemSettings = catchAsync(async (req, res, next) => {
  // Role check already handled by middleware
  const settings = await getAllSettings();
  
  res.status(200).json({
    status: 'success',
    data: { settings }
  });
});

// Update system settings (Admin only)
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
  // Role check already handled by middleware
  const userId = req.user.id;
  
  try {
    const updatedSettings = await updateSettings(req.body, userId);
    
    logger.info(`System settings updated by admin ${userId}`);
    
    res.status(200).json({
      status: 'success',
      data: { settings: updatedSettings }
    });
  } catch (error) {
    logger.error(`Failed to update system settings by admin ${userId}:`, error);
    return next(new AppError(error.message || 'Failed to update settings', error.status || 400));
  }
});
