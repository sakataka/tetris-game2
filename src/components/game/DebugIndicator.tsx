import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useGameStore } from "@/store/gameStore";
import type { TetrominoTypeName } from "@/types/game";
import { generateDebugUrl } from "@/utils/debugParams";
import { getDebugPreset, getPresetNames } from "@/utils/debugPresets";

export function DebugIndicator() {
  const debugMode = useGameStore((state) => state.debugMode);
  const debugParams = useGameStore((state) => state.debugParams);
  const applyDebugPreset = useGameStore((state) => state.applyDebugPreset);
  const setDebugQueue = useGameStore((state) => state.setDebugQueue);

  if (!debugMode || !debugParams) {
    return null;
  }

  const presetNames = getPresetNames();

  return (
    <Card className="fixed top-4 right-4 z-50 p-4 bg-red-900/90 border-red-500 max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            DEBUG MODE
          </Badge>
          {debugParams.preset && (
            <Badge variant="outline" className="text-xs">
              Preset: {debugParams.preset}
            </Badge>
          )}
        </div>

        {debugParams.queue && debugParams.queue.length > 0 && (
          <div className="text-xs text-gray-300">Queue: {debugParams.queue.join(", ")}</div>
        )}

        {debugParams.seed !== undefined && (
          <div className="text-xs text-gray-300">Seed: {debugParams.seed}</div>
        )}

        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
            Quick Presets
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {presetNames.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => {
                  const preset = getDebugPreset(name);
                  if (preset) {
                    applyDebugPreset(name);
                    // Update URL to reflect current preset
                    const newUrl = generateDebugUrl({
                      enabled: true,
                      preset: name,
                    });
                    window.history.replaceState({}, "", newUrl);
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </details>

        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
            Custom Queue
          </summary>
          <div className="mt-2 space-y-1">
            <input
              type="text"
              placeholder="e.g., IJLOSTZ"
              className="w-full text-xs px-2 py-1 bg-gray-800 rounded text-gray-300"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.currentTarget.value.toUpperCase();
                  const pieces = input
                    .split("")
                    .filter((p) => ["I", "J", "L", "O", "S", "T", "Z"].includes(p));
                  if (pieces.length > 0) {
                    setDebugQueue(pieces as TetrominoTypeName[]);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
            <div className="text-xs text-gray-500">Press Enter to apply</div>
          </div>
        </details>

        <div className="text-xs text-gray-500 mt-2">
          URL parameters: ?debug=true&preset=NAME&queue=PIECES
        </div>
      </div>
    </Card>
  );
}
