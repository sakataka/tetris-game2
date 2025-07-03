import { afterEach, beforeEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Set up localStorage mock before each test
beforeEach(() => {
  // Ensure localStorage is available for tests
  if (!global.localStorage) {
    (global as unknown as { localStorage: Storage }).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
});

// Clean up after each test
afterEach(() => {
  cleanup();
  // Clear all timers after each test
  global.setTimeout = globalThis.setTimeout;
  global.clearTimeout = globalThis.clearTimeout;
  global.setInterval = globalThis.setInterval;
  global.clearInterval = globalThis.clearInterval;
});
