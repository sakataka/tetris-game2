import { Window } from "happy-dom";
import type { DebugParams } from "./debugParams";
import { generateDebugUrl, parseDebugParams } from "./debugParams";

describe("parseDebugParams", () => {
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    const window = new Window({ url: "https://example.com/" });
    originalWindow = global.window;
    global.window = window as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe("basic functionality", () => {
    test("returns disabled state when no debug param", () => {
      const window = new Window({ url: "https://example.com/" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: false });
    });

    test("returns disabled state when debug param is false", () => {
      const window = new Window({ url: "https://example.com/?debug=false" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: false });
    });

    test("returns disabled state when debug param is 0", () => {
      const window = new Window({ url: "https://example.com/?debug=0" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: false });
    });

    test("returns enabled state when debug=true", () => {
      const window = new Window({ url: "https://example.com/?debug=true" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("returns enabled state when debug=1", () => {
      const window = new Window({ url: "https://example.com/?debug=1" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("returns disabled state for invalid debug values", () => {
      const window = new Window({ url: "https://example.com/?debug=yes" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: false });
    });
  });

  describe("parameter parsing", () => {
    test("parses preset parameter correctly", () => {
      const window = new Window({ url: "https://example.com/?debug=true&preset=tetris" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, preset: "tetris" });
    });

    test("parses queue parameter with single character format", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=IJLOSTZ" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "J", "L", "O", "S", "T", "Z"] });
    });

    test("parses queue parameter with comma-separated format", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=I,J,L,O,S,T,Z" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "J", "L", "O", "S", "T", "Z"] });
    });

    test("parses queue parameter with mixed case", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=ijl" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "J", "L"] });
    });

    test("parses seed parameter correctly", () => {
      const window = new Window({ url: "https://example.com/?debug=true&seed=42" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, seed: 42 });
    });

    test("parses score parameter correctly", () => {
      const window = new Window({ url: "https://example.com/?debug=true&score=1000" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, score: 1000 });
    });

    test("parses level parameter correctly", () => {
      const window = new Window({ url: "https://example.com/?debug=true&level=5" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, level: 5 });
    });

    test("parses lines parameter correctly", () => {
      const window = new Window({ url: "https://example.com/?debug=true&lines=10" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, lines: 10 });
    });

    test("parses multiple parameters correctly", () => {
      const window = new Window({
        url: "https://example.com/?debug=true&preset=tetris&queue=IJLOSTZ&seed=42&score=1000&level=5&lines=10",
      });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({
        enabled: true,
        preset: "tetris",
        queue: ["I", "J", "L", "O", "S", "T", "Z"],
        seed: 42,
        score: 1000,
        level: 5,
        lines: 10,
      });
    });
  });

  describe("edge cases and error handling", () => {
    test("handles repeated debug keys (URLSearchParams behavior)", () => {
      const window = new Window({ url: "https://example.com/?debug=false&debug=true" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: false });
    });

    test("handles invalid numeric seed values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&seed=foo" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("handles invalid numeric score values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&score=bar" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("handles invalid numeric level values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&level=baz" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("handles invalid numeric lines values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&lines=qux" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("ignores out-of-range level values", () => {
      const window = new Window({ url: "https://example.com/?debug=true&level=50" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("ignores level values below minimum", () => {
      const window = new Window({ url: "https://example.com/?debug=true&level=0" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("ignores negative score values", () => {
      const window = new Window({ url: "https://example.com/?debug=true&score=-100" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("ignores negative lines values", () => {
      const window = new Window({ url: "https://example.com/?debug=true&lines=-5" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("filters out invalid tetromino characters", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=IXYZ" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "Z"] });
    });

    test("handles empty queue values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("handles empty preset values gracefully", () => {
      const window = new Window({ url: "https://example.com/?debug=true&preset=" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true });
    });

    test("handles queue with spaces", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=I J L" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "J", "L"] });
    });

    test("handles comma-separated queue with spaces", () => {
      const window = new Window({ url: "https://example.com/?debug=true&queue=I, J, L" });
      global.window = window as unknown as Window & typeof globalThis;

      const result = parseDebugParams();
      expect(result).toEqual({ enabled: true, queue: ["I", "J", "L"] });
    });

    test("handles malformed percent encoding gracefully", () => {
      // This test ensures that malformed encoding doesn't crash the parser
      const window = new Window({ url: "https://example.com/?debug=true&queue=%E0%A4" });
      global.window = window as unknown as Window & typeof globalThis;

      expect(() => parseDebugParams()).not.toThrow();
    });
  });

  describe("generateDebugUrl", () => {
    beforeEach(() => {
      const window = new Window({ url: "https://example.com/path?existing=param" });
      global.window = window as unknown as Window & typeof globalThis;
    });

    test("generates URL with debug enabled", () => {
      const result = generateDebugUrl({ enabled: true });
      expect(result).toBe("https://example.com/path?existing=param&debug=true");
    });

    test("generates URL with debug disabled", () => {
      const result = generateDebugUrl({ enabled: false });
      expect(result).toBe("https://example.com/path?existing=param");
    });

    test("clears existing debug params before adding new ones", () => {
      const window = new Window({
        url: "https://example.com/?debug=true&preset=old&queue=OLD&seed=999&score=9999&level=99&lines=999",
      });
      global.window = window as unknown as Window & typeof globalThis;

      const result = generateDebugUrl({ enabled: true, preset: "new", queue: ["I", "J"] });
      expect(result).toBe("https://example.com/?debug=true&preset=new&queue=IJ");
    });

    test("generates URL with all parameters", () => {
      const params: DebugParams = {
        enabled: true,
        preset: "tetris",
        queue: ["I", "J", "L", "O", "S", "T", "Z"],
        seed: 42,
        score: 1000,
        level: 5,
        lines: 10,
      };

      const result = generateDebugUrl(params);
      expect(result).toBe(
        "https://example.com/path?existing=param&debug=true&preset=tetris&queue=IJLOSTZ&seed=42&score=1000&level=5&lines=10",
      );
    });

    test("handles special characters in preset names", () => {
      const result = generateDebugUrl({ enabled: true, preset: "test mode" });
      expect(result).toBe("https://example.com/path?existing=param&debug=true&preset=test+mode");
    });

    test("round-trip: parse → generate → parse yields same result", () => {
      const originalParams: DebugParams = {
        enabled: true,
        preset: "tetris",
        queue: ["I", "J", "L"],
        seed: 42,
        score: 1000,
        level: 5,
        lines: 10,
      };

      const url = generateDebugUrl(originalParams);
      const window = new Window({ url });
      global.window = window as unknown as Window & typeof globalThis;

      const parsedParams = parseDebugParams();
      expect(parsedParams).toEqual(originalParams);
    });

    test("handles undefined values correctly", () => {
      const result = generateDebugUrl({ enabled: true, seed: undefined, score: undefined });
      expect(result).toBe("https://example.com/path?existing=param&debug=true");
    });

    test("handles zero values correctly", () => {
      const result = generateDebugUrl({ enabled: true, seed: 0, score: 0, level: 1, lines: 0 });
      expect(result).toBe(
        "https://example.com/path?existing=param&debug=true&seed=0&score=0&level=1&lines=0",
      );
    });

    test("handles empty queue correctly", () => {
      const result = generateDebugUrl({ enabled: true, queue: [] });
      expect(result).toBe("https://example.com/path?existing=param&debug=true");
    });
  });
});
