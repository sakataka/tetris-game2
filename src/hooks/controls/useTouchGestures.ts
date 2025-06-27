import { useTouchActions } from "./useTouchActions";
import { type TouchGestureOptions, useTouchDetection } from "./useTouchDetection";

export interface TouchGesturesReturn {
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
}

/**
 * Main touch gestures hook that coordinates touch detection and actions
 *
 * This hook acts as a coordinator between useTouchDetection and useTouchActions,
 * maintaining backward compatibility while providing a clean separation of concerns.
 *
 * @param options - Touch gesture configuration options
 * @returns Touch event handlers for components
 */
export function useTouchGestures(options: TouchGestureOptions = {}): TouchGesturesReturn {
  const actions = useTouchActions();

  const detection = useTouchDetection(
    {
      onSwipe: actions.handleSwipe,
      onTap: actions.handleTap,
      onDoubleTap: actions.handleDoubleTap,
    },
    options,
  );

  return {
    handleTouchStart: detection.handleTouchStart,
    handleTouchEnd: detection.handleTouchEnd,
  };
}
