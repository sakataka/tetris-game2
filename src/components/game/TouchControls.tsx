import { ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, RotateCw } from "lucide-react";
import { useTransition } from "react";
import { useGameStore } from "../../store/gameStore";
import { AnimatedButton } from "../ui/AnimatedButton";

interface TouchControlsProps {
  className?: string;
}

export function TouchControls({ className }: TouchControlsProps) {
  const { moveLeft, moveRight, moveDown, rotate, drop, isPaused, isGameOver } = useGameStore();
  const [, startTransition] = useTransition();

  // Helper for game actions with common conditions
  const executeGameAction = (action: () => void, useTransitionWrapper = true) => {
    if (isGameOver || isPaused) return;
    if (useTransitionWrapper) {
      startTransition(action);
    } else {
      action();
    }
  };

  const handleMoveLeft = () => executeGameAction(moveLeft);
  const handleMoveRight = () => executeGameAction(moveRight);
  const handleMoveDown = () => executeGameAction(moveDown);
  const handleRotate = () => executeGameAction(rotate);
  const handleDrop = () => executeGameAction(drop, false);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Top row - Rotate and Hard Drop */}
      <div className="flex justify-center gap-4">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleRotate}
          onClick={handleRotate}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Rotate piece"
          animationDisabled={true}
        >
          <RotateCw className="h-6 w-6" />
        </AnimatedButton>
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleDrop}
          onClick={handleDrop}
          disabled={isGameOver || isPaused}
          className="h-12 w-16 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Hard drop"
          animationDisabled={true}
        >
          <ChevronsDown className="h-6 w-6" />
        </AnimatedButton>
      </div>

      {/* Middle row - Soft Drop */}
      <div className="flex justify-center">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveDown}
          onClick={handleMoveDown}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Soft drop"
          animationDisabled={true}
        >
          <ChevronDown className="h-6 w-6" />
        </AnimatedButton>
      </div>

      {/* Bottom row - Left and Right */}
      <div className="flex justify-center gap-4">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveLeft}
          onClick={handleMoveLeft}
          disabled={isGameOver || isPaused}
          className="h-12 w-16 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Move left"
          animationDisabled={true}
        >
          <ChevronLeft className="h-6 w-6" />
        </AnimatedButton>
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveRight}
          onClick={handleMoveRight}
          disabled={isGameOver || isPaused}
          className="h-12 w-16 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Move right"
          animationDisabled={true}
        >
          <ChevronRight className="h-6 w-6" />
        </AnimatedButton>
      </div>
    </div>
  );
}
