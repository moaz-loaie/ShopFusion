// File: server/db/index.js
"use strict";
// This file initializes Sequelize, loads models, and sets up associations.
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const logger = require("../utils/logger"); // Use logger

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
// Load the correct config based on environment
const configPath = path.join(__dirname, "..", "config", "config.js");
let config;
try {
  const configJson = require(configPath);
  config = configJson[env];
  if (!config) {
    throw new Error(
      `Configuration for environment "${env}" not found in config.js`
    );
  }
} catch (error) {
  logger.error(`Error loading database configuration for env "${env}":`, error);
  process.exit(1);
}

const db = {};

let sequelize;
// Prefer DATABASE_URL if provided (common in production environments)
if (config.use_env_variable && process.env[config.use_env_variable]) {
  logger.info(
    `Connecting to database using environment variable: ${config.use_env_variable}`
  );
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else if (config.database && config.username) {
  logger.info(
    `Connecting to database: ${config.database} on host: ${config.host}`
  );
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
} else {
  logger.error(
    "Database configuration is incomplete. Provide DATABASE_URL or DB_NAME/DB_USER."
  );
  process.exit(1);
}

// Load all model files dynamically from the models directory
const modelsDir = path.join(__dirname, "..", "models");
try {
  fs.readdirSync(modelsDir)
    .filter((file) => {
      // Include .js files, exclude this index file, hidden files, test files, and non-model files like index.js
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file !== "index.js" && // Exclude Sequelize's generated index.js if present
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      // logger.debug(`Loading model: ${file}`); // Log model loading
      // Use `require(path.join(modelsDir, file))` to load the model definition function
      // Pass sequelize instance and DataTypes to the model definition function
      const model = require(path.join(modelsDir, file))(
        sequelize,
        Sequelize.DataTypes
      );
      db[model.name] = model; // Store model in db object using its class name
    });
} catch (error) {
  logger.error("Error loading models:", error);
  process.exit(1);
}

// Set up associations between models
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    // logger.debug(`Associating model: ${modelName}`); // Log association setup
    db[modelName].associate(db); // Call the associate method, passing the db object
  }
});

// Export the sequelize instance and Sequelize library itself
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; // Export the db object containing models and sequelize instance
