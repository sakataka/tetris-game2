import { ChevronDown, ChevronLeft, ChevronRight, ChevronsDown, RotateCw } from "lucide-react";
import { GameControlButton } from "@/components/game/GameControlButton";
import { useGamePlayState } from "@/features/game-play";
import { useMovementControls } from "@/hooks/controls/useMovementControls";
import { useRotationControl } from "@/hooks/controls/useRotationControl";

interface TouchControlsProps {
  className?: string;
}

export function TouchControls({ className }: TouchControlsProps) {
  const { isPaused, isGameOver } = useGamePlayState();
  const { handleRotate } = useRotationControl();
  const { handleMoveLeft, handleMoveRight, handleMoveDown, handleDrop } = useMovementControls();

  const handleGameAction = (action: string) => {
    switch (action) {
      case "move-left":
        handleMoveLeft();
        break;
      case "move-right":
        handleMoveRight();
        break;
      case "move-down":
        handleMoveDown();
        break;
      case "rotate":
        handleRotate();
        break;
      case "hard-drop":
        handleDrop();
        break;
    }
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {/* Left column - Move Left */}
      <div className="flex items-end justify-end">
        <GameControlButton
          action="move-left"
          onClick={handleGameAction}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
          enableHaptic={true}
          hapticIntensity="light"
          ultraResponsive={true}
        >
          <ChevronLeft className="h-5 w-5" />
        </GameControlButton>
      </div>

      {/* Center column - Rotate, Drop, Down */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-center gap-2">
          <GameControlButton
            action="rotate"
            onClick={handleGameAction}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
            enableHaptic={true}
            hapticIntensity="light"
            ultraResponsive={true}
          >
            <RotateCw className="h-5 w-5" />
          </GameControlButton>
          <GameControlButton
            action="hard-drop"
            onClick={handleGameAction}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
            enableHaptic={true}
            hapticIntensity="heavy"
            ultraResponsive={true}
          >
            <ChevronsDown className="h-5 w-5" />
          </GameControlButton>
        </div>
        <div className="flex justify-center">
          <GameControlButton
            action="move-down"
            onClick={handleGameAction}
            disabled={isGameOver || isPaused}
            className="h-10 w-10 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
            enableHaptic={true}
            hapticIntensity="light"
            ultraResponsive={true}
          >
            <ChevronDown className="h-5 w-5" />
          </GameControlButton>
        </div>
      </div>

      {/* Right column - Move Right */}
      <div className="flex items-end justify-start">
        <GameControlButton
          action="move-right"
          onClick={handleGameAction}
          disabled={isGameOver || isPaused}
          className="h-12 w-12 bg-slate-800/70 border-slate-600 hover:bg-slate-700/50"
          enableHaptic={true}
          hapticIntensity="light"
          ultraResponsive={true}
        >
          <ChevronRight className="h-5 w-5" />
        </GameControlButton>
      </div>
    </div>
  );
}
