import { afterEach, beforeAll } from "bun:test";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Window } from "happy-dom";

// Set up happy-dom environment
beforeAll(() => {
  const window = new Window();
  const document = window.document;

  // Set global window and document with proper types
  global.window = window as Window & typeof globalThis;
  global.document = document as Document;
  global.navigator = window.navigator as Navigator;
  global.HTMLElement = window.HTMLElement as typeof HTMLElement;

  // Set up localStorage mock
  global.localStorage = {
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
