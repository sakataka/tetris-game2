import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie";
import type { GamePhase } from "@/game/ai/evaluators/new-weights";

/**
 * Schema version for weight configuration format
 */
export const CURRENT_SCHEMA_VERSION = "1.0";

/**
 * Metadata information for weight configuration
 */
export interface WeightMetadata {
  description: string;
  created: string;
  lastModified: string;
  version: string;
}

/**
 * Complete weight configuration structure
 */
export interface WeightConfiguration {
  schemaVersion: string;
  metadata: WeightMetadata;
  evaluators: {
    dellacherie: EvaluationWeights;
    phaseWeights: Record<GamePhase, EvaluationWeights>;
  };
  adjustments: {
    dangerZone: Record<string, number>;
    phaseAdjustments: Record<GamePhase, Record<string, number>>;
    survival: Record<string, number>;
    earlyGame: Record<string, number>;
    cleanup: Record<string, number>;
  };
}

/**
 * Load result with error handling
 */
export type LoadResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Weight loader class for managing AI evaluator weights
 * Handles YAML loading, schema validation, and compatibility
 */
export class WeightLoader {
  private static instance: WeightLoader | null = null;
  private cachedConfig: WeightConfiguration | null = null;

  private constructor() {
    // Future: This would be configurable for different environments
  }

  /**
   * Get singleton instance of WeightLoader
   */
  public static getInstance(): WeightLoader {
    if (!WeightLoader.instance) {
      WeightLoader.instance = new WeightLoader();
    }
    return WeightLoader.instance;
  }

  /**
   * Load and parse YAML configuration
   * @returns Promise resolving to the loaded configuration or error
   */
  public async loadConfiguration(): Promise<LoadResult<WeightConfiguration>> {
    try {
      // In a real implementation, this would load from the file system
      // For now, we'll return the hardcoded configuration
      const config = this.getDefaultConfiguration();

      // Validate schema version
      const validationResult = this.validateSchema(config);
      if (!validationResult.success) {
        return validationResult;
      }

      // Cache the configuration
      this.cachedConfig = config;

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get Dellacherie evaluator weights
   */
  public async getDellacherieWeights(): Promise<LoadResult<EvaluationWeights>> {
    const configResult = await this.loadConfiguration();
    if (!configResult.success) {
      return configResult;
    }

    return {
      success: true,
      data: { ...configResult.data.evaluators.dellacherie },
    };
  }

  /**
   * Get phase-specific weights
   */
  public async getPhaseWeights(phase: GamePhase): Promise<LoadResult<EvaluationWeights>> {
    const configResult = await this.loadConfiguration();
    if (!configResult.success) {
      return configResult;
    }

    const phaseWeights = configResult.data.evaluators.phaseWeights[phase];
    if (!phaseWeights) {
      return {
        success: false,
        error: `Phase weights not found for phase: ${phase}`,
      };
    }

    return {
      success: true,
      data: { ...phaseWeights },
    };
  }

  /**
   * Get all phase weights
   */
  public async getAllPhaseWeights(): Promise<LoadResult<Record<GamePhase, EvaluationWeights>>> {
    const configResult = await this.loadConfiguration();
    if (!configResult.success) {
      return configResult;
    }

    return {
      success: true,
      data: {
        early: { ...configResult.data.evaluators.phaseWeights.early },
        mid: { ...configResult.data.evaluators.phaseWeights.mid },
        late: { ...configResult.data.evaluators.phaseWeights.late },
      },
    };
  }

  /**
   * Get adjustment multipliers for a specific category
   */
  public async getAdjustmentMultipliers(
    category: keyof WeightConfiguration["adjustments"],
  ): Promise<LoadResult<Record<string, number>>> {
    const configResult = await this.loadConfiguration();
    if (!configResult.success) {
      return configResult;
    }

    const adjustments = configResult.data.adjustments[category];
    if (!adjustments) {
      return {
        success: false,
        error: `Adjustment category not found: ${category}`,
      };
    }

    return {
      success: true,
      data: { ...adjustments } as Record<string, number>,
    };
  }

  /**
   * Validate schema version and structure
   */
  private validateSchema(config: unknown): LoadResult<WeightConfiguration> {
    try {
      // Type guard for configuration structure
      if (!this.isValidConfiguration(config)) {
        return {
          success: false,
          error: "Invalid configuration structure",
        };
      }

      // Check schema version
      if (config.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        // Check for compatibility
        if (this.isCompatibleVersion(config.schemaVersion)) {
          console.warn(
            `Loading configuration with schema version ${config.schemaVersion}, current version is ${CURRENT_SCHEMA_VERSION}`,
          );
        } else {
          return {
            success: false,
            error: `Unsupported schema version: ${config.schemaVersion}. Current version: ${CURRENT_SCHEMA_VERSION}`,
          };
        }
      }

      // Validate weight structure
      const weightValidation = this.validateWeightStructure(config.evaluators);
      if (!weightValidation.success) {
        return weightValidation;
      }

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check if schema version is compatible
   */
  private isCompatibleVersion(version: string): boolean {
    // For now, only 1.0 is supported
    return version === "1.0";
  }

  /**
   * Type guard for configuration structure
   */
  private isValidConfiguration(config: unknown): config is WeightConfiguration {
    if (typeof config !== "object" || config === null) {
      return false;
    }

    const cfg = config as Record<string, unknown>;

    return (
      typeof cfg.schemaVersion === "string" &&
      typeof cfg.metadata === "object" &&
      typeof cfg.evaluators === "object" &&
      typeof cfg.adjustments === "object"
    );
  }

  /**
   * Validate weight structure for all evaluators
   */
  private validateWeightStructure(evaluators: unknown): LoadResult<void> {
    if (typeof evaluators !== "object" || evaluators === null) {
      return {
        success: false,
        error: "Invalid evaluators structure",
      };
    }

    const evaluatorConfig = evaluators as Record<string, unknown>;

    // Validate Dellacherie weights
    if (!this.isValidEvaluationWeights(evaluatorConfig.dellacherie)) {
      return {
        success: false,
        error: "Invalid Dellacherie weights structure",
      };
    }

    // Validate phase weights
    if (typeof evaluatorConfig.phaseWeights !== "object" || evaluatorConfig.phaseWeights === null) {
      return {
        success: false,
        error: "Invalid phase weights structure",
      };
    }

    const phaseWeights = evaluatorConfig.phaseWeights as Record<string, unknown>;
    const phases: GamePhase[] = ["early", "mid", "late"];

    for (const phase of phases) {
      if (!this.isValidEvaluationWeights(phaseWeights[phase])) {
        return {
          success: false,
          error: `Invalid ${phase} phase weights structure`,
        };
      }
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Type guard for EvaluationWeights
   */
  private isValidEvaluationWeights(weights: unknown): weights is EvaluationWeights {
    if (typeof weights !== "object" || weights === null) {
      return false;
    }

    const w = weights as Record<string, unknown>;

    // Check required weight properties
    const requiredProperties = [
      "landingHeight",
      "linesCleared",
      "potentialLinesFilled",
      "rowTransitions",
      "columnTransitions",
      "holes",
      "wells",
      "blocksAboveHoles",
      "wellOpen",
      "escapeRoute",
      "bumpiness",
      "maxHeight",
      "rowFillRatio",
    ];

    return requiredProperties.every((prop) => typeof w[prop] === "number");
  }

  /**
   * Get default configuration (fallback)
   */
  private getDefaultConfiguration(): WeightConfiguration {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      metadata: {
        description: "AI Evaluator Weight Configurations",
        created: "2025-01-09",
        lastModified: "2025-01-09",
        version: "1.0.0",
      },
      evaluators: {
        dellacherie: {
          landingHeight: -1.5,
          linesCleared: 1000.0,
          potentialLinesFilled: 200.0,
          rowTransitions: -1.0,
          columnTransitions: -3.0,
          holes: -5.0,
          wells: -1.0,
          blocksAboveHoles: -2.5,
          wellOpen: 0.0,
          escapeRoute: 0.0,
          bumpiness: -3.0,
          maxHeight: -15.0,
          rowFillRatio: 50.0,
        },
        phaseWeights: {
          early: {
            landingHeight: -1.3,
            linesCleared: 1000.0,
            potentialLinesFilled: 200.0,
            rowTransitions: -1.0,
            columnTransitions: -2.7,
            holes: -5.0,
            wells: -1.0,
            blocksAboveHoles: -2.7,
            wellOpen: 0.0,
            escapeRoute: 0.0,
            bumpiness: -0.7,
            maxHeight: -10.0,
            rowFillRatio: 50.0,
          },
          mid: {
            landingHeight: -1.4,
            linesCleared: 1000.0,
            potentialLinesFilled: 250.0,
            rowTransitions: -1.0,
            columnTransitions: -3.0,
            holes: -6.0,
            wells: -1.1,
            blocksAboveHoles: -3.3,
            wellOpen: 0.0,
            escapeRoute: 0.0,
            bumpiness: -0.8,
            maxHeight: -13.3,
            rowFillRatio: 60.0,
          },
          late: {
            landingHeight: -1.7,
            linesCleared: 1000.0,
            potentialLinesFilled: 300.0,
            rowTransitions: -1.2,
            columnTransitions: -3.3,
            holes: -6.7,
            wells: -1.3,
            blocksAboveHoles: -4.0,
            wellOpen: 0.0,
            escapeRoute: 0.0,
            bumpiness: -0.9,
            maxHeight: -20.0,
            rowFillRatio: 80.0,
          },
        },
      },
      adjustments: {
        dangerZone: {
          maxMultiplier: 1.4,
          linesCleared: 1.4,
          potentialLinesFilled: 1.3,
          landingHeight: 1.3,
          holes: 0.9,
          blocksAboveHoles: 1.2,
          wellOpen: 1.3,
          escapeRoute: 1.5,
        },
        phaseAdjustments: {
          early: {
            landingHeight: 0.9,
            linesCleared: 1.2,
            rowTransitions: 0.9,
            columnTransitions: 0.9,
            holes: 0.9,
            blocksAboveHoles: 0.9,
            wellOpen: 1.1,
            escapeRoute: 1.1,
          },
          mid: {
            landingHeight: 0.95,
            linesCleared: 1.3,
            holes: 0.95,
            wells: 0.9,
            blocksAboveHoles: 0.95,
            wellOpen: 1.2,
            escapeRoute: 1.1,
          },
          late: {
            landingHeight: 1.0,
            linesCleared: 1.5,
            holes: 1.0,
            wells: 1.0,
            blocksAboveHoles: 1.1,
            wellOpen: 1.3,
            escapeRoute: 1.2,
          },
        },
        survival: {
          maxMultiplier: 1.3,
          linesCleared: 1.6,
          holes: 1.15,
          wells: 1.1,
          rowTransitions: 1.15,
          columnTransitions: 1.1,
          blocksAboveHoles: 1.2,
          wellOpen: 1.4,
          escapeRoute: 1.6,
        },
        earlyGame: {
          landingHeight: 0.85,
          linesCleared: 1.4,
          rowTransitions: 0.85,
          columnTransitions: 0.85,
          holes: 0.85,
          wells: 0.75,
          blocksAboveHoles: 0.85,
          wellOpen: 1.15,
          escapeRoute: 1.1,
        },
        cleanup: {
          linesCleared: 1.2,
          holes: 1.1,
          rowTransitions: 1.0,
          columnTransitions: 1.0,
          blocksAboveHoles: 1.2,
          wellOpen: 1.2,
          escapeRoute: 1.1,
        },
      },
    };
  }

  /**
   * Clear cached configuration
   */
  public clearCache(): void {
    this.cachedConfig = null;
  }

  /**
   * Get cached configuration if available
   */
  public getCachedConfiguration(): WeightConfiguration | null {
    return this.cachedConfig;
  }
}

/**
 * Convenience function to get the default weight loader instance
 */
export function getWeightLoader(): WeightLoader {
  return WeightLoader.getInstance();
}

/**
 * Load Dellacherie weights (convenience function)
 */
export async function loadDellacherieWeights(): Promise<LoadResult<EvaluationWeights>> {
  return getWeightLoader().getDellacherieWeights();
}

/**
 * Load phase weights (convenience function)
 */
export async function loadPhaseWeights(phase: GamePhase): Promise<LoadResult<EvaluationWeights>> {
  return getWeightLoader().getPhaseWeights(phase);
}

/**
 * Load all phase weights (convenience function)
 */
export async function loadAllPhaseWeights(): Promise<
  LoadResult<Record<GamePhase, EvaluationWeights>>
> {
  return getWeightLoader().getAllPhaseWeights();
}
