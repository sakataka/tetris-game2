import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONSTANTS } from "../../utils/gameConstants";

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export interface TouchGestureOptions {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  tapTime?: number;
  doubleTapTime?: number;
}

export type SwipeDirection = "left" | "right" | "up" | "down";
export interface SwipeGesture {
  direction: SwipeDirection;
  distance: number;
  deltaTime: number;
  isLongSwipe?: boolean;
}
export interface TapGesture {
  x: number;
  y: number;
  deltaTime: number;
}
export interface TouchDetectionEvents {
  onSwipe?: (gesture: SwipeGesture) => void;
  onTap?: (gesture: TapGesture) => void;
  onDoubleTap?: (gesture: TapGesture) => void;
}
export interface TouchDetectionReturn {
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
}

export function useTouchDetection(
  events: TouchDetectionEvents = {},
  options: TouchGestureOptions = {},
): TouchDetectionReturn {
  const {
    minSwipeDistance = GAME_CONSTANTS.TOUCH.MIN_SWIPE_DISTANCE,
    maxSwipeTime = GAME_CONSTANTS.TOUCH.MAX_SWIPE_TIME,
    tapTime = GAME_CONSTANTS.TOUCH.TAP_TIME,
    doubleTapTime = GAME_CONSTANTS.TOUCH.DOUBLE_TAP_TIME,
  } = options;
  const { onSwipe, onTap, onDoubleTap } = events;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!touchStartRef.current || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const touchEnd = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const deltaTime = touchEnd.time - touchStartRef.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Reset touch start
      touchStartRef.current = null;

      // Check if it's a tap (short time, small distance)
      if (deltaTime < tapTime && distance < minSwipeDistance) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;

        const tapGesture: TapGesture = { x: touchEnd.x, y: touchEnd.y, deltaTime };

        if (lastTapTime > 0 && timeSinceLastTap < doubleTapTime) {
          // Double tap detected - clear pending timeout and execute immediately
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          onDoubleTap?.(tapGesture);
          setLastTapTime(0); // Reset to prevent triple tap
        } else {
          // First tap - record time and schedule delayed single tap action
          setLastTapTime(now);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => {
            setLastTapTime((prevTime) => {
              // Only execute tap if this is still the last tap
              if (prevTime === now) {
                onTap?.(tapGesture);
                return 0;
              }
              return prevTime;
            });
            timeoutRef.current = null;
          }, doubleTapTime);
        }
        return;
      }

      if (deltaTime > maxSwipeTime || distance < minSwipeDistance) return;

      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const direction: SwipeDirection = isHorizontal
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
          ? "down"
          : "up";

      onSwipe?.({
        direction,
        distance,
        deltaTime,
        // Mark as long swipe for hard drop when down swipe exceeds threshold
        isLongSwipe:
          direction === "down" &&
          Math.abs(deltaY) > minSwipeDistance * GAME_CONSTANTS.TOUCH.LONG_SWIPE_MULTIPLIER,
      });
    },
    [
      minSwipeDistance,
      maxSwipeTime,
      tapTime,
      doubleTapTime,
      onSwipe,
      onTap,
      onDoubleTap,
      lastTapTime,
    ],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [],
  );

  return { handleTouchStart, handleTouchEnd };
}
