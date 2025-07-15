/**
 * Legacy code cleanup script
 * Removes old files and updates imports
 */

const fs = require("node:fs");
const _path = require("node:path");
const glob = require("glob");

class LegacyCodeCleaner {
  constructor() {
    this.legacyFiles = [
      "src/store/gameStore.ts",
      "src/store/gameStore.test.ts",
      "src/components/OldGame.tsx",
      "src/hooks/useOldGameLoop.ts",
      "src/utils/oldGameLogic.ts",
    ];

    this.legacyImports = [
      { from: "useGameStore", to: "useGamePlay" },
      { from: "./store/gameStore", to: "./features/game-play" },
      { from: "OldGame", to: "GameBoard" },
    ];
  }

  async cleanup() {
    console.log("🧹 Starting legacy code cleanup...");

    // Remove legacy files
    await this.removeLegacyFiles();

    // Update imports
    await this.updateImports();

    // Verify no references remain
    await this.verifyCleanup();

    console.log("✅ Legacy cleanup completed!");
  }

  async removeLegacyFiles() {
    for (const file of this.legacyFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️  Removed ${file}`);
      }
    }
  }

  async updateImports() {
    const files = glob.sync("src/**/*.{ts,tsx}");

    for (const file of files) {
      let content = fs.readFileSync(file, "utf8");
      let modified = false;

      for (const { from, to } of this.legacyImports) {
        const regex = new RegExp(from, "g");
        if (content.includes(from)) {
          content = content.replace(regex, to);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(file, content);
        console.log(`📝 Updated imports in ${file}`);
      }
    }
  }

  async verifyCleanup() {
    const files = glob.sync("src/**/*.{ts,tsx}");
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      for (const { from } of this.legacyImports) {
        if (content.includes(from)) {
          violations.push({ file, term: from });
        }
      }
    }

    if (violations.length > 0) {
      console.warn("⚠️  Legacy references still found:");
      violations.forEach(({ file, term }) => {
        console.warn(`  ${file}: ${term}`);
      });
    } else {
      console.log("✅ No legacy references found");
    }
  }
}

// Run cleanup
if (require.main === module) {
  const cleaner = new LegacyCodeCleaner();
  cleaner.cleanup().catch(console.error);
}

module.exports = { LegacyCodeCleaner };
