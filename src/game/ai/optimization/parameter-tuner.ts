import type { TetrominoTypeName } from "@/types/game";
import { AdvancedAIEngine } from "../core/advanced-ai-engine";
import type { BitBoard } from "../core/bitboard";

// Parameter ranges for optimization
export interface ParameterRange {
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  type: "integer" | "float";
}

// Optimization methods
export type OptimizationMethod = "grid" | "random" | "bayesian" | "genetic";

// Tuning configuration
export interface TuningConfig {
  parameters: ParameterRange[];
  objectiveFunction: (params: number[]) => Promise<number>;
  method: OptimizationMethod;
  maxIterations: number;
  convergenceThreshold: number;
  populationSize?: number; // For genetic algorithm
  mutationRate?: number; // For genetic algorithm
  crossoverRate?: number; // For genetic algorithm
}

// Optimization result
export interface OptimalParameters {
  parameters: number[];
  score: number;
  iteration: number;
  convergenceReached: boolean;
  evaluationHistory: EvaluationPoint[];
}

interface EvaluationPoint {
  parameters: number[];
  score: number;
  iteration: number;
  timestamp: number;
}

// Predefined parameter ranges for Tetris AI
export const TETRIS_AI_PARAMETERS: ParameterRange[] = [
  // Dellacherie weights
  { name: "landingHeight", min: -10, max: 10, default: -4.5, type: "float" },
  { name: "linesCleared", min: 0, max: 50, default: 3.4, type: "float" },
  { name: "rowTransitions", min: -20, max: 0, default: -3.2, type: "float" },
  { name: "columnTransitions", min: -20, max: 0, default: -9.6, type: "float" },
  { name: "holes", min: -20, max: 0, default: -7.9, type: "float" },
  { name: "wells", min: -10, max: 0, default: -3.3, type: "float" },

  // Advanced features weights
  { name: "blocksAboveHoles", min: -200, max: 0, default: -45, type: "float" },
  { name: "patternBonus", min: 0, max: 300, default: 100, type: "float" },
  { name: "tSpinBonus", min: 0, max: 500, default: 200, type: "float" },
  { name: "perfectClearBonus", min: 0, max: 1000, default: 500, type: "float" },

  // Search parameters
  { name: "beamWidth", min: 10, max: 100, default: 30, step: 5, type: "integer" },
  { name: "maxDepth", min: 2, max: 5, default: 3, type: "integer" },
  { name: "diversityRatio", min: 0, max: 1, default: 0.3, type: "float" },
  { name: "explorationBonus", min: 0, max: 1, default: 0.1, type: "float" },

  // Phase transition thresholds
  { name: "earlyToMidThreshold", min: 3, max: 10, default: 6, type: "integer" },
  { name: "midToLateThreshold", min: 8, max: 16, default: 12, type: "integer" },
  { name: "dangerZoneThreshold", min: 14, max: 18, default: 16, type: "integer" },
];

export class ParameterTuner {
  private config: TuningConfig;
  private evaluationHistory: EvaluationPoint[] = [];
  private bestParameters: number[] = [];
  private bestScore = Number.NEGATIVE_INFINITY;
  private currentIteration = 0;

  constructor(config: TuningConfig) {
    this.config = config;
    this.bestParameters = config.parameters.map((p) => p.default);
  }

  async optimize(): Promise<OptimalParameters> {
    console.log(`🚀 Starting parameter optimization using ${this.config.method} method`);
    console.log(`Parameters to optimize: ${this.config.parameters.map((p) => p.name).join(", ")}`);

    const optimizer = this.createOptimizer();
    let stagnationCount = 0;
    const maxStagnation = Math.max(10, Math.floor(this.config.maxIterations * 0.1));

    for (
      this.currentIteration = 0;
      this.currentIteration < this.config.maxIterations;
      this.currentIteration++
    ) {
      const candidates = optimizer.generateCandidates(this.bestParameters);

      // Evaluate all candidates in parallel
      const results = await Promise.all(
        candidates.map(async (params, index) => {
          try {
            const score = await this.config.objectiveFunction(params);
            this.logEvaluation(params, score);
            return { params, score, index };
          } catch (error) {
            console.warn(`Evaluation failed for candidate ${index}:`, error);
            return { params, score: Number.NEGATIVE_INFINITY, index };
          }
        }),
      );

      // Update best parameters
      const previousBestScore = this.bestScore;
      for (const result of results) {
        if (result.score > this.bestScore) {
          this.bestScore = result.score;
          this.bestParameters = [...result.params];
          stagnationCount = 0;
        }
      }

      // Check for stagnation
      if (this.bestScore === previousBestScore) {
        stagnationCount++;
      }

      // Log progress
      if (this.currentIteration % 10 === 0 || this.currentIteration < 10) {
        console.log(
          `Iteration ${this.currentIteration}: Best score = ${this.bestScore.toFixed(3)}`,
        );
      }

      // Check convergence
      if (this.hasConverged() || stagnationCount >= maxStagnation) {
        console.log(`Convergence reached at iteration ${this.currentIteration}`);
        break;
      }

      // Update optimizer state
      optimizer.updateState(results);
    }

    const result: OptimalParameters = {
      parameters: this.bestParameters,
      score: this.bestScore,
      iteration: this.currentIteration,
      convergenceReached: this.hasConverged(),
      evaluationHistory: [...this.evaluationHistory],
    };

    this.logOptimizationResult(result);
    return result;
  }

  private createOptimizer(): Optimizer {
    switch (this.config.method) {
      case "grid":
        return new GridSearchOptimizer(this.config);
      case "random":
        return new RandomSearchOptimizer(this.config);
      case "bayesian":
        return new BayesianOptimizer(this.config);
      case "genetic":
        return new GeneticOptimizer(this.config);
      default:
        throw new Error(`Unknown optimization method: ${this.config.method}`);
    }
  }

  private logEvaluation(params: number[], score: number): void {
    this.evaluationHistory.push({
      parameters: [...params],
      score,
      iteration: this.currentIteration,
      timestamp: Date.now(),
    });
  }

  private hasConverged(): boolean {
    if (this.evaluationHistory.length < 20) return false;

    const recent = this.evaluationHistory.slice(-20);
    const scores = recent.map((e) => e.score);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return stdDev < this.config.convergenceThreshold;
  }

  private logOptimizationResult(result: OptimalParameters): void {
    console.log("\n🎯 Optimization Results");
    console.log("======================");
    console.log(`Best score: ${result.score.toFixed(3)}`);
    console.log(`Iterations: ${result.iteration}`);
    console.log(`Convergence: ${result.convergenceReached ? "Yes" : "No"}`);
    console.log("\nOptimal Parameters:");

    result.parameters.forEach((value, index) => {
      const param = this.config.parameters[index];
      console.log(`  ${param.name}: ${value.toFixed(3)} (default: ${param.default})`);
    });
  }
}

// Abstract optimizer interface
abstract class Optimizer {
  protected config: TuningConfig;

  constructor(config: TuningConfig) {
    this.config = config;
  }

  abstract generateCandidates(bestParams: number[]): number[][];
  abstract updateState(results: { params: number[]; score: number; index: number }[]): void;

  protected generateRandomCandidate(): number[] {
    return this.config.parameters.map((param) => {
      if (param.type === "integer") {
        const range = param.max - param.min;
        const step = param.step || 1;
        const steps = Math.floor(range / step);
        return param.min + Math.floor(Math.random() * (steps + 1)) * step;
      }
      return param.min + Math.random() * (param.max - param.min);
    });
  }

  protected clampParameters(params: number[]): number[] {
    return params.map((value, index) => {
      const param = this.config.parameters[index];
      let clampedValue = Math.max(param.min, Math.min(param.max, value));

      if (param.type === "integer") {
        clampedValue = Math.round(clampedValue);
        if (param.step) {
          clampedValue =
            param.min + Math.round((clampedValue - param.min) / param.step) * param.step;
        }
      }

      return clampedValue;
    });
  }
}

// Grid Search Optimizer
class GridSearchOptimizer extends Optimizer {
  private gridPoints: number[][] = [];
  private currentIndex = 0;

  constructor(config: TuningConfig) {
    super(config);
    this.generateGrid();
  }

  generateCandidates(bestParams: number[]): number[][] {
    const batchSize = 8;
    const candidates: number[][] = [];

    for (let i = 0; i < batchSize && this.currentIndex < this.gridPoints.length; i++) {
      candidates.push(this.gridPoints[this.currentIndex++]);
    }

    return candidates;
  }

  updateState(results: { params: number[]; score: number; index: number }[]): void {
    // Grid search doesn't need state updates
  }

  private generateGrid(): void {
    // Generate a subset of grid points for feasible computation
    const gridResolution = Math.max(3, Math.floor(1000 ** (1 / this.config.parameters.length)));

    this.gridPoints = this.generateGridRecursive(0, [], gridResolution);
    console.log(`Generated ${this.gridPoints.length} grid points`);
  }

  private generateGridRecursive(
    paramIndex: number,
    currentPoint: number[],
    resolution: number,
  ): number[][] {
    if (paramIndex >= this.config.parameters.length) {
      return [currentPoint];
    }

    const param = this.config.parameters[paramIndex];
    const points: number[][] = [];

    for (let i = 0; i < resolution; i++) {
      const ratio = i / (resolution - 1);
      let value = param.min + ratio * (param.max - param.min);

      if (param.type === "integer") {
        value = Math.round(value);
        if (param.step) {
          value = param.min + Math.round((value - param.min) / param.step) * param.step;
        }
      }

      const newPoint = [...currentPoint, value];
      points.push(...this.generateGridRecursive(paramIndex + 1, newPoint, resolution));
    }

    return points;
  }
}

// Random Search Optimizer
class RandomSearchOptimizer extends Optimizer {
  generateCandidates(bestParams: number[]): number[][] {
    const candidates: number[][] = [];
    const batchSize = 16;

    for (let i = 0; i < batchSize; i++) {
      candidates.push(this.generateRandomCandidate());
    }

    return candidates;
  }

  updateState(results: { params: number[]; score: number; index: number }[]): void {
    // Random search doesn't need state updates
  }
}

// Simplified Bayesian Optimizer
class BayesianOptimizer extends Optimizer {
  private observations: { params: number[]; score: number }[] = [];

  generateCandidates(bestParams: number[]): number[][] {
    const candidates: number[][] = [];
    const batchSize = 8;

    // Generate candidates using acquisition function (simplified)
    for (let i = 0; i < batchSize; i++) {
      if (this.observations.length < 5 || Math.random() < 0.3) {
        // Exploration: random candidate
        candidates.push(this.generateRandomCandidate());
      } else {
        // Exploitation: perturb best parameters
        const perturbedCandidate = bestParams.map((value, index) => {
          const param = this.config.parameters[index];
          const range = param.max - param.min;
          const noise = (Math.random() - 0.5) * range * 0.1; // 10% noise
          return value + noise;
        });
        candidates.push(this.clampParameters(perturbedCandidate));
      }
    }

    return candidates;
  }

  updateState(results: { params: number[]; score: number; index: number }[]): void {
    for (const result of results) {
      this.observations.push({ params: result.params, score: result.score });
    }
  }
}

// Genetic Algorithm Optimizer
class GeneticOptimizer extends Optimizer {
  private population: { params: number[]; score: number }[] = [];
  private generation = 0;

  constructor(config: TuningConfig) {
    super(config);
    this.initializePopulation();
  }

  generateCandidates(bestParams: number[]): number[][] {
    if (this.generation === 0) {
      // Return initial population
      return this.population.map((individual) => individual.params);
    }

    // Generate new generation through selection, crossover, and mutation
    const newGeneration: number[][] = [];
    const populationSize = this.config.populationSize || 20;

    // Elite selection (keep best 20%)
    const eliteCount = Math.floor(populationSize * 0.2);
    const sortedPopulation = [...this.population].sort((a, b) => b.score - a.score);

    for (let i = 0; i < eliteCount; i++) {
      newGeneration.push(sortedPopulation[i].params);
    }

    // Generate offspring
    while (newGeneration.length < populationSize) {
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();

      const offspring = this.crossover(parent1.params, parent2.params);
      const mutatedOffspring = this.mutate(offspring);

      newGeneration.push(mutatedOffspring);
    }

    return newGeneration;
  }

  updateState(results: { params: number[]; score: number; index: number }[]): void {
    this.population = results.map((result) => ({
      params: result.params,
      score: result.score,
    }));
    this.generation++;
  }

  private initializePopulation(): void {
    const populationSize = this.config.populationSize || 20;

    for (let i = 0; i < populationSize; i++) {
      this.population.push({
        params: this.generateRandomCandidate(),
        score: Number.NEGATIVE_INFINITY,
      });
    }
  }

  private tournamentSelection(): { params: number[]; score: number } {
    const tournamentSize = 3;
    let best = this.population[Math.floor(Math.random() * this.population.length)];

    for (let i = 1; i < tournamentSize; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (candidate.score > best.score) {
        best = candidate;
      }
    }

    return best;
  }

  private crossover(parent1: number[], parent2: number[]): number[] {
    const crossoverRate = this.config.crossoverRate || 0.8;

    if (Math.random() > crossoverRate) {
      return Math.random() < 0.5 ? [...parent1] : [...parent2];
    }

    const offspring: number[] = [];
    const crossoverPoint = Math.floor(Math.random() * parent1.length);

    for (let i = 0; i < parent1.length; i++) {
      offspring.push(i < crossoverPoint ? parent1[i] : parent2[i]);
    }

    return offspring;
  }

  private mutate(individual: number[]): number[] {
    const mutationRate = this.config.mutationRate || 0.1;
    const mutated = [...individual];

    for (let i = 0; i < mutated.length; i++) {
      if (Math.random() < mutationRate) {
        const param = this.config.parameters[i];
        const range = param.max - param.min;
        const mutation = (Math.random() - 0.5) * range * 0.2; // 20% range mutation
        mutated[i] += mutation;
      }
    }

    return this.clampParameters(mutated);
  }
}

// Utility function to create objective function for Tetris AI
export function createTetrisObjectiveFunction(
  testScenarios: { board: BitBoard; pieces: TetrominoTypeName[] }[],
  evaluationGames = 10,
): (params: number[]) => Promise<number> {
  return async (params: number[]): Promise<number> => {
    try {
      // Convert parameters to AI configuration
      const aiConfig = parameterArrayToConfig(params);
      const ai = new AdvancedAIEngine(aiConfig);

      let totalScore = 0;
      let validGames = 0;

      // Test AI on multiple scenarios
      for (const scenario of testScenarios) {
        try {
          const result = await ai.findBestMove(
            scenario.board,
            scenario.pieces[0],
            scenario.pieces.slice(1),
          );

          if (result.bestMove) {
            // Score based on evaluation quality and decision time
            const decisionQuality = result.evaluation || 0;
            const timeBonus = result.thinkingTime < 150 ? 10 : 0;

            totalScore += decisionQuality + timeBonus;
            validGames++;
          }
        } catch (error) {
          // Penalize configurations that cause errors
          totalScore -= 1000;
        }
      }

      return validGames > 0 ? totalScore / validGames : Number.NEGATIVE_INFINITY;
    } catch (error) {
      return Number.NEGATIVE_INFINITY;
    }
  };
}

function parameterArrayToConfig(params: number[]): any {
  // Convert parameter array to AI configuration
  // This is a simplified version - in practice, you'd map each parameter
  // to its corresponding configuration field
  return {
    thinkingTimeLimit: 150,
    evaluator: "dellacherie" as const,
    enableLogging: false,
    fallbackOnTimeout: true,
    useDynamicWeights: true,
    beamSearchConfig: {
      beamWidth: Math.round(params[10] || 30),
      maxDepth: Math.round(params[11] || 3),
      enableHold: true,
      timeLimit: 150,
    },
    enableAdvancedFeatures: true,
    enablePatternDetection: true,
  };
}
