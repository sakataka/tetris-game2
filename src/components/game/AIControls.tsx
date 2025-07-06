import { Brain, Pause, Play, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIController } from "@/hooks/ai/useAIController";
import { useGameStore } from "@/store/gameStore";
import { CARD_STYLES } from "@/utils/styles";

/**
 * AI Controls component for enabling/disabling AI gameplay
 * Uses isolated custom hook to prevent React dependency issues
 */
export function AIControls() {
  const { t } = useTranslation();
  const { aiEnabled, isThinking, aiStats, toggleAI } = useAIController();

  // Game state selectors (using individual selectors for Zustand v5 compliance)
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentPiece = useGameStore((state) => state.currentPiece);

  const canRunAI = !isGameOver && !isPaused && currentPiece;

  return (
    <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
          <Brain className="w-4 h-4" />
          {t("game.ai.title", "AI Controls")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* AI Toggle Button */}
        <Button
          onClick={toggleAI}
          disabled={!canRunAI && !aiEnabled}
          variant={aiEnabled ? "destructive" : "default"}
          className="w-full text-sm"
        >
          {aiEnabled ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              {t("game.ai.stop", "Stop AI")}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t("game.ai.start", "Start AI")}
            </>
          )}
        </Button>

        {/* AI Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{t("game.ai.status", "Status")}:</span>
          <Badge
            variant={aiEnabled ? "default" : "outline"}
            className={aiEnabled ? "bg-green-600 text-white" : "border-gray-600 text-gray-400"}
          >
            {isThinking ? (
              <>
                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                {t("game.ai.thinking", "Thinking")}
              </>
            ) : aiEnabled ? (
              t("game.ai.active", "Active")
            ) : (
              t("game.ai.inactive", "Inactive")
            )}
          </Badge>
        </div>

        {/* AI Statistics (only show when AI has been active) */}
        {aiStats.movesPlayed > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              {t("game.ai.stats", "AI Statistics")}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">{t("game.ai.moves", "Moves")}:</div>
              <div className="text-right text-gray-300">{aiStats.movesPlayed}</div>
              <div className="text-gray-400">{t("game.ai.avgTime", "Avg Time")}:</div>
              <div className="text-right text-gray-300">{aiStats.avgThinkTime.toFixed(1)}ms</div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          {aiEnabled
            ? t("game.ai.helpActive", "AI is playing automatically")
            : t("game.ai.helpInactive", "Click to enable AI auto-play")}
        </div>
      </CardContent>
    </Card>
  );
}
