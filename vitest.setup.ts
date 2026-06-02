import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest is not configured with `globals: true`, so React Testing Library's
// auto-cleanup is not registered. Unmount between tests to avoid DOM bleed.
afterEach(() => {
  cleanup();
});

// Class-based mock so `new IntersectionObserver(...)` is constructable
// (a plain `vi.fn(() => ({}))` is not callable with `new`).
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
