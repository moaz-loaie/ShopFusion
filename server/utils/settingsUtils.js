'use strict';

const { SystemSetting } = require('../db');
const AppError = require('./AppError');
const logger = require('./logger');
const { defaultSettings } = require('./systemDefaults');

const PUBLIC_SETTINGS = [
  'maintenanceMode',
  'allowNewRegistrations',
  'platformFeePercentage',
  'minimumOrderAmount'
];

// Cache configuration
const CACHE_CONFIG = {
  general: 5 * 60 * 1000, // 5 minutes
  security: 15 * 60 * 1000, // 15 minutes
  business: 30 * 60 * 1000 // 30 minutes
};

// Cache structure with versioning
const cache = {
  version: 1,
  data: {},
  lastUpdate: {},
};

// Helper to determine if a setting should be visible to public
const isPublicSetting = (key) => PUBLIC_SETTINGS.includes(key);

// Helper to check if cache is valid for a category
const isCacheValid = (category) => {
  const ttl = CACHE_CONFIG[category] || CACHE_CONFIG.general;
  return cache.data[category] && 
         cache.lastUpdate[category] && 
         (Date.now() - cache.lastUpdate[category] < ttl);
};

/**
 * Get public settings only (no authentication required)
 */
async function getPublicSettings() {
  const allSettings = await getAllSettings();
  const publicSettings = {};
  
  // Only include whitelisted settings
  Object.entries(allSettings).forEach(([category, settings]) => {
    publicSettings[category] = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (isPublicSetting(key)) {
        publicSettings[category][key] = value;
      }
    });
    // Remove empty categories
    if (Object.keys(publicSettings[category]).length === 0) {
      delete publicSettings[category];
    }
  });
  
  return publicSettings;
}

const validateSettingValue = (key, value) => {
  switch (key) {
    case 'maintenanceMode':
    case 'allowNewRegistrations':
    case 'emailVerificationRequired':
    case 'automaticModeration':
      if (typeof value !== 'boolean') {
        throw new AppError(`${key} must be a boolean`, 400);
      }
      break;
    case 'maxLoginAttempts':
    case 'sessionTimeout':
    case 'disputeAutoClose':
    case 'lowStockThreshold':
      if (!Number.isInteger(value) || value < 1) {
        throw new AppError(`${key} must be a positive integer`, 400);
      }
      break;
    case 'minimumOrderAmount':
    case 'platformFeePercentage':
      if (typeof value !== 'number' || value < 0) {
        throw new AppError(`${key} must be a positive number`, 400);
      }
      break;
  }
};

/**
 * Get all system settings, with defaults for missing values
 */
async function getAllSettings() {
  try {
    // Check cache validity for all categories
    const allCategoriesValid = Object.keys(defaultSettings).every(category => 
      isCacheValid(category)
    );

    if (allCategoriesValid) {
      return cache.data;
    }

    const settings = await SystemSetting.findAll();
    const result = JSON.parse(JSON.stringify(defaultSettings));

    // Merge database settings with defaults
    settings.forEach(setting => {
      const { category, id, value, metadata } = setting;
      if (!result[category]) {
        result[category] = {};
      }
      result[category][id] = value;
      
      // Store metadata if present
      if (metadata) {
        if (!cache.data._metadata) {
          cache.data._metadata = {};
        }
        cache.data._metadata[`${category}.${id}`] = metadata;
      }
    });

    // Update cache
    cache.data = result;
    Object.keys(result).forEach(category => {
      cache.lastUpdate[category] = Date.now();
    });
    
    return result;
  } catch (error) {
    logger.error('Error fetching settings:', error);
    return defaultSettings; // Fallback to defaults on error
  }
}

/**
 * Update system settings
 */
async function updateSettings(newSettings, userId) {
  const transaction = await SystemSetting.sequelize.transaction();

  try {
    for (const category in newSettings) {
      for (const key in newSettings[category]) {
        const value = newSettings[category][key];
        
        // Validate setting value
        validateSettingValue(key, value);

        // Create metadata
        const metadata = {
          lastUpdated: new Date().toISOString(),
          updatedBy: userId,
          version: (cache.data._metadata?.[`${category}.${key}`]?.version || 0) + 1
        };

        await SystemSetting.upsert({
          key: `${category}.${key}`,
          value,
          metadata,
          category,
          updated_by: userId
        }, { transaction });
      }
    }

    await transaction.commit();
    
    // Increment cache version to force refresh
    cache.version++;
    cache.data = {};
    cache.lastUpdate = {};

    logger.info(`Settings updated successfully by user ${userId}`);
    return await getAllSettings();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Manually clear the settings cache
 */
function clearCache() {
  cache.data = {};
  cache.lastUpdate = {};
}

module.exports = {
  getAllSettings,
  updateSettings,
  clearCache,
  getPublicSettings
};
