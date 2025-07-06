import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { getTSpinDisplayName, type TSpinType } from "@/game/scoring";

interface TSpinIndicatorProps {
  tSpinType: TSpinType;
  linesCleared: number;
  show: boolean;
  onComplete?: () => void;
}

/**
 * T-Spin Indicator Component
 *
 * Displays animated T-Spin notifications with appropriate styling
 * based on T-Spin type and lines cleared.
 */
export function TSpinIndicator({ tSpinType, linesCleared, show, onComplete }: TSpinIndicatorProps) {
  const { t } = useTranslation();

  // Don't render if not showing or no T-Spin
  if (!show || tSpinType === "none") {
    return null;
  }

  const displayName = getTSpinDisplayName(tSpinType, linesCleared);

  // Get styling based on T-Spin type
  const getSpinStyles = () => {
    switch (tSpinType) {
      case "mini":
        return {
          textColor: "text-purple-400",
          glowColor: "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]",
          bgColor: "bg-gradient-to-r from-purple-600/20 to-purple-500/20",
          borderColor: "border-purple-400/30",
        };
      case "normal":
        return {
          textColor: "text-purple-300",
          glowColor: "drop-shadow-[0_0_12px_rgba(196,181,253,1)]",
          bgColor: "bg-gradient-to-r from-purple-500/30 to-purple-400/30",
          borderColor: "border-purple-300/50",
        };
      default:
        return {
          textColor: "text-gray-400",
          glowColor: "drop-shadow-[0_0_4px_rgba(156,163,175,0.5)]",
          bgColor: "bg-gradient-to-r from-gray-600/20 to-gray-500/20",
          borderColor: "border-gray-400/30",
        };
    }
  };

  const styles = getSpinStyles();

  return (
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      aria-live="assertive"
      aria-atomic="true"
    >
      <motion.div
        initial={{
          scale: 0.3,
          opacity: 0,
          rotateX: -90,
        }}
        animate={{
          scale: 1,
          opacity: 1,
          rotateX: 0,
        }}
        exit={{
          scale: 1.2,
          opacity: 0,
          y: -20,
        }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart
          scale: {
            type: "spring",
            stiffness: 300,
            damping: 25,
          },
        }}
        onAnimationComplete={() => {
          // Auto-hide after showing for a duration
          const hideTimer = setTimeout(() => {
            onComplete?.();
          }, 1500);

          return () => clearTimeout(hideTimer);
        }}
        className={`
          ${styles.bgColor} 
          ${styles.borderColor}
          border-2 rounded-xl px-6 py-3
          backdrop-blur-sm
          shadow-2xl
        `}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center"
        >
          <motion.h2
            className={`
              ${styles.textColor} 
              ${styles.glowColor}
              text-2xl sm:text-3xl md:text-4xl 
              font-black tracking-wider
              uppercase select-none
            `}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            {displayName}
          </motion.h2>

          {/* Accent line under text */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className={`
              h-1 mx-auto mt-2 rounded-full
              ${tSpinType === "mini" ? "w-16" : "w-20"}
              ${styles.bgColor.replace("/20", "/60").replace("/30", "/60")}
            `}
          />

          {/* Score display if available */}
          {linesCleared > 0 && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className={`
                ${styles.textColor} 
                text-sm font-semibold mt-1 opacity-80
              `}
            >
              {t("game.linesCleared", { count: linesCleared })}
            </motion.p>
          )}
        </motion.div>

        {/* Particle effects for visual enhancement */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <motion.div
              key={`particle-${i}`}
              className={`
                absolute w-1 h-1 rounded-full
                ${styles.bgColor.replace("/20", "").replace("/30", "")}
              `}
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 2) * 80}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Screen reader announcement */}
      <div className="sr-only">
        {t("game.tSpinAnnouncement", {
          type: displayName,
          lines: linesCleared,
        })}
      </div>
    </div>
  );
}
