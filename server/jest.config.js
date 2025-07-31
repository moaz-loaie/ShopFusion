module.exports = {
  testEnvironment: "node",
  verbose: true,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8", // or 'babel'  // A list of paths to directories that Jest should use to search for files in
  roots: ["<rootDir>/tests"],
  // Setup files to run before test framework installation
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Test timeout
  testTimeout: 30000, // Increase timeout for integration tests involving DB calls
};
