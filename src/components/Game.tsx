import { useGameLoop } from "../hooks/useGameLoop";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { Board } from "./Board";
import { Controls } from "./Controls";
import { GameOverlay } from "./GameOverlay";
import { LanguageSelector } from "./LanguageSelector";
import { NextPiece } from "./NextPiece";
import { ScoreBoard } from "./ScoreBoard";

export function Game() {
  useGameLoop();
  useKeyboardControls();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, rgb(15, 23, 42), rgb(88, 28, 135), rgb(15, 23, 42))",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
      }}
    >
      <LanguageSelector />
      <div style={{ display: "flex", gap: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "200px" }}>
          <ScoreBoard />
          <NextPiece />
          <Controls />
        </div>
        <div style={{ position: "relative" }}>
          <Board />
          <GameOverlay />
        </div>
      </div>
    </div>
  );
}
