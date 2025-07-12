import type { EvaluationFeatures, EvaluationWeights } from "@/game/ai/evaluators/dellacherie/types";

/**
 * Calculate weighted score from feature values
 * Combines all features using learned weights
 * Enhanced with exponential line clearing bonuses and NO-CLEAR PENALTY
 *
 * @param features - Extracted feature values
 * @param weights - Evaluation weights
 * @returns Final heuristic score
 */
export function calculateScore(features: EvaluationFeatures, weights: EvaluationWeights): number {
  // Apply MASSIVE bonus for line clears
  const lineClearBonus = features.linesCleared * weights.linesCleared;

  // Apply NO-CLEAR PENALTY: Strong penalty when no lines are cleared
  const noClearPenalty = features.linesCleared === 0 ? -150.0 : 0;

  // Apply bonus for potential line fills
  const potentialLinesBonus = features.potentialLinesFilled * weights.potentialLinesFilled;

  // Apply maxHeight with thresholded height cost (THC)
  const heightThreshold = 15; // Increased threshold to allow higher stacks for line clearing
  const maxHeightScore = features.maxHeight * weights.maxHeight;
  const thresholdedHeightPenalty =
    features.maxHeight > heightThreshold
      ? (features.maxHeight - heightThreshold) ** 2 * -10.0 // Reduced penalty to allow stacking
      : 0;

  // Apply row fill ratio bonus
  const rowFillBonus = features.rowFillRatio * weights.rowFillRatio;

  // Base score calculation
  const baseScore =
    features.landingHeight * weights.landingHeight +
    features.rowTransitions * weights.rowTransitions +
    features.columnTransitions * weights.columnTransitions +
    features.holes * weights.holes +
    features.wells * weights.wells +
    features.blocksAboveHoles * weights.blocksAboveHoles +
    (features.wellOpen ? 1 : 0) * weights.wellOpen +
    features.escapeRoute * weights.escapeRoute +
    features.bumpiness * weights.bumpiness +
    maxHeightScore +
    thresholdedHeightPenalty;

  const totalScore =
    baseScore + lineClearBonus + potentialLinesBonus + rowFillBonus + noClearPenalty;

  // DEBUG: Log scoring details for ALL moves to track decision making
  if (features.linesCleared > 0 || features.potentialLinesFilled > 0 || features.maxHeight > 8) {
    console.log(`🎯 [Dellacherie] Score Details:
      Lines Cleared: ${features.linesCleared} × ${weights.linesCleared} = ${lineClearBonus}
      No-Clear Penalty: ${noClearPenalty}
      Potential Lines: ${features.potentialLinesFilled} × ${weights.potentialLinesFilled} = ${potentialLinesBonus}
      Max Height: ${features.maxHeight} (Penalty: ${maxHeightScore.toFixed(2)} + Threshold: ${thresholdedHeightPenalty.toFixed(2)})
      Row Fill Ratio: ${features.rowFillRatio.toFixed(2)} (Bonus: ${rowFillBonus.toFixed(2)})
      Bumpiness: ${features.bumpiness} (Penalty: ${(features.bumpiness * weights.bumpiness).toFixed(2)})
      Holes: ${features.holes} (Penalty: ${(features.holes * weights.holes).toFixed(2)})
      Base Score: ${baseScore.toFixed(2)}
      Total Score: ${totalScore.toFixed(2)}`);
  }

  return totalScore;
}
