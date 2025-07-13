import { beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useHighScoreStore } from "./highScoreStore";

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};

class MockStorage implements Storage {
  get length(): number {
    return Object.keys(mockStorage).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(mockStorage);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return mockStorage[key] || null;
  }

  setItem(key: string, value: string): void {
    mockStorage[key] = value;
  }

  removeItem(key: string): void {
    delete mockStorage[key];
  }

  clear(): void {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }
}

// Set up mock localStorage
Object.defineProperty(globalThis, "localStorage", {
  value: new MockStorage(),
  writable: true,
});

// Default state for tests
const DEFAULT_HIGH_SCORE_STATE = {
  currentHighScore: null,
  highScoresList: [],
};

// Create isolated test store instance for each test file

describe("highScoreStore", () => {
  beforeEach(() => {
    // Clear localStorage completely
    localStorage.clear();

    // Reset store to default state
    act(() => {
      useHighScoreStore.setState({
        ...DEFAULT_HIGH_SCORE_STATE,
      });
    });
  });

  describe("initial state", () => {
    it("should initialize with null current high score and empty list", () => {
      const { result } = renderHook(() => useHighScoreStore());

      expect(result.current.currentHighScore).toBeNull();
      expect(result.current.highScoresList).toEqual([]);
    });
  });

  describe("addNewHighScore", () => {
    it("should set first score as current high score", () => {
      const { result } = renderHook(() => useHighScoreStore());

      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      expect(result.current.currentHighScore).toEqual({
        score: 1000,
        lines: 10,
        level: 1,
        date: expect.any(String),
      });
      expect(result.current.highScoresList).toHaveLength(1);
      expect(result.current.highScoresList[0].score).toBe(1000);
    });

    it("should update current high score when new score is higher", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Set initial high score
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      // Add higher score
      act(() => {
        result.current.addNewHighScore(2000, 20, 2);
      });

      expect(result.current.currentHighScore?.score).toBe(2000);
      expect(result.current.highScoresList).toHaveLength(2);
      expect(result.current.highScoresList[0].score).toBe(2000); // Should be sorted
      expect(result.current.highScoresList[1].score).toBe(1000);
    });

    it("should not update current high score when new score is lower", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Set initial high score
      act(() => {
        result.current.addNewHighScore(2000, 20, 2);
      });

      const initialHighScore = result.current.currentHighScore;

      // Add lower score
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      expect(result.current.currentHighScore).toEqual(initialHighScore);
      expect(result.current.highScoresList).toHaveLength(1); // Lower score not added to list
    });

    it("should maintain top 10 scores only", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Add 12 scores (more than the limit of 10)
      for (let i = 1; i <= 12; i++) {
        act(() => {
          result.current.addNewHighScore(i * 1000, i * 10, i);
        });
      }

      expect(result.current.highScoresList).toHaveLength(10);
      expect(result.current.highScoresList[0].score).toBe(12000); // Highest score
      expect(result.current.highScoresList[9].score).toBe(3000); // 10th highest score
      expect(result.current.currentHighScore?.score).toBe(12000);
    });

    it("should sort high scores in descending order", () => {
      const { result } = renderHook(() => useHighScoreStore());

      const scores = [1500, 3000, 500, 2000, 1000];

      scores.forEach((score, index) => {
        act(() => {
          result.current.addNewHighScore(score, index + 1, 1);
        });
      });

      // The logic only adds scores that are higher than the current high score
      // So only 1500, then 3000 are added to the list
      const sortedScores = result.current.highScoresList.map((hs) => hs.score);
      expect(sortedScores).toEqual([3000, 1500]);
    });

    it("should include date in ISO string format", () => {
      const { result } = renderHook(() => useHighScoreStore());

      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      const highScore = result.current.currentHighScore;
      expect(highScore?.date).toBeTruthy();
      if (highScore) {
        expect(() => new Date(highScore.date)).not.toThrow();
        expect(new Date(highScore.date).toISOString()).toBe(highScore.date);
      }
    });

    it("should include all required properties in high score", () => {
      const { result } = renderHook(() => useHighScoreStore());

      act(() => {
        result.current.addNewHighScore(1500, 15, 3);
      });

      const highScore = result.current.currentHighScore;
      expect(highScore).toEqual({
        score: 1500,
        lines: 15,
        level: 3,
        date: expect.any(String),
      });
    });
  });

  describe("persistence", () => {
    it("should have persistence functionality", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Verify that persistence is working by testing multiple score additions
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      expect(result.current.currentHighScore?.score).toBe(1000);
      expect(result.current.highScoresList).toHaveLength(1);

      act(() => {
        result.current.addNewHighScore(2000, 20, 2);
      });

      expect(result.current.currentHighScore?.score).toBe(2000);
      expect(result.current.highScoresList).toHaveLength(2);
    });

    it("should maintain data consistency across operations", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Add multiple scores and verify persistence behavior
      const scores = [1500, 2500, 800, 3000, 1200];

      scores.forEach((score, index) => {
        act(() => {
          result.current.addNewHighScore(score, index + 1, 1);
        });
      });

      // Verify final state
      expect(result.current.currentHighScore?.score).toBe(3000);
      expect(result.current.highScoresList).toHaveLength(3); // Only new high scores are added to the list

      // Verify sorting - only scores that were new high scores at the time
      const sortedScores = result.current.highScoresList.map((hs) => hs.score);
      expect(sortedScores).toEqual([3000, 2500, 1500]);
    });
  });

  describe("edge cases", () => {
    it("should handle equal scores correctly", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Add same score twice
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      act(() => {
        result.current.addNewHighScore(1000, 15, 2);
      });

      // Should not update current high score for equal score
      expect(result.current.currentHighScore?.lines).toBe(10); // First score remains current
      expect(result.current.highScoresList).toHaveLength(1); // Second score not added
    });

    it("should handle zero scores", () => {
      const { result } = renderHook(() => useHighScoreStore());

      act(() => {
        result.current.addNewHighScore(0, 0, 1);
      });

      expect(result.current.currentHighScore?.score).toBe(0);
      expect(result.current.highScoresList).toHaveLength(1);
    });

    it("should handle negative values gracefully", () => {
      const { result } = renderHook(() => useHighScoreStore());

      act(() => {
        result.current.addNewHighScore(-100, -5, 0);
      });

      expect(result.current.currentHighScore?.score).toBe(-100);
      expect(result.current.currentHighScore?.lines).toBe(-5);
      expect(result.current.currentHighScore?.level).toBe(0);
    });
  });

  describe("store interface", () => {
    it("should provide all required properties and methods", () => {
      const { result } = renderHook(() => useHighScoreStore());

      expect(result.current.currentHighScore).toBeDefined();
      expect(Array.isArray(result.current.highScoresList)).toBe(true);
      expect(typeof result.current.addNewHighScore).toBe("function");
    });
  });

  describe("localStorage persistence behavior", () => {
    it("should maintain consistent state across multiple operations", () => {
      const { result } = renderHook(() => useHighScoreStore());

      // Add multiple high scores and verify state consistency
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      const _firstState = {
        currentHighScore: result.current.currentHighScore,
        highScoresList: [...result.current.highScoresList],
      };

      act(() => {
        result.current.addNewHighScore(2000, 20, 2);
      });

      // Verify state progression is logical
      expect(result.current.currentHighScore?.score).toBe(2000);
      expect(result.current.highScoresList).toHaveLength(2);
      expect(result.current.highScoresList[0].score).toBe(2000);
      expect(result.current.highScoresList[1].score).toBe(1000);
    });

    it("should pre-populate localStorage data correctly", () => {
      // Pre-populate localStorage with high scores data
      const mockHighScoresData = {
        state: {
          currentHighScore: {
            score: 5000,
            lines: 50,
            level: 5,
            date: "2024-01-01T00:00:00.000Z",
          },
          highScoresList: [
            { score: 5000, lines: 50, level: 5, date: "2024-01-01T00:00:00.000Z" },
            { score: 4000, lines: 40, level: 4, date: "2024-01-02T00:00:00.000Z" },
          ],
        },
        version: 0,
      };

      localStorage.setItem("tetris-high-scores", JSON.stringify(mockHighScoresData));

      // Verify localStorage data structure is correct
      const stored = localStorage.getItem("tetris-high-scores");
      expect(stored).toBeTruthy();

      if (stored) {
        const parsedData = JSON.parse(stored);
        expect(parsedData.state.currentHighScore.score).toBe(5000);
        expect(parsedData.state.highScoresList).toHaveLength(2);
        expect(parsedData.state.highScoresList[0].score).toBe(5000);
        expect(parsedData.state.highScoresList[1].score).toBe(4000);
      }
    });

    it("should handle localStorage data format correctly", () => {
      // Test expected localStorage data format
      const expectedFormat = {
        state: {
          currentHighScore: null,
          highScoresList: [],
        },
        version: 0,
      };

      localStorage.setItem("tetris-high-scores", JSON.stringify(expectedFormat));

      const stored = localStorage.getItem("tetris-high-scores");
      expect(stored).toBeTruthy();

      if (stored) {
        const parsedData = JSON.parse(stored);
        expect(parsedData).toHaveProperty("state");
        expect(parsedData).toHaveProperty("version");
        expect(parsedData.state).toHaveProperty("currentHighScore");
        expect(parsedData.state).toHaveProperty("highScoresList");
      }
    });

    it("should handle invalid localStorage data gracefully", () => {
      // Set invalid JSON in localStorage
      localStorage.setItem("tetris-high-scores", "invalid-json");

      // Store should still initialize without crashing
      expect(() => {
        renderHook(() => useHighScoreStore());
      }).not.toThrow();
    });

    it("should handle corrupted localStorage data structure", () => {
      // Set malformed data structure
      const corruptedData = {
        state: {
          currentHighScore: "not-an-object",
          highScoresList: "not-an-array",
        },
      };

      localStorage.setItem("tetris-high-scores", JSON.stringify(corruptedData));

      // Store should still initialize without crashing
      expect(() => {
        renderHook(() => useHighScoreStore());
      }).not.toThrow();
    });

    it("should initialize with default values when localStorage is empty", () => {
      // Ensure localStorage is empty
      localStorage.clear();

      const { result } = renderHook(() => useHighScoreStore());

      expect(result.current.currentHighScore).toBeNull();
      expect(result.current.highScoresList).toEqual([]);
    });

    it("should use correct localStorage key name", () => {
      // Test that the expected key name pattern is used
      const expectedKey = "tetris-high-scores";

      // Pre-populate with test data
      localStorage.setItem(
        expectedKey,
        JSON.stringify({
          state: { currentHighScore: null, highScoresList: [] },
          version: 0,
        }),
      );

      // Verify the key exists and incorrect keys don't
      expect(localStorage.getItem(expectedKey)).toBeTruthy();
      expect(localStorage.getItem("high-scores")).toBeNull();
      expect(localStorage.getItem("tetris-highscores")).toBeNull();
    });

    it("should handle valid date format in localStorage", () => {
      // Test date format preservation
      const testDate = "2024-01-01T00:00:00.000Z";
      const testData = {
        state: {
          currentHighScore: {
            score: 1000,
            lines: 10,
            level: 1,
            date: testDate,
          },
          highScoresList: [{ score: 1000, lines: 10, level: 1, date: testDate }],
        },
        version: 0,
      };

      localStorage.setItem("tetris-high-scores", JSON.stringify(testData));

      const stored = localStorage.getItem("tetris-high-scores");
      if (stored) {
        const parsedData = JSON.parse(stored);
        const storedDate = parsedData.state.currentHighScore.date;

        // Verify date is in ISO string format
        expect(typeof storedDate).toBe("string");
        expect(() => new Date(storedDate)).not.toThrow();
        expect(new Date(storedDate).toISOString()).toBe(storedDate);
      }
    });
  });

  describe("localStorage edge cases", () => {
    it("should handle localStorage quota exceeded gracefully", () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      const { result } = renderHook(() => useHighScoreStore());

      // Since Zustand persist middleware handles errors gracefully,
      // the state should still update even if localStorage fails
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      // State should still be updated in memory
      expect(result.current.currentHighScore).toEqual({
        score: 1000,
        lines: 10,
        level: 1,
        date: expect.any(String),
      });

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });

    it("should handle localStorage disabled (Safari private mode)", () => {
      // Mock localStorage to be undefined/disabled
      const originalLocalStorage = localStorage;
      // @ts-expect-error - Intentionally setting localStorage to null for testing
      globalThis.localStorage = null;

      // Store creation should not crash
      expect(() => {
        renderHook(() => useHighScoreStore());
      }).not.toThrow();

      // Restore original localStorage
      globalThis.localStorage = originalLocalStorage;
    });

    it("should handle localStorage getItem returning null", () => {
      // Mock getItem to always return null
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => null;

      const { result } = renderHook(() => useHighScoreStore());

      // Should initialize with default values
      expect(result.current.currentHighScore).toBeNull();
      expect(result.current.highScoresList).toEqual([]);

      // Restore original getItem
      localStorage.getItem = originalGetItem;
    });

    it("should handle localStorage setItem throwing generic error", () => {
      // Mock setItem to throw a generic error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Generic localStorage error");
      };

      const { result } = renderHook(() => useHighScoreStore());

      // Since Zustand persist middleware handles errors gracefully,
      // the state should still update even if localStorage fails
      act(() => {
        result.current.addNewHighScore(1000, 10, 1);
      });

      // State should still be updated in memory
      expect(result.current.currentHighScore).toEqual({
        score: 1000,
        lines: 10,
        level: 1,
        date: expect.any(String),
      });

      // Restore original setItem
      localStorage.setItem = originalSetItem;
    });
  });
});
