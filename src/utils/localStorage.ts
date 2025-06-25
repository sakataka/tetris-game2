/**
 * Safe LocalStorage utility with type safety and error handling
 * Provides a reliable interface for storing and retrieving game data
 */

export interface HighScore {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export interface GameSettings {
  language: "ja" | "en";
  volume: number;
  showGhostPiece: boolean;
}

const STORAGE_KEYS = {
  HIGH_SCORES: "tetris-high-scores",
  CURRENT_HIGH_SCORE: "tetris-current-high-score",
  SETTINGS: "tetris-settings",
} as const;

const DEFAULT_SETTINGS: GameSettings = {
  language: "ja",
  volume: 0.5,
  showGhostPiece: true,
};

/**
 * Safely checks if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely gets an item from localStorage with type safety
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    // If parsing fails, return default value and clean up corrupted data
    localStorage.removeItem(key);
    return defaultValue;
  }
}

/**
 * Safely sets an item in localStorage
 */
function setStorageItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the current high score
 */
export function getCurrentHighScore(): HighScore | null {
  return getStorageItem(STORAGE_KEYS.CURRENT_HIGH_SCORE, null);
}

/**
 * Sets the current high score if it's higher than the existing one
 */
export function setHighScore(score: number, lines: number, level: number): boolean {
  const currentHighScore = getCurrentHighScore();

  if (!currentHighScore || score > currentHighScore.score) {
    const newHighScore: HighScore = {
      score,
      lines,
      level,
      date: new Date().toISOString(),
    };

    const success = setStorageItem(STORAGE_KEYS.CURRENT_HIGH_SCORE, newHighScore);

    // Also add to high scores list
    if (success) {
      addToHighScoresList(newHighScore);
      // Note: High score update notification is now handled by Zustand store
      // The store will be updated when components call updateHighScore action
    }

    return success;
  }

  return false;
}

/**
 * Gets the list of high scores (top 10)
 */
export function getHighScoresList(): HighScore[] {
  return getStorageItem(STORAGE_KEYS.HIGH_SCORES, []);
}

/**
 * Adds a score to the high scores list and keeps only top 10
 */
export function addToHighScoresList(highScore: HighScore): boolean {
  const currentList = getHighScoresList();

  // Add new score and sort by score descending
  const updatedList = [...currentList, highScore].sort((a, b) => b.score - a.score).slice(0, 10); // Keep only top 10

  return setStorageItem(STORAGE_KEYS.HIGH_SCORES, updatedList);
}

/**
 * Gets user settings
 */
export function getSettings(): GameSettings {
  return getStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

/**
 * Updates user settings
 */
export function updateSettings(settings: Partial<GameSettings>): boolean {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...settings };
  return setStorageItem(STORAGE_KEYS.SETTINGS, newSettings);
}

/**
 * Checks if a score qualifies as a new high score
 */
export function isNewHighScore(score: number): boolean {
  const currentHighScore = getCurrentHighScore();
  return !currentHighScore || score > currentHighScore.score;
}

/**
 * Clears all stored data (for testing or reset purposes)
 */
export function clearAllData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch {
    return false;
  }
}
