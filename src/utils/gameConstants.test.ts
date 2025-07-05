import { describe, expect, test } from "bun:test";
import { GAME_CONSTANTS } from "./gameConstants";

describe("gameConstants", () => {
  describe("GAME_CONSTANTS structure", () => {
    test("should have all expected top-level keys", () => {
      const expectedKeys = [
        "BOARD",
        "TIMING",
        "TETROMINO",
        "ANIMATION",
        "TOUCH",
        "UI",
        "SCORING",
        "TYPES",
        "PIECE_BAG",
      ];

      expect(Object.keys(GAME_CONSTANTS)).toEqual(expectedKeys);
    });

    test("should be a readonly object", () => {
      expect(typeof GAME_CONSTANTS).toBe("object");
      expect(GAME_CONSTANTS).not.toBeNull();
    });
  });

  describe("BOARD constants", () => {
    test("should have expected board dimensions", () => {
      expect(GAME_CONSTANTS.BOARD.WIDTH).toBe(10);
      expect(GAME_CONSTANTS.BOARD.HEIGHT).toBe(20);
    });

    test("should have expected UI dimensions", () => {
      expect(GAME_CONSTANTS.BOARD.CELL_SIZE).toBe(30);
      expect(GAME_CONSTANTS.BOARD.MIN_WIDTH_PX).toBe(320);
      expect(GAME_CONSTANTS.BOARD.MIN_HEIGHT_PX).toBe(620);
    });

    test("should have all expected board keys", () => {
      const expectedKeys = ["WIDTH", "HEIGHT", "CELL_SIZE", "MIN_WIDTH_PX", "MIN_HEIGHT_PX"];
      expect(Object.keys(GAME_CONSTANTS.BOARD)).toEqual(expectedKeys);
    });
  });

  describe("TIMING constants", () => {
    test("should have expected timing values", () => {
      expect(GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS).toBe(1000);
      expect(GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS).toBe(100);
      expect(GAME_CONSTANTS.TIMING.SPEED_DECREASE_PER_LEVEL).toBe(100);
      expect(GAME_CONSTANTS.TIMING.SOFT_DROP_INTERVAL).toBe(50);
      expect(GAME_CONSTANTS.TIMING.HARD_DROP_DELAY).toBe(100);
      expect(GAME_CONSTANTS.TIMING.LINE_CLEAR_DELAY).toBe(300);
      expect(GAME_CONSTANTS.TIMING.TRANSITION_DURATION).toBe(300);
    });

    test("should have logical timing relationships", () => {
      expect(GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS).toBeGreaterThan(
        GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS,
      );
      expect(GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.TIMING.SOFT_DROP_INTERVAL).toBeLessThan(
        GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS,
      );
    });

    test("should have all expected timing keys", () => {
      const expectedKeys = [
        "INITIAL_DROP_SPEED_MS",
        "MIN_DROP_SPEED_MS",
        "SPEED_DECREASE_PER_LEVEL",
        "SOFT_DROP_INTERVAL",
        "HARD_DROP_DELAY",
        "LINE_CLEAR_DELAY",
        "TRANSITION_DURATION",
      ];
      expect(Object.keys(GAME_CONSTANTS.TIMING)).toEqual(expectedKeys);
    });
  });

  describe("TETROMINO constants", () => {
    test("should have expected tetromino values", () => {
      expect(GAME_CONSTANTS.TETROMINO.GRID_SIZE).toBe(4);
      expect(GAME_CONSTANTS.TETROMINO.NEXT_PIECE_GRID_SIZE).toBe(4);
      expect(GAME_CONSTANTS.TETROMINO.DROP_POSITION_LIMIT).toBe(30);
      expect(GAME_CONSTANTS.TETROMINO.MAX_ROTATION_STATE).toBe(3);
      expect(GAME_CONSTANTS.TETROMINO.GRID_ROWS).toBe(3);
      expect(GAME_CONSTANTS.TETROMINO.GRID_CELL_SIZE).toBe(16);
    });

    test("should have expected rotation states", () => {
      expect(GAME_CONSTANTS.TETROMINO.ROTATION_STATES).toEqual([0, 90, 180, 270]);
      expect(GAME_CONSTANTS.TETROMINO.ROTATION_STATES).toHaveLength(4);
    });

    test("should have all expected tetromino keys", () => {
      const expectedKeys = [
        "GRID_SIZE",
        "NEXT_PIECE_GRID_SIZE",
        "ROTATION_STATES",
        "DROP_POSITION_LIMIT",
        "MAX_ROTATION_STATE",
        "GRID_ROWS",
        "GRID_CELL_SIZE",
      ];
      expect(Object.keys(GAME_CONSTANTS.TETROMINO)).toEqual(expectedKeys);
    });
  });

  describe("ANIMATION constants", () => {
    test("should have expected animation sections", () => {
      const expectedKeys = [
        "SCORE",
        "LINES",
        "LEVEL",
        "DEFAULT",
        "CELL",
        "LINE_CLEAR_DURATION",
        "PIECE_PLACE_DURATION",
        "COMPLETION_DELAY",
      ];
      expect(Object.keys(GAME_CONSTANTS.ANIMATION)).toEqual(expectedKeys);
    });

    test("should have expected score animation values", () => {
      expect(GAME_CONSTANTS.ANIMATION.SCORE.STIFFNESS).toBe(300);
      expect(GAME_CONSTANTS.ANIMATION.SCORE.DAMPING).toBe(15);
    });

    test("should have expected lines animation values", () => {
      expect(GAME_CONSTANTS.ANIMATION.LINES.STIFFNESS).toBe(400);
      expect(GAME_CONSTANTS.ANIMATION.LINES.DAMPING).toBe(20);
    });

    test("should have expected level animation values", () => {
      expect(GAME_CONSTANTS.ANIMATION.LEVEL.STIFFNESS).toBe(250);
      expect(GAME_CONSTANTS.ANIMATION.LEVEL.DAMPING).toBe(12);
    });

    test("should have expected default animation values", () => {
      expect(GAME_CONSTANTS.ANIMATION.DEFAULT.STIFFNESS).toBe(300);
      expect(GAME_CONSTANTS.ANIMATION.DEFAULT.DAMPING).toBe(15);
    });

    test("should have expected cell animation values", () => {
      expect(GAME_CONSTANTS.ANIMATION.CELL.STIFFNESS).toBe(500);
      expect(GAME_CONSTANTS.ANIMATION.CELL.DAMPING).toBe(30);
      expect(GAME_CONSTANTS.ANIMATION.CELL.DURATION).toBe(0.25);
    });

    test("should have expected timing values", () => {
      expect(GAME_CONSTANTS.ANIMATION.LINE_CLEAR_DURATION).toBe(0.2);
      expect(GAME_CONSTANTS.ANIMATION.PIECE_PLACE_DURATION).toBe(0.15);
      expect(GAME_CONSTANTS.ANIMATION.COMPLETION_DELAY).toBe(10);
    });
  });

  describe("TOUCH constants", () => {
    test("should have expected touch values", () => {
      expect(GAME_CONSTANTS.TOUCH.MIN_SWIPE_DISTANCE).toBe(30);
      expect(GAME_CONSTANTS.TOUCH.MAX_SWIPE_TIME).toBe(500);
      expect(GAME_CONSTANTS.TOUCH.TAP_TIME).toBe(200);
      expect(GAME_CONSTANTS.TOUCH.DOUBLE_TAP_TIME).toBe(300);
      expect(GAME_CONSTANTS.TOUCH.LONG_SWIPE_MULTIPLIER).toBe(2);
    });

    test("should have logical touch relationships", () => {
      expect(GAME_CONSTANTS.TOUCH.DOUBLE_TAP_TIME).toBeGreaterThan(GAME_CONSTANTS.TOUCH.TAP_TIME);
      expect(GAME_CONSTANTS.TOUCH.MIN_SWIPE_DISTANCE).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.TOUCH.LONG_SWIPE_MULTIPLIER).toBeGreaterThan(1);
    });

    test("should have all expected touch keys", () => {
      const expectedKeys = [
        "MIN_SWIPE_DISTANCE",
        "MAX_SWIPE_TIME",
        "TAP_TIME",
        "DOUBLE_TAP_TIME",
        "LONG_SWIPE_MULTIPLIER",
      ];
      expect(Object.keys(GAME_CONSTANTS.TOUCH)).toEqual(expectedKeys);
    });
  });

  describe("UI constants", () => {
    test("should have expected UI values", () => {
      expect(GAME_CONSTANTS.UI.BUTTON_HEIGHT).toBe(48);
      expect(GAME_CONSTANTS.UI.BUTTON_WIDTH_SMALL).toBe(48);
      expect(GAME_CONSTANTS.UI.BUTTON_WIDTH_LARGE).toBe(64);
      expect(GAME_CONSTANTS.UI.HIGH_SCORE_LIST_MAX).toBe(10);
      expect(GAME_CONSTANTS.UI.DEFAULT_VOLUME).toBe(0.5);
    });

    test("should have logical UI relationships", () => {
      expect(GAME_CONSTANTS.UI.BUTTON_WIDTH_LARGE).toBeGreaterThan(
        GAME_CONSTANTS.UI.BUTTON_WIDTH_SMALL,
      );
      expect(GAME_CONSTANTS.UI.HIGH_SCORE_LIST_MAX).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.UI.DEFAULT_VOLUME).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.UI.DEFAULT_VOLUME).toBeLessThanOrEqual(1);
    });

    test("should have all expected UI keys", () => {
      const expectedKeys = [
        "BUTTON_HEIGHT",
        "BUTTON_WIDTH_SMALL",
        "BUTTON_WIDTH_LARGE",
        "HIGH_SCORE_LIST_MAX",
        "DEFAULT_VOLUME",
      ];
      expect(Object.keys(GAME_CONSTANTS.UI)).toEqual(expectedKeys);
    });
  });

  describe("SCORING constants", () => {
    test("should have expected scoring values", () => {
      expect(GAME_CONSTANTS.SCORING.BASE_SCORES).toEqual([0, 100, 300, 500, 800]);
      expect(GAME_CONSTANTS.SCORING.LEVEL_MULTIPLIER).toBe(1);
      expect(GAME_CONSTANTS.SCORING.LINES_PER_LEVEL).toBe(10);
    });

    test("should have ascending base scores", () => {
      const scores = GAME_CONSTANTS.SCORING.BASE_SCORES;
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
    });

    test("should have all expected scoring keys", () => {
      const expectedKeys = ["BASE_SCORES", "LEVEL_MULTIPLIER", "LINES_PER_LEVEL"];
      expect(Object.keys(GAME_CONSTANTS.SCORING)).toEqual(expectedKeys);
    });
  });

  describe("TYPES constants", () => {
    test("should have expected tetromino types", () => {
      expect(GAME_CONSTANTS.TYPES.TETROMINO_TYPES).toEqual(["I", "O", "T", "S", "Z", "J", "L"]);
      expect(GAME_CONSTANTS.TYPES.TETROMINO_TYPES).toHaveLength(7);
    });

    test("should have all expected types keys", () => {
      const expectedKeys = ["TETROMINO_TYPES"];
      expect(Object.keys(GAME_CONSTANTS.TYPES)).toEqual(expectedKeys);
    });
  });

  describe("PIECE_BAG constants", () => {
    test("should have expected piece bag values", () => {
      expect(GAME_CONSTANTS.PIECE_BAG.HISTORY_SIZE).toBe(14);
    });

    test("should have all expected piece bag keys", () => {
      const expectedKeys = ["HISTORY_SIZE"];
      expect(Object.keys(GAME_CONSTANTS.PIECE_BAG)).toEqual(expectedKeys);
    });

    test("should have logical piece bag relationships", () => {
      expect(GAME_CONSTANTS.PIECE_BAG.HISTORY_SIZE).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.PIECE_BAG.HISTORY_SIZE).toBeGreaterThan(
        GAME_CONSTANTS.TYPES.TETROMINO_TYPES.length,
      );
    });
  });

  describe("value types and ranges", () => {
    test("should have numeric values where expected", () => {
      const numericValues = [
        GAME_CONSTANTS.BOARD.WIDTH,
        GAME_CONSTANTS.BOARD.HEIGHT,
        GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS,
        GAME_CONSTANTS.TETROMINO.GRID_SIZE,
        GAME_CONSTANTS.ANIMATION.SCORE.STIFFNESS,
        GAME_CONSTANTS.TOUCH.MIN_SWIPE_DISTANCE,
        GAME_CONSTANTS.UI.BUTTON_HEIGHT,
        GAME_CONSTANTS.SCORING.LEVEL_MULTIPLIER,
      ];

      for (const value of numericValues) {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThan(0);
      }
    });

    test("should have array values where expected", () => {
      expect(Array.isArray(GAME_CONSTANTS.TETROMINO.ROTATION_STATES)).toBe(true);
      expect(Array.isArray(GAME_CONSTANTS.SCORING.BASE_SCORES)).toBe(true);
      expect(Array.isArray(GAME_CONSTANTS.TYPES.TETROMINO_TYPES)).toBe(true);
    });

    test("should have reasonable value ranges", () => {
      // Board dimensions should be reasonable
      expect(GAME_CONSTANTS.BOARD.WIDTH).toBeLessThan(100);
      expect(GAME_CONSTANTS.BOARD.HEIGHT).toBeLessThan(100);

      // Timing values should be reasonable (in milliseconds)
      expect(GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS).toBeLessThan(10000);
      expect(GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS).toBeGreaterThan(10);

      // Animation values should be reasonable
      expect(GAME_CONSTANTS.ANIMATION.SCORE.STIFFNESS).toBeLessThan(1000);
      expect(GAME_CONSTANTS.ANIMATION.SCORE.DAMPING).toBeLessThan(100);
    });
  });
});
