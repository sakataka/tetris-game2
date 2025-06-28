import { useGameStore } from "../../store/gameStore";
import { GameSettings } from "./GameSettings";

export function MobileHeader() {
  const score = useGameStore((state) => state.score);
  const lines = useGameStore((state) => state.lines);
  const level = useGameStore((state) => state.level);
  const nextPiece = useGameStore((state) => state.nextPiece);
  const heldPiece = useGameStore((state) => state.heldPiece);

  return (
    <div className="flex items-center px-4 py-2 bg-slate-900/50 backdrop-blur-sm">
      {/* Left side - Score info and Hold/Next */}
      <div className="flex gap-4 text-sm flex-1">
        <div className="text-center">
          <div className="text-xs text-slate-400">Score</div>
          <div className="font-bold text-cyan-400">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Lines</div>
          <div className="font-bold text-yellow-400">{lines}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Level</div>
          <div className="font-bold text-purple-400">{level}</div>
        </div>

        {/* Hold/Next pieces moved to left side */}
        <div className="flex gap-3 ml-2">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Hold</div>
            <div className="w-8 h-8 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
              {heldPiece && <span className="text-xs font-bold text-slate-300">{heldPiece}</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Next</div>
            <div className="w-8 h-8 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
              {nextPiece && <span className="text-xs font-bold text-slate-300">{nextPiece}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Settings icon only */}
      <div>
        <GameSettings />
      </div>
    </div>
  );
}
