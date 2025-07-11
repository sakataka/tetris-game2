import { useGameActionHandler } from "@/hooks/core/useGameActionHandler";
import { useGameStoreActions } from "@/hooks/core/useGameStoreActions";
import { useRotationControl } from "./useRotationControl";
import type { SwipeGesture, TapGesture } from "./useTouchDetection";

export interface TouchActionsReturn {
  handleSwipe: (gesture: SwipeGesture) => void;
  handleTap: (gesture: TapGesture) => void;
  handleDoubleTap: (gesture: TapGesture) => void;
}

export function useTouchActions(): TouchActionsReturn {
  const { moveLeft, moveRight, moveDown, drop } = useGameStoreActions();
  const executeAction = useGameActionHandler();
  const { handleRotate } = useRotationControl();

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
    handleRotate();
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
