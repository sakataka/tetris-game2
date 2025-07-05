import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useMovementControls } from "./useMovementControls";

// Mock the dependencies
const mockMoveLeft = mock();
const mockMoveRight = mock();
const mockMoveDown = mock();
const mockDrop = mock();
const mockExecuteAction = mock();

mock.module("../core/useGameStoreActions", () => ({
  useGameStoreActions: mock(() => ({
    moveLeft: mockMoveLeft,
    moveRight: mockMoveRight,
    moveDown: mockMoveDown,
    drop: mockDrop,
  })),
}));

mock.module("../core/useGameActionHandler", () => ({
  useGameActionHandler: mock(() => mockExecuteAction),
}));

mock.module("./useActionCooldown", () => ({
  useActionCooldown: mock((action) => ({
    execute: action,
    isOnCooldown: false,
    remainingCooldown: 0,
    reset: mock(),
  })),
}));

describe("useMovementControls", () => {
  beforeEach(() => {
    mockMoveLeft.mockClear();
    mockMoveRight.mockClear();
    mockMoveDown.mockClear();
    mockDrop.mockClear();
    mockExecuteAction.mockClear();
  });

  it("should return movement control handlers", () => {
    const { result } = renderHook(() => useMovementControls());

    expect(result.current).toHaveProperty("handleMoveLeft");
    expect(result.current).toHaveProperty("handleMoveRight");
    expect(result.current).toHaveProperty("handleMoveDown");
    expect(result.current).toHaveProperty("handleDrop");
    expect(typeof result.current.handleMoveLeft).toBe("function");
    expect(typeof result.current.handleMoveRight).toBe("function");
    expect(typeof result.current.handleMoveDown).toBe("function");
    expect(typeof result.current.handleDrop).toBe("function");
  });

  it("should execute moveLeft action when handleMoveLeft is called", () => {
    const { result } = renderHook(() => useMovementControls());

    act(() => {
      result.current.handleMoveLeft();
    });

    expect(mockExecuteAction).toHaveBeenCalledWith(mockMoveLeft);
  });

  it("should execute moveRight action when handleMoveRight is called", () => {
    const { result } = renderHook(() => useMovementControls());

    act(() => {
      result.current.handleMoveRight();
    });

    expect(mockExecuteAction).toHaveBeenCalledWith(mockMoveRight);
  });

  it("should execute moveDown action when handleMoveDown is called", () => {
    const { result } = renderHook(() => useMovementControls());

    act(() => {
      result.current.handleMoveDown();
    });

    expect(mockExecuteAction).toHaveBeenCalledWith(mockMoveDown);
  });

  it("should execute drop action with urgent flag when handleDrop is called", () => {
    const { result } = renderHook(() => useMovementControls());

    act(() => {
      result.current.handleDrop();
    });

    expect(mockExecuteAction).toHaveBeenCalledWith(mockDrop, true);
  });
});
