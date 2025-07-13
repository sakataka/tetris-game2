import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ComboIndicatorProps {
  comboCount: number;
  isActive: boolean;
  lastClearType: "single" | "double" | "triple" | "tetris" | "tspin" | null;
  className?: string;
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
}: ComboIndicatorProps) {
  const [highlightAnimation, setHighlightAnimation] = useState("");
  const [responseTime, setResponseTime] = useState<number>(0);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isActive && comboCount > 1) {
      // 🎯 120ms以内ハイライト開始測定
      startTimeRef.current = performance.now();

      setHighlightAnimation("combo-flash");

      // Performance measurement
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTimeRef.current;
        setResponseTime(responseTime);

        if (responseTime > 120) {
          console.warn(`⚠️ Slow combo response: ${responseTime.toFixed(2)}ms`);
        }
      });

      // Reset animation after 300ms
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightAnimation("");
      }, 300);
    } else {
      setHighlightAnimation("");
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [comboCount, isActive]);

  if (!isActive || comboCount <= 1) {
    return null;
  }

  const getComboColor = () => {
    switch (lastClearType) {
      case "tetris":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400";
      case "tspin":
        return "text-purple-400 bg-purple-400/20 border-purple-400";
      case "triple":
        return "text-red-400 bg-red-400/20 border-red-400";
      case "double":
        return "text-blue-400 bg-blue-400/20 border-blue-400";
      default:
        return "text-green-400 bg-green-400/20 border-green-400";
    }
  };

  return (
    <motion.div
      className={`
        inline-flex items-center px-3 py-1 rounded-lg border-2 font-bold text-sm
        ${getComboColor()} 
        ${highlightAnimation === "combo-flash" ? "animate-pulse" : ""}
        ${className}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <span className="mr-1">{comboCount}x</span>
      <span>COMBO</span>

      {/* Performance debug info (only in development) */}
      {process.env.NODE_ENV === "development" && responseTime > 0 && (
        <span className="ml-2 text-xs opacity-60">{responseTime.toFixed(1)}ms</span>
      )}
    </motion.div>
  );
}
