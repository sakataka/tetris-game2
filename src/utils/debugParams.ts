import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export type DebugParams = {
  enabled: boolean;
  preset?: string;
  queue?: TetrominoTypeName[];
  seed?: number;
  score?: number;
  level?: number;
  lines?: number;
};

// Parse URL parameters for debug mode
export function parseDebugParams(): DebugParams {
  const params = new URLSearchParams(window.location.search);

  const debugParam = params.get("debug");
  const enabled = debugParam === "true" || debugParam === "1";

  if (!enabled) {
    return { enabled: false };
  }

  const result: DebugParams = { enabled: true };

  // Parse preset
  const preset = params.get("preset");
  if (preset) {
    result.preset = preset;
  }

  // Parse piece queue
  const queue = params.get("queue");
  if (queue) {
    result.queue = parsePieceQueue(queue);
  }

  // Parse seed for random number generator
  const seed = params.get("seed");
  if (seed) {
    const seedNum = Number.parseInt(seed, 10);
    if (!Number.isNaN(seedNum)) {
      result.seed = seedNum;
    }
  }

  // Parse score
  const score = params.get("score");
  if (score) {
    const scoreNum = Number.parseInt(score, 10);
    if (!Number.isNaN(scoreNum) && scoreNum >= 0) {
      result.score = scoreNum;
    }
  }

  // Parse level
  const level = params.get("level");
  if (level) {
    const levelNum = Number.parseInt(level, 10);
    if (!Number.isNaN(levelNum) && levelNum >= 1 && levelNum <= 20) {
      result.level = levelNum;
    }
  }

  // Parse lines
  const lines = params.get("lines");
  if (lines) {
    const linesNum = Number.parseInt(lines, 10);
    if (!Number.isNaN(linesNum) && linesNum >= 0) {
      result.lines = linesNum;
    }
  }

  return result;
}

// Parse piece queue string (e.g., "IJLOSTZ" or "I,J,L,O,S,T,Z")
function parsePieceQueue(queueStr: string): TetrominoTypeName[] {
  const pieces: TetrominoTypeName[] = [];

  // Remove spaces and convert to uppercase
  const cleaned = queueStr.replace(/\s/g, "").toUpperCase();

  // Check if comma-separated
  if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    for (const part of parts) {
      if (isValidTetromino(part)) {
        pieces.push(part as TetrominoTypeName);
      }
    }
  } else {
    // Single character format
    for (const char of cleaned) {
      if (isValidTetromino(char)) {
        pieces.push(char as TetrominoTypeName);
      }
    }
  }

  return pieces;
}

// Validate tetromino type
function isValidTetromino(piece: string): boolean {
  return GAME_CONSTANTS.TYPES.TETROMINO_TYPES.includes(piece as TetrominoTypeName);
}

// Generate debug URL with parameters
export function generateDebugUrl(params: Partial<DebugParams>): string {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  // Clear existing debug params
  searchParams.delete("debug");
  searchParams.delete("preset");
  searchParams.delete("queue");
  searchParams.delete("seed");
  searchParams.delete("score");
  searchParams.delete("level");
  searchParams.delete("lines");

  if (params.enabled) {
    searchParams.set("debug", "true");

    if (params.preset) {
      searchParams.set("preset", params.preset);
    }

    if (params.queue && params.queue.length > 0) {
      searchParams.set("queue", params.queue.join(""));
    }

    if (params.seed !== undefined) {
      searchParams.set("seed", params.seed.toString());
    }

    if (params.score !== undefined) {
      searchParams.set("score", params.score.toString());
    }

    if (params.level !== undefined) {
      searchParams.set("level", params.level.toString());
    }

    if (params.lines !== undefined) {
      searchParams.set("lines", params.lines.toString());
    }
  }

  return url.toString();
}
