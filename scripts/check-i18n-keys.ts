#!/usr/bin/env bun

/**
 * i18n Key Consistency Checker
 *
 * This script validates the consistency between translation keys used in the codebase
 * and the keys defined in translation files. It helps prevent issues like missing
 * translations or outdated key references.
 *
 * Features:
 * - Extracts all translation keys from JSON files
 * - Finds all t() function calls in TypeScript/TSX files
 * - Reports missing keys and unused translations
 * - Supports nested key structures (dot notation)
 *
 * Usage:
 *   bun run scripts/check-i18n-keys.ts
 *   bun run check:i18n
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

interface CheckResult {
  missingKeys: string[];
  unusedKeys: string[];
  usedKeys: string[];
  translationKeys: string[];
}

/**
 * Recursively extracts all dot-notation keys from a nested object
 */
function extractKeysFromObject(obj: TranslationKeys, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      keys.push(fullKey);
    } else if (typeof value === "object" && value !== null) {
      keys.push(...extractKeysFromObject(value, fullKey));
    }
  }

  return keys;
}

/**
 * Loads and extracts all translation keys from JSON files in locales directory
 */
function loadTranslationKeys(localesDir: string): string[] {
  const files = readdirSync(localesDir).filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    throw new Error(`No translation files found in ${localesDir}`);
  }

  // Use the first translation file as the reference
  const referenceFile = files[0];
  const filePath = join(localesDir, referenceFile);

  try {
    const content = readFileSync(filePath, "utf-8");
    const translations: TranslationKeys = JSON.parse(content);
    return extractKeysFromObject(translations);
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error}`);
  }
}

/**
 * Recursively finds all TypeScript/TSX files in a directory
 */
function findSourceFiles(dir: string): string[] {
  const files: string[] = [];

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!["node_modules", "dist", ".git", "coverage"].includes(item)) {
        files.push(...findSourceFiles(fullPath));
      }
    } else if (stat.isFile()) {
      const ext = extname(item);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Extracts translation keys from t() function calls in source code
 * Supports various patterns:
 * - t("key")
 * - t('key')
 * - t(`key`)
 * - t("nested.key.path")
 */
function extractUsedKeys(sourceFiles: string[]): string[] {
  const usedKeys = new Set<string>();

  // Regular expressions for different t() call patterns
  const patterns = [
    /\bt\s*\(\s*["']([^"']+)["']\s*\)/g, // t("key") or t('key')
    /\bt\s*\(\s*`([^`]+)`\s*\)/g, // t(`key`)
  ];

  for (const filePath of sourceFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: necessary for regex iteration
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          // Skip template literal variables and complex expressions
          if (!key.includes("${") && !key.includes("`")) {
            usedKeys.add(key);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return Array.from(usedKeys).sort();
}

/**
 * Formats results for console output with colors
 */
function formatResults(result: CheckResult): string {
  const { missingKeys, unusedKeys, usedKeys, translationKeys } = result;

  let output = "";

  // Header
  output += "🔍 i18n Key Consistency Check Results\n";
  output += "=====================================\n\n";

  // Statistics
  output += "📊 Statistics:\n";
  output += `   Translation keys: ${translationKeys.length}\n`;
  output += `   Used keys: ${usedKeys.length}\n`;
  output += `   Missing keys: ${missingKeys.length}\n`;
  output += `   Unused keys: ${unusedKeys.length}\n\n`;

  // Missing keys (used but not defined)
  if (missingKeys.length > 0) {
    output += `❌ Missing Keys (${missingKeys.length}):\n`;
    output += "   These keys are used in code but not defined in translation files:\n";
    for (const key of missingKeys) {
      output += `   - ${key}\n`;
    }
    output += "\n";
  }

  // Unused keys (defined but not used)
  if (unusedKeys.length > 0) {
    output += `⚠️  Unused Keys (${unusedKeys.length}):\n`;
    output += "   These keys are defined in translation files but not used in code:\n";
    for (const key of unusedKeys) {
      output += `   - ${key}\n`;
    }
    output += "\n";
  }

  // Success message
  if (missingKeys.length === 0 && unusedKeys.length === 0) {
    output += "✅ All translation keys are consistent!\n";
  }

  return output;
}

/**
 * Main function to check i18n key consistency
 */
function checkI18nKeys(): CheckResult {
  const projectRoot = process.cwd();
  const localesDir = join(projectRoot, "src", "locales");
  const sourceDir = join(projectRoot, "src");

  console.log("🔍 Checking i18n key consistency...\n");

  // Load translation keys
  console.log("📚 Loading translation keys...");
  const translationKeys = loadTranslationKeys(localesDir);
  console.log(`   Found ${translationKeys.length} translation keys\n`);

  // Find source files
  console.log("📁 Scanning source files...");
  const sourceFiles = findSourceFiles(sourceDir);
  console.log(`   Found ${sourceFiles.length} source files\n`);

  // Extract used keys
  console.log("🔎 Extracting used keys from source code...");
  const usedKeys = extractUsedKeys(sourceFiles);
  console.log(`   Found ${usedKeys.length} used keys\n`);

  // Compare keys
  console.log("⚖️  Comparing keys...\n");

  const translationKeySet = new Set(translationKeys);
  const usedKeySet = new Set(usedKeys);

  const missingKeys = usedKeys.filter((key) => !translationKeySet.has(key));
  const unusedKeys = translationKeys.filter((key) => !usedKeySet.has(key));

  return {
    missingKeys,
    unusedKeys,
    usedKeys,
    translationKeys,
  };
}

// Main execution
if (import.meta.main) {
  try {
    const result = checkI18nKeys();
    console.log(formatResults(result));

    // Exit with error code if there are issues
    if (result.missingKeys.length > 0) {
      console.error("💥 Build failed: Missing translation keys detected!");
      process.exit(1);
    }

    if (result.unusedKeys.length > 0) {
      console.warn("⚠️  Warning: Unused translation keys detected!");
      // Don't exit with error for unused keys, just warn
    }

    console.log("✨ i18n key consistency check completed successfully!");
  } catch (error) {
    console.error(`💥 Error: ${error}`);
    process.exit(1);
  }
}

export { checkI18nKeys, extractKeysFromObject, extractUsedKeys, loadTranslationKeys };
