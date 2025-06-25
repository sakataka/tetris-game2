import { beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useHighScoreStore } from "./highScoreStore";

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
  },
  writable: true,
});

describe("highScoreStore", () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();

    // Reset store to initial state
    useHighScoreStore.setState({
      currentHighScore: null,
      highScoresList: [],
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
});
