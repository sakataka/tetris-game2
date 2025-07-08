import type { TetrominoTypeName } from "@/types/game";
import { BitBoard } from "../core/bitboard";
import { ABTestFramework, type AIConfig, TETRIS_METRICS } from "./ab-testing";
import { BattleSimulator } from "./battle-simulator";
import {
  createTetrisObjectiveFunction,
  ParameterTuner,
  TETRIS_AI_PARAMETERS,
} from "./parameter-tuner";

// Performance issue types
interface PerformanceIssue {
  type: "score" | "efficiency" | "survival" | "speed" | "stability";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metrics: Record<string, number>;
  threshold: number;
  currentValue: number;
}

// Game log entry
interface GameLogEntry {
  timestamp: number;
  score: number;
  lines: number;
  duration: number;
  moves: number;
  aiConfig: string;
  errors: string[];
}

// Performance analysis result
interface PerformanceAnalysis {
  period: { start: number; end: number };
  gamesAnalyzed: number;
  avgScore: number;
  avgEfficiency: number;
  avgSurvival: number;
  errorRate: number;
  trends: Record<string, "improving" | "declining" | "stable">;
  issues: PerformanceIssue[];
}

// Improvement recommendation
interface ImprovementRecommendation {
  type: "parameter_tuning" | "config_change" | "algorithm_update" | "emergency_rollback";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  estimatedImpact: number; // Expected improvement percentage
  estimatedCost: number; // Implementation effort (hours)
  parameters?: Record<string, number>;
  newConfig?: any;
}

// Deployment result
interface DeploymentResult {
  success: boolean;
  version: string;
  timestamp: number;
  rollbackPlan?: string;
  metrics?: Record<string, number>;
  error?: string;
}

export class ContinuousImprovement {
  private parameterTuner: ParameterTuner;
  private abTestFramework: ABTestFramework;
  private battleSimulator: BattleSimulator;
  private gameLogs: GameLogEntry[] = [];
  private currentConfig: AIConfig;
  private baselineMetrics: Record<string, number> = {};

  constructor(initialConfig: AIConfig) {
    this.parameterTuner = new ParameterTuner({
      parameters: TETRIS_AI_PARAMETERS,
      objectiveFunction: this.createOptimizationObjective(),
      method: "bayesian",
      maxIterations: 50,
      convergenceThreshold: 0.01,
    });

    this.abTestFramework = new ABTestFramework();
    this.battleSimulator = new BattleSimulator();
    this.currentConfig = initialConfig;
    this.initializeBaselineMetrics();
  }

  async runDailyOptimization(): Promise<void> {
    console.log("🔄 Starting daily optimization cycle");
    console.log("==================================");

    try {
      // 1. Collect and analyze recent performance data
      const analysis = await this.analyzeRecentPerformance();
      console.log(`Analyzed ${analysis.gamesAnalyzed} games from the last 24 hours`);

      // 2. Identify performance issues
      const issues = this.identifyIssues(analysis);
      console.log(`Found ${issues.length} performance issues`);

      if (issues.length === 0) {
        console.log("✅ No significant issues detected. System performing well.");
        return;
      }

      // 3. Generate improvement recommendations
      const recommendations = this.generateRecommendations(issues, analysis);
      console.log(`Generated ${recommendations.length} improvement recommendations`);

      // 4. Execute highest priority recommendation
      const topRecommendation = recommendations[0];
      if (topRecommendation) {
        await this.executeRecommendation(topRecommendation, analysis);
      }
    } catch (error) {
      console.error("❌ Daily optimization failed:", error);
      await this.handleOptimizationFailure(error);
    }
  }

  async runWeeklyTuning(): Promise<void> {
    console.log("🎯 Starting weekly parameter tuning");
    console.log("==================================");

    try {
      // Run comprehensive parameter optimization
      const optimizationResult = await this.parameterTuner.optimize();

      if (optimizationResult.score > this.baselineMetrics.score) {
        console.log("🚀 Found improved parameters, running A/B test");

        const newConfig = this.createConfigFromParameters(optimizationResult.parameters);
        const abTestResult = await this.abTestFramework.compareStrategies({
          baselineConfig: this.currentConfig,
          experimentalConfig: newConfig,
          metrics: TETRIS_METRICS,
          minSampleSize: 100,
          maxSampleSize: 500,
          confidenceLevel: 0.95,
          minimumDetectableEffect: 0.05,
        });

        if (abTestResult.recommendation === "deploy") {
          await this.deployNewConfiguration(newConfig, abTestResult);
        }
      }
    } catch (error) {
      console.error("❌ Weekly tuning failed:", error);
    }
  }

  async runMonthlyEvaluation(): Promise<void> {
    console.log("📈 Starting monthly comprehensive evaluation");
    console.log("==========================================");

    try {
      // Run tournament against known benchmarks
      const tournamentResult = await this.battleSimulator.runTournament(
        [this.currentConfig, ...this.getBenchmarkConfigs()],
        200,
      );

      // Analyze performance trends
      const monthlyAnalysis = await this.analyzeMonthlyPerformance();

      // Generate strategic recommendations
      const strategicRecommendations = this.generateStrategicRecommendations(
        tournamentResult,
        monthlyAnalysis,
      );

      // Create monthly report
      await this.generateMonthlyReport(tournamentResult, monthlyAnalysis, strategicRecommendations);
    } catch (error) {
      console.error("❌ Monthly evaluation failed:", error);
    }
  }

  private async analyzeRecentPerformance(): Promise<PerformanceAnalysis> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Collect recent game logs (simulated for this implementation)
    const recentLogs = this.collectGameLogs(oneDayAgo, now);

    if (recentLogs.length === 0) {
      console.log("No recent game data available, using simulated data");
      return this.generateSimulatedAnalysis();
    }

    const scores = recentLogs.map((log) => log.score);
    const efficiencies = recentLogs.map((log) => (log.moves > 0 ? log.score / log.moves : 0));
    const survivals = recentLogs.map((log) => log.moves);
    const errors = recentLogs.flatMap((log) => log.errors);

    return {
      period: { start: oneDayAgo, end: now },
      gamesAnalyzed: recentLogs.length,
      avgScore: this.average(scores),
      avgEfficiency: this.average(efficiencies),
      avgSurvival: this.average(survivals),
      errorRate: errors.length / recentLogs.length,
      trends: this.analyzeTrends(recentLogs),
      issues: [],
    };
  }

  private collectGameLogs(startTime: number, endTime: number): GameLogEntry[] {
    // In a real implementation, this would query a database or log files
    // For this implementation, we'll return the stored logs or generate some
    return this.gameLogs.filter((log) => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  private generateSimulatedAnalysis(): PerformanceAnalysis {
    // Generate realistic simulated performance data
    return {
      period: { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
      gamesAnalyzed: 100,
      avgScore: 8500 + Math.random() * 2000,
      avgEfficiency: 45 + Math.random() * 10,
      avgSurvival: 120 + Math.random() * 40,
      errorRate: 0.02 + Math.random() * 0.03,
      trends: {
        score: Math.random() > 0.5 ? "improving" : "declining",
        efficiency: Math.random() > 0.5 ? "stable" : "improving",
        survival: Math.random() > 0.5 ? "improving" : "stable",
      },
      issues: [],
    };
  }

  private identifyIssues(analysis: PerformanceAnalysis): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Score performance issue
    if (analysis.avgScore < this.baselineMetrics.score * 0.9) {
      issues.push({
        type: "score",
        severity: analysis.avgScore < this.baselineMetrics.score * 0.8 ? "high" : "medium",
        description: "Average score has declined significantly",
        metrics: { current: analysis.avgScore, baseline: this.baselineMetrics.score },
        threshold: this.baselineMetrics.score * 0.9,
        currentValue: analysis.avgScore,
      });
    }

    // Efficiency issue
    if (analysis.avgEfficiency < this.baselineMetrics.efficiency * 0.85) {
      issues.push({
        type: "efficiency",
        severity: "medium",
        description: "AI efficiency (score per piece) has decreased",
        metrics: { current: analysis.avgEfficiency, baseline: this.baselineMetrics.efficiency },
        threshold: this.baselineMetrics.efficiency * 0.85,
        currentValue: analysis.avgEfficiency,
      });
    }

    // Error rate issue
    if (analysis.errorRate > 0.05) {
      issues.push({
        type: "stability",
        severity: analysis.errorRate > 0.1 ? "critical" : "high",
        description: "Error rate is above acceptable threshold",
        metrics: { current: analysis.errorRate, baseline: 0.02 },
        threshold: 0.05,
        currentValue: analysis.errorRate,
      });
    }

    // Trend-based issues
    if (analysis.trends.score === "declining") {
      issues.push({
        type: "score",
        severity: "low",
        description: "Score trend is declining over time",
        metrics: { trend: "declining" },
        threshold: 0,
        currentValue: -1,
      });
    }

    return issues;
  }

  private generateRecommendations(
    issues: PerformanceIssue[],
    analysis: PerformanceAnalysis,
  ): ImprovementRecommendation[] {
    const recommendations: ImprovementRecommendation[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case "score":
          if (issue.severity === "high" || issue.severity === "critical") {
            recommendations.push({
              type: "parameter_tuning",
              priority: "high",
              description: "Tune evaluation weights to improve scoring",
              estimatedImpact: 15,
              estimatedCost: 2,
              parameters: {
                linesCleared: this.baselineMetrics.linesCleared * 1.2,
                patternBonus: this.baselineMetrics.patternBonus * 1.1,
              },
            });
          }
          break;

        case "efficiency":
          recommendations.push({
            type: "config_change",
            priority: "medium",
            description: "Adjust beam search parameters for better efficiency",
            estimatedImpact: 8,
            estimatedCost: 1,
            newConfig: {
              ...this.currentConfig,
              beamSearchConfig: {
                ...this.currentConfig.config.beamSearchConfig,
                beamWidth: Math.min(this.currentConfig.config.beamSearchConfig.beamWidth + 5, 50),
              },
            },
          });
          break;

        case "stability":
          if (issue.severity === "critical") {
            recommendations.push({
              type: "emergency_rollback",
              priority: "critical",
              description: "High error rate detected, consider rollback to previous stable version",
              estimatedImpact: 0,
              estimatedCost: 0.5,
            });
          } else {
            recommendations.push({
              type: "config_change",
              priority: "high",
              description: "Increase timeout margins to reduce errors",
              estimatedImpact: 5,
              estimatedCost: 0.5,
              newConfig: {
                ...this.currentConfig,
                config: {
                  ...this.currentConfig.config,
                  thinkingTimeLimit: this.currentConfig.config.thinkingTimeLimit + 20,
                },
              },
            });
          }
          break;
      }
    }

    // Sort by priority and estimated impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedImpact - a.estimatedImpact;
    });
  }

  private async executeRecommendation(
    recommendation: ImprovementRecommendation,
    analysis: PerformanceAnalysis,
  ): Promise<void> {
    console.log(`🚀 Executing recommendation: ${recommendation.description}`);

    try {
      switch (recommendation.type) {
        case "parameter_tuning":
          await this.executeParameterTuning(recommendation);
          break;

        case "config_change":
          await this.executeConfigChange(recommendation);
          break;

        case "emergency_rollback":
          await this.executeEmergencyRollback();
          break;

        case "algorithm_update":
          await this.executeAlgorithmUpdate(recommendation);
          break;
      }

      console.log("✅ Recommendation executed successfully");
    } catch (error) {
      console.error("❌ Failed to execute recommendation:", error);
      throw error;
    }
  }

  private async executeParameterTuning(recommendation: ImprovementRecommendation): Promise<void> {
    if (!recommendation.parameters) return;

    // Create new config with tuned parameters
    const newConfig = {
      ...this.currentConfig,
      config: {
        ...this.currentConfig.config,
        // Apply parameter changes (simplified)
        weights: {
          ...this.currentConfig.config.weights,
          ...recommendation.parameters,
        },
      },
    };

    // Quick A/B test with smaller sample size for rapid deployment
    const abTestResult = await this.abTestFramework.compareStrategies({
      baselineConfig: this.currentConfig,
      experimentalConfig: newConfig,
      metrics: TETRIS_METRICS.slice(0, 3), // Test only key metrics
      minSampleSize: 20,
      maxSampleSize: 50,
      confidenceLevel: 0.9, // Lower confidence for faster results
      minimumDetectableEffect: 0.1,
    });

    if (abTestResult.recommendation === "deploy") {
      await this.deployNewConfiguration(newConfig, abTestResult);
    }
  }

  private async executeConfigChange(recommendation: ImprovementRecommendation): Promise<void> {
    if (!recommendation.newConfig) return;

    // Deploy configuration change immediately for non-critical changes
    const deploymentResult = await this.deployNewConfiguration(recommendation.newConfig, null);

    if (deploymentResult.success) {
      console.log("Configuration change deployed successfully");
    }
  }

  private async executeEmergencyRollback(): Promise<void> {
    console.log("🚨 Executing emergency rollback");

    // In a real implementation, this would rollback to the last known good configuration
    // For now, we'll reset to a safe default configuration
    const safeConfig: AIConfig = {
      name: "Safe Default",
      config: {
        thinkingTimeLimit: 200, // Generous timeout
        evaluator: "dellacherie",
        enableLogging: false,
        fallbackOnTimeout: true,
        useDynamicWeights: false,
        beamSearchConfig: {
          beamWidth: 20, // Conservative beam width
          maxDepth: 2, // Shallow search
          enableHold: false,
          timeLimit: 150,
        },
        enableAdvancedFeatures: false,
        enablePatternDetection: false,
      },
    };

    await this.deployNewConfiguration(safeConfig, null);
  }

  private async executeAlgorithmUpdate(recommendation: ImprovementRecommendation): Promise<void> {
    console.log("🔧 Algorithm update would be implemented here");
    // In practice, this would involve updating core AI algorithms
  }

  private async deployNewConfiguration(
    newConfig: AIConfig,
    testResult: any,
  ): Promise<DeploymentResult> {
    try {
      console.log(`📦 Deploying new configuration: ${newConfig.name}`);

      // Store previous configuration for rollback
      const previousConfig = { ...this.currentConfig };

      // Update current configuration
      this.currentConfig = newConfig;

      // Update baseline metrics if we have test results
      if (testResult) {
        this.updateBaselineMetrics(testResult);
      }

      // In a real implementation, this would:
      // 1. Save the new configuration to persistent storage
      // 2. Notify the application to reload the AI configuration
      // 3. Monitor for any immediate issues

      await this.notifyConfigurationUpdate(newConfig, testResult);

      return {
        success: true,
        version: `v${Date.now()}`,
        timestamp: Date.now(),
        rollbackPlan: `Rollback to ${previousConfig.name}`,
      };
    } catch (error) {
      return {
        success: false,
        version: "",
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async notifyConfigurationUpdate(newConfig: AIConfig, testResult: any): Promise<void> {
    const message = `AI configuration updated to ${newConfig.name}`;

    if (testResult) {
      console.log(`${message} (${testResult.summary})`);
    } else {
      console.log(message);
    }

    // In a real implementation, this might:
    // - Send notifications to monitoring systems
    // - Update configuration management systems
    // - Log the change for audit purposes
  }

  private async handleOptimizationFailure(error: any): Promise<void> {
    console.error("🚨 Optimization cycle failed, entering safe mode");

    // Log the error for analysis
    console.error("Error details:", error);

    // Could implement automated error reporting here
    // Could also trigger a rollback to the last known good configuration
  }

  private createOptimizationObjective() {
    // Create test scenarios for parameter optimization
    const testScenarios = [
      { board: this.createTestBoard(6), pieces: ["I", "T", "O", "S"] as TetrominoTypeName[] },
      { board: this.createTestBoard(10), pieces: ["L", "J", "Z", "T"] as TetrominoTypeName[] },
      { board: this.createTestBoard(14), pieces: ["S", "I", "L", "O"] as TetrominoTypeName[] },
    ];

    return createTetrisObjectiveFunction(testScenarios, 5);
  }

  private createTestBoard(height: number): BitBoard {
    const board = new BitBoard();
    // Create test boards with different complexity levels
    for (let y = 20 - height; y < 20; y++) {
      const row = Math.floor(Math.random() * 1024); // Random pattern
      board.setRowBits(y, row);
    }
    return board;
  }

  private createConfigFromParameters(parameters: number[]): AIConfig {
    // Convert optimized parameters back to AI configuration
    return {
      name: "Optimized AI",
      config: {
        thinkingTimeLimit: 150,
        evaluator: "dellacherie",
        enableLogging: false,
        fallbackOnTimeout: true,
        useDynamicWeights: true,
        beamSearchConfig: {
          beamWidth: Math.round(parameters[10] || 30),
          maxDepth: Math.round(parameters[11] || 3),
          enableHold: true,
          timeLimit: 150,
        },
        enableAdvancedFeatures: true,
        enablePatternDetection: true,
      },
    };
  }

  private getBenchmarkConfigs(): AIConfig[] {
    // Return standard benchmark configurations for comparison
    return [
      {
        name: "Basic Benchmark",
        config: {
          thinkingTimeLimit: 150,
          evaluator: "dellacherie",
          enableLogging: false,
          fallbackOnTimeout: true,
          useDynamicWeights: false,
          beamSearchConfig: {
            beamWidth: 20,
            maxDepth: 2,
            enableHold: false,
            timeLimit: 100,
          },
          enableAdvancedFeatures: false,
          enablePatternDetection: false,
        },
      },
    ];
  }

  private initializeBaselineMetrics(): void {
    // Initialize with reasonable baseline metrics
    this.baselineMetrics = {
      score: 8000,
      efficiency: 45,
      survival: 120,
      linesCleared: 15,
      patternBonus: 100,
    };
  }

  private updateBaselineMetrics(testResult: any): void {
    // Update baseline metrics based on test results
    if (testResult && testResult.analysis) {
      Object.entries(testResult.analysis).forEach(([metric, analysis]: [string, any]) => {
        if (analysis.experimentalMean > analysis.baselineMean) {
          this.baselineMetrics[metric] = analysis.experimentalMean;
        }
      });
    }
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  private analyzeTrends(
    logs: GameLogEntry[],
  ): Record<string, "improving" | "declining" | "stable"> {
    // Simple trend analysis based on first half vs second half of data
    if (logs.length < 10) {
      return { score: "stable", efficiency: "stable", survival: "stable" };
    }

    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);

    const firstAvgScore = this.average(firstHalf.map((l) => l.score));
    const secondAvgScore = this.average(secondHalf.map((l) => l.score));

    const scoreTrend =
      secondAvgScore > firstAvgScore * 1.05
        ? "improving"
        : secondAvgScore < firstAvgScore * 0.95
          ? "declining"
          : "stable";

    return {
      score: scoreTrend,
      efficiency: "stable", // Simplified for this implementation
      survival: "stable",
    };
  }

  private async analyzeMonthlyPerformance(): Promise<PerformanceAnalysis> {
    // Analyze performance over the last month
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    return this.analyzeRecentPerformance(); // Simplified for this implementation
  }

  private generateStrategicRecommendations(
    tournamentResult: any,
    monthlyAnalysis: PerformanceAnalysis,
  ): ImprovementRecommendation[] {
    // Generate high-level strategic recommendations based on monthly data
    return [
      {
        type: "algorithm_update",
        priority: "medium",
        description:
          "Consider implementing new evaluation features based on monthly performance data",
        estimatedImpact: 10,
        estimatedCost: 8,
      },
    ];
  }

  private async generateMonthlyReport(
    tournamentResult: any,
    monthlyAnalysis: PerformanceAnalysis,
    recommendations: ImprovementRecommendation[],
  ): Promise<void> {
    console.log("\n📈 Monthly Performance Report");
    console.log("============================");
    console.log(`Games Analyzed: ${monthlyAnalysis.gamesAnalyzed}`);
    console.log(`Average Score: ${monthlyAnalysis.avgScore.toFixed(0)}`);
    console.log(`Average Efficiency: ${monthlyAnalysis.avgEfficiency.toFixed(1)}`);
    console.log(`Error Rate: ${(monthlyAnalysis.errorRate * 100).toFixed(2)}%`);
    console.log(`Strategic Recommendations: ${recommendations.length}`);
  }
}
