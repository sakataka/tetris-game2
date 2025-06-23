import { useRef, useTransition } from "react";
import { useGameStore } from "../store/gameStore";

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface TouchGestureOptions {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  tapTime?: number;
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const { minSwipeDistance = 30, maxSwipeTime = 500, tapTime = 200 } = options;

  const { moveLeft, moveRight, moveDown, rotate, drop, isPaused, isGameOver } = useGameStore();

  const [, startTransition] = useTransition();
  const touchStartRef = useRef<TouchPoint | null>(null);

  // Helper for game actions with common conditions
  const executeGameAction = (action: () => void, useTransitionWrapper = true) => {
    if (isGameOver || isPaused) return;
    if (useTransitionWrapper) {
      startTransition(action);
    } else {
      action();
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStartRef.current || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Reset touch start
    touchStartRef.current = null;

    // Check if it's a tap (short time, small distance)
    if (deltaTime < tapTime && distance < minSwipeDistance) {
      // Double tap for hard drop, single tap for rotate
      executeGameAction(rotate);
      return;
    }

    // Check if swipe is within time limit and meets minimum distance
    if (deltaTime > maxSwipeTime || distance < minSwipeDistance) {
      return;
    }

    // Determine swipe direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        executeGameAction(moveRight);
      } else {
        // Swipe left
        executeGameAction(moveLeft);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Swipe down
        const isLongSwipe = Math.abs(deltaY) > minSwipeDistance * 2;
        if (isLongSwipe) {
          // Long swipe down = hard drop
          executeGameAction(drop, false);
        } else {
          // Short swipe down = soft drop
          executeGameAction(moveDown);
        }
      }
      // Ignore swipe up for now (could be used for rotate in future)
    }
  };

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}
