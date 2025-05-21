// File: client/jest.config.js
module.exports = {
  // The root of your source code, typically /src
  roots: ['<rootDir>/src'],

  // Jest transformations
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest', // Use babel-jest for JS/JSX files
    // If using TypeScript: '^.+\\.tsx?$': 'ts-jest',
  },

  // Runs special logic after test framework has been installed in the environment
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Test spec file resolution pattern
  // Looks for .js, .jsx files in __tests__ folders or with .test/.spec extensions
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',

  // Module file extensions for importing
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // The test environment that will be used for testing
  testEnvironment: 'jsdom', // Simulates a browser environment for React components

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage/client', // Separate coverage for client

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8', // 'v8' is generally faster than 'babel'

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',            // Exclude main entry point
    '!src/reportWebVitals.js',  // Exclude Create React App specific file
    '!src/setupTests.js',       // Exclude test setup file
    '!src/utils/logger.js',     // Exclude simple logger utility if not complex
    '!src/**/index.js',         // Exclude barrel files if they only re-export
    '!src/App.js',              // App.js is mostly routing, better tested with E2E
    // Exclude __tests__ folders and test files themselves
    '!src/**/__tests__/**/*.{js,jsx}',
    '!src/**/*.{test,spec}.{js,jsx}',
    // Exclude generated storybook files if any
    '!src/**/*.stories.{js,jsx}',
    // Exclude any non-code assets or configuration files within src
    '!src/assets/**/*',
    '!src/styles/**/*',
  ],
  // Coverage thresholds can be set to enforce minimum coverage
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10, // Allow 10 uncovered statements
  //   },
  // },

  // Used to configure a map from regular expressions to module names or paths
  moduleNameMapper: {
    // Handle CSS imports (e.g., \*.css, \*.scss, \*.module.css) by mocking them
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    // Handle static assets (images, fonts, etc.) by pointing to a mock file
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    // Example for absolute imports if configured in jsconfig.json or tsconfig.json
    // '^@components/(.*)$': '<rootDir>/src/components/$1',
    // '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    // '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    // '^@services/(.*)$': '<rootDir>/src/services/$1',
    // '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    // '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],

  // Options for watch mode
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  // Automatically reset mock state before every test call.
  resetMocks: true,
};