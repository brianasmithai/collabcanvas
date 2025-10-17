// Vitest setup file for testing configuration
// Configures testing environment and global test utilities

import '@testing-library/jest-dom';

// Mock Firebase for testing (prevents actual Firebase calls during tests)
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  connectDatabaseEmulator: vi.fn(),
}));

// Mock environment variables for testing
vi.mock('../config/env', () => ({
  env: {
    mode: 'test',
    firebase: {
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '123456789',
      appId: 'test-app-id',
      databaseURL: 'https://test-project.firebaseio.com',
    },
  },
  isProduction: false,
  isDevelopment: false,
  isTest: true,
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
