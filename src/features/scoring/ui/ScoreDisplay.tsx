import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { useTranslation } from "react-i18next";
import { useAnimatedValue } from "@/hooks/ui/useAnimatedValue";
import { CARD_STYLES } from "@/utils/styles";
import { AnimatedScoreItem } from "./AnimatedScoreItem";
import { ComboIndicator } from "./ComboIndicator";
import { FloatingScoreManager } from "./FloatingScoreText";
import { ScoreCounter } from "./ScoreCounter";
import { TetrisFlashEffect } from "./TetrisFlashEffect";
import { TSpinIndicator } from "./TSpinIndicator";

export interface ScoreData {
  score: number;
  lines: number;
  level: number;
  previousScore?: number;
}

export interface ScoreAnimationState {
  previousScore: number;
  isAnimating: boolean;
  scoreIncrement: number;
}

export interface ComboState {
  count: number;
  isActive: boolean;
  lastUpdate: number;
}

export interface FloatingScoreEvent {
  id: string;
  value: number;
  type: "line-clear" | "combo" | "t-spin" | "perfect-clear";
  position: { x: number; y: number };
  timestamp: number;
}

export interface ScoreDisplayProps {
  scoreData: ScoreData;
  animationState?: ScoreAnimationState;
  comboState?: ComboState;
  floatingScoreEvents?: FloatingScoreEvent[];
  onFloatingScoreComplete?: (id: string) => void;
  className?: string;
  compact?: boolean;
  showAnimations?: boolean;
}

export function ScoreDisplay({
  scoreData,
  animationState,
  comboState,
  floatingScoreEvents = [],
  onFloatingScoreComplete,
  className,
  compact = false,
  showAnimations = true,
}: ScoreDisplayProps) {
  const { t } = useTranslation();
  const { score, lines, level, previousScore = 0 } = scoreData;

  const linesKey = useAnimatedValue(lines);
  const levelKey = useAnimatedValue(level);

  // Default handlers if not provided
  const handleFloatingScoreComplete =
    onFloatingScoreComplete ||
    ((_id: string) => {
      console.log("[ScoreDisplay] Floating score completed:", _id);
    });

  const cardClasses = compact
    ? `${CARD_STYLES.base} ${className}`
    : `${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive} ${className}`;

  return (
    <>
      <Card className={cardClasses} data-testid="score-display">
        <CardHeader className={compact ? "p-3" : undefined}>
          <CardTitle
            as="h2"
            className={`font-bold text-white text-center ${compact ? "text-sm" : "text-base"}`}
          >
            {t("game.score.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className={`space-y-3 ${compact ? "p-3" : ""}`}>
          {/* Live region for important score updates (level changes) */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {t("game.score.level")} {level}
          </div>

          {/* Enhanced Score Counter */}
          <div className="flex items-center justify-between">
            <p className={`font-medium text-gray-300 ${compact ? "text-xs" : "text-sm"}`}>
              {t("game.score.title")}
            </p>
            <ScoreCounter
              score={score}
              previousScore={animationState?.previousScore || previousScore}
              className={`font-bold text-tetris-cyan ${compact ? "text-lg" : "text-xl"}`}
              data-testid="score"
              showAnimation={showAnimations}
            />
          </div>

          {/* Lines Counter */}
          <div className="flex items-center justify-between">
            <p className={`font-medium text-gray-300 ${compact ? "text-xs" : "text-sm"}`}>
              {t("game.score.lines")}
            </p>
            <AnimatedScoreItem
              key={linesKey}
              value={lines}
              className={`font-bold text-tetris-blue ${compact ? "text-lg" : "text-xl"}`}
              data-testid="lines"
              showAnimation={showAnimations}
            />
          </div>

          {/* Level Counter */}
          <div className="flex items-center justify-between">
            <p className={`font-medium text-gray-300 ${compact ? "text-xs" : "text-sm"}`}>
              {t("game.score.level")}
            </p>
            <AnimatedScoreItem
              key={levelKey}
              value={level}
              className={`font-bold text-tetris-green ${compact ? "text-lg" : "text-xl"}`}
              data-testid="level"
              showAnimation={showAnimations}
            />
          </div>

          {/* Combo Indicator */}
          {showAnimations && comboState?.isActive && (
            <ComboIndicator
              comboCount={comboState.count}
              isActive={comboState.isActive}
              compact={compact}
            />
          )}
        </CardContent>
      </Card>

      {/* Floating Score Effects */}
      {showAnimations && floatingScoreEvents.length > 0 && (
        <FloatingScoreManager
          events={floatingScoreEvents}
          onComplete={handleFloatingScoreComplete}
        />
      )}

      {/* Special Effects */}
      {showAnimations && (
        <>
          <TetrisFlashEffect />
          <TSpinIndicator />
        </>
      )}
    </>
  );
}
