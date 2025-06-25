import { afterEach, beforeAll } from "bun:test";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Window } from "happy-dom";

// Extend global interface to match happy-dom types
declare global {
  namespace NodeJS {
    interface Global {
      window: Window & typeof globalThis;
      document: Document;
      navigator: Navigator;
      HTMLElement: typeof HTMLElement;
      localStorage: Storage;
    }
  }
}

// Set up happy-dom environment
beforeAll(() => {
  const window = new Window();
  const document = window.document;

  // Set global window and document with proper types
  (global as any).window = window;
  (global as any).document = document;
  (global as any).navigator = window.navigator;
  (global as any).HTMLElement = window.HTMLElement;

  // Set up localStorage mock
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  } as Storage;
});

// Clean up after each test
afterEach(() => {
  cleanup();
});
