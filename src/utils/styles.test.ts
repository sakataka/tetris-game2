import { describe, expect, test } from "bun:test";
import { BOARD_STYLES, CARD_STYLES, CONTROL_STYLES, MODAL_STYLES } from "./styles";

describe("styles", () => {
  describe("CARD_STYLES", () => {
    test("should have all expected card style keys", () => {
      const expectedKeys = ["base", "hover", "interactive"];
      expect(Object.keys(CARD_STYLES)).toEqual(expectedKeys);
    });

    test("should have expected base card styles", () => {
      expect(CARD_STYLES.base).toBe("bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl");
    });

    test("should have hover styles with transition", () => {
      expect(CARD_STYLES.hover).toContain("hover:bg-gray-900/60");
      expect(CARD_STYLES.hover).toContain("hover:border-gray-600");
      expect(CARD_STYLES.hover).toContain("transition-all");
      expect(CARD_STYLES.hover).toContain("duration-[300ms]");
    });

    test("should have interactive styles with transform", () => {
      expect(CARD_STYLES.interactive).toContain("hover:shadow-2xl");
      expect(CARD_STYLES.interactive).toContain("transform");
      expect(CARD_STYLES.interactive).toContain("hover:scale-105");
    });

    test("should have string values", () => {
      const values = Object.values(CARD_STYLES);
      for (const value of values) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  describe("BOARD_STYLES", () => {
    test("should have all expected board style keys", () => {
      const expectedKeys = [
        "container",
        "cell",
        "cellBorder",
        "emptyCellBorder",
        "activePiece",
        "ghostPiece",
        "clearingLine",
      ];
      expect(Object.keys(BOARD_STYLES)).toEqual(expectedKeys);
    });

    test("should have expected container styles", () => {
      expect(BOARD_STYLES.container).toBe("grid gap-[1px] bg-gray-700 p-1 rounded-sm");
    });

    test("should have expected cell styles", () => {
      expect(BOARD_STYLES.cell).toContain("w-[30px]");
      expect(BOARD_STYLES.cell).toContain("h-[30px]");
      expect(BOARD_STYLES.cell).toContain("rounded-sm");
      expect(BOARD_STYLES.cell).toContain("transition-all");
      expect(BOARD_STYLES.cell).toContain("duration-150");
    });

    test("should have expected cell border styles", () => {
      expect(BOARD_STYLES.cellBorder).toBe("border border-white/20 shadow-sm");
      expect(BOARD_STYLES.emptyCellBorder).toBe("border border-gray-700/50");
    });

    test("should have expected active piece styles", () => {
      expect(BOARD_STYLES.activePiece).toContain("shadow-white/50");
      expect(BOARD_STYLES.activePiece).toContain("shadow-lg");
      expect(BOARD_STYLES.activePiece).toContain("ring-1");
      expect(BOARD_STYLES.activePiece).toContain("ring-white/30");
    });

    test("should have expected ghost piece styles", () => {
      expect(BOARD_STYLES.ghostPiece).toContain("opacity-30");
      expect(BOARD_STYLES.ghostPiece).toContain("border");
      expect(BOARD_STYLES.ghostPiece).toContain("border-white/30");
      expect(BOARD_STYLES.ghostPiece).toContain("bg-gray-400/20");
    });

    test("should have expected clearing line styles", () => {
      expect(BOARD_STYLES.clearingLine).toContain("shadow-white/80");
      expect(BOARD_STYLES.clearingLine).toContain("shadow-xl");
      expect(BOARD_STYLES.clearingLine).toContain("ring-2");
      expect(BOARD_STYLES.clearingLine).toContain("ring-white/50");
      expect(BOARD_STYLES.clearingLine).toContain("animate-pulse");
    });
  });

  describe("MODAL_STYLES", () => {
    test("should have all expected modal style keys", () => {
      const expectedKeys = ["backdrop", "panel", "overlay", "separator"];
      expect(Object.keys(MODAL_STYLES)).toEqual(expectedKeys);
    });

    test("should have expected backdrop styles", () => {
      expect(MODAL_STYLES.backdrop).toBe("bg-gray-900/70 backdrop-blur-sm");
    });

    test("should have expected panel styles", () => {
      expect(MODAL_STYLES.panel).toBe("bg-gray-900 border-gray-700 shadow-lg");
    });

    test("should have expected overlay styles", () => {
      expect(MODAL_STYLES.overlay).toBe("bg-gray-900/95 border-gray-700 backdrop-blur-sm");
    });

    test("should have expected separator styles", () => {
      expect(MODAL_STYLES.separator).toBe("h-px bg-gray-700");
    });

    test("should have consistent gray color usage", () => {
      const values = Object.values(MODAL_STYLES);
      for (const value of values) {
        expect(value).toContain("gray-");
      }
    });
  });

  describe("CONTROL_STYLES", () => {
    test("should have all expected control style keys", () => {
      const expectedKeys = ["button", "interactiveItem", "toggleOn", "toggleOff", "toggleThumb"];
      expect(Object.keys(CONTROL_STYLES)).toEqual(expectedKeys);
    });

    test("should have expected button styles", () => {
      expect(CONTROL_STYLES.button).toContain("bg-gray-900/70");
      expect(CONTROL_STYLES.button).toContain("backdrop-blur-sm");
      expect(CONTROL_STYLES.button).toContain("border-gray-700");
      expect(CONTROL_STYLES.button).toContain("text-white");
      expect(CONTROL_STYLES.button).toContain("hover:bg-gray-800/70");
      expect(CONTROL_STYLES.button).toContain("transition-colors");
      expect(CONTROL_STYLES.button).toContain("border");
    });

    test("should have expected interactive item styles", () => {
      expect(CONTROL_STYLES.interactiveItem).toBe(
        "bg-gray-800/30 hover:bg-gray-700/30 transition-colors",
      );
    });

    test("should have expected toggle styles", () => {
      expect(CONTROL_STYLES.toggleOn).toBe("bg-blue-600");
      expect(CONTROL_STYLES.toggleOff).toBe("bg-gray-600");
    });

    test("should have expected toggle thumb styles", () => {
      expect(CONTROL_STYLES.toggleThumb).toBe("w-3 h-3 rounded-full bg-white transition-transform");
    });

    test("should have consistent transition usage", () => {
      expect(CONTROL_STYLES.button).toContain("transition-");
      expect(CONTROL_STYLES.interactiveItem).toContain("transition-");
      expect(CONTROL_STYLES.toggleThumb).toContain("transition-");
    });
  });

  describe("style consistency", () => {
    test("should use consistent backdrop blur", () => {
      expect(CARD_STYLES.base).toContain("backdrop-blur-sm");
      expect(MODAL_STYLES.backdrop).toContain("backdrop-blur-sm");
      expect(MODAL_STYLES.overlay).toContain("backdrop-blur-sm");
      expect(CONTROL_STYLES.button).toContain("backdrop-blur-sm");
    });

    test("should use consistent gray color scheme", () => {
      const allStyles = [
        ...Object.values(CARD_STYLES),
        ...Object.values(BOARD_STYLES),
        ...Object.values(MODAL_STYLES),
        ...Object.values(CONTROL_STYLES),
      ];

      const grayUsage = allStyles.filter((style) => style.includes("gray-"));
      expect(grayUsage.length).toBeGreaterThan(0);
    });

    test("should use consistent border styling", () => {
      expect(CARD_STYLES.base).toContain("border-gray-700");
      expect(MODAL_STYLES.panel).toContain("border-gray-700");
      expect(MODAL_STYLES.overlay).toContain("border-gray-700");
      expect(CONTROL_STYLES.button).toContain("border-gray-700");
    });

    test("should use consistent shadow styling", () => {
      expect(CARD_STYLES.base).toContain("shadow-xl");
      expect(CARD_STYLES.interactive).toContain("shadow-2xl");
      expect(MODAL_STYLES.panel).toContain("shadow-lg");
      expect(BOARD_STYLES.cellBorder).toContain("shadow-sm");
      expect(BOARD_STYLES.activePiece).toContain("shadow-lg");
      expect(BOARD_STYLES.clearingLine).toContain("shadow-xl");
    });

    test("should use consistent transition patterns", () => {
      expect(CARD_STYLES.hover).toContain("transition-all");
      expect(BOARD_STYLES.cell).toContain("transition-all");
      expect(CONTROL_STYLES.button).toContain("transition-colors");
      expect(CONTROL_STYLES.interactiveItem).toContain("transition-colors");
      expect(CONTROL_STYLES.toggleThumb).toContain("transition-transform");
    });
  });

  describe("constants immutability", () => {
    test("should be readonly constants", () => {
      expect(typeof CARD_STYLES).toBe("object");
      expect(typeof BOARD_STYLES).toBe("object");
      expect(typeof MODAL_STYLES).toBe("object");
      expect(typeof CONTROL_STYLES).toBe("object");
    });

    test("should not be null or undefined", () => {
      expect(CARD_STYLES).not.toBeNull();
      expect(BOARD_STYLES).not.toBeNull();
      expect(MODAL_STYLES).not.toBeNull();
      expect(CONTROL_STYLES).not.toBeNull();
    });
  });
});
