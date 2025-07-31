// This file configures Sequelize using environment variables primarily.
// Ensure corresponding variables are set in your .env file or deployment environment.
require("dotenv").config(); // Make sure .env is loaded

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "shopfusion_dev",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    // Optional: Add logging configuration for development SQL queries

    logging: false, // Disable default logging usually
  },  test: {
    username: process.env.DB_USER || "root", // Use default root user
    password: process.env.DB_PASSWORD || "", // Empty password
    database: process.env.DB_NAME || "shopfusion_test", // Use specific test database
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false, // Disable logging for tests
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    // Use DATABASE_URL for platforms like Heroku, Render
    use_env_variable: "DATABASE_URL",
    dialect: "mysql",
    logging: false, // Disable logging in production unless needed for debugging
    dialectOptions: {
      // SSL options for MySQL (if needed)
    },
    // Optional: Production pool settings
    pool: {
      max: 10, // Max number of connection in pool
      min: 0, // Min number of connection in pool
      acquire: 30000, // Max time (ms) that pool will try to get connection before throwing error
      idle: 10000, // Max time (ms) that a connection can be idle before being released
    },
  },
};
