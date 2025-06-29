# AI-Driven Tetris Development Specification

This document provides a comprehensive specification for developing a modern Tetris game using AI-driven development. It emphasizes clarity, modern technology stack, and simplicity while maintaining feature completeness.

## Project Overview

Create a fully-featured Tetris game with the following core principles:
- **Modern Technology**: Use cutting-edge web technologies and best practices
- **Functional Programming**: Prefer pure functions over class-based approaches
- **Type Safety**: Strict TypeScript throughout the codebase
- **Bilingual Support**: English and Japanese interface from the start
- **Cross-Platform**: Desktop and mobile responsive design
- **Comprehensive Testing**: Test-driven development with high coverage

## Development Environment & Language Requirements

### Development Environment
- **Primary Platform**: macOS (assumes standard development tools are pre-installed)
- **Required Tools**: Git, Node.js/Bun, modern web browser
- **Assumed Available**: Homebrew, Xcode Command Line Tools, Terminal applications

### Language Standards
- **Documentation Language**: All documentation must be written in **English**
- **Source Code Comments**: All code comments must be written in **English**
- **Commit Messages**: All Git commit messages must be in **English**
- **Variable/Function Names**: Use descriptive **English** names following TypeScript conventions
- **User Interface**: Supports bilingual (English/Japanese) through i18n, but development artifacts remain in English

**Example:**
```typescript
// ✅ Correct: English comments and naming
/**
 * Calculates the fall speed based on the current level
 * @param level - Current game level (1-based)
 * @returns Fall interval in milliseconds
 */
function calculateFallSpeed(level: number): number {
  // Decrease speed by 100ms per level, minimum 100ms
  return Math.max(100, 1000 - ((level - 1) * 100));
}

// ❌ Incorrect: Non-English comments
/**
 * レベルに基づいて落下速度を計算
 */
function calculateFallSpeed(level: number): number {
  // レベルごとに100ms速くする
  return Math.max(100, 1000 - ((level - 1) * 100));
}
```

## Technology Stack (Latest Versions)

### Core Runtime & Build Tools
```json
{
  "bun": "1.2.17",           // Primary toolchain for package management, testing, and scripts
  "vite": "rolldown-vite",   // Enhanced build performance using Rust-based bundler
  "typescript": "5.8.3"       // Strict mode with ESNext target
}
```

### Frontend Framework
```json
{
  "react": "19.1.0",         // Latest React with concurrent features
  "react-dom": "19.1.0",     // DOM renderer
  "zustand": "5.0.6"         // Lightweight state management
}
```

### UI & Styling
```json
{
  "@tailwindcss/vite": "4.1.11",     // Tailwind CSS via Vite plugin
  "framer-motion": "12.19.2",        // Animation framework
  "@radix-ui/react-*": "latest",     // Headless accessible components
  "lucide-react": "0.525.0",         // SVG icon library
  "class-variance-authority": "0.7.1", // Component variant management
  "clsx": "2.1.1",                   // Conditional class names
  "tailwind-merge": "3.3.1"          // Tailwind class merging
}
```

### Internationalization
```json
{
  "i18next": "25.2.1",          // Core i18n framework
  "react-i18next": "15.5.3"     // React integration
}
```

### Development Tools
```json
{
  "@biomejs/biome": "2.0.6",          // Rust-based linter/formatter
  "happy-dom": "18.0.1",              // Lightweight DOM for testing
  "@playwright/test": "1.53.1",       // E2E testing
  "lefthook": "1.11.14",              // Git hooks
  "@vitejs/plugin-react-oxc": "0.2.3" // High-performance React plugin
}
```

## Project Structure

```
src/
├── components/          # React UI components
│   ├── game/           # Game-specific components
│   │   ├── Board.tsx           # Main game board (20x10 grid)
│   │   ├── BoardCell.tsx       # Individual cell with animations
│   │   ├── TetrominoGrid.tsx   # Grid display for pieces
│   │   ├── NextPiece.tsx       # Next piece preview
│   │   ├── HoldPiece.tsx       # Hold piece display
│   │   ├── ScoreBoard.tsx      # Score, lines, level display
│   │   ├── HighScore.tsx       # High score management
│   │   ├── GameOverlay.tsx     # Pause/game over overlays
│   │   ├── Controls.tsx        # Control reference
│   │   └── TouchControls.tsx   # Mobile touch interface
│   ├── layout/         # Layout components
│   │   ├── Game.tsx            # Main game layout
│   │   ├── GameSettings.tsx    # Settings dropdown
│   │   └── MobileGameLayout.tsx # Mobile-specific layout
│   └── ui/             # Reusable UI components
│       ├── AnimatedButton.tsx  # Button with animations
│       └── [radix-ui-wrappers] # Styled Radix UI components
├── game/               # Pure game logic (no React/UI dependencies)
│   ├── board.ts               # Board operations
│   ├── tetrominos.ts          # Piece definitions and rotation
│   ├── game.ts                # Core game mechanics
│   ├── pieceBag.ts            # 7-bag randomization
│   ├── wallKick.ts            # SRS wall kick system
│   ├── hold.ts                # Hold piece logic
│   └── ghost.ts               # Ghost piece calculation logic
├── hooks/              # Custom React hooks
│   ├── controls/       # Input handling hooks
│   │   ├── useKeyboardControls.ts  # Keyboard input
│   │   ├── useTouchGestures.ts     # Touch gestures
│   │   └── useActionCooldown.ts    # Input rate limiting
│   ├── core/           # Core game hooks
│   │   ├── useGameLoop.ts          # Main game loop
│   │   └── useGameActionHandler.ts # Action processing
│   └── ui/             # UI-related hooks
│       └── useAnimatedValue.ts     # Animation helpers
├── store/              # Zustand state management
│   ├── gameStore.ts           # Game state
│   ├── settingsStore.ts       # User settings
│   └── highScoreStore.ts      # Score persistence
├── types/              # TypeScript definitions
│   ├── game.ts                # Core game types
│   └── storage.ts             # Storage types
├── utils/              # Shared utilities
│   ├── gameConstants.ts       # All game constants
│   ├── colors.ts              # Tetromino colors
│   ├── boardUtils.ts          # Board helpers
│   └── gameValidation.ts      # State validation
├── locales/            # Translation files
│   ├── en.json               # English translations
│   └── ja.json               # Japanese translations
├── i18n/               # i18n configuration
│   └── config.ts             # Language setup
└── test/               # Test utilities
    └── setup.ts              # Test environment setup
```

## Core Game Implementation

### 1. Game Board System

```typescript
// Type definitions
type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0=empty, 1-7=colors
type GameBoard = CellValue[][];                    // Visible board only (20x10)
type GameBoardWithBuffer = CellValue[][];          // Full board with buffer (24x10)

// Board dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;          // Visible playing field
const BUFFER_HEIGHT = 4;          // Invisible area above visible board
const TOTAL_BOARD_HEIGHT = BOARD_HEIGHT + BUFFER_HEIGHT; // 24 total

// Create empty visible board (for display purposes)
function createEmptyBoard(): GameBoard {
  return Array(BOARD_HEIGHT).fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));
}

// Create complete board with buffer area (for game logic)
function createEmptyBoardWithBuffer(): GameBoardWithBuffer {
  return Array(TOTAL_BOARD_HEIGHT).fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));
}
```

### 2. Tetromino System

All 7 standard pieces with color indices:

```typescript
type TetrominoTypeName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type RotationState = 0 | 1 | 2 | 3; // 0=spawn, 1=right, 2=180, 3=left

const TETROMINO_COLOR_MAP = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7
} as const;

// Piece shapes (1 = filled, 0 = empty)
const TETROMINOS = {
  I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  O: [[1,1], [1,1]],
  T: [[0,1,0], [1,1,1], [0,0,0]],
  S: [[0,1,1], [1,1,0], [0,0,0]],
  Z: [[1,1,0], [0,1,1], [0,0,0]],
  J: [[1,0,0], [1,1,1], [0,0,0]],
  L: [[0,0,1], [1,1,1], [0,0,0]]
};
```

### 3. 7-Bag Randomization

Ensures fair piece distribution:

```typescript
// Create a new bag with all 7 pieces
function createPieceBag(): TetrominoTypeName[] {
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  // Fisher-Yates shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

// Get next piece, refill bag if empty
function getNextPiece(bag: TetrominoTypeName[]): [TetrominoTypeName, TetrominoTypeName[]] {
  if (bag.length === 0) {
    bag = createPieceBag();
  }
  return [bag[0], bag.slice(1)];
}
```

### 4. SRS (Super Rotation System) Wall Kicks

Complete SRS wall kick data implementation:

```typescript
// Wall kick offset data for standard pieces (J, L, T, S, Z)
const WALL_KICK_DATA = {
  // Clockwise rotations
  "0->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  "1->2": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  "2->3": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  "3->0": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  
  // Counter-clockwise rotations (reverse of clockwise)
  "1->0": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  "2->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  "3->2": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  "0->3": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
};

// I-piece has special wall kick data (different offsets)
const WALL_KICK_DATA_I = {
  // Clockwise rotations
  "0->1": [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
  "1->2": [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
  "2->3": [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
  "3->0": [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
  
  // Counter-clockwise rotations
  "1->0": [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
  "2->1": [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
  "3->2": [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
  "0->3": [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
};

// O-piece never rotates, so no wall kick data needed

function getWallKickData(pieceType: TetrominoTypeName, from: RotationState, to: RotationState): Position[] {
  if (pieceType === "O") return []; // O-piece doesn't rotate
  
  const key = `${from}->${to}`;
  const data = pieceType === "I" ? WALL_KICK_DATA_I : WALL_KICK_DATA;
  
  return data[key] || [];
}
```

### 5. Core Game Mechanics

```typescript
interface GameState {
  board: GameBoard;
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  ghostPosition: Position | null;
  pieceBag: TetrominoTypeName[];
  lockDelay: LockDelayState | null;
  lastDropTime: number; // For natural fall timing
  dropInterval: number; // Current drop speed in milliseconds
}

// Key game functions (all pure, return new state)
function moveTetrominoBy(state: GameState, dx: number, dy: number): GameState
function rotateTetrominoCW(state: GameState): GameState
function hardDropTetromino(state: GameState): GameState
function holdCurrentPiece(state: GameState): GameState
function lockCurrentTetromino(state: GameState): GameState
function clearLines(board: GameBoard): [GameBoard, number[]]

// Ghost piece calculation (pure function)
function calculateGhostPosition(
  board: GameBoardWithBuffer, 
  piece: Tetromino
): Position {
  // Start from current piece position
  let ghostY = piece.position.y;
  
  // Move down until collision is detected
  while (isValidPosition(board, piece.shape, { 
    x: piece.position.x, 
    y: ghostY - 1 
  })) {
    ghostY--;
  }
  
  return { x: piece.position.x, y: ghostY };
}

// Ghost piece utility functions
function isGhostPositionValid(
  board: GameBoardWithBuffer,
  currentPiece: Tetromino,
  ghostPosition: Position
): boolean {
  // Ghost position must be at or below current piece
  return ghostPosition.y <= currentPiece.position.y &&
         isValidPosition(board, currentPiece.shape, ghostPosition);
}

// Ghost piece optimization for performance
function shouldUpdateGhostPosition(
  oldPiece: Tetromino | null,
  newPiece: Tetromino
): boolean {
  if (!oldPiece) return true;
  
  // Only recalculate if position or rotation changed
  return oldPiece.position.x !== newPiece.position.x ||
         oldPiece.position.y !== newPiece.position.y ||
         oldPiece.rotation !== newPiece.rotation;
}
```

### 6. Game Rules & Mechanics

#### Level Progression
```typescript
const LINES_PER_LEVEL = 10;
function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / LINES_PER_LEVEL) + 1;
}

// Fall speed calculation (in milliseconds)
function calculateFallSpeed(level: number): number {
  const INITIAL_DROP_SPEED = 1000;
  const MIN_DROP_SPEED = 100;
  const SPEED_DECREASE_PER_LEVEL = 100;
  
  return Math.max(
    MIN_DROP_SPEED,
    INITIAL_DROP_SPEED - ((level - 1) * SPEED_DECREASE_PER_LEVEL)
  );
}

// Fall speed progression:
// Level 1:  1000ms (1.0 second)
// Level 2:   900ms (0.9 seconds)
// Level 3:   800ms (0.8 seconds)
// ...
// Level 9:   200ms (0.2 seconds)
// Level 10:  100ms (0.1 seconds)
// Level 11+: 100ms (maintains minimum speed, no further acceleration)
//
// Note: After level 10, fall speed remains constant at 100ms.
// This provides a skill ceiling where players must handle maximum speed
// while line clearing difficulty continues to increase through level progression.
```

#### Scoring System (Simplified)
```typescript
const BASE_SCORES = [0, 100, 300, 500, 800]; // 0-4 lines cleared
function calculateScore(linesCleared: number, level: number): number {
  return BASE_SCORES[linesCleared] * level;
}

// Note: This implementation uses simplified scoring
// Advanced features like T-Spin, Back-to-Back, and Combo scoring are NOT included
// to maintain simplicity and focus on core gameplay mechanics
```

#### Game Over Conditions
```typescript
function isGameOver(board: GameBoardWithBuffer, newPiece: Tetromino): boolean {
  // Game over when a new piece cannot be placed at its spawn position in buffer area
  return !isValidPosition(board, newPiece.shape, newPiece.position);
}

// Game over occurs when:
// 1. A new tetromino spawns but collides with existing blocks in the buffer area
// 2. The spawn position (y = 21) or any part of the spawning piece collides
// 3. This typically happens when stacked blocks reach into the buffer area (rows 20-23)
// 4. Note: Blocks in the visible area (rows 0-19) alone do not cause game over
//         until they prevent spawning in the buffer area
```

#### Hold System Rules
```typescript
interface HoldState {
  heldPiece: TetrominoTypeName | null;
  canHold: boolean; // Reset to true when piece locks, false after hold action
}

// Hold rules:
// 1. Can only hold once per piece (canHold = false after holding)
// 2. canHold resets to true when current piece locks in place
// 3. Cannot hold the same piece twice in a row
// 4. First hold: current piece → hold, get next piece
// 5. Subsequent holds: swap current piece ↔ held piece
```

#### Tetromino Spawn Position and Buffer Area
```typescript
// Board dimensions including invisible buffer area
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;          // Visible playing field
const BUFFER_HEIGHT = 4;          // Invisible area above visible board
const TOTAL_BOARD_HEIGHT = BOARD_HEIGHT + BUFFER_HEIGHT; // 24 total

// Complete board with buffer area
type GameBoardWithBuffer = CellValue[][]; // [24][10] array

function createEmptyBoardWithBuffer(): GameBoardWithBuffer {
  return Array(TOTAL_BOARD_HEIGHT).fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));
}

function getSpawnPosition(pieceType: TetrominoTypeName): Position {
  // All pieces spawn in the buffer area (y = 20-23, invisible to player)
  // This allows pieces to enter the visible area smoothly
  return {
    x: Math.floor((BOARD_WIDTH - TETROMINOS[pieceType][0].length) / 2),
    y: BOARD_HEIGHT + 1 // y = 21 (in buffer area, 1 row above visible board)
  };
}

// Buffer area rules:
// 1. Rows 0-19: Visible playing field (displayed to player)
// 2. Rows 20-23: Buffer area (invisible, for piece spawning/movement)
// 3. New pieces spawn at y = 21 (2 rows above visible area)
// 4. Pieces become visible as they naturally fall into rows 0-19
// 5. Game over occurs when pieces cannot spawn due to buffer area collision

// Standard spawn positions (x-coordinate):
// - I-piece (4-wide): x = 3, y = 21
// - O-piece (2-wide): x = 4, y = 21  
// - T,S,Z,J,L (3-wide): x = 3, y = 21
```

#### Lock Delay with Move/Rotation Limits
```typescript
const LOCK_DELAY_MS = 500; // Time before piece locks after landing
const MAX_LOCK_RESET_COUNT = 15; // Maximum number of moves/rotations allowed during lock delay

interface LockDelayState {
  isActive: boolean;
  startTime: number;
  resetCount: number; // Track number of moves/rotations during delay
  lastLowestY: number; // Track the lowest Y position reached during lock delay
}

// Lock delay rules:
// 1. When piece can't move down, start lock delay timer
// 2. If piece moves or rotates during delay, reset timer BUT increment resetCount
// 3. If piece moves to a lower position, reset resetCount (encourages downward movement)
// 4. After delay expires OR resetCount reaches MAX_LOCK_RESET_COUNT, force lock
// 5. This prevents "infinity" placement by limiting manipulation attempts
// 6. resetCount resets to 0 when new piece spawns

function shouldForceLock(lockState: LockDelayState, currentY: number): boolean {
  const timeExpired = Date.now() - lockState.startTime >= LOCK_DELAY_MS;
  const maxResetsReached = lockState.resetCount >= MAX_LOCK_RESET_COUNT;
  
  // Reset counter if piece moved to a lower position
  if (currentY < lockState.lastLowestY) {
    lockState.resetCount = 0;
    lockState.lastLowestY = currentY;
  }
  
  return timeExpired || maxResetsReached;
}
```

## State Management with Zustand

### Game Store

```typescript
interface GameStore extends GameState {
  // Actions
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotate: () => void;
  drop: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  resetGame: () => void;
}

const useGameStore = create<GameStore>()((set) => ({
  ...createInitialGameState(),
  
  moveLeft: () => set((state) => moveTetrominoBy(state, -1, 0)),
  moveRight: () => set((state) => moveTetrominoBy(state, 1, 0)),
  // ... other actions
}));
```

### Settings Store

```typescript
interface SettingsState {
  language: 'en' | 'ja';
  showGhostPiece: boolean;
  setLanguage: (lang: 'en' | 'ja') => void;
  toggleGhostPiece: () => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      showGhostPiece: true,
      setLanguage: (language) => set({ language }),
      toggleGhostPiece: () => set((state) => ({ 
        showGhostPiece: !state.showGhostPiece 
      })),
    }),
    { name: 'tetris-settings' }
  )
);
```

### High Score Store

```typescript
interface HighScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string;
}

interface HighScoreState {
  highScores: HighScoreEntry[];
  addHighScore: (entry: Omit<HighScoreEntry, 'date'>) => void;
}
```

## UI Implementation Guidelines

### 1. Component Organization

- **Pure Presentation**: Components should be pure and receive all data via props
- **No Direct Store Access**: Only container components access stores
- **Memoization**: Use React.memo for performance-critical components
- **Animation Isolation**: Keep animations in separate components

### 2. Responsive Design

```typescript
// Mobile breakpoint: < 768px (md in Tailwind)
// Desktop: >= 768px

// Example responsive component
function GameLayout() {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileGameLayout />
      </div>
      
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopGameLayout />
      </div>
    </>
  );
}
```

### 3. Touch Controls

Implement swipe gestures and tap controls:

```typescript
// Touch gesture mapping
- Swipe left: Move piece left
- Swipe right: Move piece right
- Swipe down: Soft drop
- Long swipe down: Hard drop
- Tap: Rotate clockwise
- Double tap: Hold piece

// Touch detection thresholds and logic
const TOUCH_THRESHOLDS = {
  MIN_SWIPE_DISTANCE: 30,         // Minimum pixels to register as swipe
  MAX_SWIPE_TIME: 500,            // Maximum time for swipe gesture (ms)
  TAP_MAX_TIME: 200,              // Maximum duration for tap (ms)
  TAP_MAX_DISTANCE: 10,           // Maximum movement for tap (pixels)
  DOUBLE_TAP_MAX_INTERVAL: 300,   // Maximum time between taps for double tap (ms)
  LONG_SWIPE_THRESHOLD: 80,       // Minimum distance for hard drop swipe (pixels)
  SWIPE_VELOCITY_THRESHOLD: 0.5   // Minimum pixels/ms for swipe recognition
};

// Touch gesture recognition logic
interface TouchGestureState {
  startPosition: { x: number; y: number };
  startTime: number;
  lastTapTime: number;
  isMoving: boolean;
}

function recognizeGesture(
  touchStart: Touch, 
  touchEnd: Touch, 
  duration: number
): TouchGesture {
  const deltaX = touchEnd.clientX - touchStart.clientX;
  const deltaY = touchEnd.clientY - touchStart.clientY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const velocity = distance / duration;
  
  // Tap recognition: short time, minimal movement
  if (duration <= TOUCH_THRESHOLDS.TAP_MAX_TIME && 
      distance <= TOUCH_THRESHOLDS.TAP_MAX_DISTANCE) {
    return 'tap';
  }
  
  // Swipe recognition: sufficient distance and velocity
  if (distance >= TOUCH_THRESHOLDS.MIN_SWIPE_DISTANCE &&
      velocity >= TOUCH_THRESHOLDS.SWIPE_VELOCITY_THRESHOLD &&
      duration <= TOUCH_THRESHOLDS.MAX_SWIPE_TIME) {
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'swipe-right' : 'swipe-left';
    } else {
      // Distinguish between soft drop and hard drop based on distance
      if (deltaY > 0) {
        return distance >= TOUCH_THRESHOLDS.LONG_SWIPE_THRESHOLD ? 
               'hard-drop' : 'soft-drop';
      }
    }
  }
  
  return 'none';
}
```

### 4. Animations with Framer Motion

```typescript
// Score animation
<motion.span
  key={score}
  initial={{ scale: 1.5, color: "#fbbf24" }}
  animate={{ scale: 1, color: "#ffffff" }}
  transition={{ type: "spring", stiffness: 300, damping: 15 }}
>
  {score}
</motion.span>

// Line clear animation
<motion.div
  initial={{ opacity: 1 }}
  animate={{ opacity: 0, scale: 1.2 }}
  transition={{ duration: 0.2 }}
/>
```

### 5. Keyboard Controls

```
← / → : Move left/right
↓     : Soft drop
Space : Hard drop
↑ / X : Rotate clockwise (CW)
Z     : Rotate counter-clockwise (CCW)
C     : Hold piece
P     : Pause/Resume
R     : Reset game (when game over)
Esc   : Pause/Resume (alternative)
Enter : Start game / Confirm actions
```

### 6. Input Handling & DAS (Delayed Auto Shift)

```typescript
// DAS (Delayed Auto Shift) configuration
const DAS_CONFIG = {
  INITIAL_DELAY: 170,    // Time before auto-repeat starts (ms)
  REPEAT_RATE: 50,       // Time between auto-repeats (ms)
  SOFT_DROP_RATE: 50,    // Soft drop repeat rate (ms)
};

interface DASState {
  leftPressed: boolean;
  rightPressed: boolean;
  downPressed: boolean;
  lastLeftTime: number;
  lastRightTime: number;
  lastDownTime: number;
  leftRepeatStarted: boolean;
  rightRepeatStarted: boolean;
  downRepeatStarted: boolean;
}

// DAS implementation ensures smooth, responsive controls
// Initial key press: immediate response
// After INITIAL_DELAY: repeat at REPEAT_RATE interval
// This matches standard Tetris control behavior
```

## Testing Strategy

### 1. Test Organization & Strategy

- Co-locate test files with source files
- Use descriptive test names
- Group related tests with describe blocks
- **Test pure functions only** - Focus testing on game logic, utilities, and calculations
- **No React component testing** - UI components are validated through E2E tests
- **No hook testing** - Custom hooks are tested indirectly through integration

#### Testing Strategy Rationale

This specification adopts a **strategic testing pyramid** that prioritizes development velocity and real-world validation:

**Pure Function Testing (Unit Tests):**
- **Why**: Game logic is complex and critical - bugs here break core gameplay
- **What**: Board operations, piece rotation, line clearing, collision detection
- **Benefit**: Fast, reliable, easy to maintain, provides immediate feedback

**E2E Testing (Integration Tests):**
- **Why**: User behavior is the ultimate validation - if UI works for users, it works
- **What**: Complete user flows, cross-browser compatibility, visual regression  
- **Benefit**: Tests real user scenarios, catches integration issues, validates accessibility

**Omitted Testing (React Components/Hooks):**
- **Why**: UI components are implementation details that change frequently
- **Rationale**: Component unit tests are often brittle, hard to maintain, and provide limited value
- **Alternative**: E2E tests validate the same functionality with better coverage
- **Result**: Faster development cycle, fewer test maintenance issues, focus on user value

This approach maximizes **confidence per test effort** by focusing on high-value, stable interfaces while avoiding the maintenance overhead of intermediate abstraction testing.

### 2. Testing Patterns

```typescript
// Pure function testing
describe("rotateTetromino", () => {
  test("rotates T piece clockwise", () => {
    const shape = [[0,1,0], [1,1,1], [0,0,0]];
    const rotated = rotateTetromino(shape);
    expect(rotated).toEqual([[0,1,0], [0,1,1], [0,1,0]]);
  });
});

// Component testing
describe("Board", () => {
  test("renders 20x10 grid", () => {
    render(<Board />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(200);
  });
});

// Hook testing
describe("useGameLoop", () => {
  test("advances game state at correct interval", () => {
    const { result } = renderHook(() => useGameLoop());
    // Test game loop behavior
  });
});
```

### 3. Test Setup

```typescript
// test/setup.ts
import { Window } from "happy-dom";
import "@testing-library/jest-dom";

beforeAll(() => {
  const window = new Window();
  global.window = window;
  global.document = window.document;
  // Set up other globals
});

afterEach(() => {
  cleanup();
});
```

## Internationalization (i18n)

### 1. Setup

```typescript
// i18n/config.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: { en: { translation: enJSON }, ja: { translation: jaJSON }},
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});
```

### 2. Translation Structure

```json
// locales/en.json
{
  "game": {
    "title": "Tetris",
    "score": { "title": "Score", "lines": "Lines", "level": "Level" },
    "controls": { "move": "Move", "rotate": "Rotate", "drop": "Drop" },
    "gameOver": "Game Over",
    "paused": "Paused"
  }
}
```

### 3. Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function ScoreBoard() {
  const { t } = useTranslation();
  return <h2>{t('game.score.title')}</h2>;
}
```

## Advanced Development Tools (MCP Integration)

The development environment supports Model Context Protocol (MCP) integration for enhanced development workflows. While not immediately required for basic implementation, these tools provide powerful capabilities for advanced development scenarios.

### Playwright MCP - Browser Testing & UI Validation

**Purpose:** Visual UI validation, user interaction testing, and responsive design verification

**Key Capabilities:**
- **Visual UI Validation**: Take screenshots and verify layout correctness
- **User Interaction Testing**: Simulate clicks, input, and navigation
- **Responsive Design Verification**: Test behavior across different screen sizes
- **Animation Analysis**: Verify timing and behavior of Framer Motion animations

**Core Functions:**
```typescript
// Navigation and page analysis
mcp__playwright__browser_navigate(url: string)
mcp__playwright__browser_snapshot()  // Analyze page structure
mcp__playwright__browser_take_screenshot()

// User interactions
mcp__playwright__browser_click(element: string, ref: string)
mcp__playwright__browser_type(element: string, ref: string, text: string)
mcp__playwright__browser_hover(element: string, ref: string)

// Mobile testing
mcp__playwright__browser_resize(width: number, height: number)
mcp__playwright__browser_press_key(key: string)
```

**Usage Example:**
```bash
# Start development server
bun run dev

# Navigate to application
mcp__playwright__browser_navigate "http://localhost:5173"

# Analyze page structure for testing
mcp__playwright__browser_snapshot

# Take screenshot for visual verification
mcp__playwright__browser_take_screenshot
```

**When to Use:**
- Validating responsive design on different screen sizes
- Testing touch controls on mobile layout
- Verifying animations play correctly
- Debugging layout issues during development
- Creating visual regression tests

### Context7 MCP - Library Documentation & Updates

**Purpose:** Access up-to-date library documentation and check for breaking changes

**Key Capabilities:**
- **Latest Documentation**: Get current documentation for any library
- **Breaking Changes**: Check for API changes before updates
- **Performance Tips**: Discover optimization techniques
- **Troubleshooting**: Access current solutions for known issues

**Core Functions:**
```typescript
// Resolve library to Context7 ID
mcp__context7__resolve-library-id(libraryName: string)

// Get comprehensive documentation
mcp__context7__get-library-docs(context7CompatibleLibraryID: string, options?: {
  tokens?: number,  // Documentation length
  topic?: string    // Focus area
})
```

**Usage Workflow:**
```bash
# 1. Resolve library name to Context7 ID
mcp__context7__resolve-library-id "bun"
# → Returns: `/oven-sh/bun`

# 2. Get documentation for specific topic
mcp__context7__get-library-docs "/oven-sh/bun" --topic "testing"
# → Latest Bun testing features, API changes, best practices

# 3. Check framework updates
mcp__context7__resolve-library-id "react"
# → Returns: `/facebook/react`
mcp__context7__get-library-docs "/facebook/react" --topic "hooks"
# → Current React 19 hooks documentation
```

**Common Use Cases:**
```bash
# Check Zustand latest features
mcp__context7__resolve-library-id "zustand"
mcp__context7__get-library-docs "/pmndrs/zustand"

# Framer Motion animation techniques
mcp__context7__resolve-library-id "framer-motion"
mcp__context7__get-library-docs "/framer/motion" --topic "animations"

# Tailwind CSS latest utilities
mcp__context7__resolve-library-id "tailwindcss"
mcp__context7__get-library-docs "/tailwindlabs/tailwindcss" --topic "utilities"

# i18next configuration updates
mcp__context7__resolve-library-id "i18next"
mcp__context7__get-library-docs "/i18next/i18next" --topic "configuration"
```

**When to Use:**
- Before updating dependencies to check breaking changes
- When implementing new features with unfamiliar APIs
- Troubleshooting library-specific issues
- Discovering performance optimization techniques
- Learning about new features in library updates

## Development Workflow

### 1. Scripts

```json
{
  "dev": "bun --bun vite",              // Development server
  "build": "bun x vite build",          // Production build
  "test": "bun test src/",              // Run tests
  "lint": "bun x biome check --write",  // Lint and fix
  "format": "bun x biome format --write", // Code formatting
  "typecheck": "bun x tsc --noEmit",   // Type checking
  "knip": "bun x knip",                 // Dead code detection
  "ci": "bun x biome ci && bun run typecheck && bun test && bun run build",
  "prepare": "lefthook install"         // Install git hooks
}
```

### 2. Git Workflow & Version Control

#### Repository Setup

```bash
# Initialize repository
git init
git remote add origin https://github.com/[username]/tetris-game.git

# Initial commit
git add .
git commit -m "feat: initial tetris game setup with Bun and Vite"
git push -u origin main
```

#### Branch Strategy

```bash
main        # Production-ready code
├── develop # Integration branch
    ├── feature/*  # New features (feat/add-sound-effects)
    ├── fix/*      # Bug fixes (fix/rotation-bug)
    └── chore/*    # Maintenance tasks (chore/update-dependencies)
```

#### Commit Convention

Follow Conventional Commits specification:

```bash
# Format: type(scope): description

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation only
style:    # Code style (formatting, missing semicolons, etc)
refactor: # Code restructuring without changing functionality
test:     # Adding or updating tests
chore:    # Maintenance tasks

# Examples:
git commit -m "feat(game): implement SRS wall kick system"
git commit -m "fix(controls): resolve double tap detection on mobile"
git commit -m "test(board): add comprehensive line clearing tests"
git commit -m "chore(deps): update Bun to 1.2.17"
```

#### Pre-commit Checks

Lefthook automatically runs before each commit:

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    format:
      glob: "*.{js,ts,jsx,tsx,json,md}"
      run: bun run format
      stage_fixed: true  # Auto-stage formatted files
    
    lint:
      glob: "*.{js,ts,jsx,tsx}"
      run: bun run lint
      stage_fixed: true

commit-msg:
  commands:
    commitlint:
      run: |
        # Validate commit message format
        if ! grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+" {1}; then
          echo "❌ Commit message must follow Conventional Commits format"
          exit 1
        fi
```

### 3. GitHub Actions CI/CD

#### CI Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.2.17

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run linting
        run: bun run lint

      - name: Run type check
        run: bun run typecheck

      - name: Run tests
        run: bun test

      - name: Check dead code
        run: bun run knip

      - name: Run build
        run: bun run build

      - name: Upload build artifacts
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

#### Pull Request Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/ghost-piece-preview
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(game): add ghost piece preview feature"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/ghost-piece-preview
   ```

4. **Create Pull Request**
   - Title: Clear description of changes
   - Description: What, Why, How
   - Link related issues
   - Wait for CI checks to pass

5. **Code Review Requirements**
   - All CI checks must pass
   - At least one approval required
   - No unresolved conversations
   - Up-to-date with target branch

### 4. GitHub Configuration Files

#### `.gitignore`
```gitignore
# Dependencies
node_modules/
.bun/

# Build outputs
dist/
build/
*.stats.html

# Environment
.env
.env.local

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Logs
*.log
npm-debug.log*
```

#### `dependabot.yml`
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "*test*"
          - "*dev*"
```

### 5. Import Rules

- Cross-directory imports: Use `@/` alias
- Same directory imports: Use relative `./` paths
- External imports: Direct package names

### 6. Release Process

#### Version Management

Use semantic versioning (semver):
- MAJOR.MINOR.PATCH (1.0.0)
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

#### Release Steps

1. **Update version**
   ```bash
   # Update package.json version
   bun version patch  # or minor/major
   ```

2. **Create release tag**
   ```bash
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git push origin v1.0.1
   ```

3. **GitHub Release**
   - Go to Releases → Create new release
   - Choose tag
   - Generate release notes
   - Attach build artifacts
   - Publish release

#### Deployment (Optional)

For Vercel deployment:
```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "installCommand": "bun install",
  "framework": null
}
```

## Performance Optimization

### 1. Code Splitting

- Lazy load heavy components (settings, high scores)
- Split language files for i18n
- Use dynamic imports for optional features

### 2. Rendering Optimization

- Memoize expensive calculations (ghost position)
- Use React.memo for static components
- Implement proper key strategies for lists

### 3. Animation Performance

- Use CSS transforms over position changes
- Leverage GPU acceleration with will-change
- Batch DOM updates in game loop

## Implementation Reference

For detailed implementation steps, please refer to the separate **[IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md)** document.

The implementation guide provides:
- **9 detailed phases** with specific daily goals
- **Phase-based task breakdown** with comprehensive checklists  
- **TDD-focused approach** with testing requirements for pure functions
- **Git workflow integration** with commit guidelines for each phase
- **Early i18n setup** to prevent extensive refactoring
- **Validation criteria** for each phase completion

### Quick Overview of Implementation Phases

1. **Phase 1**: Foundation Setup (Bun, Vite, TypeScript, i18n)
2. **Phase 2**: Core Types & Game Logic (Board, Tetrominos, Pure Functions)
3. **Phase 3**: Advanced Game Mechanics (7-Bag, SRS, Game State)
4. **Phase 4**: State Management & i18n Integration (Zustand Stores)
5. **Phase 5**: Core UI Components (Board, Pieces, Scoring)
6. **Phase 6**: Game Loop & Controls (Timing, Input Handling)
7. **Phase 7**: Layout & Polish (Responsive Design, Accessibility)
8. **Phase 8**: Comprehensive Testing & E2E (Coverage, Browser Testing)
9. **Phase 9**: Production Ready (Optimization, Documentation, Release)

Each phase includes detailed tasks with checklists, testing requirements, validation criteria, and commit guidelines to ensure systematic and high-quality development.

## Game Design Decisions Summary

### Simplified Design Choices
To maintain development focus and implementation clarity, the following design decisions prioritize simplicity over advanced features:

**Scoring System:**
- **Included**: Basic line clearing scores (100/300/500/800 points) with level multipliers
- **Excluded**: T-Spin bonuses, Back-to-Back chains, Combo scoring, Perfect Clear bonuses

**Rotation System:**
- **Included**: Complete SRS (Super Rotation System) with full wall kick data
- **Included**: Both clockwise (↑/X) and counter-clockwise (Z) rotation
- **Standard**: I-piece uses special wall kick data, O-piece doesn't rotate

**Level Progression:**
- **Rule**: 10 lines cleared = 1 level increase
- **Speed**: 1000ms initial fall time, decreasing by 100ms per level
- **Minimum**: 100ms minimum fall time (level 10+)

**Lock Delay:**
- **Standard**: 500ms delay after piece lands
- **Reset**: Timer resets on movement/rotation during delay
- **Limits**: Maximum 15 move/rotation resets to prevent infinite manipulation
- **Encouragement**: Reset counter resets when piece moves to lower position

**Hold System:**
- **Standard**: One hold per piece, resets when piece locks
- **Swap**: Hold current piece ↔ swap with held piece
- **Spawn**: New pieces appear at top-center of board

**Game Over:**
- **Condition**: New piece cannot spawn due to collision
- **Position**: Spawn position occupied by existing blocks

These decisions ensure the game remains authentic to Tetris mechanics while keeping implementation complexity manageable for AI-driven development.

## Key Implementation Notes

### DO:
- Keep all game logic pure and testable
- Use TypeScript strictly (no `any`)
- Implement proper error boundaries
- Add comprehensive keyboard shortcuts
- Ensure mobile-first responsive design
- Use semantic HTML for accessibility

### DON'T:
- Don't use classes for components or logic
- Don't hardcode any UI strings (use i18n for all text)
- Don't skip type definitions (use strict TypeScript)
- Don't ignore performance in game loop (60 FPS target)
- Don't forget touch control optimization (mobile-first approach)
- Don't mix UI and game logic (pure functions for game state)
- Don't implement advanced scoring (T-Spin, Back-to-Back, Combo)
- Don't add sound effects or music (focus on core gameplay)

## Success Criteria

The implementation is successful when:

1. **Gameplay**: Smooth 60 FPS gameplay on all devices
2. **Features**: All standard Tetris features implemented
3. **Responsive**: Works perfectly on mobile and desktop
4. **Bilingual**: Full English and Japanese support
5. **Testing**: >80% test coverage on game logic
6. **Performance**: <3s initial load, <100ms input latency
7. **Accessibility**: Keyboard navigable, screen reader friendly
8. **Code Quality**: Zero TypeScript errors, clean Biome checks

## Conclusion

This specification provides a complete blueprint for AI-driven Tetris development. Follow the phases sequentially, maintain strict type safety, and prioritize user experience. The resulting game should be modern, performant, and maintainable while showcasing the latest web technologies.