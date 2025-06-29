import { describe, expect, test, vi } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { milliseconds, useActionCooldown } from "./useActionCooldown";

// ==============================
// Test Helper Functions - Junichi Ito Style
// ==============================

/**
 * Create mock action function
 * Tracks execution count and arguments
 */
function createMockAction() {
  const mockAction = vi.fn();
  return {
    action: mockAction,
    getCallCount: () => mockAction.mock.calls.length,
    getLastCallArgs: () => mockAction.mock.calls[mockAction.mock.calls.length - 1],
    reset: () => mockAction.mockReset(),
  };
}

/**
 * Helper function to wait for specified milliseconds
 */
async function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to render useActionCooldown hook
 */
function renderActionCooldownHook(action: (...args: unknown[]) => void, cooldownMs: number) {
  return renderHook(() => useActionCooldown(action, cooldownMs));
}

// ==============================
// Test Implementation - Junichi Ito Practical Patterns
// ==============================

describe("useActionCooldown - 伊藤淳一氏スタイル", () => {
  describe("APIの基本構造", () => {
    test("フックは期待されるAPIを返す", () => {
      // Given: モックアクションとクールダウン設定
      const mockAction = vi.fn();
      const cooldownMs = 100;

      // When: フックをレンダリング
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // Then: 正しいAPIが返される
      expect(typeof result.current).toBe("object");
      expect(typeof result.current.execute).toBe("function");
      expect(typeof result.current.isOnCooldown).toBe("boolean");
      expect(typeof result.current.remainingCooldown).toBe("number");
      expect(typeof result.current.reset).toBe("function");
    });

    test("初期状態はクールダウンなし", () => {
      // Given: フックの初期状態
      const mockAction = vi.fn();
      const { result } = renderActionCooldownHook(mockAction, 100);

      // When: 初期レンダリング後
      // Then: クールダウン状態はfalse、残り時間は0
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });
  });

  describe("アクション実行時の動作", () => {
    test("初回実行時は即座にアクションが実行される", async () => {
      // Given: クールダウン設定とモックアクション
      const mockActionHelper = createMockAction();
      const cooldownMs = 100;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: アクションを実行
      await act(async () => {
        await result.current.execute();
      });

      // Then: アクションが1回実行される
      expect(mockActionHelper.getCallCount()).toBe(1);
    });

    test("クールダウン期間中は連続実行が制限される", async () => {
      // Given: 短いクールダウン設定
      const mockActionHelper = createMockAction();
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: 短時間に2回実行を試みる
      await act(async () => {
        await result.current.execute();
        await result.current.execute(); // 即座に再実行
      });

      // Then: 1回目のみ実行される
      expect(mockActionHelper.getCallCount()).toBe(1);
    });

    test("クールダウン期間後は再実行可能になる", async () => {
      // Given: 短いクールダウン設定
      const mockActionHelper = createMockAction();
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: 初回実行後、クールダウン期間を待ってから再実行
      await act(async () => {
        await result.current.execute();
      });

      // 初回実行後は1回のみ
      expect(mockActionHelper.getCallCount()).toBe(1);

      // クールダウン期間を待機
      await act(async () => {
        await waitMs(cooldownMs + 10);
      });

      // 再実行
      await act(async () => {
        await result.current.execute();
      });

      // Then: 2回目も実行される
      expect(mockActionHelper.getCallCount()).toBe(2);
    });

    test("引数付きアクションも正しく実行される", async () => {
      // Given: 引数を受け取るアクション
      const mockActionHelper = createMockAction();
      const { result } = renderActionCooldownHook(mockActionHelper.action, 100);
      const testArg1 = "test";
      const testArg2 = 42;

      // When: 引数付きでアクションを実行
      await act(async () => {
        await result.current.execute(testArg1, testArg2);
      });

      // Then: 正しい引数でアクションが実行される
      expect(mockActionHelper.getCallCount()).toBe(1);
      expect(mockActionHelper.getLastCallArgs()).toEqual([testArg1, testArg2]);
    });
  });

  describe("クールダウン状態の管理", () => {
    test("アクション実行後にクールダウン状態になる", async () => {
      // Given: クールダウン設定
      const mockAction = vi.fn();
      const cooldownMs = 100;
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // When: アクションを実行
      await act(async () => {
        await result.current.execute();
      });

      // Then: クールダウン状態になる
      expect(result.current.isOnCooldown).toBe(true);
      expect(result.current.remainingCooldown).toBeGreaterThan(0);
    });

    test("クールダウン期間終了後は状態がリセットされる", async () => {
      // Given: 短いクールダウン設定
      const mockAction = vi.fn();
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // When: アクション実行後、クールダウン期間を待機
      await act(async () => {
        await result.current.execute();
      });

      await act(async () => {
        await waitMs(cooldownMs + 10);
      });

      // Then: クールダウン状態が解除される
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });
  });

  describe("境界値テスト", () => {
    test("クールダウン時間が0の場合は制限なく連続実行される", async () => {
      // Given: クールダウンなし設定
      const mockActionHelper = createMockAction();
      const { result } = renderActionCooldownHook(mockActionHelper.action, 0);

      // When: 連続で複数回実行
      await act(async () => {
        await result.current.execute();
        await result.current.execute();
        await result.current.execute();
      });

      // Then: 全て実行される
      expect(mockActionHelper.getCallCount()).toBe(3);
    });

    test("branded Milliseconds型が正しく処理される", () => {
      // Given: branded Milliseconds型のクールダウン時間
      const mockAction = vi.fn();
      const cooldownMs = milliseconds(150);

      // When: フックをレンダリング
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // Then: エラーなく正常に動作する
      expect(typeof result.current.execute).toBe("function");
    });

    test("最小値でのクールダウン動作確認", async () => {
      // Given: 最小クールダウン時間（1ms）
      const mockActionHelper = createMockAction();
      const cooldownMs = 1;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: 連続実行を試みる
      await act(async () => {
        await result.current.execute();
        await result.current.execute();
      });

      // Then: 初回のみ実行される
      expect(mockActionHelper.getCallCount()).toBe(1);
    });
  });

  describe("異常系テスト", () => {
    test("処理中の再実行は防止される", async () => {
      // Given: 実行に時間がかかるアクション
      let resolveFn: () => void;
      const longRunningAction = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveFn = resolve;
          }),
      );
      const { result } = renderActionCooldownHook(longRunningAction, 100);

      // When: 長時間実行中に再実行を試みる
      const promise1 = act(async () => {
        await result.current.execute();
      });

      // 処理中に再実行
      await act(async () => {
        await result.current.execute();
      });

      // 最初の処理を完了させる
      // biome-ignore lint/style/noNonNullAssertion: Test helper requires explicit call
      resolveFn!();
      await promise1;

      // Then: 1回のみ実行される（再実行は無視される）
      expect(longRunningAction).toHaveBeenCalledTimes(1);
    });

    test("負のクールダウン時間指定でmilliseconds()がエラーを投げる", () => {
      // Given: 負のクールダウン時間
      // When & Then: エラーが投げられる
      expect(() => milliseconds(-100)).toThrow("Milliseconds must be non-negative");
    });
  });

  describe("リセット機能", () => {
    test("reset()でクールダウン状態がクリアされる", async () => {
      // Given: クールダウン中の状態
      const mockAction = vi.fn();
      const cooldownMs = 100;
      const { result } = renderHook(() => useActionCooldown(mockAction, cooldownMs));

      // アクションを実行してクールダウン状態にする
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isOnCooldown).toBe(true);

      // When: リセットを実行
      act(() => {
        result.current.reset();
      });

      // Then: クールダウン状態がクリアされる
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });

    test("reset()後は即座に再実行可能になる", async () => {
      // Given: クールダウン中の状態
      const mockActionHelper = createMockAction();
      const cooldownMs = 1000; // 長いクールダウン
      const { result } = renderHook(() => useActionCooldown(mockActionHelper.action, cooldownMs));

      // 初回実行
      await act(async () => {
        await result.current.execute();
      });

      // When: リセット後に再実行
      act(() => {
        result.current.reset();
      });

      await act(async () => {
        await result.current.execute();
      });

      // Then: クールダウンを待たずに再実行される
      expect(mockActionHelper.getCallCount()).toBe(2);
    });
  });

  describe("型安全性", () => {
    test("branded Milliseconds型でのエラーハンドリング", () => {
      // Given: 正常な値でのbranded type作成
      // When & Then: エラーなく作成される
      expect(() => milliseconds(0)).not.toThrow();
      expect(() => milliseconds(100)).not.toThrow();
      expect(() => milliseconds(1000)).not.toThrow();
    });

    test("非同期アクションが正しく処理される", async () => {
      // Given: 非同期アクション
      const asyncAction = vi.fn(async () => {
        await waitMs(10);
        return "completed";
      });
      const { result } = renderHook(() => useActionCooldown(asyncAction, 50));

      // When: 非同期アクションを実行
      await act(async () => {
        await result.current.execute();
      });

      // Then: 正常に実行される
      expect(asyncAction).toHaveBeenCalledTimes(1);
    });
  });
});
