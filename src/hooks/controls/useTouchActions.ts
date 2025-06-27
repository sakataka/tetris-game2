import { useGameStore } from "../../store/gameStore";
import { useGameActionHandler } from "../core/useGameActionHandler";
import type { SwipeGesture, TapGesture } from "./useTouchDetection";

export interface TouchActionsReturn {
  handleSwipe: (gesture: SwipeGesture) => void;
  handleTap: (gesture: TapGesture) => void;
  handleDoubleTap: (gesture: TapGesture) => void;
}

export function useTouchActions(): TouchActionsReturn {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const executeAction = useGameActionHandler();

  const handleSwipe = (gesture: SwipeGesture) => {
    switch (gesture.direction) {
      case "left":
        executeAction(moveLeft);
        break;
      case "right":
        executeAction(moveRight);
        break;
      case "down":
        if (gesture.isLongSwipe) {
          // Long swipe down = hard drop
          executeAction(drop, true);
        } else {
          // Short swipe down = soft drop
          executeAction(moveDown);
        }
        break;
      case "up":
        // Ignore swipe up for now (could be used for rotate in future)
        break;
    }
  };

  const handleTap = (_gesture: TapGesture) => {
    executeAction(rotate);
  };

  const handleDoubleTap = (_gesture: TapGesture) => {
    executeAction(drop, true);
  };

  return {
    handleSwipe,
    handleTap,
    handleDoubleTap,
  };
}
