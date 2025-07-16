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

export interface AdvancedAIControlsProps {
  aiState: AIState;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onToggleAI: () => void;
  onPause: () => void;
}

export function AdvancedAIControls({
  aiState,
  settings,
  onSettingsChange,
  onToggleAI,
  onPause,
}: AdvancedAIControlsProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-4 space-y-4" data-testid="ai-controls">
      {/* Basic Control */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("game.ai.controls.title")}</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleAI}
            variant={aiState.isEnabled ? "destructive" : "default"}
            size="sm"
            data-testid="toggle-ai"
          >
            {aiState.isEnabled ? t("game.ai.controls.stop") : t("game.ai.controls.start")}
          </Button>

          {aiState.isEnabled && (
            <Button onClick={onPause} variant="outline" size="sm">
              {aiState.isPaused ? t("game.ai.controls.resume") : t("game.ai.controls.pause")}
            </Button>
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

      {/* AI Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="ai-level-select" className="text-sm font-medium">
            {t("game.ai.controls.level")}
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
              <SelectItem value="basic">{t("game.ai.controls.basic")}</SelectItem>
              <SelectItem value="advanced">{t("game.ai.controls.advanced")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="playback-speed-slider" className="text-sm font-medium">
              {t("game.ai.controls.playbackSpeed")}
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
            {t("game.ai.controls.showVisualization")}
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
      </div>

      {/* Statistics */}
      {aiState.stats && (
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>{t("game.ai.controls.decisions")}</span>
            <span>{aiState.stats.totalDecisions}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("game.ai.controls.avgTime")}</span>
            <span>
              {aiState.stats.averageThinkTime.toFixed(1)}
              {t("game.ai.controls.ms")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("game.ai.controls.timeouts")}</span>
            <span>{aiState.stats.timeoutCount}</span>
          </div>
          <div className="flex justify-between">
            <span>{t("game.ai.controls.holdUsage")}</span>
            <span>{(aiState.stats.holdUsageRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
