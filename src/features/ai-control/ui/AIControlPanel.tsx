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
  stats?: AdvancedAIStats | null;
}

export interface AIControlPanelProps {
  aiState: AIState;
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
  onToggleAI: () => void;
  onPause: () => void;
  className?: string;
  compact?: boolean;
}

export function AIControlPanel({
  aiState,
  settings,
  onSettingsChange,
  onToggleAI,
  onPause,
  className,
  compact = false,
}: AIControlPanelProps) {
  const { t } = useTranslation();

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
            <Button
              onClick={onPause}
              variant="outline"
              size={compact ? "sm" : "default"}
              data-testid="pause-ai"
            >
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

      {/* AI Level Selection */}
      <div className="space-y-2">
        <label htmlFor="ai-level-select" className="text-sm font-medium">
          {t("game.ai.controls.level")}
        </label>
        <Select
          value={settings.aiLevel}
          onValueChange={(value: "basic" | "advanced") => updateSettings({ aiLevel: value })}
        >
          <SelectTrigger id="ai-level-select" data-testid="ai-level-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">{t("game.ai.controls.basic")}</SelectItem>
            <SelectItem value="advanced">{t("game.ai.controls.advanced")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
              <span className="ml-1">{aiState.stats.averageThinkTime?.toFixed(1) ?? "N/A"}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.totalMoves")}:</span>
              <span className="ml-1">{aiState.stats.totalDecisions ?? 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("game.ai.controls.efficiency")}:</span>
              <span className="ml-1">{aiState.stats.tSpinDetectionRate?.toFixed(2) ?? "N/A"}%</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
