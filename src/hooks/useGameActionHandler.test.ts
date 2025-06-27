import { describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useGameActionHandler } from "./useGameActionHandler";

describe("useGameActionHandler", () => {
  test("should create handler function", () => {
    const { result } = renderHook(() => useGameActionHandler());
    expect(typeof result.current).toBe("function");
  });
});
