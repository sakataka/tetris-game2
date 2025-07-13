import { useEffect, useRef, useState } from "react";
import type { FloatingScoreEvent } from "@/types/game";

interface FloatingScoreTextProps {
  event: FloatingScoreEvent;
  onComplete: (id: string) => void;
}

/**
 * Floating score text with 1-second fade-out animation
 * Meets Issue #137 requirement: +点数テキスト1秒フェードアウト
 */
export function FloatingScoreText({ event, onComplete }: FloatingScoreTextProps) {
  const [opacity, setOpacity] = useState(1);
  const [yOffset, setYOffset] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1000; // 🎯 1秒フェードアウト

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Fade out and float up
      setOpacity(1 - progress);
      setYOffset(-progress * 50); // Float 50px up

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete(event.id);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [event.id, onComplete]);

  const getScoreColor = () => {
    if (event.points >= 1000) return "#FFD700"; // Gold for high scores
    if (event.points >= 500) return "#FF6B35"; // Orange for medium scores
    return "#00FF00"; // Green for regular scores
  };

  return (
    <div
      className="floating-score-text"
      style={{
        position: "absolute",
        left: `${event.position.x * 30}px`, // Convert grid position to pixels
        top: `${event.position.y * 30 + yOffset}px`,
        opacity,
        pointerEvents: "none",
        fontSize: "1.2rem",
        fontWeight: "bold",
        color: getScoreColor(),
        textShadow: "0 0 10px currentColor",
        zIndex: 1000,
        userSelect: "none",
      }}
    >
      +{event.points}
    </div>
  );
}

interface FloatingScoreManagerProps {
  events: FloatingScoreEvent[];
  onEventComplete: (id: string) => void;
}

/**
 * Manages multiple floating score text instances
 */
export function FloatingScoreManager({ events, onEventComplete }: FloatingScoreManagerProps) {
  return (
    <div className="floating-score-manager">
      {events
        .filter((event) => event.isActive)
        .map((event) => (
          <FloatingScoreText key={event.id} event={event} onComplete={onEventComplete} />
        ))}
    </div>
  );
}
