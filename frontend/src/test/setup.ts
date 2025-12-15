import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_MARKETSTACK_API_KEY: 'test-api-key',
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

// Extend Vitest's expect with jest-dom matchers
expect.extend({});
