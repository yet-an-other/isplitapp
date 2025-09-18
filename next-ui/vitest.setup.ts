import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Avoid real network calls for device id in tests
vi.mock('./src/api/userApi', () => ({
  ensureDeviceId: vi.fn(async () => 'test-device-id'),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));