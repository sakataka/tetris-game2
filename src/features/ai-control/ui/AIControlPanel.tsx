import { useState } from "react";
import { useTranslation } from "react-i18next";
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

export interface AIControlPanelProps {
  aiState: AIState;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onToggleAI: () => void;
  onPause: () => void;
  onStep: () => void;
  className?: string;
  compact?: boolean;
}

export function AIControlPanel({
  aiState,
  settings,
  onSettingsChange,
  onToggleAI,
  onPause,
  onStep,
  className,
  compact = false,
}: AIControlPanelProps) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSettings = (updates: Partial<AISettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`} data-testid="ai-control-panel">
      {/* Basic Control */}
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold ${compact ? "text-base" : "text-lg"}`}>
          {t("game.ai.controls.title")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleAI}
            variant={aiState.isEnabled ? "destructive" : "default"}
            size={compact ? "sm" : "default"}
            data-testid="toggle-ai"
          >
            {aiState.isEnabled ? t("game.ai.controls.stop") : t("game.ai.controls.start")}
          </Button>

          {aiState.isEnabled && (
            <>
              <Button
                onClick={onPause}
                variant="outline"
                size={compact ? "sm" : "default"}
                data-testid="pause-ai"
              >
                {aiState.isPaused ? t("game.ai.controls.resume") : t("game.ai.controls.pause")}
              </Button>
              <Button
                onClick={onStep}
                variant="outline"
                size={compact ? "sm" : "default"}
                disabled={!aiState.isPaused}
                data-testid="step-ai"
              >
                {t("game.ai.controls.step")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={aiState.isEnabled ? "default" : "secondary"} data-testid="ai-status">
          {aiState.isEnabled ? t("game.ai.controls.active") : t("game.ai.controls.inactive")}
        </Badge>

        {aiState.isThinking && (
          <Badge variant="outline" data-testid="thinking-indicator">
            {t("game.ai.controls.thinking")}
          </Badge>
        )}

        {aiState.lastDecision && (
          <span className="text-muted-foreground">
            {t("game.ai.controls.last")} {aiState.lastDecision.thinkingTime.toFixed(1)}
            {t("game.ai.controls.ms")}, {aiState.lastDecision.nodesExplored}{" "}
            {t("game.ai.controls.nodes")}
          </span>
        )}
      </div>

      {/* AI Level Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("game.ai.controls.level")}</label>
        <Select
          value={settings.aiLevel}
          onValueChange={(value: "basic" | "advanced") => updateSettings({ aiLevel: value })}
        >
          <SelectTrigger data-testid="ai-level-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">{t("game.ai.controls.basic")}</SelectItem>
            <SelectItem value="advanced">{t("game.ai.controls.advanced")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Settings Toggle */}
      {settings.aiLevel === "advanced" && (
        <div className="flex items-center space-x-2">
          <Switch id="show-advanced" checked={showAdvanced} onCheckedChange={setShowAdvanced} />
          <label htmlFor="show-advanced" className="text-sm font-medium">
            {t("game.ai.controls.showAdvanced")}
          </label>
        </div>
      )}

      {/* Advanced Settings */}
      {settings.aiLevel === "advanced" && showAdvanced && (
        <div className="space-y-4 pt-2 border-t">
          {/* Beam Width */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("game.ai.controls.beamWidth")}: {settings.beamWidth}
            </label>
            <Slider
              value={[settings.beamWidth]}
              onValueChange={([value]) => updateSettings({ beamWidth: value })}
              min={1}
              max={20}
              step={1}
              data-testid="beam-width-slider"
            />
          </div>

          {/* Thinking Time Limit */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("game.ai.controls.thinkingTime")}: {settings.thinkingTimeLimit}ms
            </label>
            <Slider
              value={[settings.thinkingTimeLimit]}
              onValueChange={([value]) => updateSettings({ thinkingTimeLimit: value })}
              min={10}
              max={200}
              step={10}
              data-testid="thinking-time-slider"
            />
          </div>

          {/* Use Hold */}
          <div className="flex items-center space-x-2">
            <Switch
              id="use-hold"
              checked={settings.useHold}
              onCheckedChange={(checked) => updateSettings({ useHold: checked })}
              data-testid="use-hold-switch"
            />
            <label htmlFor="use-hold" className="text-sm font-medium">
              {t("game.ai.controls.useHold")}
            </label>
          </div>

          {/* Enable Visualization */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-visualization"
              checked={settings.enableVisualization}
              onCheckedChange={(checked) => updateSettings({ enableVisualization: checked })}
              data-testid="visualization-switch"
            />
            <label htmlFor="enable-visualization" className="text-sm font-medium">
              {t("game.ai.controls.visualization")}
            </label>
          </div>

          {/* Playback Speed */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("game.ai.controls.playbackSpeed")}: {settings.playbackSpeed}x
            </label>
            <Slider
              value={[settings.playbackSpeed]}
              onValueChange={([value]) => updateSettings({ playbackSpeed: value })}
              min={0.1}
              max={5}
              step={0.1}
              data-testid="playback-speed-slider"
            />
          </div>
        </div>
      )}

      {/* Statistics Display */}
      {aiState.stats && (
        <div className="pt-2 border-t">
          <h3 className="text-sm font-medium mb-2">{t("game.ai.controls.statistics")}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.avgNodes")}:</span>
              <span className="ml-1">
                {aiState.stats.averageNodesExplored?.toFixed(0) ?? "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.avgTime")}:</span>
              <span className="ml-1">
                {aiState.stats.averageThinkingTime?.toFixed(1) ?? "N/A"}ms
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.totalMoves")}:</span>
              <span className="ml-1">{aiState.stats.totalMoves ?? 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.efficiency")}:</span>
              <span className="ml-1">{aiState.stats.efficiency?.toFixed(2) ?? "N/A"}%</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
