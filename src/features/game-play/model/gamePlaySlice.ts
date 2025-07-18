import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  AnimationTriggerKey,
  ComboState,
  FloatingScoreEvent,
  GameAnimationState,
  GameBoard,
  LevelCelebrationState,
  LineClearAnimationData,
  Position,
  ScoreAnimationState,
  Tetromino,
  TetrominoTypeName,
  TSpinState,
} from "@/types/game";
import { type DebugParams, parseDebugParams } from "@/utils/debugParams";
import { getDebugPreset } from "@/utils/debugPresets";
import { gameEngineAdapter } from "../api/gameEngineAdapter";

interface GamePlayState {
  // Core game state
  board: GameBoard;
  boardBeforeClear: GameBoard | null;
  currentPiece: Tetromino | null;
  ghostPiece: Tetromino | null;
  nextPieces: TetrominoTypeName[];
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
  pieceBag: TetrominoTypeName[];

  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;

  // Score state (integrated with Scoring Store)
  score: number;
  lines: number;
  level: number;

  // Timing
  lastFall: number;
  fallSpeed: number;
  lockDelay: number;
  lockDelayActive: boolean;

  // Animation state
  animationState: GameAnimationState;
  lineClearData: LineClearAnimationData | null;
  placedPositions: Position[];
  clearingLines: number[];
  animationTriggerKey: AnimationTriggerKey;
  ghostPosition: Position | null;

  // Enhanced game features
  tSpinState: TSpinState;
  comboState: ComboState;
  scoreAnimationState: ScoreAnimationState;
  floatingScoreEvents: FloatingScoreEvent[];
  levelCelebrationState: LevelCelebrationState;

  // Game statistics
  totalLinesCleared: number;
  totalTSpins: number;
  totalPerfectClears: number;
  totalTetrises: number;
  totalSingles: number;
  totalDoubles: number;
  totalTriples: number;
  maxCombo: number;

  // Debug features
  debugMode: boolean;
  debugParams: DebugParams | null;
  showResetConfirmation: boolean;

  // State update actions
  updateBoard: (board: GameBoard) => void;
  updateCurrentPiece: (piece: Tetromino | null) => void;
  updateGhostPiece: (piece: Tetromino | null) => void;
  updateNextPieces: (pieces: TetrominoTypeName[]) => void;
  updateHeldPiece: (piece: TetrominoTypeName | null) => void;
  setCanHold: (canHold: boolean) => void;
  updatePieceBag: (bag: TetrominoTypeName[]) => void;
  setBoardBeforeClear: (board: GameBoard | null) => void;
  setPlacedPositions: (positions: Position[]) => void;
  setClearingLines: (lines: number[]) => void;
  setAnimationTriggerKey: (key: AnimationTriggerKey) => void;
  setGhostPosition: (position: Position | null) => void;

  // Enhanced state actions
  updateScore: (score: number) => void;
  updateLines: (lines: number) => void;
  updateLevel: (level: number) => void;

  // T-Spin actions
  updateTSpinState: (state: TSpinState) => void;
  hideTSpinIndicator: () => void;

  // Combo actions
  updateComboState: (state: ComboState) => void;
  incrementCombo: (clearType: "single" | "double" | "triple" | "tetris" | "tspin") => void;
  resetCombo: () => void;
  updateMaxCombo: (count: number) => void;

  // Score animation actions
  updateScoreAnimationState: (state: ScoreAnimationState) => void;
  addFloatingScoreEvent: (event: FloatingScoreEvent) => void;
  removeFloatingScoreEvent: (id: string) => void;
  clearFloatingScoreEvents: () => void;

  // Level celebration actions
  startLevelCelebration: (level: number) => void;
  updateLevelCelebrationPhase: (phase: "intro" | "main" | "outro" | "completed") => void;
  completeLevelCelebration: () => void;
  cancelLevelCelebration: () => void;

  // Statistics actions
  incrementTotalLines: (lines: number) => void;
  incrementTSpins: () => void;
  incrementPerfectClears: () => void;
  incrementTetrises: () => void;
  incrementSingles: () => void;
  incrementDoubles: () => void;
  incrementTriples: () => void;
  resetStatistics: () => void;

  // Debug actions
  setDebugMode: (enabled: boolean) => void;
  applyDebugPreset: (preset: string) => void;
  setDebugQueue: (queue: TetrominoTypeName[]) => void;
  updateDebugParams: (params: DebugParams | null) => void;

  // Reset confirmation actions
  showResetDialog: () => void;
  hideResetDialog: () => void;
  confirmReset: () => void;

  // Game control actions
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  endGame: () => void;

  // Animation control
  startLineClearAnimation: (data: LineClearAnimationData) => void;
  completeLineClearAnimation: () => void;
  startLineFallAnimation: () => void;
  completeLineFallAnimation: () => void;
  clearAnimationData: () => void;

  // Movement actions (these will integrate with the game engine)
  moveLeft: () => void;
  moveRight: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  rotate180: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  holdPiece: () => void;

  // Timing control
  updateFallSpeed: (speed: number) => void;
  updateLastFall: (timestamp: number) => void;
  setLockDelay: (active: boolean) => void;

  // Derived state selectors
  isGameLoopPaused: () => boolean;
  isAnimationActive: () => boolean;
  isLevelCelebrationActive: () => boolean;

  // Error recovery
  resetToPlayingState: () => void;
}

export const useGamePlayStore = create<GamePlayState>()(
  devtools(
    (set, get) => ({
      // Initial state
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(0)) as GameBoard,
      boardBeforeClear: null,
      currentPiece: null,
      ghostPiece: null,
      nextPieces: [],
      heldPiece: null,
      canHold: true,
      pieceBag: [],
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      lines: 0,
      level: 1,
      lastFall: 0,
      fallSpeed: 1000, // ms
      lockDelay: 500, // ms
      lockDelayActive: false,
      animationState: "idle",
      lineClearData: null,
      placedPositions: [],
      clearingLines: [],
      animationTriggerKey: 0,
      ghostPosition: null,
      tSpinState: {
        type: "none",
        show: false,
        linesCleared: 0,
        rotationResult: null,
      },
      comboState: {
        count: 0,
        isActive: false,
        lastClearType: null,
      },
      scoreAnimationState: {
        previousScore: 0,
        scoreIncrease: 0,
        lineCount: 0,
        clearType: null,
        isTetris: false,
        animationTriggerTime: 0,
      },
      floatingScoreEvents: [],
      levelCelebrationState: {
        isActive: false,
        level: null,
        startTime: null,
        phase: "completed",
        userCancelled: false,
      },

      // Statistics
      totalLinesCleared: 0,
      totalTSpins: 0,
      totalPerfectClears: 0,
      totalTetrises: 0,
      totalSingles: 0,
      totalDoubles: 0,
      totalTriples: 0,
      maxCombo: 0,

      debugMode: false,
      debugParams: null,
      showResetConfirmation: false,

      // State update actions
      updateBoard: (board) => set(() => ({ board })),
      updateCurrentPiece: (piece) => set(() => ({ currentPiece: piece })),
      updateGhostPiece: (piece) => set(() => ({ ghostPiece: piece })),
      updateNextPieces: (pieces) => set(() => ({ nextPieces: pieces })),
      updateHeldPiece: (piece) => set(() => ({ heldPiece: piece })),
      setCanHold: (canHold) => set(() => ({ canHold })),
      updatePieceBag: (bag) => set(() => ({ pieceBag: bag })),
      setBoardBeforeClear: (board) => set(() => ({ boardBeforeClear: board })),
      setPlacedPositions: (positions) => set(() => ({ placedPositions: positions })),
      setClearingLines: (lines) => set(() => ({ clearingLines: lines })),
      setAnimationTriggerKey: (key) => set(() => ({ animationTriggerKey: key })),
      setGhostPosition: (position) => set(() => ({ ghostPosition: position })),

      // Enhanced state actions
      updateScore: (score) => set(() => ({ score })),
      updateLines: (lines) => set(() => ({ lines })),
      updateLevel: (level) => set(() => ({ level })),

      // T-Spin actions
      updateTSpinState: (tSpinState) => set(() => ({ tSpinState })),
      hideTSpinIndicator: () =>
        set((state) => ({
          tSpinState: { ...state.tSpinState, show: false },
        })),

      // Combo actions
      updateComboState: (comboState) => set(() => ({ comboState })),
      incrementCombo: (clearType) =>
        set((state) => {
          const newCombo = state.comboState.count + 1;
          const newMaxCombo = Math.max(state.maxCombo, newCombo);
          return {
            comboState: {
              count: newCombo,
              isActive: true,
              lastClearType: clearType,
            },
            maxCombo: newMaxCombo,
          };
        }),
      resetCombo: () =>
        set(() => ({
          comboState: {
            count: 0,
            isActive: false,
            lastClearType: null,
          },
        })),
      updateMaxCombo: (count) =>
        set((state) => ({
          maxCombo: Math.max(state.maxCombo, count),
        })),

      // Score animation actions
      updateScoreAnimationState: (scoreAnimationState) => set(() => ({ scoreAnimationState })),
      addFloatingScoreEvent: (event) =>
        set((state) => ({
          floatingScoreEvents: [...state.floatingScoreEvents, event],
        })),
      removeFloatingScoreEvent: (id) =>
        set((state) => ({
          floatingScoreEvents: state.floatingScoreEvents.filter((event) => event.id !== id),
        })),
      clearFloatingScoreEvents: () => set(() => ({ floatingScoreEvents: [] })),

      // Level celebration actions
      startLevelCelebration: (level) =>
        set(() => ({
          levelCelebrationState: {
            isActive: true,
            level,
            startTime: Date.now(),
            phase: "intro",
            userCancelled: false,
          },
        })),
      updateLevelCelebrationPhase: (phase) =>
        set((state) => ({
          levelCelebrationState: { ...state.levelCelebrationState, phase },
        })),
      completeLevelCelebration: () =>
        set(() => ({
          levelCelebrationState: {
            isActive: false,
            level: null,
            startTime: null,
            phase: "completed",
            userCancelled: false,
          },
        })),
      cancelLevelCelebration: () =>
        set((state) => ({
          levelCelebrationState: {
            ...state.levelCelebrationState,
            userCancelled: true,
            phase: "completed",
          },
        })),

      // Statistics actions
      incrementTotalLines: (lines) =>
        set((state) => ({
          totalLinesCleared: state.totalLinesCleared + lines,
        })),
      incrementTSpins: () =>
        set((state) => ({
          totalTSpins: state.totalTSpins + 1,
        })),
      incrementPerfectClears: () =>
        set((state) => ({
          totalPerfectClears: state.totalPerfectClears + 1,
        })),
      incrementTetrises: () =>
        set((state) => ({
          totalTetrises: state.totalTetrises + 1,
        })),
      incrementSingles: () =>
        set((state) => ({
          totalSingles: state.totalSingles + 1,
        })),
      incrementDoubles: () =>
        set((state) => ({
          totalDoubles: state.totalDoubles + 1,
        })),
      incrementTriples: () =>
        set((state) => ({
          totalTriples: state.totalTriples + 1,
        })),
      resetStatistics: () =>
        set(() => ({
          totalLinesCleared: 0,
          totalTSpins: 0,
          totalPerfectClears: 0,
          totalTetrises: 0,
          totalSingles: 0,
          totalDoubles: 0,
          totalTriples: 0,
          maxCombo: 0,
        })),

      // Debug actions
      setDebugMode: (enabled) => {
        const params = enabled ? parseDebugParams() : null;
        set(() => ({ debugMode: enabled, debugParams: params }));
      },
      applyDebugPreset: (preset) => {
        const presetData = getDebugPreset(preset);
        if (presetData) {
          set((state) => ({
            ...presetData,
            debugParams: state.debugParams
              ? { ...state.debugParams, preset, enabled: true }
              : { enabled: true, preset },
          }));
        }
      },
      setDebugQueue: (queue) =>
        set((state) => ({
          debugParams: state.debugParams
            ? { ...state.debugParams, queue }
            : { enabled: true, queue },
        })),
      updateDebugParams: (params) => set(() => ({ debugParams: params })),

      // Reset confirmation actions
      showResetDialog: () => set(() => ({ showResetConfirmation: true })),
      hideResetDialog: () => set(() => ({ showResetConfirmation: false })),
      confirmReset: () => {
        const { resetGame, hideResetDialog } = get();
        hideResetDialog();
        resetGame();
      },

      // Game control actions
      startGame: () => {
        // Start the game engine
        gameEngineAdapter.startGame();

        // Set up game over event listener
        gameEngineAdapter.on("game-over", (_data) => {
          const { endGame } = get();
          endGame();
        });

        // Get initial state from engine
        const engineState = gameEngineAdapter.getGameState();
        if (engineState) {
          set(() => ({
            board: engineState.board,
            currentPiece: engineState.currentPiece,
            ghostPiece:
              engineState.ghostPosition && engineState.currentPiece
                ? {
                    ...engineState.currentPiece,
                    position: engineState.ghostPosition,
                  }
                : null,
            nextPieces: [engineState.nextPiece],
            heldPiece: engineState.heldPiece,
            canHold: engineState.canHold,
            isPlaying: true,
            isPaused: false,
            isGameOver: engineState.isGameOver || false,
            lastFall: Date.now(),
            fallSpeed: 1000, // Will be updated based on level
            animationState: "idle",
            lineClearData: null,
          }));
        } else {
          // Fallback if engine fails
          set(() => ({
            isPlaying: true,
            isPaused: false,
            isGameOver: false,
            lastFall: Date.now(),
            animationState: "idle",
            lineClearData: null,
          }));
        }
      },

      pauseGame: () =>
        set((state) => ({
          isPaused: !state.isPaused,
        })),

      resetGame: () => {
        // Reset the game engine
        gameEngineAdapter.resetGame();

        set(() => ({
          board: Array(20)
            .fill(null)
            .map(() => Array(10).fill(0)) as GameBoard,
          boardBeforeClear: null,
          currentPiece: null,
          ghostPiece: null,
          nextPieces: [],
          heldPiece: null,
          canHold: true,
          pieceBag: [],
          isPlaying: false,
          isPaused: false,
          isGameOver: false,
          score: 0,
          lines: 0,
          level: 1,
          lastFall: 0,
          lockDelayActive: false,
          animationState: "idle",
          lineClearData: null,
          placedPositions: [],
          clearingLines: [],
          animationTriggerKey: 0,
          ghostPosition: null,
          tSpinState: {
            type: "none",
            show: false,
            linesCleared: 0,
            rotationResult: null,
          },
          comboState: {
            count: 0,
            isActive: false,
            lastClearType: null,
          },
          scoreAnimationState: {
            previousScore: 0,
            scoreIncrease: 0,
            lineCount: 0,
            clearType: null,
            isTetris: false,
            animationTriggerTime: 0,
          },
          floatingScoreEvents: [],
          levelCelebrationState: {
            isActive: false,
            level: null,
            startTime: null,
            phase: "completed",
            userCancelled: false,
          },
          showResetConfirmation: false,
        }));
      },

      endGame: () =>
        set(() => ({
          isPlaying: false,
          isGameOver: true,
          animationState: "idle",
          lineClearData: null,
        })),

      // Animation control
      startLineClearAnimation: (data) =>
        set(() => ({
          animationState: "line-clearing",
          lineClearData: data,
        })),

      completeLineClearAnimation: () =>
        set(() => ({
          animationState: "line-falling",
        })),

      startLineFallAnimation: () =>
        set(() => ({
          animationState: "line-falling",
        })),

      completeLineFallAnimation: () =>
        set(() => ({
          animationState: "idle",
          lineClearData: null,
        })),

      clearAnimationData: () =>
        set(() => ({
          animationState: "idle",
          lineClearData: null,
        })),

      // Movement actions
      moveLeft: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.moveLeft()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      moveRight: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.moveRight()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      rotateClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.rotateClockwise()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      rotateCounterClockwise: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.rotateCounterClockwise()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      rotate180: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        // Call rotate clockwise twice for 180-degree rotation
        if (gameEngineAdapter.rotateClockwise() && gameEngineAdapter.rotateClockwise()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
            }));
          }
        }
      },

      softDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.softDrop()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
              // Sync score, lines, and level from engine
              score: engineState.score,
              lines: engineState.lines,
              level: engineState.level,
              // Sync game over state from engine
              isGameOver: engineState.isGameOver,
              isPlaying: !engineState.isGameOver,
            }));
          }
        }
      },

      hardDrop: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused) return;

        if (gameEngineAdapter.hardDrop()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              board: engineState.board,
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
              nextPieces: [engineState.nextPiece],
              heldPiece: engineState.heldPiece,
              canHold: true, // Reset hold ability after placing
              // Sync score, lines, and level from engine
              score: engineState.score,
              lines: engineState.lines,
              level: engineState.level,
              // Sync game over state from engine
              isGameOver: engineState.isGameOver,
              isPlaying: !engineState.isGameOver,
            }));
          }
        }
      },

      holdPiece: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused || !state.canHold) return;

        if (gameEngineAdapter.holdPiece()) {
          const engineState = gameEngineAdapter.getGameState();
          if (engineState) {
            set(() => ({
              currentPiece: engineState.currentPiece,
              ghostPiece:
                engineState.ghostPosition && engineState.currentPiece
                  ? {
                      ...engineState.currentPiece,
                      position: engineState.ghostPosition,
                    }
                  : null,
              heldPiece: engineState.heldPiece,
              canHold: engineState.canHold,
              nextPieces: [engineState.nextPiece],
            }));
          }
        }
      },

      // Timing control
      updateFallSpeed: (speed) => set(() => ({ fallSpeed: speed })),
      updateLastFall: (timestamp) => set(() => ({ lastFall: timestamp })),
      setLockDelay: (active) => set(() => ({ lockDelayActive: active })),

      // Derived state selectors
      isGameLoopPaused: () => {
        const state = get();
        return (
          state.isPaused || state.isGameOver || !state.isPlaying || state.animationState !== "idle"
        );
      },
      isAnimationActive: () => {
        const state = get();
        return state.animationState !== "idle" || state.levelCelebrationState.isActive;
      },
      isLevelCelebrationActive: () => {
        const state = get();
        return state.levelCelebrationState.isActive;
      },

      // Error recovery
      resetToPlayingState: () =>
        set(() => ({
          animationState: "idle",
          lineClearData: null,
          lockDelayActive: false,
          levelCelebrationState: {
            isActive: false,
            level: null,
            startTime: null,
            phase: "completed",
            userCancelled: false,
          },
          floatingScoreEvents: [],
          showResetConfirmation: false,
        })),
    }),
    { name: "game-play-store" },
  ),
);

// Export hooks for easier consumption
export const useGamePlayActions = () =>
  useGamePlayStore(
    useShallow((state) => ({
      // State update actions
      updateBoard: state.updateBoard,
      updateCurrentPiece: state.updateCurrentPiece,
      updateGhostPiece: state.updateGhostPiece,
      updateNextPieces: state.updateNextPieces,
      updateHeldPiece: state.updateHeldPiece,
      setCanHold: state.setCanHold,
      updatePieceBag: state.updatePieceBag,
      setBoardBeforeClear: state.setBoardBeforeClear,
      setPlacedPositions: state.setPlacedPositions,
      setClearingLines: state.setClearingLines,
      setAnimationTriggerKey: state.setAnimationTriggerKey,
      setGhostPosition: state.setGhostPosition,

      // Enhanced state actions
      updateScore: state.updateScore,
      updateLines: state.updateLines,
      updateLevel: state.updateLevel,

      // T-Spin actions
      updateTSpinState: state.updateTSpinState,
      hideTSpinIndicator: state.hideTSpinIndicator,

      // Combo actions
      updateComboState: state.updateComboState,
      incrementCombo: state.incrementCombo,
      resetCombo: state.resetCombo,

      // Score animation actions
      updateScoreAnimationState: state.updateScoreAnimationState,
      addFloatingScoreEvent: state.addFloatingScoreEvent,
      removeFloatingScoreEvent: state.removeFloatingScoreEvent,
      clearFloatingScoreEvents: state.clearFloatingScoreEvents,

      // Level celebration actions
      startLevelCelebration: state.startLevelCelebration,
      updateLevelCelebrationPhase: state.updateLevelCelebrationPhase,
      completeLevelCelebration: state.completeLevelCelebration,
      cancelLevelCelebration: state.cancelLevelCelebration,

      // Statistics actions
      incrementTotalLines: state.incrementTotalLines,
      incrementTSpins: state.incrementTSpins,
      incrementPerfectClears: state.incrementPerfectClears,
      incrementTetrises: state.incrementTetrises,
      incrementSingles: state.incrementSingles,
      incrementDoubles: state.incrementDoubles,
      incrementTriples: state.incrementTriples,
      resetStatistics: state.resetStatistics,

      // Debug actions
      setDebugMode: state.setDebugMode,
      applyDebugPreset: state.applyDebugPreset,
      setDebugQueue: state.setDebugQueue,
      updateDebugParams: state.updateDebugParams,

      // Reset confirmation actions
      showResetDialog: state.showResetDialog,
      hideResetDialog: state.hideResetDialog,
      confirmReset: state.confirmReset,

      // Game control actions
      startGame: state.startGame,
      pauseGame: state.pauseGame,
      resetGame: state.resetGame,
      endGame: state.endGame,

      // Animation control
      startLineClearAnimation: state.startLineClearAnimation,
      completeLineClearAnimation: state.completeLineClearAnimation,
      startLineFallAnimation: state.startLineFallAnimation,
      completeLineFallAnimation: state.completeLineFallAnimation,
      clearAnimationData: state.clearAnimationData,

      // Movement actions
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      rotateClockwise: state.rotateClockwise,
      rotateCounterClockwise: state.rotateCounterClockwise,
      rotate180: state.rotate180,
      softDrop: state.softDrop,
      hardDrop: state.hardDrop,
      holdPiece: state.holdPiece,

      // Timing control
      updateFallSpeed: state.updateFallSpeed,
      updateLastFall: state.updateLastFall,
      setLockDelay: state.setLockDelay,

      // Derived state selectors
      isGameLoopPaused: state.isGameLoopPaused,
      isAnimationActive: state.isAnimationActive,
      isLevelCelebrationActive: state.isLevelCelebrationActive,

      // Error recovery
      resetToPlayingState: state.resetToPlayingState,
    })),
  );

export const useGamePlayState = () =>
  useGamePlayStore(
    useShallow((state) => ({
      // Core game state
      board: state.board,
      boardBeforeClear: state.boardBeforeClear,
      currentPiece: state.currentPiece,
      ghostPiece: state.ghostPiece,
      nextPieces: state.nextPieces,
      heldPiece: state.heldPiece,
      canHold: state.canHold,
      pieceBag: state.pieceBag,

      // Game status
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      isGameOver: state.isGameOver,

      // Score state
      score: state.score,
      lines: state.lines,
      level: state.level,

      // Timing
      lastFall: state.lastFall,
      fallSpeed: state.fallSpeed,
      lockDelay: state.lockDelay,
      lockDelayActive: state.lockDelayActive,

      // Animation state
      animationState: state.animationState,
      lineClearData: state.lineClearData,
      placedPositions: state.placedPositions,
      clearingLines: state.clearingLines,
      animationTriggerKey: state.animationTriggerKey,
      ghostPosition: state.ghostPosition,

      // Enhanced game features
      tSpinState: state.tSpinState,
      comboState: state.comboState,
      scoreAnimationState: state.scoreAnimationState,
      floatingScoreEvents: state.floatingScoreEvents,
      levelCelebrationState: state.levelCelebrationState,

      // Statistics
      totalLinesCleared: state.totalLinesCleared,
      totalTSpins: state.totalTSpins,
      totalPerfectClears: state.totalPerfectClears,
      totalTetrises: state.totalTetrises,
      totalSingles: state.totalSingles,
      totalDoubles: state.totalDoubles,
      totalTriples: state.totalTriples,
      maxCombo: state.maxCombo,

      // Debug features
      debugMode: state.debugMode,
      debugParams: state.debugParams,
      showResetConfirmation: state.showResetConfirmation,
    })),
  );
