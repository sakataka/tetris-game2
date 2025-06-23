// Mock implementation for react-i18next in tests
const mockTranslations: Record<string, string> = {
  // Game controls translations
  "game.controls.title": "Controls",
  "game.controls.move": "Move",
  "game.controls.softDrop": "Soft Drop",
  "game.controls.rotate": "Rotate",
  "game.controls.hardDrop": "Hard Drop",
  "game.controls.pause": "Pause",
  "game.controls.reset": "Reset",

  // Game status translations
  "game.status.gameOver": "Game Over",
  "game.status.paused": "Paused",
  "game.status.pressEnter": "Press Enter to play again",
  "game.status.pressPause": "Press P to resume",

  // GameOverlay specific translations
  "game.gameOver": "GAME OVER",
  "game.paused": "PAUSED",
  "game.newGame": "NEW GAME",
  "game.resume": "RESUME",
  "game.resumeHint": "Press P to resume or click the button below",

  // Score translations
  "game.score.score": "Score",
  "game.score.lines": "Lines",
  "game.score.level": "Level",
  "game.score.next": "Next",

  // Language selector
  "language.selector": "Language",
  "language.japanese": "日本語",
  "language.english": "English",
};

export const useTranslation = () => ({
  t: (key: string) => mockTranslations[key] || key,
});

// Only export Trans if it's actually used in tests
export const Trans = ({ children }: { children: React.ReactNode }) => children;
