import { describe, expect, test } from "bun:test";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    test("should merge basic class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
      expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    test("should handle single class name", () => {
      expect(cn("single-class")).toBe("single-class");
    });

    test("should handle empty input", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
    });

    test("should handle null and undefined values", () => {
      expect(cn(null)).toBe("");
      expect(cn(undefined)).toBe("");
      expect(cn("class1", null, "class2")).toBe("class1 class2");
      expect(cn("class1", undefined, "class2")).toBe("class1 class2");
    });

    test("should handle conditional class names", () => {
      expect(cn("base", true && "conditional")).toBe("base conditional");
      expect(cn("base", false && "conditional")).toBe("base");
      expect(cn("base", null && "conditional")).toBe("base");
    });

    test("should handle arrays", () => {
      expect(cn(["class1", "class2"])).toBe("class1 class2");
      expect(cn(["class1", false && "class2", "class3"])).toBe("class1 class3");
    });

    test("should handle objects", () => {
      expect(cn({ class1: true, class2: false })).toBe("class1");
      expect(cn({ class1: true, class2: true })).toBe("class1 class2");
    });

    test("should merge conflicting Tailwind classes", () => {
      // twMerge should handle conflicting Tailwind classes
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
      expect(cn("p-4", "p-2")).toBe("p-2");
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    test("should handle complex combinations", () => {
      expect(
        cn("base-class", "another-class", { "conditional-class": true }, false && "skipped-class", [
          "array-class1",
          "array-class2",
        ]),
      ).toBe("base-class another-class conditional-class array-class1 array-class2");
    });

    test("should handle duplicates", () => {
      // clsx doesn't deduplicate non-Tailwind classes
      expect(cn("class1", "class1")).toBe("class1 class1");
      expect(cn("class1", "class2", "class1")).toBe("class1 class2 class1");
    });

    test("should handle whitespace", () => {
      expect(cn("class1 class2", "class3")).toBe("class1 class2 class3");
      expect(cn("  class1  ", "  class2  ")).toBe("class1 class2");
    });

    test("should handle Tailwind class merging edge cases", () => {
      // Test specific Tailwind merging scenarios
      expect(cn("px-4", "px-2")).toBe("px-2");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
      expect(cn("h-10", "h-20")).toBe("h-20");
      expect(cn("bg-red-500", "bg-blue-500", "bg-green-500")).toBe("bg-green-500");
    });

    test("should preserve non-conflicting classes", () => {
      expect(cn("bg-red-500", "text-white", "bg-blue-500")).toBe("text-white bg-blue-500");
      expect(cn("p-4", "m-2", "p-6")).toBe("m-2 p-6");
    });

    test("should handle various data types", () => {
      expect(cn("class1", 2)).toBe("class1 2");
      expect(cn("class1", 0)).toBe("class1");
      expect(cn("class1", "")).toBe("class1");
      expect(cn("class1", " ")).toBe("class1");
    });
  });
});
