import { afterEach, beforeEach } from "bun:test";
import { cleanup } from "@testing-library/react";

// Type definitions for Zustand store interfaces
interface ZustandStore {
  getState: () => unknown;
  persist?: {
    clearStorage: () => void;
  };
}

interface GameState {
  resetGame?: () => void;
}

// Import stores for cleanup
let gameStore: unknown;
let settingsStore: unknown;

// Dynamically import stores to avoid dependency issues
const importStores = async () => {
  try {
    const { useGamePlayStore } = await import("@/features/game-play/model/gamePlaySlice");
    const { useSettingsStore } = await import("@/features/settings");
    gameStore = useGamePlayStore;
    settingsStore = useSettingsStore;
  } catch {
    // Stores might not be available in some test contexts
  }
};

// Ensure DOM globals are available
if (typeof global !== "undefined" && (!global.document || !global.window)) {
  // Import happy-dom for Node.js environment
  const { Window } = await import("happy-dom");
  const window = new Window();

  // Set up comprehensive DOM globals
  global.window = window as unknown as Window & typeof globalThis;
  global.document = window.document as unknown as Document;
  global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
  global.HTMLDivElement = window.HTMLDivElement as unknown as typeof HTMLDivElement;
  global.Element = window.Element as unknown as typeof Element;
  global.Node = window.Node as unknown as typeof Node;
  global.DocumentFragment = window.DocumentFragment as unknown as typeof DocumentFragment;

  // Ensure document.body exists and is a proper DOM element
  if (!window.document.body) {
    const body = window.document.createElement("body");
    window.document.appendChild(body);
  }

  // Set up timer functions with Node.js implementations for consistency
  const nodeSetTimeout = globalThis.setTimeout;
  const nodeClearTimeout = globalThis.clearTimeout;
  const nodeSetInterval = globalThis.setInterval;
  const nodeClearInterval = globalThis.clearInterval;

  global.setTimeout = nodeSetTimeout;
  global.clearTimeout = nodeClearTimeout;
  global.setInterval = nodeSetInterval;
  global.clearInterval = nodeClearInterval;

  // Ensure window object has the same timer functions
  Object.defineProperty(window, "setTimeout", {
    value: nodeSetTimeout,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "clearTimeout", {
    value: nodeClearTimeout,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "setInterval", {
    value: nodeSetInterval,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "clearInterval", {
    value: nodeClearInterval,
    writable: true,
    configurable: true,
  });

  // Also set up on globalThis for testing-library
  globalThis.window = global.window;
  globalThis.document = global.document;
  globalThis.HTMLElement = global.HTMLElement;
  globalThis.Element = global.Element;
  globalThis.Node = global.Node;
  globalThis.DocumentFragment = global.DocumentFragment;
  globalThis.setTimeout = global.setTimeout;
  globalThis.clearTimeout = global.clearTimeout;
  globalThis.setInterval = global.setInterval;
  globalThis.clearInterval = global.clearInterval;

  // Set up MutationObserver and other Web APIs for Radix UI
  global.MutationObserver = window.MutationObserver as unknown as typeof MutationObserver;
  global.ResizeObserver =
    window.ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  globalThis.MutationObserver = global.MutationObserver;
  globalThis.ResizeObserver = global.ResizeObserver;

  // Set up getComputedStyle for testing
  if (!window.getComputedStyle) {
    Object.defineProperty(window, "getComputedStyle", {
      value: () => ({
        getPropertyValue: () => "",
      }),
      writable: true,
      configurable: true,
    });
  }

  // Manually trigger DOM content loaded to initialize properly
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
}

// Set up localStorage mock before each test
beforeEach(async () => {
  // Import stores for cleanup
  await importStores();

  // Ensure DOM body exists for testing-library
  if (global.document && !global.document.body) {
    const body = global.document.createElement("body");
    global.document.appendChild(body);
  }

  // Clear any existing content from document.body
  if (global.document?.body) {
    global.document.body.innerHTML = "";
  }

  // Set up proper localStorage mock for tests
  const storage = new Map<string, string>();

  global.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index: number) => {
      const keys = Array.from(storage.keys());
      return keys[index] ?? null;
    },
    get length() {
      return storage.size;
    },
  };

  // Also ensure window.localStorage exists if window is available
  if (global.window && !global.window.localStorage) {
    Object.defineProperty(global.window, "localStorage", {
      value: global.localStorage,
      writable: true,
      configurable: true,
    });
  }

  // Reset all Zustand stores before each test
  if (gameStore && typeof gameStore === "object" && "getState" in gameStore) {
    const store = gameStore as unknown as ZustandStore;
    const state = store.getState() as GameState;
    if (state?.resetGame) {
      state.resetGame();
    }
  }

  // Clear any persisted settings
  if (settingsStore && typeof settingsStore === "object" && "persist" in settingsStore) {
    const store = settingsStore as unknown as ZustandStore;
    const persist = store.persist;
    if (persist?.clearStorage) {
      persist.clearStorage();
    }
  }

  // High score store doesn't need reset for tests
  // High scores should persist across test runs unless explicitly cleared

  // Clear all existing timers (functions are already set up globally)
  if (global.clearTimeout && global.clearInterval) {
    for (let i = 1; i < 1000; i++) {
      try {
        global.clearTimeout(i);
        global.clearInterval(i);
      } catch {
        // Ignore errors for non-existent timers
      }
    }
  }
});

// Clean up after each test
afterEach(() => {
  // React Testing Library cleanup
  cleanup();

  // Clear timers after each test without overriding the functions
  if (global.clearTimeout && global.clearInterval) {
    // Clear any active timers (limited range to prevent performance issues)
    for (let i = 1; i < 1000; i++) {
      try {
        global.clearTimeout(i);
        global.clearInterval(i);
      } catch {
        // Ignore errors for non-existent timers
      }
    }
  }

  // Reset Zustand stores after each test as well
  if (gameStore && typeof gameStore === "object" && "getState" in gameStore) {
    try {
      const store = gameStore as unknown as ZustandStore;
      const state = store.getState() as GameState;
      if (state?.resetGame) {
        state.resetGame();
      }
    } catch {
      // Ignore errors if store is not available
    }
  }

  // Clear localStorage
  if (global.localStorage) {
    global.localStorage.clear();
  }

  // Clear any remaining mocks
  // Note: Bun test runner automatically clears mocks between tests
});
