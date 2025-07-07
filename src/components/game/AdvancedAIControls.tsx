import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { AdvancedAIDecision, AdvancedAIStats } from "@/game/ai";

export interface AISettings {
  aiLevel: "basic" | "advanced";
  beamWidth: number;
  thinkingTimeLimit: number;
  useHold: boolean;
  enableVisualization: boolean;
  playbackSpeed: number;
}

export interface AIState {
  isEnabled: boolean;
  isPaused: boolean;
  isThinking: boolean;
  lastDecision?: AdvancedAIDecision | null;
  stats?: AdvancedAIStats;
}

export interface AdvancedAIControlsProps {
  aiState: AIState;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onToggleAI: () => void;
  onPause: () => void;
  onStep: () => void;
}

export function AdvancedAIControls({
  aiState,
  settings,
  onSettingsChange,
  onToggleAI,
  onPause,
  onStep,
}: AdvancedAIControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card className="p-4 space-y-4" data-testid="ai-controls">
      {/* Basic Control */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Control</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleAI}
            variant={aiState.isEnabled ? "destructive" : "default"}
            size="sm"
            data-testid="toggle-ai"
          >
            {aiState.isEnabled ? "Stop AI" : "Start AI"}
          </Button>

          {aiState.isEnabled && (
            <>
              <Button onClick={onPause} variant="outline" size="sm">
                {aiState.isPaused ? "Resume" : "Pause"}
              </Button>
              <Button onClick={onStep} variant="outline" size="sm" disabled={!aiState.isPaused}>
                Step
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={aiState.isEnabled ? "default" : "secondary"} data-testid="ai-status">
          {aiState.isEnabled ? "Active" : "Inactive"}
        </Badge>

        {aiState.isThinking && (
          <Badge variant="outline" data-testid="thinking-indicator">
            Thinking...
          </Badge>
        )}

        {aiState.lastDecision && (
          <span className="text-muted-foreground">
            Last: {aiState.lastDecision.thinkingTime.toFixed(1)}ms,{" "}
            {aiState.lastDecision.nodesExplored} nodes
          </span>
        )}
      </div>

      {/* AI Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="ai-level-select" className="text-sm font-medium">
            AI Level
          </label>
          <Select
            value={settings.aiLevel}
            onValueChange={(value: "basic" | "advanced") =>
              onSettingsChange({ ...settings, aiLevel: value })
            }
          >
            <SelectTrigger id="ai-level-select" className="w-32" data-testid="ai-level-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="playback-speed-slider" className="text-sm font-medium">
              Playback Speed
            </label>
            <span className="text-sm text-muted-foreground">{settings.playbackSpeed}x</span>
          </div>
          <Slider
            id="playback-speed-slider"
            value={[settings.playbackSpeed]}
            onValueChange={([value]) => onSettingsChange({ ...settings, playbackSpeed: value })}
            min={0.1}
            max={2.0}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="show-visualization-switch" className="text-sm font-medium">
            Show Visualization
          </label>
          <Switch
            id="show-visualization-switch"
            checked={settings.enableVisualization}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, enableVisualization: checked })
            }
            data-testid="enable-visualization"
          />
        </div>

        {/* Advanced Settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
          data-testid="show-advanced"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Settings
        </Button>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t">
            {settings.aiLevel === "advanced" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="beam-width" className="text-sm font-medium">
                      Beam Width
                    </label>
                    <span
                      className="text-sm text-muted-foreground"
                      data-testid="current-beam-width"
                    >
                      {settings.beamWidth}
                    </span>
                  </div>
                  <Slider
                    id="beam-width"
                    value={[settings.beamWidth]}
                    onValueChange={([value]) => onSettingsChange({ ...settings, beamWidth: value })}
                    min={5}
                    max={20}
                    step={1}
                    className="w-full"
                    data-testid="beam-width-slider"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="time-limit" className="text-sm font-medium">
                      Time Limit (ms)
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {settings.thinkingTimeLimit}
                    </span>
                  </div>
                  <Slider
                    value={[settings.thinkingTimeLimit]}
                    onValueChange={([value]) =>
                      onSettingsChange({ ...settings, thinkingTimeLimit: value })
                    }
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="use-hold" className="text-sm font-medium">
                    Use Hold
                  </label>
                  <Switch
                    id="use-hold"
                    checked={settings.useHold}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ ...settings, useHold: checked })
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      {aiState.stats && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>Decisions:</span>
            <span>{aiState.stats.totalDecisions}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Time:</span>
            <span>{aiState.stats.averageThinkTime.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Timeouts:</span>
            <span>{aiState.stats.timeoutCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Hold Usage:</span>
            <span>{(aiState.stats.holdUsageRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
