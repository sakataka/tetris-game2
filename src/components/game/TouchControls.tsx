import { ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, RotateCw } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useHapticFeedback } from "@/hooks/common/useHapticFeedback";
import { useMovementControls } from "@/hooks/controls/useMovementControls";
import { useRotationControl } from "@/hooks/controls/useRotationControl";
import { useGameStore } from "@/store/gameStore";

interface TouchControlsProps {
  className?: string;
}

export function TouchControls({ className }: TouchControlsProps) {
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const { handleRotate } = useRotationControl();
  const { handleMoveLeft, handleMoveRight, handleMoveDown, handleDrop } = useMovementControls();
  const { lightImpact, mediumImpact } = useHapticFeedback();

  const handleMoveLeftWithHaptic = () => {
    lightImpact();
    handleMoveLeft();
  };

  const handleMoveRightWithHaptic = () => {
    lightImpact();
    handleMoveRight();
  };

  const handleMoveDownWithHaptic = () => {
    lightImpact();
    handleMoveDown();
  };

  const handleRotateWithHaptic = () => {
    lightImpact();
    handleRotate();
  };

  const handleDropWithHaptic = () => {
    mediumImpact();
    handleDrop();
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {/* Left column - Move Left */}
      <div className="flex items-end justify-end">
        <AnimatedButton
          variant="outline"
          size="lg"
          onTouchStart={handleMoveLeftWithHaptic}
          onClick={handleMoveLeftWithHaptic}
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
            onTouchStart={handleRotateWithHaptic}
            onClick={handleRotateWithHaptic}
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
            onTouchStart={handleDropWithHaptic}
            onClick={handleDropWithHaptic}
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
            onTouchStart={handleMoveDownWithHaptic}
            onClick={handleMoveDownWithHaptic}
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
          onTouchStart={handleMoveRightWithHaptic}
          onClick={handleMoveRightWithHaptic}
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
