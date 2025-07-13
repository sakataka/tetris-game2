#!/usr/bin/env bun

/**
 * TypeScript Type Generation Script for Fine-Tune Configuration
 *
 * 🚨 AI-PROHIBITED: This script generates types from human-controlled schema
 * Automatically generates TypeScript types from JSON Schema to ensure type safety
 * while maintaining separation between human UX parameters and AI-controlled logic.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { compile } from "json-schema-to-typescript";

// Configuration paths
const SCHEMA_PATH = "src/game/animations/config/schema/fine-tune.schema.json";
const OUTPUT_PATH = "src/game/animations/config/types.generated.ts";
const PROJECT_ROOT = process.cwd();

// AI-Prohibited markers for generated files
const AI_PROHIBITED_HEADER = `// 🚨 AUTO-GENERATED - DO NOT EDIT
// 🚨 AI-PROHIBITED: Generated from human-controlled UX schema
// Generated from fine-tune.schema.json on ${new Date().toISOString()}
// 
// This file contains TypeScript types for animation configuration parameters
// that require human judgment and should NOT be modified by AI systems.
// 
// To update these types:
// 1. Modify the JSON Schema at: ${SCHEMA_PATH}
// 2. Run: bun run scripts/generate-config-types.ts
// 3. Commit both schema and generated types together
//
// DO NOT manually edit this file - changes will be overwritten!

`;

interface GenerationOptions {
  bannerComment?: string;
  style?: {
    bracketSpacing?: boolean;
    singleQuote?: boolean;
    semi?: boolean;
  };
}

/**
 * Load and validate JSON Schema
 */
async function loadSchema(): Promise<object> {
  const schemaPath = join(PROJECT_ROOT, SCHEMA_PATH);

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  try {
    const schemaContent = await readFile(schemaPath, "utf-8");
    const schema = JSON.parse(schemaContent);

    // Validate required schema properties
    if (!schema.$schema) {
      throw new Error("Schema missing $schema property");
    }

    if (!schema.title) {
      throw new Error("Schema missing title property");
    }

    if (schema.type !== "object") {
      throw new Error('Root schema must be of type "object"');
    }

    return schema;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in schema file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate TypeScript types from JSON Schema
 */
async function generateTypes(schema: object, options: GenerationOptions = {}): Promise<string> {
  try {
    const types = await compile(schema, "FineTuneConfig", {
      bannerComment: options.bannerComment || "",
      style: {
        bracketSpacing: false,
        singleQuote: true,
        semi: true,
        ...options.style,
      },
      additionalProperties: false,
      enableConstEnums: true,
      format: true,
      ignoreMinAndMaxItems: false,
      maxItems: 20,
      strictIndexSignatures: true,
      unknownAny: false,
      unreachableDefinitions: false,
    });

    return types;
  } catch (error) {
    throw new Error(
      `Type generation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Add custom utility types and exports
 */
function addUtilityTypes(): string {
  return `
// Utility types for configuration validation and type safety
export type ConfigurationKeys = keyof FineTuneConfig;
export type UITimingKeys = keyof FineTuneConfig['uiTimings'];

// Type guards for runtime type checking
export function isFineTuneConfig(value: unknown): value is FineTuneConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'uiTimings' in value &&
    'performanceBudgets' in value
  );
}

export function isUITimingConfig(value: unknown): value is FineTuneConfig['uiTimings'][string] {
  return (
    typeof value === 'object' &&
    value !== null &&
    'duration' in value &&
    'easing' in value &&
    typeof (value as Record<string, unknown>).duration === 'number' &&
    typeof (value as Record<string, unknown>).easing === 'string'
  );
}

// Configuration validation helpers
export interface ConfigValidationContext {
  path: string[];
  value: unknown;
  schema: object;
}

export type ConfigValidator<T> = (value: T, context: ConfigValidationContext) => string | null;

// Performance budget validation
export function validatePerformanceBudget(
  budget: FineTuneConfig['performanceBudgets'],
  _context: ConfigValidationContext
): string | null {
  if (budget.mainThreadBlocking > 16) {
    return 'Main thread blocking exceeds 60fps budget (16ms)';
  }
  
  if (budget.layoutThrashing > 5) {
    return 'Layout thrashing count too high for smooth animation';
  }
  
  return null;
}

// Accessibility compliance helpers
export function getAccessibilityAdjustedConfig(
  config: FineTuneConfig,
  preferences: {
    prefersReducedMotion?: boolean;
    prefersHighContrast?: boolean;
  }
): FineTuneConfig {
  if (!preferences.prefersReducedMotion && !preferences.prefersHighContrast) {
    return config;
  }
  
  const adjusted = { ...config };
  
  if (preferences.prefersReducedMotion && config.accessibilityOverrides?.reduceMotion) {
    const multiplier = config.accessibilityOverrides.reduceMotion.durationMultiplier;
    adjusted.uiTimings = Object.fromEntries(
      Object.entries(config.uiTimings).map(([key, timing]) => [
        key,
        {
          ...timing,
          duration: Math.round(timing.duration * multiplier),
          easing: config.accessibilityOverrides?.reduceMotion?.disableEasing 
            ? 'linear' 
            : timing.easing,
        },
      ])
    );
  }
  
  return adjusted;
}

// Development utilities
export const configTypeUtils = {
  /**
   * Get all UI timing keys for iteration
   */
  getUITimingKeys: (config: FineTuneConfig): UITimingKeys[] => 
    Object.keys(config.uiTimings) as UITimingKeys[],
    
  /**
   * Validate configuration structure at compile time
   */
  validateStructure: (_config: FineTuneConfig): true => true,
  
  /**
   * Get default configuration values
   */
  getDefaults: (): Partial<FineTuneConfig> => ({
    version: 'prototype-1.0',
    performanceBudgets: {
      mainThreadBlocking: 4,
      layoutThrashing: 1,
    },
  }),
} as const;

`;
}

/**
 * Ensure output directory exists
 */
async function ensureOutputDirectory(outputPath: string): Promise<void> {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Write generated types to file
 */
async function writeGeneratedTypes(content: string, outputPath: string): Promise<void> {
  await ensureOutputDirectory(outputPath);

  const fullContent = AI_PROHIBITED_HEADER + content + addUtilityTypes();

  await writeFile(outputPath, fullContent, "utf-8");
}

/**
 * Main generation function
 */
async function generateConfigTypes(): Promise<void> {
  console.log("🔧 Generating TypeScript types from fine-tune configuration schema...");

  try {
    // Load schema
    console.log(`📖 Loading schema from: ${SCHEMA_PATH}`);
    const schema = await loadSchema();

    // Generate types
    console.log("🏗️  Generating TypeScript definitions...");
    const types = await generateTypes(schema, {
      bannerComment: "// TypeScript definitions for Fine-Tune Animation Configuration\n",
    });

    // Write output
    const outputPath = join(PROJECT_ROOT, OUTPUT_PATH);
    console.log(`📝 Writing types to: ${OUTPUT_PATH}`);
    await writeGeneratedTypes(types, outputPath);

    console.log("✅ Type generation completed successfully!");
    console.log(`📋 Generated types saved to: ${outputPath}`);
    console.log("🚨 Remember: These types are auto-generated and should not be manually edited");
  } catch (error) {
    console.error("❌ Type generation failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🚨 AI-Prohibited Configuration Type Generator

Usage: bun run scripts/generate-config-types.ts [options]

Options:
  --help, -h     Show this help message
  --watch, -w    Watch for schema changes (not implemented)
  --validate     Validate existing types against schema

This script generates TypeScript types from the fine-tune configuration JSON Schema.
The generated types ensure type safety for human-controlled animation parameters.

Files:
  Input:  ${SCHEMA_PATH}
  Output: ${OUTPUT_PATH}

⚠️  The generated types file should not be manually edited.
    All changes should be made to the JSON Schema.
`);
    return;
  }

  if (args.includes("--validate")) {
    console.log("🔍 Validation mode not yet implemented");
    return;
  }

  await generateConfigTypes();
}

// Run if called directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { generateConfigTypes, loadSchema, generateTypes };
