import { motion } from "motion/react";
import { useEffect } from "react";

export interface FloatingScoreEvent {
  id: string;
  value: number;
  type: "line-clear" | "combo" | "t-spin" | "perfect-clear";
  position: { x: number; y: number };
  timestamp: number;
}

interface FloatingScoreTextProps {
  event: FloatingScoreEvent;
  onComplete: (id: string) => void;
}

/**
 * Individual floating score text component
 */
export function FloatingScoreText({ event, onComplete }: FloatingScoreTextProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete(event.id);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [event.id, onComplete]);

  const getColor = () => {
    switch (event.type) {
      case "t-spin":
        return "text-purple-400";
      case "perfect-clear":
        return "text-rainbow";
      case "combo":
        return "text-orange-400";
      default:
        return "text-tetris-cyan";
    }
  };

  const getText = () => {
    const baseText = `+${event.value.toLocaleString()}`;
    const typeText =
      event.type === "t-spin"
        ? " T-SPIN!"
        : event.type === "perfect-clear"
          ? " PERFECT!"
          : event.type === "combo"
            ? " COMBO!"
            : "";
    return baseText + typeText;
  };

  return (
    <motion.div
      initial={{
        scale: 0,
        opacity: 0,
        x: event.position.x,
        y: event.position.y,
      }}
      animate={{
        scale: [0, 1.2, 1],
        opacity: [0, 1, 0],
        y: event.position.y - 50,
      }}
      transition={{
        duration: 2,
        ease: "easeOut",
        times: [0, 0.3, 1],
      }}
      className={`
        absolute pointer-events-none z-40
        text-lg font-bold
        ${getColor()}
        drop-shadow-lg
      `}
      style={{
        left: event.position.x,
        top: event.position.y,
      }}
    >
      {getText()}
    </motion.div>
  );
}

interface FloatingScoreManagerProps {
  events: FloatingScoreEvent[];
  onComplete: (id: string) => void;
}

/**
 * Manager component for multiple floating score texts
 */
export function FloatingScoreManager({ events, onComplete }: FloatingScoreManagerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {events.map((event) => (
        <FloatingScoreText key={event.id} event={event} onComplete={onComplete} />
      ))}
    </div>
  );
}
