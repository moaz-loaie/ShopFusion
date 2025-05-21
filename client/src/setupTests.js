// File: client/src/setupTests.js
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// --- Global Mocks & Configuration ---

// 1. Mock localStorage and sessionStorage
// These are not available in Jest's JSDOM environment by default.
const createStorageMock = () => {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; },
    key(index) { return Object.keys(store)[index] || null; },
    get length() { return Object.keys(store).length; }
  };
};

Object.defineProperty(window, 'localStorage', { value: createStorageMock(), writable: true });
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock(), writable: true });

// 2. Mock window.matchMedia
// Often used by UI libraries for responsive design features.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Default to non-matching for tests unless overridden
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated but included for compatibility
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 3. Mock window.scrollTo
// Called by routers or UI components on navigation or layout changes.
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// 4. Mock IntersectionObserver (if used for lazy loading images, infinite scroll, etc.)
// A basic mock that immediately calls the callback for all entries.
const mockIntersectionObserver = jest.fn(callback => ({
    observe: jest.fn(() => {
        // Simulate element becoming visible immediately for tests
        // This might need adjustment based on how IntersectionObserver is used
        const entries = [{ isIntersecting: true, target: document.createElement('div') }];
        callback(entries, this); // 'this' refers to the observer instance
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => []), // Return empty array for takeRecords
    root: null,
    rootMargin: '',
    thresholds: [],
}));
Object.defineProperty(window, 'IntersectionObserver', { value: mockIntersectionObserver, writable: true });


// --- Test Lifecycle Hooks ---

// Optional: Reset mocks and clear storage before each test for better isolation
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  jest.clearAllMocks(); // Clears mock.calls, mock.instances, mock.contexts and mock.results
  // If using msw (Mock Service Worker) for API mocking, reset handlers:
  // server.resetHandlers(); // Assuming 'server' is your msw server instance
});

// Optional: Clean up after tests (React Testing Library does this automatically for DOM)
// import { cleanup } from '@testing-library/react';
// afterEach(cleanup);

// Optional: Silence console.error or console.warn for specific expected errors during tests
// This can be useful to keep test output clean if some warnings/errors are intentional or third-party.
// Store original console methods
// const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;

// beforeEach(() => {
//   console.error = (...args) => {
//     // Example: Filter out specific React act warnings if unavoidable
//     if (typeof args[0] === 'string' && args[0].includes('Warning: An update to %s inside a test was not wrapped in act(...)')) {
//       return;
//     }
//     originalConsoleError(...args);
//   };
//   console.warn = (...args) => {
//      // Filter specific warnings
//     originalConsoleWarn(...args);
//   }
// });

// afterEach(() => {
//   // Restore original console methods after all tests in a file
//   console.error = originalConsoleError;
//   console.warn = originalConsoleWarn;
// });

// You can also import specific jest-dom matchers if not globally imported via tsconfig or jsconfig
// import '@testing-library/jest-dom/extend-expect';