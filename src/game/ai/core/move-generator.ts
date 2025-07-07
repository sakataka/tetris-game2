import { createTetromino } from "@/game/tetrominos";
import { applyWallKickOffset, getWallKickOffsets } from "@/game/wallKick";
import type { RotationState, Tetromino, TetrominoTypeName } from "@/types/game";
import type { BitBoard } from "./bitboard";
import { getPieceBitsAtPosition } from "./piece-bits";

/**
 * Game action types for AI move execution
 */
export type GameActionType =
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "MOVE_DOWN"
  | "ROTATE_CW"
  | "ROTATE_180"
  | "HARD_DROP"
  | "HOLD";

export interface GameAction {
  type: GameActionType;
}

/**
 * Represents a complete move solution with position and execution sequence
 */
export interface Move {
  piece: TetrominoTypeName;
  rotation: RotationState;
  x: number;
  y: number;
  sequence: GameAction[];
  evaluationScore?: number;
  wallKicksUsed?: number;
}

/**
 * Configuration options for move generation
 */
export interface MoveGenerationOptions {
  useHold: boolean;
  maxSearchDepth: number;
  includeWallKicks: boolean;
  enableTSpinDetection: boolean;
}

/**
 * Default move generation options optimized for Phase 1
 */
export const DEFAULT_MOVE_OPTIONS: MoveGenerationOptions = {
  useHold: false, // Not used in Phase 1
  maxSearchDepth: 1,
  includeWallKicks: true,
  enableTSpinDetection: false, // Phase 1 only uses basic evaluation
};

/**
 * Comprehensive move generator with SRS wall kick support
 * Generates all possible moves for a given piece on a board state
 */
export class MoveGenerator {
  private readonly options: MoveGenerationOptions;

  constructor(options: MoveGenerationOptions = DEFAULT_MOVE_OPTIONS) {
    this.options = { ...options };
  }

  /**
   * Generate all valid moves for current piece and optional hold piece
   * @param board - Current board state
   * @param currentPiece - Current falling piece
   * @param heldPiece - Currently held piece (optional)
   * @returns Array of all valid moves
   */
  generateAllMoves(board: BitBoard, currentPiece: Tetromino, heldPiece?: Tetromino | null): Move[] {
    // Check if piece is valid
    if (!currentPiece.type || !currentPiece.position) {
      console.error("[MoveGen] Invalid piece structure:", currentPiece);
      return [];
    }

    const moves: Move[] = [];

    // Generate moves for current piece
    const currentPieceMoves = this.generateMovesForPiece(board, currentPiece);
    moves.push(...currentPieceMoves);

    // Generate moves using hold piece if enabled and available
    if (this.options.useHold && heldPiece) {
      const holdMoves = this.generateMovesForPiece(board, heldPiece);
      // Add HOLD action to the beginning of each sequence
      holdMoves.forEach((move) => {
        move.sequence.unshift({ type: "HOLD" });
      });
      moves.push(...holdMoves);
    }

    const validMoves = this.filterValidMoves(moves, board);
    return validMoves;
  }

  /**
   * Generate all possible moves for a specific piece
   * @param board - Board state
   * @param piece - Tetromino to generate moves for
   * @returns Array of moves for this piece
   */
  private generateMovesForPiece(board: BitBoard, piece: Tetromino): Move[] {
    const moves: Move[] = [];

    // Removed verbose debug logging for production

    // Test all 4 rotation states
    for (let targetRotation = 0; targetRotation < 4; targetRotation++) {
      const rotState = targetRotation as RotationState;
      let _rotationMoves = 0;

      // Test all horizontal positions (-2 to +11 for off-board exploration)
      for (let targetX = -2; targetX <= 11; targetX++) {
        const move = this.findValidMove(board, piece, rotState, targetX);
        if (move) {
          moves.push(move);
          _rotationMoves++;
        }
      }
    }

    return moves;
  }

  /**
   * Find a valid move for specific rotation and X position
   * Uses SRS wall kicks to find the actual placement position
   * @param board - Board state
   * @param piece - Original piece
   * @param targetRotation - Target rotation state
   * @param targetX - Target X position
   * @returns Valid move or null if impossible
   */
  private findValidMove(
    board: BitBoard,
    piece: Tetromino,
    targetRotation: RotationState,
    targetX: number,
  ): Move | null {
    try {
      // Simulate the path from current position to target
      const path = this.simulateMovePath(board, piece, targetRotation, targetX);

      if (!path) {
        return null;
      }

      // Find drop position for final placement
      const pieceBits = getPieceBitsAtPosition(
        path.finalPiece.type,
        path.finalPiece.rotation,
        path.finalPiece.position.x,
      );

      const dropY = this.findDropPosition(board, pieceBits, path.finalPiece.position.x);

      if (dropY === -1) {
        return null;
      }

      // Create move with action sequence
      return {
        piece: piece.type,
        rotation: targetRotation,
        x: path.finalPiece.position.x,
        y: dropY,
        sequence: path.actionSequence,
        wallKicksUsed: path.wallKicksUsed,
      };
    } catch (_error) {
      // Silent error handling in production
      return null;
    }
  }

  /**
   * Simulate the movement path from current piece to target state
   * @param board - Board state
   * @param piece - Starting piece
   * @param targetRotation - Target rotation
   * @param targetX - Target X position
   * @returns Movement path or null if impossible
   */
  private simulateMovePath(
    board: BitBoard,
    piece: Tetromino,
    targetRotation: RotationState,
    targetX: number,
  ): { finalPiece: Tetromino; actionSequence: GameAction[]; wallKicksUsed: number } | null {
    let currentPiece = { ...piece };
    const actionSequence: GameAction[] = [];
    let wallKicksUsed = 0;

    // Phase 1: Rotate to target rotation
    while (currentPiece.rotation !== targetRotation) {
      const nextRotation = this.getNextRotation(currentPiece.rotation);
      const rotationResult = this.attemptRotation(board, currentPiece, nextRotation);

      if (!rotationResult) return null; // Rotation impossible

      currentPiece = rotationResult.piece;
      actionSequence.push({ type: "ROTATE_CW" });

      if (rotationResult.wallKickUsed) {
        wallKicksUsed++;
      }
    }

    // Phase 2: Move horizontally to target X
    while (currentPiece.position.x !== targetX) {
      const direction = targetX > currentPiece.position.x ? 1 : -1;
      const newX = currentPiece.position.x + direction;

      // Check if horizontal movement is valid
      const pieceBits = getPieceBitsAtPosition(currentPiece.type, currentPiece.rotation, newX);
      if (!board.canPlace(pieceBits, currentPiece.position.y)) {
        return null; // Horizontal movement blocked
      }

      currentPiece.position.x = newX;
      actionSequence.push({
        type: direction > 0 ? "MOVE_RIGHT" : "MOVE_LEFT",
      });
    }

    // Phase 3: Add hard drop
    actionSequence.push({ type: "HARD_DROP" });

    return {
      finalPiece: currentPiece,
      actionSequence,
      wallKicksUsed,
    };
  }

  /**
   * Attempt to rotate piece with SRS wall kick support
   * @param board - Board state
   * @param piece - Current piece
   * @param targetRotation - Target rotation
   * @returns Rotation result or null if impossible
   */
  private attemptRotation(
    board: BitBoard,
    piece: Tetromino,
    targetRotation: RotationState,
  ): { piece: Tetromino; wallKickUsed: boolean } | null {
    // Get wall kick offsets for this rotation transition
    const wallKickOffsets = getWallKickOffsets(piece.type, piece.rotation, targetRotation);

    // Try each wall kick offset in SRS order
    for (let i = 0; i < wallKickOffsets.length; i++) {
      const offset = wallKickOffsets[i];
      const testPosition = applyWallKickOffset(piece.position, offset);

      // Check if piece can be placed at this position
      const pieceBits = getPieceBitsAtPosition(piece.type, targetRotation, testPosition.x);
      if (board.canPlace(pieceBits, testPosition.y)) {
        return {
          piece: {
            ...piece,
            position: testPosition,
            rotation: targetRotation,
            shape: createTetromino(piece.type).shape,
          },
          wallKickUsed: i > 0, // First offset (0,0) is not a wall kick
        };
      }
    }

    return null; // All wall kick attempts failed
  }

  /**
   * Find the lowest valid Y position for piece placement (drop simulation)
   * @param board - Board state
   * @param pieceBits - Piece bit patterns
   * @param x - X position
   * @returns Y position or -1 if invalid
   */
  private findDropPosition(board: BitBoard, pieceBits: number[], _x: number): number {
    // Start from top and work down
    for (let y = 0; y <= 20 - pieceBits.length; y++) {
      if (board.canPlace(pieceBits, y)) {
        // Check if piece would be supported (can't fall further)
        const nextY = y + 1;
        if (nextY + pieceBits.length > 20 || !board.canPlace(pieceBits, nextY)) {
          return y; // This is the final resting position
        }
      }
    }

    return -1; // No valid position found
  }

  /**
   * Get next clockwise rotation state
   * @param current - Current rotation state
   * @returns Next rotation state
   */
  private getNextRotation(current: RotationState): RotationState {
    return ((current + 1) % 4) as RotationState;
  }

  /**
   * Filter moves to only include valid placements
   * @param moves - All generated moves
   * @param board - Board state for validation
   * @returns Filtered valid moves
   */
  private filterValidMoves(moves: Move[], board: BitBoard): Move[] {
    return moves.filter((move) => {
      const pieceBits = getPieceBitsAtPosition(move.piece, move.rotation, move.x);
      return board.canPlace(pieceBits, move.y);
    });
  }

  /**
   * Update move generation options
   * @param newOptions - New options to apply
   */
  updateOptions(newOptions: Partial<MoveGenerationOptions>): void {
    Object.assign(this.options, newOptions);
  }

  /**
   * Get current move generation options
   * @returns Current options
   */
  getOptions(): MoveGenerationOptions {
    return { ...this.options };
  }
}
