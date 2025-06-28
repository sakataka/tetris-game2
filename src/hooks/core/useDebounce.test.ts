import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("should return debounce and cancel functions", () => {
    const { result } = renderHook(() => useDebounce(250));

    expect(typeof result.current.debounce).toBe("function");
    expect(typeof result.current.cancel).toBe("function");
  });

  it("should call function after delay", async () => {
    const mockFn = mock();
    const { result } = renderHook(() => useDebounce(10)); // Use very short delay for testing

    act(() => {
      result.current.debounce(mockFn);
    });

    // Wait for debounce delay to complete
    await new Promise((resolve) => setTimeout(resolve, 15));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
