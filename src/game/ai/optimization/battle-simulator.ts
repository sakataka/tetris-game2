import type { TetrominoTypeName } from "@/types/game";
import { AdvancedAIEngine } from "../core/advanced-ai-engine";
import { BitBoard } from "../core/bitboard";

// AI configuration for battles
export interface AIConfig {
  name: string;
  config: any; // AdvancedAIEngine configuration
  description?: string;
}

// Battle result
export interface BattleResult {
  winner: string;
  scores: [number, number];
  lines: [number, number];
  duration: number;
  moves: [number, number];
  efficiency: [number, number]; // Score per piece
}

// Battle statistics
export interface BattleStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgScore: number;
  avgLines: number;
  avgDuration: number;
  avgEfficiency: number;
}

// Tournament results
export interface TournamentResults {
  participants: string[];
  battles: BattleResult[];
  standings: { name: string; stats: BattleStats; ranking: number }[];
  duration: number;
  timestamp: number;
}

// Game simulation result
interface GameResult {
  score: number;
  lines: number;
  time: number;
  moves: number;
  gameOver: boolean;
  finalBoard: BitBoard;
}

export class BattleSimulator {
  private seedCounter = 0;

  async runTournament(aiConfigs: AIConfig[], gamesPerMatchup = 100): Promise<TournamentResults> {
    console.log(`🏆 Starting tournament with ${aiConfigs.length} AIs`);
    console.log(`Games per matchup: ${gamesPerMatchup}`);

    const startTime = Date.now();
    const battles: BattleResult[] = [];
    const stats = new Map<string, BattleStats>();

    // Initialize stats for all AIs
    for (const ai of aiConfigs) {
      stats.set(ai.name, {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        avgScore: 0,
        avgLines: 0,
        avgDuration: 0,
        avgEfficiency: 0,
      });
    }

    // Run all matchups
    for (let i = 0; i < aiConfigs.length; i++) {
      for (let j = i + 1; j < aiConfigs.length; j++) {
        console.log(`🥊 ${aiConfigs[i].name} vs ${aiConfigs[j].name}`);

        const matchupBattles = await this.runMatchup(aiConfigs[i], aiConfigs[j], gamesPerMatchup);

        battles.push(...matchupBattles);

        // Update statistics
        this.updateStats(stats, aiConfigs[i].name, aiConfigs[j].name, matchupBattles);
      }
    }

    // Calculate final statistics
    this.finalizeStats(stats);

    // Create standings
    const standings = Array.from(stats.entries())
      .map(([name, stat]) => ({ name, stats: stat, ranking: 0 }))
      .sort((a, b) => b.stats.winRate - a.stats.winRate)
      .map((entry, index) => ({ ...entry, ranking: index + 1 }));

    const duration = Date.now() - startTime;

    console.log(`🏁 Tournament completed in ${(duration / 1000).toFixed(1)}s`);
    this.logTournamentResults(standings);

    return {
      participants: aiConfigs.map((ai) => ai.name),
      battles,
      standings,
      duration,
      timestamp: startTime,
    };
  }

  async runMatchup(ai1: AIConfig, ai2: AIConfig, gameCount: number): Promise<BattleResult[]> {
    const battles: BattleResult[] = [];

    // Run games in batches for better performance
    const batchSize = 10;
    const batches = Math.ceil(gameCount / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, gameCount);
      const batchGames = batchEnd - batchStart;

      // Run batch games in parallel
      const batchBattles = await Promise.all(
        Array.from({ length: batchGames }, (_, i) =>
          this.runSingleBattle(ai1, ai2, this.generateSeed()),
        ),
      );

      battles.push(...batchBattles);

      // Progress update
      if (batch % 5 === 0 || batch === batches - 1) {
        const progress = (((batch + 1) / batches) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${progress}%`);
      }
    }

    console.log(); // New line after progress
    return battles;
  }

  private async runSingleBattle(ai1: AIConfig, ai2: AIConfig, seed: number): Promise<BattleResult> {
    // Create identical game scenarios for both AIs
    const pieceSequence = this.generatePieceSequence(seed, 1000);

    // Run both games in parallel
    const [result1, result2] = await Promise.all([
      this.simulateGame(ai1, pieceSequence, seed),
      this.simulateGame(ai2, pieceSequence, seed),
    ]);

    // Determine winner
    let winner: string;
    if (result1.score > result2.score) {
      winner = ai1.name;
    } else if (result2.score > result1.score) {
      winner = ai2.name;
    } else {
      // Tie-breaker: lines cleared, then duration
      if (result1.lines > result2.lines) {
        winner = ai1.name;
      } else if (result2.lines > result1.lines) {
        winner = ai2.name;
      } else {
        winner = result1.time < result2.time ? ai1.name : ai2.name;
      }
    }

    return {
      winner,
      scores: [result1.score, result2.score],
      lines: [result1.lines, result2.lines],
      duration: Math.max(result1.time, result2.time),
      moves: [result1.moves, result2.moves],
      efficiency: [
        result1.moves > 0 ? result1.score / result1.moves : 0,
        result2.moves > 0 ? result2.score / result2.moves : 0,
      ],
    };
  }

  private async simulateGame(
    aiConfig: AIConfig,
    pieceSequence: Piece[],
    seed: number,
  ): Promise<GameResult> {
    const ai = new AdvancedAIEngine(aiConfig.config);
    const board = new BitBoard();

    let score = 0;
    let lines = 0;
    let moves = 0;
    let pieceIndex = 0;
    let gameTime = 0;
    const maxGameTime = 300000; // 5 minutes max
    const startTime = Date.now();

    while (pieceIndex < pieceSequence.length && gameTime < maxGameTime) {
      const currentPiece = pieceSequence[pieceIndex];
      const nextPieces = pieceSequence.slice(pieceIndex + 1, pieceIndex + 6); // Look-ahead

      try {
        // AI makes decision
        const decisionStart = Date.now();
        const decision = await ai.findBestMove(board, currentPiece, nextPieces);
        const decisionTime = Date.now() - decisionStart;

        if (!decision.bestMove) {
          // Game over - no valid moves
          break;
        }

        // Apply move to board
        const moveResult = this.applyMove(board, currentPiece, decision.bestMove);

        if (!moveResult.success) {
          // Invalid move - game over
          break;
        }

        // Update game state
        score += moveResult.scoreGain;
        lines += moveResult.linesCleared;
        moves++;
        pieceIndex++;
        gameTime = Date.now() - startTime;

        // Check for game over condition
        if (this.isGameOver(board)) {
          break;
        }
      } catch (error) {
        // AI error - game over
        console.warn(`AI ${aiConfig.name} encountered error:`, error);
        break;
      }
    }

    return {
      score,
      lines,
      time: gameTime,
      moves,
      gameOver: this.isGameOver(board) || pieceIndex >= pieceSequence.length,
      finalBoard: board,
    };
  }

  private applyMove(
    board: BitBoard,
    piece: TetrominoTypeName,
    move: any,
  ): { success: boolean; scoreGain: number; linesCleared: number } {
    // Simplified move application for simulation
    // In a real implementation, this would use the full game logic
    try {
      // Check if move is valid
      if (!this.isValidMove(board, piece, move.position)) {
        return { success: false, scoreGain: 0, linesCleared: 0 };
      }

      // Place piece (simplified)
      this.placePieceOnBoard(board, piece, move.position);

      // Clear completed lines
      const linesCleared = this.clearCompletedLines(board);

      // Calculate score gain
      const scoreGain = this.calculateScoreGain(linesCleared, move.position.y);

      return { success: true, scoreGain, linesCleared };
    } catch (error) {
      return { success: false, scoreGain: 0, linesCleared: 0 };
    }
  }

  private isValidMove(board: BitBoard, piece: TetrominoTypeName, position: any): boolean {
    // Simplified validation - check if position is within bounds
    return position.x >= 0 && position.x < 10 && position.y >= 0 && position.y < 20;
  }

  private placePieceOnBoard(board: BitBoard, piece: TetrominoTypeName, position: any): void {
    // Simplified piece placement
    // In real implementation, this would handle piece shapes and rotations
    const x = position.x;
    const y = position.y;

    // Place a simple 1x1 block for simulation purposes
    if (x >= 0 && x < 10 && y >= 0 && y < 20) {
      const row = board.getRowBits(y);
      board.setRowBits(y, row | (1 << x));
    }
  }

  private clearCompletedLines(board: BitBoard): number {
    let linesCleared = 0;

    for (let y = 19; y >= 0; y--) {
      const row = board.getRowBits(y);
      if (row === 0b1111111111) {
        // Full row
        // Clear line and move everything down
        for (let moveY = y; moveY > 0; moveY--) {
          board.setRowBits(moveY, board.getRowBits(moveY - 1));
        }
        board.setRowBits(0, 0); // Clear top row
        linesCleared++;
        y++; // Check the same line again
      }
    }

    return linesCleared;
  }

  private calculateScoreGain(linesCleared: number, dropHeight: number): number {
    // Simplified scoring
    const lineScores = [0, 100, 300, 500, 800];
    const lineScore = lineScores[Math.min(linesCleared, 4)];
    const dropBonus = Math.max(0, 20 - dropHeight);

    return lineScore + dropBonus;
  }

  private isGameOver(board: BitBoard): boolean {
    // Check if top rows have any filled cells
    return board.getRowBits(0) !== 0 || board.getRowBits(1) !== 0;
  }

  private generatePieceSequence(seed: number, length: number): TetrominoTypeName[] {
    // Seeded random number generator for reproducible sequences
    let rng = seed;
    const sequence: TetrominoTypeName[] = [];
    const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "L", "J"];

    for (let i = 0; i < length; i++) {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      const index = rng % pieces.length;
      sequence.push(pieces[index]);
    }

    return sequence;
  }

  private generateSeed(): number {
    return ++this.seedCounter;
  }

  private updateStats(
    stats: Map<string, BattleStats>,
    ai1Name: string,
    ai2Name: string,
    battles: BattleResult[],
  ): void {
    for (const battle of battles) {
      const ai1Stats = stats.get(ai1Name)!;
      const ai2Stats = stats.get(ai2Name)!;

      // Update games played
      ai1Stats.gamesPlayed++;
      ai2Stats.gamesPlayed++;

      // Update wins/losses
      if (battle.winner === ai1Name) {
        ai1Stats.wins++;
        ai2Stats.losses++;
      } else if (battle.winner === ai2Name) {
        ai2Stats.wins++;
        ai1Stats.losses++;
      } else {
        ai1Stats.draws++;
        ai2Stats.draws++;
      }

      // Update averages (running average)
      const n1 = ai1Stats.gamesPlayed;
      const n2 = ai2Stats.gamesPlayed;

      ai1Stats.avgScore = (ai1Stats.avgScore * (n1 - 1) + battle.scores[0]) / n1;
      ai1Stats.avgLines = (ai1Stats.avgLines * (n1 - 1) + battle.lines[0]) / n1;
      ai1Stats.avgDuration = (ai1Stats.avgDuration * (n1 - 1) + battle.duration) / n1;
      ai1Stats.avgEfficiency = (ai1Stats.avgEfficiency * (n1 - 1) + battle.efficiency[0]) / n1;

      ai2Stats.avgScore = (ai2Stats.avgScore * (n2 - 1) + battle.scores[1]) / n2;
      ai2Stats.avgLines = (ai2Stats.avgLines * (n2 - 1) + battle.lines[1]) / n2;
      ai2Stats.avgDuration = (ai2Stats.avgDuration * (n2 - 1) + battle.duration) / n2;
      ai2Stats.avgEfficiency = (ai2Stats.avgEfficiency * (n2 - 1) + battle.efficiency[1]) / n2;
    }
  }

  private finalizeStats(stats: Map<string, BattleStats>): void {
    for (const [name, stat] of stats) {
      stat.winRate = stat.gamesPlayed > 0 ? stat.wins / stat.gamesPlayed : 0;
    }
  }

  private logTournamentResults(
    standings: { name: string; stats: BattleStats; ranking: number }[],
  ): void {
    console.log("\n🏆 Tournament Results");
    console.log("===================");
    console.log("Rank | AI Name                 | Win Rate | Avg Score | Avg Lines | Efficiency");
    console.log("-----|-------------------------|----------|-----------|-----------|----------");

    for (const entry of standings) {
      const { name, stats, ranking } = entry;
      console.log(
        `${ranking.toString().padStart(4)} | ${name.padEnd(23)} | ` +
          `${(stats.winRate * 100).toFixed(1).padStart(7)}% | ` +
          `${stats.avgScore.toFixed(0).padStart(9)} | ` +
          `${stats.avgLines.toFixed(1).padStart(9)} | ` +
          `${stats.avgEfficiency.toFixed(1).padStart(10)}`,
      );
    }
  }
}

// Predefined AI configurations for testing
export const PRESET_AI_CONFIGS: AIConfig[] = [
  {
    name: "Basic AI",
    description: "Standard Dellacherie evaluation",
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
  {
    name: "Advanced AI",
    description: "Enhanced features with beam search",
    config: {
      thinkingTimeLimit: 150,
      evaluator: "dellacherie",
      enableLogging: false,
      fallbackOnTimeout: true,
      useDynamicWeights: true,
      beamSearchConfig: {
        beamWidth: 30,
        maxDepth: 3,
        enableHold: true,
        timeLimit: 150,
      },
      enableAdvancedFeatures: true,
      enablePatternDetection: false,
    },
  },
  {
    name: "Pattern-Aware AI",
    description: "Advanced AI with pattern recognition",
    config: {
      thinkingTimeLimit: 150,
      evaluator: "dellacherie",
      enableLogging: false,
      fallbackOnTimeout: true,
      useDynamicWeights: true,
      beamSearchConfig: {
        beamWidth: 35,
        maxDepth: 3,
        enableHold: true,
        timeLimit: 150,
      },
      enableAdvancedFeatures: true,
      enablePatternDetection: true,
    },
  },
  {
    name: "High-Performance AI",
    description: "Optimized for maximum performance",
    config: {
      thinkingTimeLimit: 200,
      evaluator: "dellacherie",
      enableLogging: false,
      fallbackOnTimeout: true,
      useDynamicWeights: true,
      beamSearchConfig: {
        beamWidth: 50,
        maxDepth: 4,
        enableHold: true,
        timeLimit: 200,
      },
      enableAdvancedFeatures: true,
      enablePatternDetection: true,
    },
  },
];
