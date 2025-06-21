#!/usr/bin/env node

/**
 * Accessibility checker for Tetris game colors
 * Checks WCAG 2.1 contrast ratios and provides recommendations
 */

// Color definitions from the game
const colors = {
  // Tetromino colors
  I: "#06b6d4", // cyan-500
  O: "#eab308", // yellow-500
  T: "#a855f7", // purple-500
  S: "#22c55e", // green-500
  Z: "#ef4444", // red-500
  J: "#3b82f6", // blue-500
  L: "#f97316", // orange-500

  // Background colors
  background: "#0f172a", // slate-900
  boardBackground: "#1e293b", // slate-800
  cellEmpty: "#334155", // slate-600

  // Text colors
  textPrimary: "#ffffff", // white
  textSecondary: "#94a3b8", // slate-400
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
function checkWCAG(ratio) {
  return {
    AA_normal: ratio >= 4.5,
    AA_large: ratio >= 3.0,
    AAA_normal: ratio >= 7.0,
    AAA_large: ratio >= 4.5,
  };
}

/**
 * Color blindness simulation
 */
function simulateColorBlindness(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return null;

  // Protanopia (red-blind) simulation
  const protanopia = {
    r: Math.round(0.567 * rgb.r + 0.433 * rgb.g + 0.0 * rgb.b),
    g: Math.round(0.558 * rgb.r + 0.442 * rgb.g + 0.0 * rgb.b),
    b: Math.round(0.0 * rgb.r + 0.242 * rgb.g + 0.758 * rgb.b),
  };

  return `#${protanopia.r.toString(16).padStart(2, "0")}${protanopia.g.toString(16).padStart(2, "0")}${protanopia.b.toString(16).padStart(2, "0")}`;
}

console.log("🎮 Tetris Game Accessibility Report\n");
console.log("═══════════════════════════════════════════════════════════\n");

// Check text contrast ratios
console.log("📝 Text Contrast Ratios:");
console.log("─────────────────────────────────────────────────────────\n");

const textTests = [
  { name: "Primary text on background", fg: colors.textPrimary, bg: colors.background },
  { name: "Secondary text on background", fg: colors.textSecondary, bg: colors.background },
  { name: "Primary text on board", fg: colors.textPrimary, bg: colors.boardBackground },
  { name: "Secondary text on board", fg: colors.textSecondary, bg: colors.boardBackground },
];

textTests.forEach((test) => {
  const ratio = getContrastRatio(test.fg, test.bg);
  const wcag = checkWCAG(ratio);

  console.log(`${test.name}:`);
  console.log(`  Contrast ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  WCAG AA Normal: ${wcag.AA_normal ? "✅" : "❌"}`);
  console.log(`  WCAG AA Large: ${wcag.AA_large ? "✅" : "❌"}`);
  console.log(`  WCAG AAA Normal: ${wcag.AAA_normal ? "✅" : "❌"}`);
  console.log(`  WCAG AAA Large: ${wcag.AAA_large ? "✅" : "❌"}`);
  console.log("");
});

// Check tetromino colors against backgrounds
console.log("🎯 Tetromino Color Visibility:");
console.log("─────────────────────────────────────────────────────────\n");

const tetrominoes = ["I", "O", "T", "S", "Z", "J", "L"];
tetrominoes.forEach((piece) => {
  const ratio = getContrastRatio(colors[piece], colors.background);
  const wcag = checkWCAG(ratio);

  console.log(`${piece}-piece (${colors[piece]}):`);
  console.log(`  Contrast ratio: ${ratio.toFixed(2)}:1`);
  console.log(`  WCAG AA Large: ${wcag.AA_large ? "✅" : "❌"} (recommended for game elements)`);
  console.log("");
});

// Color blindness check
console.log("👁️  Color Blindness Simulation:");
console.log("─────────────────────────────────────────────────────────\n");

tetrominoes.forEach((piece) => {
  const original = colors[piece];
  const protanopia = simulateColorBlindness(original);

  console.log(`${piece}-piece:`);
  console.log(`  Original: ${original}`);
  console.log(`  Protanopia: ${protanopia}`);
  console.log("");
});

// Recommendations
console.log("💡 Recommendations:");
console.log("─────────────────────────────────────────────────────────\n");

console.log("1. Text contrast ratios appear to be good with white text on dark backgrounds");
console.log("2. Consider adding pattern/texture to tetromino pieces for color-blind users");
console.log("3. Ensure focus indicators have sufficient contrast");
console.log("4. Test with actual color blindness simulation tools for validation");
console.log("5. Consider adding a high contrast mode option");

console.log("\n═══════════════════════════════════════════════════════════");
