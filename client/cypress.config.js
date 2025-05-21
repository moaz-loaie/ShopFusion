// File: client/cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Set the base URL for your frontend application during testing
    baseUrl: 'http://localhost:3000', // Your React app's dev server URL
    // Optional: Set default viewport size
    viewportWidth: 1280,
    viewportHeight: 720,
    // Optional: Disable video recording for faster runs
    video: false,
  },
});
