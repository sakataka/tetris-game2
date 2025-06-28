import { ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, RotateCw } from "lucide-react";
import { useRotationControl } from "../../hooks/controls/useRotationControl";
import { useGameActionHandler } from "../../hooks/core/useGameActionHandler";
import { useGameStore } from "../../store/gameStore";
import { AnimatedButton } from "../ui/AnimatedButton";

interface TouchControlsProps {
  className?: string;
}

export function TouchControls({ className }: TouchControlsProps) {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const moveDown = useGameStore((state) => state.moveDown);
  const drop = useGameStore((state) => state.drop);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const { handleRotate } = useRotationControl();
  const executeGameAction = useGameActionHandler();

  const handleMoveLeft = () => executeGameAction(moveLeft);
  const handleMoveRight = () => executeGameAction(moveRight);
  const handleMoveDown = () => executeGameAction(moveDown);
  const handleDrop = () => executeGameAction(drop, true); // urgent = true for hard drop

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {/* Left column - Move Left */}
      <div className="flex items-end justify-end">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveLeft}
          onClick={handleMoveLeft}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Move left"
          animationDisabled={true}
        >
          <ChevronLeft className="h-5 w-5" />
        </AnimatedButton>
      </div>

      {/* Center column - Rotate, Drop, Down */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-2">
          <AnimatedButton
            variant="outline"
            size="lg"
            onTouchStart={handleRotate}
            onClick={handleRotate}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
            aria-label="Rotate piece"
            animationDisabled={true}
          >
            <RotateCw className="h-5 w-5" />
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            size="lg"
            onTouchStart={handleDrop}
            onClick={handleDrop}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
            aria-label="Hard drop"
            animationDisabled={true}
          >
            <ChevronsDown className="h-5 w-5" />
          </AnimatedButton>
        </div>
        <div className="flex justify-center">
          <AnimatedButton
            variant="outline"
            size="lg"
            onTouchStart={handleMoveDown}
            onClick={handleMoveDown}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
            aria-label="Soft drop"
            animationDisabled={true}
          >
            <ChevronDown className="h-5 w-5" />
          </AnimatedButton>
        </div>
      </div>

      {/* Right column - Move Right */}
      <div className="flex items-end justify-start">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveRight}
          onClick={handleMoveRight}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50 touch-manipulation"
          aria-label="Move right"
          animationDisabled={true}
        >
          <ChevronRight className="h-5 w-5" />
        </AnimatedButton>
      </div>
    </div>
  );
}
