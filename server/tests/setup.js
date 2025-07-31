// File: tests/setup.js
require('dotenv').config({ path: '.env.test' });
const path = require('path');
const db = require('../db');
const logger = require('../utils/logger');

// Export models for tests to use
const models = {
  ...db.models // Get initial models
};

// Initialize models object after database connection
const initModels = async () => {
  // Re-fetch all models after sync
  await db.sequelize.sync();
  Object.assign(models, db.models);
};



global.console.error = (...args) => logger.error(...args);
global.console.warn = (...args) => logger.warn(...args);

// Increase test timeout for DB operations
jest.setTimeout(30000);

beforeAll(async () => {
  try {
    const { Sequelize } = require('sequelize');
    const config = require('../config/config.js').test;
    
    // Create database if it doesn't exist
    const tempSequelize = new Sequelize({
      ...config,
      database: null,
      logging: false
    });
    
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${config.database};`);
    await tempSequelize.close();
    
    // Connect to test database
    await db.sequelize.authenticate();
    logger.info('Test database connection established.');
    
    // Sync database (create tables)
    await db.sequelize.sync({ force: true });
    logger.info('Test database synced.');
    
    // Initialize models
    await initModels();
  } catch (error) {
    logger.error('Unable to connect to the test database:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    // Close database connection
    await db.sequelize.close();
    logger.info('Test database connection closed.');
  } catch (error) {
    logger.error('Error closing test database connection:', error);
    process.exit(1);
  }
});

// Export required utilities for tests
module.exports = {
  db,
  models
};
