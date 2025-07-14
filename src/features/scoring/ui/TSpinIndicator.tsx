import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface TSpinIndicatorProps {
  type?: "none" | "mini" | "normal";
  linesCleared?: number;
  show?: boolean;
  onComplete?: () => void;
}

/**
 * T-Spin indicator component
 */
export function TSpinIndicator({
  type = "none",
  linesCleared = 0,
  show = false,
  onComplete,
}: TSpinIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show && type !== "none") {
      setIsVisible(true);

      // Auto-hide after 2 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [show, type, onComplete]);

  if (!isVisible || type === "none") {
    return null;
  }

  const getText = () => {
    const baseText = type === "mini" ? "T-SPIN MINI" : "T-SPIN";
    const lineText =
      linesCleared > 0
        ? ` ${
            linesCleared === 1
              ? "SINGLE"
              : linesCleared === 2
                ? "DOUBLE"
                : linesCleared === 3
                  ? "TRIPLE"
                  : ""
          }`
        : "";
    return baseText + lineText;
  };

  const getColor = () => {
    if (type === "mini") return "text-yellow-400";
    if (linesCleared >= 3) return "text-purple-400";
    if (linesCleared === 2) return "text-red-400";
    return "text-orange-400";
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -10 }}
      animate={{
        scale: [0, 1.2, 1],
        opacity: 1,
        rotate: 0,
        y: [0, -10, 0],
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        type: "spring",
      }}
      className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        text-2xl font-bold text-center z-50
        ${getColor()}
        drop-shadow-lg
      `}
    >
      <div className="bg-black/80 px-4 py-2 rounded-lg border-2 border-current">{getText()}</div>
    </motion.div>
  );
}
