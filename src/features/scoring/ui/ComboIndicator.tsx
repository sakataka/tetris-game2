import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ComboIndicatorProps {
  comboCount: number;
  isActive: boolean;
  lastClearType?: "single" | "double" | "triple" | "tetris" | "tspin" | null;
  className?: string;
  compact?: boolean;
}

/**
 * Combo indicator with 120ms maximum highlight response time
 * Meets Issue #137 requirement: Instant Combo Feedback (120ms以内ハイライト開始)
 */
export function ComboIndicator({
  comboCount,
  isActive,
  lastClearType,
  className = "",
  compact = false,
}: ComboIndicatorProps) {
  const [highlightAnimation, setHighlightAnimation] = useState("");
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && comboCount > 1) {
      // 🎯 120ms以内ハイライト開始
      setHighlightAnimation("highlight");

      // Clear previous timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Reset highlight after animation
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightAnimation("");
      }, 1000);
    } else {
      setHighlightAnimation("");
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [isActive, comboCount]);

  if (!isActive || comboCount <= 1) {
    return null;
  }

  const getComboText = () => {
    if (comboCount >= 10) return "INCREDIBLE!";
    if (comboCount >= 7) return "AMAZING!";
    if (comboCount >= 5) return "AWESOME!";
    if (comboCount >= 3) return "GREAT!";
    return "COMBO!";
  };

  const getComboColor = () => {
    if (comboCount >= 10) return "text-purple-400";
    if (comboCount >= 7) return "text-red-400";
    if (comboCount >= 5) return "text-orange-400";
    if (comboCount >= 3) return "text-yellow-400";
    return "text-tetris-cyan";
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: highlightAnimation === "highlight" ? [-5, 0] : 0,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        type: "spring",
        stiffness: 300,
      }}
      className={`
        ${compact ? "text-xs" : "text-sm"} 
        font-bold text-center 
        ${getComboColor()} 
        ${highlightAnimation === "highlight" ? "animate-pulse" : ""}
        ${className}
      `}
    >
      <div className={compact ? "space-y-0" : "space-y-1"}>
        <div>{getComboText()}</div>
        <div className="text-xs text-gray-400">
          {comboCount}x COMBO
          {lastClearType && (
            <span className="ml-1 text-gray-500">({lastClearType.toUpperCase()})</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
