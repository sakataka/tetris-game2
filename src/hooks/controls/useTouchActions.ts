import { useGameInputActions } from "./useGameInputActions";
import { useRotationControl } from "./useRotationControl";
import type { SwipeGesture, TapGesture } from "./useTouchDetection";

interface TouchActionsReturn {
  handleSwipe: (gesture: SwipeGesture) => void;
  handleTap: (gesture: TapGesture) => void;
  handleDoubleTap: (gesture: TapGesture) => void;
}

export function useTouchActions(): TouchActionsReturn {
  const { moveLeft, moveRight, moveDown, drop } = useGameInputActions(); // Using consolidated hook with built-in validation
  const { handleRotate } = useRotationControl();

  const handleSwipe = (gesture: SwipeGesture) => {
    switch (gesture.direction) {
      case "left":
        moveLeft();
        break;
      case "right":
        moveRight();
        break;
      case "down":
        if (gesture.isLongSwipe) {
          // Long swipe down = hard drop
          drop();
        } else {
          // Short swipe down = soft drop (using updated action name)
          moveDown();
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
    drop();
  };

  return {
    handleSwipe,
    handleTap,
    handleDoubleTap,
  };
}
