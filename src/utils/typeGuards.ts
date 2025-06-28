import type { RotationState } from "@/types/game";

/**
 * Validates and normalizes rotation state to ensure it's within bounds
 */
export function normalizeRotationState(rotation: number): RotationState {
  const normalized = ((rotation % 4) + 4) % 4; // Handle negative rotations
  return normalized as RotationState;
}
