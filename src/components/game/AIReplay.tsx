import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { AdvancedAIDecision, Move } from "@/game/ai";
import type { GameState } from "@/types/game";
import type { AISettings } from "./AdvancedAIControls";

export interface ReplayData {
  moves: Move[];
  decisions: AdvancedAIDecision[];
  gameStates: GameState[];
  metadata: {
    startTime: number;
    endTime: number;
    finalScore: number;
    aiSettings: AISettings;
  };
}

export interface AIReplayProps {
  replayData: ReplayData;
  onReplayEnd?: () => void;
}

export function AIReplay({ replayData, onReplayEnd }: AIReplayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const maxSteps = replayData.moves.length;

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps - 1) {
          setIsPlaying(false);
          onReplayEnd?.();
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, maxSteps, onReplayEnd]);

  const currentDecision = replayData.decisions[currentStep];

  return (
    <Card className="p-4 space-y-4" data-testid="replay-controls">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Replay</h3>
        <Button variant="outline" onClick={onReplayEnd} data-testid="close-replay">
          Close
        </Button>
      </div>

      {/* Playback Control */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)} data-testid="replay-play">
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentStep(Math.min(maxSteps - 1, currentStep + 1))}
            disabled={currentStep === maxSteps - 1}
            data-testid="replay-next"
          >
            Next
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Step {currentStep + 1} / {maxSteps}
            </span>
            <span>Speed: {playbackSpeed}x</span>
          </div>

          <Slider
            value={[currentStep]}
            onValueChange={([value]) => setCurrentStep(value)}
            min={0}
            max={maxSteps - 1}
            step={1}
            className="w-full"
          />

          <Slider
            value={[playbackSpeed]}
            onValueChange={([value]) => setPlaybackSpeed(value)}
            min={0.25}
            max={4}
            step={0.25}
            className="w-full"
          />
        </div>
      </div>

      {/* Current State Display */}
      {currentDecision && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Step {currentStep + 1} Analysis</h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium">Move:</div>
              <div>
                {currentDecision.bestPath?.[0]?.piece} R
                {currentDecision.bestPath?.[0]?.rotation || 0}
              </div>
              <div>
                Position: ({currentDecision.bestPath?.[0]?.x || 0},{" "}
                {currentDecision.bestPath?.[0]?.y || 0})
              </div>
            </div>

            <div>
              <div className="font-medium">Performance:</div>
              <div>Think Time: {currentDecision.thinkingTime.toFixed(1)}ms</div>
              <div>Nodes: {currentDecision.nodesExplored}</div>
              <div>
                Score: {currentDecision.bestPath?.[0]?.evaluationScore?.toFixed(2) || "N/A"}
              </div>
            </div>
          </div>

          {currentDecision.usedHold && (
            <div className="text-xs text-purple-600 font-medium">Used Hold in this move</div>
          )}

          {/* Special Techniques Display */}
          {currentDecision.tSpinOpportunities.length > 0 && (
            <div className="text-xs text-purple-600 font-medium">
              T-Spin opportunities: {currentDecision.tSpinOpportunities.length}
            </div>
          )}

          {currentDecision.perfectClearOpportunity && (
            <div className="text-xs text-blue-600 font-medium">
              Perfect Clear opportunity detected!
            </div>
          )}
        </div>
      )}

      {/* Game Metadata */}
      <div className="pt-2 border-t">
        <h4 className="text-sm font-medium mb-2">Game Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Final Score:</span>
            <span className="ml-2">{replayData.metadata.finalScore.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="ml-2">
              {Math.floor((replayData.metadata.endTime - replayData.metadata.startTime) / 1000)}s
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">AI Level:</span>
            <span className="ml-2 capitalize">{replayData.metadata.aiSettings.aiLevel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Moves:</span>
            <span className="ml-2">{replayData.moves.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
