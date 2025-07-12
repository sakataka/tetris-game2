import { afterEach, beforeEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

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

interface GlobalWithJest {
  jest?: {
    clearAllMocks?: () => void;
  };
}

// Import stores for cleanup
let gameStore: unknown;
let settingsStore: unknown;
let highScoreStore: unknown;

// Dynamically import stores to avoid dependency issues
const importStores = async () => {
  try {
    const { useGameStore } = await import("@/store/gameStore");
    const { useSettingsStore } = await import("@/store/settingsStore");
    const { useHighScoreStore } = await import("@/store/highScoreStore");
    gameStore = useGameStore;
    settingsStore = useSettingsStore;
    highScoreStore = useHighScoreStore;
  } catch {
    // Stores might not be available in some test contexts
  }
};

// Ensure DOM globals are available
if (typeof global !== "undefined" && !global.document) {
  // Import happy-dom for Node.js environment
  const { Window } = await import("happy-dom");
  const window = new Window();
  global.window = window as unknown as Window & typeof globalThis;
  global.document = window.document as unknown as Document;
  global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
  global.HTMLDivElement = window.HTMLDivElement as unknown as typeof HTMLDivElement;
  global.Element = window.Element as unknown as typeof Element;
  global.Node = window.Node as unknown as typeof Node;
  global.DocumentFragment = window.DocumentFragment as unknown as typeof DocumentFragment;
}

// Set up localStorage mock before each test
beforeEach(async () => {
  // Import stores for cleanup
  await importStores();

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

  if (highScoreStore && typeof highScoreStore === "object" && "persist" in highScoreStore) {
    const store = highScoreStore as unknown as ZustandStore;
    const persist = store.persist;
    if (persist?.clearStorage) {
      persist.clearStorage();
    }
  }

  // Clear all existing timers
  if (typeof global !== "undefined") {
    // Clear any existing timeouts/intervals
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }
});

// Clean up after each test
afterEach(() => {
  // React Testing Library cleanup
  cleanup();

  // Clear all timers after each test
  global.setTimeout = globalThis.setTimeout;
  global.clearTimeout = globalThis.clearTimeout;
  global.setInterval = globalThis.setInterval;
  global.clearInterval = globalThis.clearInterval;

  // More aggressive timer cleanup
  for (let i = 1; i < 100000; i++) {
    try {
      clearTimeout(i);
      clearInterval(i);
    } catch {
      // Ignore errors for non-existent timers
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
  if (typeof globalThis !== "undefined" && "jest" in globalThis) {
    const globalWithJest = globalThis as unknown as GlobalWithJest;
    const jest = globalWithJest.jest;
    if (jest?.clearAllMocks) {
      jest.clearAllMocks();
    }
  }
});
