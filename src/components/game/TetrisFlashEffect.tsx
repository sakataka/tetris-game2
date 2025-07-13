import { useEffect, useRef, useState } from "react";

interface TetrisFlashEffectProps {
  isTriggered: boolean;
  onComplete?: () => void;
}

/**
 * Tetris flash effect with 200ms maximum completion time
 * Meets Issue #137 requirement: Tetris Special Effect (200ms以内画面フラッシュ完了)
 */
export function TetrisFlashEffect({ isTriggered, onComplete }: TetrisFlashEffectProps) {
  const [flashIntensity, setFlashIntensity] = useState(0);
  const [effectDuration, setEffectDuration] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isTriggered) {
      startTimeRef.current = performance.now();
      const duration = 200; // 🎯 200ms以内完了

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = elapsed / duration;

        if (progress <= 0.3) {
          // Flash up (0-30% of duration)
          setFlashIntensity(progress / 0.3);
        } else {
          // Flash down (30-100% of duration)
          setFlashIntensity(1 - (progress - 0.3) / 0.7);
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const finalDuration = performance.now() - startTimeRef.current;
          setEffectDuration(finalDuration);
          setFlashIntensity(0);

          // Performance measurement
          if (finalDuration > 200) {
            console.warn(`⚠️ Slow Tetris flash: ${finalDuration.toFixed(2)}ms`);
          }

          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTriggered, onComplete]);

  if (flashIntensity === 0) return null;

  return (
    <>
      {/* Main flash overlay */}
      <div
        className="tetris-flash-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(255, 255, 255, ${flashIntensity * 0.8})`,
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      {/* Performance debug info (only in development) */}
      {process.env.NODE_ENV === "development" && effectDuration > 0 && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 10000,
            pointerEvents: "none",
          }}
        >
          Tetris Flash: {effectDuration.toFixed(1)}ms
        </div>
      )}
    </>
  );
}
