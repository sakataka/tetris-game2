#!/usr/bin/env bun

/**
 * i18n Key Consistency Checker
 *
 * Comprehensive i18n analysis tool that checks for:
 * 1. Missing translation keys (used but not defined)
 * 2. Unused translation keys (defined but not used)
 * 3. Dynamic key patterns like t(`game.${type}`)
 * 4. Hardcoded strings that should use i18n
 * 5. Potential translation candidates
 *
 * Features:
 * - Detects dynamic key construction patterns
 * - Finds hardcoded user-facing strings
 * - Validates actual key existence in translation files
 * - Suggests improvements for i18n compliance
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
  dynamicPatterns: DynamicPattern[];
  hardcodedStrings: HardcodedString[];
  potentialKeys: string[];
}

interface DynamicPattern {
  pattern: string;
  file: string;
  line: number;
  possibleKeys: string[];
}

interface HardcodedString {
  text: string;
  file: string;
  line: number;
  context: string;
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
 * Extract dynamic patterns like t(`game.${type}`)
 */
function extractDynamicPatterns(sourceFiles: string[]): DynamicPattern[] {
  const patterns: DynamicPattern[] = [];

  // Pattern for template literals in t() calls
  const dynamicPattern = /\bt\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`\s*\)/g;

  for (const filePath of sourceFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const _lines = content.split("\n");

      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: necessary for regex iteration
      while ((match = dynamicPattern.exec(content)) !== null) {
        const pattern = match[1];
        const matchIndex = match.index;

        // Find line number
        const beforeMatch = content.substring(0, matchIndex);
        const lineNumber = beforeMatch.split("\n").length;

        // Try to generate possible keys based on common patterns
        const possibleKeys = generatePossibleKeys(pattern);

        patterns.push({
          pattern,
          file: filePath,
          line: lineNumber,
          possibleKeys,
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return patterns;
}

/**
 * Generate possible keys from dynamic patterns
 */
function generatePossibleKeys(pattern: string): string[] {
  const keys: string[] = [];

  // Handle dynamic type patterns
  const gamePrefix = "game.";
  const dollarSign = "$";
  const typeVariable = `${dollarSign}{type}`;
  if (pattern.includes(gamePrefix + typeVariable)) {
    const knownTypes = ["hold", "next"];
    for (const type of knownTypes) {
      keys.push(pattern.replace(/\$\{type\}/g, type));
    }
  }

  // Add more pattern recognition as needed

  return keys;
}

/**
 * Find hardcoded strings that should potentially use i18n
 */
function findHardcodedStrings(sourceFiles: string[]): HardcodedString[] {
  const hardcodedStrings: HardcodedString[] = [];

  // Patterns for likely user-facing strings
  const stringPatterns = [
    /"([A-Z][a-zA-Z\s:]{2,}[a-z])"/g, // "Title Case Strings"
    /'([A-Z][a-zA-Z\s:]{2,}[a-z])'/g, // 'Title Case Strings'
  ];

  // Exclude patterns (technical strings, file paths, etc.)
  const excludePatterns = [
    /\.(ts|tsx|js|jsx|css|json|md)$/,
    /^https?:\/\//,
    /^\/[a-z]/,
    /^[a-z]+[A-Z]/, // camelCase
    /\d+/, // Contains numbers
    /^[A-Z_]+$/, // CONSTANTS
  ];

  for (const filePath of sourceFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (const pattern of stringPatterns) {
        let match: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: necessary for regex iteration
        while ((match = pattern.exec(content)) !== null) {
          const text = match[1];
          const matchIndex = match.index;

          // Skip if matches exclude patterns
          if (excludePatterns.some((exclude) => exclude.test(text))) {
            continue;
          }

          // Find line number and context
          const beforeMatch = content.substring(0, matchIndex);
          const lineNumber = beforeMatch.split("\n").length;
          const contextLine = lines[lineNumber - 1] || "";

          hardcodedStrings.push({
            text,
            file: filePath,
            line: lineNumber,
            context: contextLine.trim(),
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return hardcodedStrings;
}

/**
 * Extract regular translation keys from t() function calls
 */
function extractUsedKeys(sourceFiles: string[]): string[] {
  const usedKeys = new Set<string>();

  // Regular expressions for different t() call patterns
  const patterns = [
    /\bt\s*\(\s*["']([^"'${]+)["']\s*\)/g, // t("key") or t('key') - excluding template vars
  ];

  for (const filePath of sourceFiles) {
    try {
      const content = readFileSync(filePath, "utf-8");

      for (const pattern of patterns) {
        let match: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: necessary for regex iteration
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          usedKeys.add(key);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error}`);
    }
  }

  return Array.from(usedKeys).sort();
}

/**
 * Enhanced check function
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
  console.log(`   Found ${usedKeys.length} static keys\n`);

  // Extract dynamic patterns
  console.log("🔄 Analyzing dynamic key patterns...");
  const dynamicPatterns = extractDynamicPatterns(sourceFiles);
  console.log(`   Found ${dynamicPatterns.length} dynamic patterns\n`);

  // Find hardcoded strings
  console.log("📝 Detecting hardcoded strings...");
  const hardcodedStrings = findHardcodedStrings(sourceFiles);
  console.log(`   Found ${hardcodedStrings.length} potential hardcoded strings\n`);

  // Generate potential keys from dynamic patterns
  const potentialKeys = dynamicPatterns.flatMap((dp) => dp.possibleKeys);

  // Compare keys
  console.log("⚖️  Comparing keys...\n");

  const translationKeySet = new Set(translationKeys);
  const allUsedKeys = [...usedKeys, ...potentialKeys];
  const usedKeySet = new Set(allUsedKeys);

  const missingKeys = allUsedKeys.filter((key) => !translationKeySet.has(key));
  const unusedKeys = translationKeys.filter((key) => !usedKeySet.has(key));

  return {
    missingKeys,
    unusedKeys,
    usedKeys: allUsedKeys,
    translationKeys,
    dynamicPatterns,
    hardcodedStrings,
    potentialKeys,
  };
}

/**
 * Format enhanced results
 */
function formatResults(result: CheckResult): string {
  const { missingKeys, unusedKeys, usedKeys, translationKeys, dynamicPatterns, hardcodedStrings } =
    result;

  let output = "";

  // Header
  output += "🔍 i18n Key Consistency Check Results\n";
  output += "=====================================\n\n";

  // Statistics
  output += "📊 Statistics:\n";
  output += `   Translation keys: ${translationKeys.length}\n`;
  output += `   Used keys: ${usedKeys.length}\n`;
  output += `   Missing keys: ${missingKeys.length}\n`;
  output += `   Unused keys: ${unusedKeys.length}\n`;
  output += `   Dynamic patterns: ${dynamicPatterns.length}\n`;
  output += `   Hardcoded strings: ${hardcodedStrings.length}\n\n`;

  // Missing keys
  if (missingKeys.length > 0) {
    output += `❌ Missing Keys (${missingKeys.length}):\n`;
    output += "   These keys are used in code but not defined in translation files:\n";
    for (const key of missingKeys) {
      output += `   - ${key}\n`;
    }
    output += "\n";
  }

  // Dynamic patterns
  if (dynamicPatterns.length > 0) {
    output += `🔄 Dynamic Key Patterns (${dynamicPatterns.length}):\n`;
    output += "   These dynamic patterns need verification:\n";
    for (const dp of dynamicPatterns) {
      output += `   - Pattern: t(\`${dp.pattern}\`) in ${dp.file}:${dp.line}\n`;
      output += `     Possible keys: ${dp.possibleKeys.join(", ")}\n`;
    }
    output += "\n";
  }

  // Hardcoded strings
  if (hardcodedStrings.length > 0) {
    output += `📝 Hardcoded Strings (${hardcodedStrings.length}):\n`;
    output += "   These strings should potentially use i18n:\n";
    const uniqueStrings = [...new Set(hardcodedStrings.map((hs) => hs.text))];
    for (const text of uniqueStrings.slice(0, 10)) {
      // Limit output
      const examples = hardcodedStrings.filter((hs) => hs.text === text).slice(0, 2);
      output += `   - "${text}"\n`;
      for (const ex of examples) {
        output += `     Found in: ${ex.file}:${ex.line}\n`;
      }
    }
    if (uniqueStrings.length > 10) {
      output += `     ... and ${uniqueStrings.length - 10} more\n`;
    }
    output += "\n";
  }

  // Unused keys
  if (unusedKeys.length > 0) {
    output += `⚠️  Unused Keys (${unusedKeys.length}):\n`;
    output += "   These keys are defined in translation files but not used in code:\n";
    for (const key of unusedKeys.slice(0, 10)) {
      // Limit output
      output += `   - ${key}\n`;
    }
    if (unusedKeys.length > 10) {
      output += `     ... and ${unusedKeys.length - 10} more\n`;
    }
    output += "\n";
  }

  // Success message
  if (missingKeys.length === 0 && hardcodedStrings.length === 0) {
    output += "✅ All translation keys are consistent!\n";
  }

  return output;
}

// Main execution
if (import.meta.main) {
  try {
    const result = checkI18nKeys();
    console.log(formatResults(result));

    // Exit with error code if there are critical issues
    if (result.missingKeys.length > 0) {
      console.error("💥 Critical: Missing translation keys detected!");
      process.exit(1);
    }

    if (result.hardcodedStrings.length > 0) {
      console.warn("⚠️  Warning: Hardcoded strings detected that should use i18n!");
    }

    if (result.unusedKeys.length > 0) {
      console.warn("⚠️  Warning: Unused translation keys detected!");
    }

    console.log("✨ i18n key consistency check completed successfully!");
  } catch (error) {
    console.error(`💥 Error: ${error}`);
    process.exit(1);
  }
}

export { checkI18nKeys, extractKeysFromObject, extractUsedKeys, loadTranslationKeys };
