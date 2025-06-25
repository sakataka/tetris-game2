import { afterEach, beforeAll } from "bun:test";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Window } from "happy-dom";

// Type-safe global extensions for happy-dom environment
interface GlobalWithDom {
  window: Window & typeof globalThis;
  document: Document;
  navigator: Navigator;
  HTMLElement: typeof HTMLElement;
  localStorage: Storage;
}

// Set up happy-dom environment
beforeAll(() => {
  const window = new Window();
  const document = window.document;
  const globalWithDom = global as unknown as GlobalWithDom;

  // Set global window and document with proper types
  globalWithDom.window = window as unknown as Window & typeof globalThis;
  globalWithDom.document = document as unknown as Document;
  globalWithDom.navigator = window.navigator as unknown as Navigator;
  globalWithDom.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;

  // Set up localStorage mock with proper Storage interface
  globalWithDom.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  } satisfies Storage;
});

// Clean up after each test
afterEach(() => {
  cleanup();
});
