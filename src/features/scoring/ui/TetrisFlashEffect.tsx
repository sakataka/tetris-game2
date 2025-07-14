import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface TetrisFlashEffectProps {
  isActive?: boolean;
  onComplete?: () => void;
}

/**
 * Tetris flash effect for 4-line clears
 */
export function TetrisFlashEffect({ isActive = false, onComplete }: TetrisFlashEffectProps) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowEffect(true);

      const timeout = setTimeout(() => {
        setShowEffect(false);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete]);

  if (!showEffect) {
    return null;
  }

  return (
    <>
      {/* Screen flash effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0, 0.6, 0, 0.4, 0],
          backgroundColor: ["#ffffff", "#ffff00", "#ffffff", "#ffff00", "#ffffff"],
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 1],
        }}
        className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
      />

      {/* TETRIS! text */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{
          scale: [0, 1.5, 1.2, 1],
          opacity: [0, 1, 1, 0],
          rotate: [10, 0, 0, 0],
          y: [0, -20, -10, 0],
        }}
        transition={{
          duration: 1,
          ease: "easeOut",
          times: [0, 0.3, 0.7, 1],
        }}
        className="
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          text-6xl font-bold text-center z-50
          text-yellow-400
          drop-shadow-lg
          pointer-events-none
        "
        style={{
          textShadow: "0 0 20px rgba(255, 255, 0, 0.8), 0 0 40px rgba(255, 255, 0, 0.6)",
        }}
      >
        <div className="bg-black/80 px-6 py-3 rounded-lg border-4 border-yellow-400">TETRIS!</div>
      </motion.div>

      {/* Particle effects */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              scale: 0,
              x: "50vw",
              y: "50vh",
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: `${50 + (Math.random() - 0.5) * 100}vw`,
              y: `${50 + (Math.random() - 0.5) * 100}vh`,
            }}
            transition={{
              duration: 1,
              delay: i * 0.05,
              ease: "easeOut",
            }}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          />
        ))}
      </div>
    </>
  );
}
