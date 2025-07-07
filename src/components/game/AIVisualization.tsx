import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import type { AdvancedAIDecision, PerfectClearOpportunity, TSpinOpportunity } from "@/game/ai";
import type { GameState } from "@/types/game";
import type { AISettings } from "./AdvancedAIControls";

export interface AIVisualizationProps {
  decision: AdvancedAIDecision | null;
  settings: AISettings;
  gameState: GameState;
}

export interface SearchTree {
  maxDepth: number;
  levels: Array<{
    nodes: Array<{
      score: number;
      isInBestPath: boolean;
    }>;
  }>;
}

export function AIVisualization({ decision, settings }: AIVisualizationProps) {
  if (!settings.enableVisualization || !decision) return null;

  return (
    <div className="space-y-4">
      {/* Search Tree */}
      {decision.bestPath && (
        <SearchTreeVisualization
          tree={{
            maxDepth: decision.searchDepth || 2,
            levels: createMockSearchTree(decision),
          }}
        />
      )}

      {/* Evaluation Details */}
      <EvaluationDetails decision={decision} />

      {/* T-Spin/PC Detection */}
      {(decision.tSpinOpportunities.length > 0 || decision.perfectClearOpportunity) && (
        <SpecialOpportunities
          tSpins={decision.tSpinOpportunities}
          perfectClear={decision.perfectClearOpportunity}
        />
      )}
    </div>
  );
}

function SearchTreeVisualization({ tree }: { tree: SearchTree }) {
  return (
    <Card className="p-3">
      <h4 className="text-sm font-medium mb-2">Search Tree (Depth: {tree.maxDepth})</h4>
      <div className="space-y-2">
        {tree.levels.map((level, levelIndex) => (
          <div
            key={`level-d${levelIndex}-n${level.nodes.length}`}
            className="flex items-center gap-1"
          >
            <span className="text-xs text-muted-foreground w-12">D{levelIndex}:</span>
            <div className="flex gap-1 flex-wrap">
              {level.nodes.slice(0, 20).map((node, nodeIndex) => (
                <motion.div
                  key={`node-d${levelIndex}-s${node.score.toFixed(3)}-${nodeIndex}`}
                  className={`w-3 h-3 rounded-sm ${
                    node.isInBestPath ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  title={`Score: ${node.score.toFixed(1)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: levelIndex * 0.1 + nodeIndex * 0.01 }}
                />
              ))}
              {level.nodes.length > 20 && (
                <span className="text-xs text-muted-foreground">
                  +{level.nodes.length - 20} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EvaluationDetails({ decision }: { decision: AdvancedAIDecision }) {
  const bestMove = decision.bestPath?.[0];
  if (!bestMove) return null;

  // Demo evaluation features (get from decision in actual implementation)
  const features = {
    landingHeight: decision.terrainEvaluation ? -decision.terrainEvaluation.smoothness * 5 : 0,
    linesCleared: 0, // Actual line clear count needed
    holes: Math.floor((1 - decision.terrainEvaluation.accessibility) * 10),
    rowTransitions: Math.floor(decision.terrainEvaluation.smoothness * 20),
    columnTransitions: Math.floor(decision.terrainEvaluation.smoothness * 15),
    wells: decision.terrainEvaluation.tSpinPotential * 3,
  };

  return (
    <Card className="p-3" data-testid="evaluation-details">
      <h4 className="text-sm font-medium mb-2">Evaluation Breakdown</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Landing Height:</span>
          <span className={features.landingHeight < 0 ? "text-green-600" : "text-red-600"}>
            {features.landingHeight.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Lines Cleared:</span>
          <span className="text-green-600">{features.linesCleared}</span>
        </div>
        <div className="flex justify-between">
          <span>Holes:</span>
          <span className={features.holes === 0 ? "text-green-600" : "text-red-600"}>
            {features.holes}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Row Transitions:</span>
          <span>{features.rowTransitions}</span>
        </div>
        <div className="flex justify-between">
          <span>Column Transitions:</span>
          <span>{features.columnTransitions}</span>
        </div>
        <div className="flex justify-between">
          <span>Wells:</span>
          <span>{features.wells.toFixed(1)}</span>
        </div>
        <hr className="my-1" />
        <div className="flex justify-between font-medium">
          <span>Total Score:</span>
          <span
            className={
              bestMove.evaluationScore && bestMove.evaluationScore > 0
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {bestMove.evaluationScore?.toFixed(2) || "N/A"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function SpecialOpportunities({
  tSpins,
  perfectClear,
}: {
  tSpins: TSpinOpportunity[];
  perfectClear: PerfectClearOpportunity | null;
}) {
  if (tSpins.length === 0 && !perfectClear) return null;

  return (
    <Card className="p-3">
      <h4 className="text-sm font-medium mb-2">Special Opportunities</h4>

      {tSpins.length > 0 && (
        <div className="mb-2">
          <h5 className="text-xs font-medium text-purple-600 mb-1">T-Spin Detected:</h5>
          {tSpins.slice(0, 3).map((tSpin, index) => (
            <div
              key={`tspin-${tSpin.type}-${tSpin.position.x}-${tSpin.position.y}-${index}`}
              className="text-xs flex justify-between"
            >
              <span>
                {tSpin.type} at ({tSpin.position.x},{tSpin.position.y})
              </span>
              <span className="text-purple-600">{tSpin.expectedLines} lines</span>
            </div>
          ))}
        </div>
      )}

      {perfectClear && (
        <div>
          <h5 className="text-xs font-medium text-blue-600 mb-1">Perfect Clear:</h5>
          <div className="text-xs flex justify-between">
            <span>{perfectClear.remainingBlocks} blocks remaining</span>
            <span className="text-blue-600">~{perfectClear.estimatedMoves} moves</span>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Create mock search tree (for demo)
 * Get search tree info from decision in actual implementation
 */
function createMockSearchTree(decision: AdvancedAIDecision): SearchTree["levels"] {
  const levels: SearchTree["levels"] = [];
  const maxDepth = decision.searchDepth || 2;
  const nodesExplored = decision.nodesExplored;

  for (let depth = 0; depth < maxDepth; depth++) {
    const nodesAtDepth = Math.max(1, Math.floor(nodesExplored / 2 ** (depth + 1)));
    const nodes = Array.from({ length: nodesAtDepth }, (_, i) => ({
      score: Math.random() * 100 - 50,
      isInBestPath: i === 0 && depth < (decision.bestPath?.length || 0),
    }));

    levels.push({ nodes });
  }

  return levels;
}
