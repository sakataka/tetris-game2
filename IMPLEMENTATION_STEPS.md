# Tetris Game Implementation Steps for AI

## Overview

This document provides a comprehensive, step-by-step implementation guide for developing a modern Tetris game using Test-Driven Development (TDD) principles. Each phase contains detailed tasks with checklists to ensure systematic progress and quality assurance.

## Core Implementation Principles

- **Test-Driven Development (TDD)**: Write tests for pure functions before implementation
  - **Red**: Write a failing test for the desired functionality
  - **Green**: Write the minimum code to make the test pass
  - **Refactor**: Improve code quality while maintaining test coverage
  - Apply this cycle continuously for all pure functions in `src/game/*` and `src/utils/*`
- **Phase-based Development**: Complete one phase before moving to the next
- **Git Workflow**: Commit and push after each phase completion
- **Early i18n Setup**: Implement internationalization in Phase 1 to avoid refactoring
- **Pure Function Testing**: Focus testing only on game logic, utilities, and calculations
- **Architectural Separation**: UI components must never directly import from `src/game/*` - use Zustand stores only

---

## Phase 1: Foundation Setup
**Duration**: Day 1  
**Goal**: Establish project infrastructure, tooling, and internationalization foundation

### Task 1.1: Project Initialization
**Objective**: Set up Bun + Vite project with TypeScript

**Checklist:**
- [ ] Initialize new project directory
- [ ] Run `bun create vite tetris-game --template react-ts`
- [ ] Navigate to project directory
- [ ] Install base dependencies with `bun install`
- [ ] Verify project builds with `bun run dev`
- [ ] Update `package.json` with correct project metadata

### Task 1.2: TypeScript Configuration
**Objective**: Configure strict TypeScript settings

**Checklist:**
- [ ] Update `tsconfig.json` with strict settings
- [ ] Set `"strict": true` in compiler options
- [ ] Add `"noUnusedLocals": true`
- [ ] Add `"noUnusedParameters": true`
- [ ] Configure path aliases: `"@/*": ["./src/*"]`
- [ ] Set target to `"ESNext"`
- [ ] Verify TypeScript compilation works

### Task 1.3: Tailwind CSS Setup
**Objective**: Install and configure Tailwind CSS via Vite plugin

**Checklist:**
- [ ] Install Tailwind dependencies: `bun add -D @tailwindcss/vite tailwindcss`
- [ ] Update `vite.config.ts` to include Tailwind plugin
- [ ] Create basic Tailwind config (if needed)
- [ ] Update `src/index.css` with Tailwind directives
- [ ] Test Tailwind classes work in a component
- [ ] Verify hot reloading works with styles

### Task 1.4: Code Quality Tools
**Objective**: Set up Biome for linting and formatting

**Checklist:**
- [ ] Install Biome: `bun add -D @biomejs/biome`
- [ ] Create `biome.json` configuration file
- [ ] Configure linting rules (recommended + custom)
- [ ] Configure formatting settings (2 spaces, 100 line width)
- [ ] Add scripts: `"lint"`, `"format"` to package.json
- [ ] Run lint check: `bun run lint`
- [ ] Run format check: `bun run format`

### Task 1.5: Git Repository Setup
**Objective**: Initialize Git repository and GitHub integration

**Checklist:**
- [ ] Initialize Git repository: `git init`
- [ ] Create comprehensive `.gitignore` file
- [ ] Add GitHub remote: `git remote add origin [repository-url]`
- [ ] Create initial commit with foundation files
- [ ] Push to GitHub: `git push -u origin main`
- [ ] Verify repository is accessible on GitHub

### Task 1.6: GitHub Actions CI/CD
**Objective**: Set up automated testing and build pipeline

**Checklist:**
- [ ] Create `.github/workflows/ci.yml` file
- [ ] Configure CI to run on push/PR to main branch
- [ ] Add Bun setup step with version 1.2.17
- [ ] Add dependency installation step
- [ ] Add linting step: `bun run lint`
- [ ] Add type checking step: `bun run typecheck`
- [ ] Add test step: `bun test`
- [ ] Add build step: `bun run build`
- [ ] Test CI pipeline with a test commit

### Task 1.7: Pre-commit Hooks with Lefthook
**Objective**: Automate code quality checks before commits

**Checklist:**
- [ ] Install Lefthook: `bun add -D lefthook`
- [ ] Create `lefthook.yml` configuration file
- [ ] Configure pre-commit hooks for formatting and linting
- [ ] Configure commit message validation
- [ ] Add prepare script: `"prepare": "lefthook install"`
- [ ] Run `bun run prepare` to install hooks
- [ ] Test pre-commit hooks with a sample commit

### Task 1.8: Testing Infrastructure
**Objective**: Set up Bun test environment with happy-dom

**Checklist:**
- [ ] Install test dependencies: `bun add -D happy-dom @testing-library/jest-dom`
- [ ] Create `src/test/setup.ts` file
- [ ] Configure happy-dom environment in setup
- [ ] Add global test setup for DOM simulation
- [ ] Configure cleanup after each test
- [ ] Add test script to package.json: `"test": "bun test src/"`
- [ ] Create sample test file to verify setup works
- [ ] Run tests to confirm environment is working

### Task 1.9: i18n Foundation (Critical)
**Objective**: Set up internationalization infrastructure early

**Checklist:**
- [ ] Install i18n dependencies: `bun add i18next react-i18next`
- [ ] Create `src/locales/en.json` with basic translations
- [ ] Create `src/locales/ja.json` with basic translations
- [ ] Create `src/i18n/config.ts` configuration file
- [ ] Configure i18next with intelligent language detection priority:
  1. localStorage saved preference ('tetris-language' key)
  2. Browser language (navigator.language, check for 'ja' prefix)
  3. Fallback to English ('en')
- [ ] Set up localStorage persistence for language preference
- [ ] Create basic language switching mechanism
- [ ] Test language switching between English and Japanese
- [ ] Test initial language detection with different browser languages

### Task 1.10: i18n Testing & Validation
**Objective**: Ensure i18n system works correctly

**Checklist:**
- [ ] Create sample components using `useTranslation` hook
- [ ] Add translations for sample text in both languages
- [ ] Test translation loading in browser
- [ ] Test language persistence across page reloads
- [ ] Verify no hardcoded strings in components
- [ ] Document translation key naming conventions
- [ ] Add i18n testing to test setup

### Task 1.11: Phase 1 Completion
**Objective**: Validate foundation and commit progress

**Checklist:**
- [ ] Run full CI pipeline locally: `bun run ci`
- [ ] Verify all linting passes
- [ ] Verify all type checking passes
- [ ] Verify basic tests pass
- [ ] Verify project builds successfully
- [ ] Test i18n language switching works
- [ ] Commit all changes with conventional commit message
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes on GitHub

**Phase 1 Validation Criteria:**
- [ ] Project builds and runs successfully
- [ ] Linting and formatting tools work correctly
- [ ] i18n switches between English and Japanese
- [ ] Basic test infrastructure is functional
- [ ] Git repository is properly configured
- [ ] CI/CD pipeline passes all checks

---

## Phase 2: Core Types & Game Logic
**Duration**: Day 2  
**Goal**: Implement fundamental game types and pure function logic

### Task 2.1: Type Definitions
**Objective**: Define all TypeScript types for the game

**Checklist:**
- [ ] Create `src/types/game.ts` file
- [ ] Define `TetrominoTypeName` union type ("I" | "O" | "T" | "S" | "Z" | "J" | "L")
- [ ] Define `RotationState` type (0 | 1 | 2 | 3)
- [ ] Define `CellValue` type (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)
- [ ] Define `Position` interface with x, y coordinates
- [ ] Define `Tetromino` interface with type, position, rotation, shape
- [ ] Define `GameBoard` and `GameBoardWithBuffer` types
- [ ] Define `LockDelayState` interface with timer and reset count
- [ ] Define `DASState` interface for delayed auto shift
- [ ] Define complete `GameState` interface
- [ ] Create `src/types/storage.ts` for localStorage types

### Task 2.2: Type Validation Functions (TDD)
**Objective**: Create and test type guard and validation functions

**Checklist:**
- [ ] Create `src/utils/typeGuards.ts` file
- [ ] Write test for `isValidCellValue()` function
- [ ] Implement `isValidCellValue()` function
- [ ] Write test for `isValidRotationState()` function
- [ ] Implement `isValidRotationState()` function
- [ ] Write test for `normalizeRotationState()` function
- [ ] Implement `normalizeRotationState()` function
- [ ] Write test for `isValidTetrominoType()` function
- [ ] Implement `isValidTetrominoType()` function
- [ ] Run tests to verify all type guards work

### Task 2.3: Game Constants
**Objective**: Define all game constants in centralized location

**Checklist:**
- [ ] Create `src/utils/gameConstants.ts` file
- [ ] Define `GAME_CONSTANTS` object with board dimensions (20x10 visible, 24x10 total)
- [ ] Add timing constants (drop speeds, delays, animations)
- [ ] Add DAS constants (initial delay: 170ms, repeat rate: 50ms)
- [ ] Add lock delay constants (delay: 500ms, max resets: 15)
- [ ] Add tetromino constants (grid size, rotation states)
- [ ] Add touch control constants (swipe distances, tap times)
- [ ] Add UI constants (button sizes, colors)
- [ ] Add scoring constants (base scores, level progression)
- [ ] Add gameplay constants (spawn delay, piece bag)
- [ ] Export all constants as read-only

### Task 2.4: Board System - Testing (TDD)
**Objective**: Write comprehensive tests for board operations

**Checklist:**
- [ ] Create `src/game/board.test.ts` file
- [ ] Write test for `createEmptyBoard()` - should create 20x10 visible grid of zeros
- [ ] Write test for `createEmptyBoardWithBuffer()` - should create 24x10 total grid of zeros
- [ ] Write test for `createEmptyBoard()` - should handle invalid dimensions
- [ ] Write test for `isValidPosition()` - piece within bounds (including buffer area)
- [ ] Write test for `isValidPosition()` - piece outside left boundary
- [ ] Write test for `isValidPosition()` - piece outside right boundary
- [ ] Write test for `isValidPosition()` - piece outside bottom boundary (visible area)
- [ ] Write test for `isValidPosition()` - piece colliding with existing blocks
- [ ] Write test for `isValidPosition()` - edge cases with different piece shapes
- [ ] Write test for spawn position validation in buffer area

### Task 2.5: Board System - Implementation
**Objective**: Implement board creation and validation logic

**Checklist:**
- [ ] Create `src/game/board.ts` file
- [ ] Implement `createEmptyBoard()` function for visible 20x10 board
- [ ] Implement `createEmptyBoardWithBuffer()` function for full 24x10 board
- [ ] Implement `isValidPosition()` function with bounds checking for buffer area
- [ ] Implement `forEachPieceCell()` helper function
- [ ] Implement `placeTetromino()` function for placing pieces on board
- [ ] Implement `clearLines()` function for line clearing logic
- [ ] Add spawn position utilities for buffer area
- [ ] Add proper TypeScript types for all function parameters
- [ ] Run board tests to verify all functions work correctly

### Task 2.6: Tetromino System - Testing (TDD)
**Objective**: Write tests for all tetromino operations

**Checklist:**
- [ ] Create `src/game/tetrominos.test.ts` file
- [ ] Write tests for all 7 tetromino shape definitions (I, O, T, S, Z, J, L)
- [ ] Write test for `getTetrominoShape()` - should return correct shapes
- [ ] Write test for `getTetrominoColorIndex()` - should return correct color indices
- [ ] Write test for `rotateTetromino()` - clockwise rotation for each piece
- [ ] Write test for `rotateTetromino()` - multiple rotations return to original
- [ ] Write test for `createTetromino()` - should create tetromino at correct spawn position
- [ ] Write test for `createTetromino()` - should handle all piece types

### Task 2.7: Tetromino System - Implementation
**Objective**: Implement tetromino definitions and operations

**Checklist:**
- [ ] Create `src/game/tetrominos.ts` file
- [ ] Define `TETROMINO_COLOR_MAP` with color indices for each piece
- [ ] Define `TETROMINOS` object with shape matrices for all 7 pieces
- [ ] Implement `getTetrominoShape()` function (returns deep copy)
- [ ] Implement `getTetrominoColorIndex()` function
- [ ] Implement `rotateTetromino()` function with 90-degree clockwise rotation
- [ ] Implement `createTetromino()` function with proper spawn positioning
- [ ] Run tetromino tests to verify all functions work correctly

### Task 2.8: Phase 2 Validation & Commit
**Objective**: Ensure all core types and logic work correctly

**Checklist:**
- [ ] Run all tests: `bun test`
- [ ] Verify >95% test coverage on pure functions
- [ ] Run type checking: `bun run typecheck`
- [ ] Run linting: `bun run lint`
- [ ] Verify all 7 tetromino shapes render correctly
- [ ] Test rotation logic for all pieces
- [ ] Test board validation with edge cases
- [ ] Commit with message: "feat(game): implement core types, board system, and tetromino logic with comprehensive tests"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 2 Validation Criteria:**
- [ ] All board operations tested and working
- [ ] All 7 tetrominoes have correct shapes and colors
- [ ] Rotation logic works for all pieces  
- [ ] Type safety enforced throughout
- [ ] Test coverage >90% on pure functions

---

## Phase 3: Advanced Game Mechanics
**Duration**: Day 3  
**Goal**: Implement 7-bag system, SRS wall kicks, and core game state management

### Task 3.1: 7-Bag System - Testing (TDD)
**Objective**: Test piece randomization system

**Checklist:**
- [ ] Create `src/game/pieceBag.test.ts` file
- [ ] Write test for `createPieceBag()` - should contain all 7 pieces exactly once
- [ ] Write test for `createPieceBag()` - should return randomized order
- [ ] Write test for `getNextPiece()` - should return first piece and remaining bag
- [ ] Write test for `getNextPiece()` - should refill bag when empty
- [ ] Write test for bag distribution - over 1000 bags, each piece appears ~142 times
- [ ] Write test for Fisher-Yates shuffle implementation
- [ ] Write test for edge case: empty bag handling

### Task 3.2: 7-Bag System - Implementation
**Objective**: Implement fair piece distribution system

**Checklist:**
- [ ] Create `src/game/pieceBag.ts` file
- [ ] Implement `createPieceBag()` with Fisher-Yates shuffle algorithm
- [ ] Implement `getNextPiece()` function with automatic bag refill
- [ ] Implement `setBagForTesting()` function for deterministic tests
- [ ] Implement `getBagContents()` helper function
- [ ] Add proper TypeScript types for all functions
- [ ] Run piece bag tests to verify randomization works
- [ ] Test bag refill logic manually

### Task 3.3: SRS Wall Kicks - Testing (TDD)
**Objective**: Test complete Super Rotation System

**Checklist:**
- [ ] Create `src/game/wallKick.test.ts` file
- [ ] Write test for standard piece wall kick data (J, L, T, S, Z)
- [ ] Write test for I-piece specific wall kick data
- [ ] Write test for `tryRotateWithWallKick()` - successful rotation
- [ ] Write test for `tryRotateWithWallKick()` - rotation with wall kick offset
- [ ] Write test for `tryRotateWithWallKick()` - impossible rotation returns null
- [ ] Write test for all 8 rotation transitions (0→1, 1→2, 2→3, 3→0, and reverse)
- [ ] Write test for O-piece (should not rotate)

### Task 3.4: SRS Wall Kicks - Implementation  
**Objective**: Implement complete wall kick system

**Checklist:**
- [ ] Create `src/game/wallKick.ts` file
- [ ] Define complete `WALL_KICK_DATA` for standard pieces (all 8 transitions)
- [ ] Define complete `WALL_KICK_DATA_I` for I-piece (all 8 transitions)
- [ ] Implement `getWallKickData()` function
- [ ] Implement `tryRotateWithWallKick()` function
- [ ] Handle O-piece special case (no rotation)
- [ ] Add comprehensive comments explaining SRS system
- [ ] Run wall kick tests to verify all rotations work

### Task 3.5: Core Game State - Testing (TDD)
**Objective**: Test fundamental game state management

**Checklist:**
- [ ] Create `src/game/game.test.ts` file
- [ ] Write test for `createInitialGameState()` - correct initial values
- [ ] Write test for `moveTetrominoBy()` - valid movement
- [ ] Write test for `moveTetrominoBy()` - blocked movement returns original state
- [ ] Write test for `moveTetrominoBy()` - downward movement triggers piece lock
- [ ] Write test for `rotateTetrominoCW()` - successful rotation
- [ ] Write test for `rotateTetrominoCW()` - rotation with wall kick
- [ ] Write test for `rotateTetrominoCW()` - blocked rotation returns original state
- [ ] Write test for `hardDropTetromino()` - piece drops to lowest position

### Task 3.6: Game State Management - Implementation
**Objective**: Implement core game state functions

**Checklist:**
- [ ] Create `src/game/game.ts` file
- [ ] Implement `createInitialGameState()` with piece bag initialization
- [ ] Implement `moveTetrominoBy()` with collision detection
- [ ] Implement `rotateTetrominoCW()` with SRS wall kick integration
- [ ] Implement `hardDropTetromino()` with ghost position calculation
- [ ] Implement `lockCurrentTetromino()` function
- [ ] Add ghost position calculation helper
- [ ] Ensure all state updates are immutable

### Task 3.7: Line Clearing & Scoring - Testing (TDD)
**Objective**: Test line clearing and score calculation

**Checklist:**
- [ ] Write test for line clearing detection (1, 2, 3, 4 lines)
- [ ] Write test for `calculateScore()` - base scores with level multiplier
- [ ] Write test for `clearLines()` - removes filled lines and shifts down
- [ ] Write test for `clearLines()` - handles multiple simultaneous line clears
- [ ] Write test for scoring progression (100, 300, 500, 800 base scores)
- [ ] Write test for level calculation based on total lines cleared
- [ ] Write test for fall speed calculation based on level

### Task 3.8: Scoring System - Implementation
**Objective**: Implement scoring and level progression

**Checklist:**
- [ ] Implement `calculateScore()` function with base scores and level multiplier
- [ ] Implement `calculateLevel()` function (10 lines per level)
- [ ] Implement `calculateFallSpeed()` function with speed progression
- [ ] Implement complete line clearing logic in `clearLines()`
- [ ] Add scoring constants to game constants file
- [ ] Run scoring tests to verify calculations

### Task 3.9: Game Over & Hold System - Testing (TDD)
**Objective**: Test game over conditions and hold mechanics

**Checklist:**
- [ ] Write test for `isGameOver()` - spawn collision detection
- [ ] Write test for hold system - first hold action
- [ ] Write test for hold system - subsequent hold (swap) action
- [ ] Write test for hold system - canHold flag behavior
- [ ] Write test for hold system - cannot hold when canHold is false
- [ ] Write test for game over condition with various scenarios

### Task 3.10: Game Over & Hold - Implementation
**Objective**: Implement game over detection and hold system

**Checklist:**
- [ ] Implement `isGameOver()` function with spawn collision check
- [ ] Implement `holdCurrentPiece()` function with swap logic
- [ ] Implement hold state management (canHold flag)
- [ ] Add game over condition to game state updates
- [ ] Add hold piece validation and constraints
- [ ] Run game over and hold tests

### Task 3.11: Lock Delay System - Testing (TDD)
**Objective**: Test lock delay mechanics with move/rotation limits

**Checklist:**
- [ ] Write test for lock delay timer initialization
- [ ] Write test for lock delay reset on movement/rotation
- [ ] Write test for lock delay expiration and piece lock
- [ ] Write test for lock delay with different game speeds
- [ ] Write test for move/rotation count tracking during lock delay
- [ ] Write test for forced lock when max moves/rotations reached (15)
- [ ] Write test for reset count clearing when new piece spawns

### Task 3.12: Lock Delay - Implementation
**Objective**: Implement lock delay system with infinity prevention

**Checklist:**
- [ ] Implement lock delay timer logic
- [ ] Add lock delay constants (500ms default, 15 max resets)
- [ ] Implement move/rotation counting during lock delay
- [ ] Add forced lock logic when max resets reached
- [ ] Integrate lock delay with game state updates
- [ ] Add timer reset logic for movement/rotation with count increment
- [ ] Reset move/rotation count when new piece spawns
- [ ] Run lock delay tests with infinity prevention

### Task 3.13: Phase 3 Validation & Commit
**Objective**: Validate advanced game mechanics

**Checklist:**
- [ ] Run all tests: `bun test`
- [ ] Verify piece randomization works correctly
- [ ] Test wall kick functionality for all pieces
- [ ] Verify line clearing calculates scores properly
- [ ] Test level progression and fall speed changes
- [ ] Test game over conditions manually
- [ ] Test hold system functionality
- [ ] Verify all game state updates are immutable
- [ ] Run type checking and linting
- [ ] Commit with message: "feat(game): implement 7-bag system, SRS wall kicks, and core game mechanics with full test coverage"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 3 Validation Criteria:**
- [ ] Piece randomization follows 7-bag system correctly
- [ ] Wall kicks function for all rotation scenarios
- [ ] Line clearing calculates scores properly
- [ ] Game state updates are immutable
- [ ] Level progression affects fall speed correctly

---

## Phase 4: State Management & i18n Integration
**Duration**: Day 4  
**Goal**: Implement Zustand stores and complete internationalization

### Task 4.1: Game Store - Testing (TDD)
**Objective**: Test game state management with Zustand

**Checklist:**
- [ ] Create `src/store/gameStore.test.ts` file
- [ ] Write test for initial game state creation
- [ ] Write test for `moveLeft()` action
- [ ] Write test for `moveRight()` action
- [ ] Write test for `moveDown()` action
- [ ] Write test for `rotate()` action
- [ ] Write test for `drop()` action (hard drop)
- [ ] Write test for `holdPiece()` action
- [ ] Write test for `togglePause()` action
- [ ] Write test for `resetGame()` action
- [ ] Write test for state immutability in all actions

### Task 4.2: Game Store - Implementation
**Objective**: Create Zustand game store with all actions

**Checklist:**
- [ ] Create `src/store/gameStore.ts` file
- [ ] Set up Zustand store with devtools middleware
- [ ] Implement initial state using `createInitialGameState()`
- [ ] Implement `moveLeft()` action calling `moveTetrominoBy()`
- [ ] Implement `moveRight()` action calling `moveTetrominoBy()`
- [ ] Implement `moveDown()` action calling `moveTetrominoBy()`
- [ ] Implement `rotate()` action calling `rotateTetrominoCW()`
- [ ] Implement `drop()` action calling `hardDropTetromino()`
- [ ] Implement `holdPiece()` action calling `holdCurrentPiece()`
- [ ] Implement `togglePause()` and `resetGame()` actions
- [ ] Add `clearAnimationData()` action for UI state cleanup

### Task 4.3: Settings Store - Testing (TDD)
**Objective**: Test settings persistence and language management

**Checklist:**
- [ ] Create `src/store/settingsStore.test.ts` file
- [ ] Write test for default settings initialization
- [ ] Write test for `setLanguage()` action
- [ ] Write test for `toggleGhostPiece()` action
- [ ] Write test for localStorage persistence
- [ ] Write test for settings loading from localStorage
- [ ] Write test for invalid settings handling
- [ ] Mock localStorage for testing environment

### Task 4.4: Settings Store - Implementation
**Objective**: Create settings store with persistence

**Checklist:**
- [ ] Create `src/store/settingsStore.ts` file
- [ ] Set up Zustand store with persist middleware
- [ ] Define settings interface (language, ghostPiece, etc.)
- [ ] Implement `setLanguage()` action with i18n integration
- [ ] Implement `toggleGhostPiece()` action
- [ ] Configure localStorage persistence with 'tetris-settings' key
- [ ] Add settings validation for loaded data
- [ ] Integrate with i18n language switching

### Task 4.5: High Score Store - Testing (TDD)
**Objective**: Test high score calculation and persistence

**Checklist:**
- [ ] Create `src/store/highScoreStore.test.ts` file
- [ ] Write test for empty high scores list initialization
- [ ] Write test for `addHighScore()` action
- [ ] Write test for high score sorting (highest first)
- [ ] Write test for high score list limitation (top 10)
- [ ] Write test for high score persistence
- [ ] Write test for duplicate score handling
- [ ] Write test for high score date formatting

### Task 4.6: High Score Store - Implementation
**Objective**: Create high score management system

**Checklist:**
- [ ] Create `src/store/highScoreStore.ts` file
- [ ] Define `HighScoreEntry` interface
- [ ] Set up Zustand store with persist middleware
- [ ] Implement `addHighScore()` action with sorting
- [ ] Implement high score list management (max 10 entries)
- [ ] Add automatic date stamping for scores
- [ ] Configure localStorage persistence with 'tetris-highscores' key
- [ ] Add high score formatting utilities

### Task 4.7: Translation Expansion
**Objective**: Complete all game text translations

**Checklist:**
- [ ] Expand `src/locales/en.json` with all game text
- [ ] Add game UI translations (score, level, lines, etc.)
- [ ] Add control instructions translations
- [ ] Add settings menu translations
- [ ] Add game state translations (paused, game over, etc.)
- [ ] Expand `src/locales/ja.json` with Japanese equivalents
- [ ] Verify translation key consistency between files
- [ ] Add validation for missing translation keys

### Task 4.8: i18n Integration Testing
**Objective**: Ensure complete i18n functionality

**Checklist:**
- [ ] Test language switching affects all UI text
- [ ] Test settings persistence across browser sessions
- [ ] Test translation loading in both languages
- [ ] Test fallback behavior for missing keys
- [ ] Verify no hardcoded strings remain in code
- [ ] Test responsive language detection
- [ ] Document translation key naming conventions

### Task 4.9: Store Integration Testing
**Objective**: Test store interactions and dependencies

**Checklist:**
- [ ] Test game store actions update state correctly
- [ ] Test settings store changes persist correctly
- [ ] Test high score store maintains proper sorting
- [ ] Test store subscription and state change notifications
- [ ] Test store performance with rapid state updates
- [ ] Verify store devtools integration works

### Task 4.10: Phase 4 Validation & Commit
**Objective**: Validate state management and i18n completion

**Checklist:**
- [ ] Run all tests: `bun test`
- [ ] Test all store operations manually
- [ ] Verify settings persist across browser sessions
- [ ] Test language switching across all UI elements
- [ ] Verify high score calculations and persistence
- [ ] Confirm no hardcoded strings remain
- [ ] Test state immutability in all stores
- [ ] Run type checking and linting
- [ ] Commit with message: "feat(store): implement Zustand stores with persistence and complete i18n integration"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 4 Validation Criteria:**
- [ ] All stores work with proper immutability
- [ ] Settings persist across browser sessions
- [ ] Language switching works throughout app
- [ ] No hardcoded strings remain in codebase
- [ ] High score system functions correctly

---

## Phase 5: Core UI Components
**Duration**: Day 5  
**Goal**: Implement React components for game board, pieces, and scoring

### Task 5.1: Board Component Implementation
**Objective**: Create main game board with responsive grid

**Checklist:**
- [ ] Create `src/components/game/Board.tsx` file
- [ ] Implement 20x10 grid layout using CSS Grid or Flexbox
- [ ] Add responsive sizing for different screen sizes
- [ ] Implement proper semantic HTML structure
- [ ] Add ARIA labels for accessibility
- [ ] Connect to game store for board state
- [ ] Add proper TypeScript props interface
- [ ] Test board rendering on desktop and mobile

### Task 5.2: BoardCell Component
**Objective**: Create individual cell component with GPU-optimized animations

**Checklist:**
- [ ] Create `src/components/game/BoardCell.tsx` file
- [ ] Implement cell rendering with proper colors for all 7 tetromino types
- [ ] Add ghost piece rendering with transparency effect
- [ ] Add Framer Motion animations for piece placement
- [ ] Prioritize `transform` and `opacity` properties for GPU acceleration
- [ ] Add line clear animations with flash effects using GPU-optimized properties
- [ ] Implement cell state management (empty, filled, ghost, clearing)
- [ ] Add proper CSS classes for styling with `will-change` hints
- [ ] Connect to animation trigger system
- [ ] Test animations perform smoothly at 60fps on mobile devices

### Task 5.3: TetrominoGrid Component
**Objective**: Create reusable component for piece preview

**Checklist:**
- [ ] Create `src/components/game/TetrominoGrid.tsx` file
- [ ] Implement configurable grid size (3x3 or 4x4)
- [ ] Add piece shape rendering with proper colors
- [ ] Implement center-alignment for pieces
- [ ] Add responsive sizing for different contexts
- [ ] Support empty/placeholder state
- [ ] Add proper TypeScript interface for props
- [ ] Test with all 7 piece types

### Task 5.4: NextPiece Component
**Objective**: Show upcoming piece preview

**Checklist:**
- [ ] Create `src/components/game/NextPiece.tsx` file
- [ ] Use TetrominoGrid for piece display
- [ ] Connect to game store for next piece data
- [ ] Add i18n support for "Next" label
- [ ] Implement proper styling and layout
- [ ] Add responsive behavior for mobile
- [ ] Test piece preview updates correctly

### Task 5.5: HoldPiece Component
**Objective**: Show held piece and availability

**Checklist:**
- [ ] Create `src/components/game/HoldPiece.tsx` file
- [ ] Use TetrominoGrid for piece display
- [ ] Connect to game store for held piece data
- [ ] Show availability state (can/cannot hold)
- [ ] Add i18n support for "Hold" label
- [ ] Implement visual feedback for hold availability
- [ ] Add proper styling for different states
- [ ] Test hold functionality integration

### Task 5.6: Score Calculation Utilities - Testing (TDD)
**Objective**: Test UI-related scoring calculations

**Checklist:**
- [ ] Create tests for score formatting functions
- [ ] Write test for number formatting with commas
- [ ] Write test for level display formatting
- [ ] Write test for lines count formatting
- [ ] Write test for high score ranking calculations
- [ ] Test score animation value calculations

### Task 5.7: ScoreBoard Component
**Objective**: Display current game statistics with animations

**Checklist:**
- [ ] Create `src/components/game/ScoreBoard.tsx` file
- [ ] Connect to game store for score, level, lines data
- [ ] Add Framer Motion animations for score changes
- [ ] Implement proper number formatting
- [ ] Add i18n support for all labels
- [ ] Create responsive layout for mobile
- [ ] Add proper semantic structure
- [ ] Test score animations and updates

### Task 5.8: High Score Utilities - Testing (TDD)
**Objective**: Test high score formatting and display logic

**Checklist:**
- [ ] Write tests for high score sorting functions
- [ ] Write test for date formatting utilities
- [ ] Write test for rank calculation functions
- [ ] Write test for score comparison logic
- [ ] Test high score list truncation (top 10)

### Task 5.9: HighScore Components
**Objective**: Create high score display system

**Checklist:**
- [ ] Create `src/components/game/HighScore.tsx` file
- [ ] Create `src/components/game/HighScoreList.tsx` file
- [ ] Create `src/components/game/HighScoreItem.tsx` file
- [ ] Connect to high score store
- [ ] Implement ranking display (1st, 2nd, 3rd, etc.)
- [ ] Add date formatting for score entries
- [ ] Add i18n support for all text
- [ ] Implement "no scores" placeholder state
- [ ] Add proper accessibility features

### Task 5.10: UI Utility Functions - Testing (TDD)
**Objective**: Test UI calculation and helper functions

**Checklist:**
- [ ] Create `src/utils/uiUtils.test.ts` file
- [ ] Write tests for color mapping functions
- [ ] Write tests for grid size calculations
- [ ] Write tests for responsive breakpoint utilities
- [ ] Write tests for animation timing calculations
- [ ] Test CSS class generation utilities

### Task 5.11: UI Utilities - Implementation
**Objective**: Implement utility functions for UI calculations

**Checklist:**
- [ ] Create `src/utils/uiUtils.ts` file
- [ ] Implement color mapping for tetromino pieces
- [ ] Add grid calculation utilities
- [ ] Implement responsive sizing helpers
- [ ] Add animation timing utilities
- [ ] Create CSS class name helpers
- [ ] Add proper TypeScript types

### Task 5.12: Component Testing with MCP Playwright (Optional)
**Objective**: Validate UI components visually

**Checklist:**
- [ ] Set up development server: `bun run dev`
- [ ] Use MCP Playwright to navigate to application
- [ ] Take screenshots of board component
- [ ] Test responsive behavior with browser resize
- [ ] Validate piece preview displays correctly
- [ ] Test score animations manually
- [ ] Verify all components render properly

### Task 5.13: Phase 5 Validation & Commit
**Objective**: Ensure all UI components work correctly

**Checklist:**
- [ ] Run all tests: `bun test`
- [ ] Test all UI utility functions
- [ ] Verify board renders correctly on all screen sizes
- [ ] Test piece previews display accurate shapes and colors
- [ ] Verify scores animate smoothly
- [ ] Confirm all text uses i18n translations
- [ ] Test component responsiveness manually
- [ ] Run type checking and linting
- [ ] Commit with message: "feat(ui): implement core game UI components with animations and responsive design"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 5 Validation Criteria:**
- [ ] Board renders correctly on all screen sizes
- [ ] Piece previews display accurate shapes and colors
- [ ] Scores animate smoothly with proper formatting
- [ ] All text uses i18n translations consistently
- [ ] Components are accessible and semantic

---

## Phase 6: Game Loop & Controls
**Duration**: Day 6  
**Goal**: Implement game loop, input handling, and control systems

### Task 6.1: Timing Utilities - Testing (TDD)
**Objective**: Test timing and interval calculation functions

**Checklist:**
- [ ] Create tests for fall speed calculation based on level
- [ ] Write test for timing interval validation
- [ ] Write test for action cooldown calculation
- [ ] Write test for frame rate limiting utilities
- [ ] Test timing consistency across different speeds

### Task 6.2: Game Loop Implementation
**Objective**: Create main game loop with optimal browser-synced timing

**Checklist:**
- [ ] Create `src/hooks/core/useGameLoop.ts` file
- [ ] Implement game loop with `requestAnimationFrame` for smooth 60fps
- [ ] Add timestamp-based delta timing for consistent gameplay speed
- [ ] Connect to game store for state updates
- [ ] Add automatic piece falling based on level speed using accumulated time
- [ ] Implement lock delay system with movement/rotation reset counting
- [ ] Add DAS (Delayed Auto Shift) for smooth key repeat behavior
- [ ] Implement pause/resume functionality
- [ ] Add game over condition handling
- [ ] Ensure consistent timing independent of frame rate
- [ ] Add proper cleanup on component unmount with `cancelAnimationFrame`
- [ ] Test performance on lower-end devices

### Task 6.3: Action Cooldown Utilities - Testing (TDD)
**Objective**: Test input rate limiting and debouncing

**Checklist:**
- [ ] Create tests for action cooldown timing
- [ ] Write test for input debouncing logic
- [ ] Write test for rapid input filtering
- [ ] Write test for cooldown reset functionality
- [ ] Test different cooldown periods for different actions

### Task 6.4: Action Cooldown Implementation
**Objective**: Implement input rate limiting system

**Checklist:**
- [ ] Create `src/hooks/controls/useActionCooldown.ts` file
- [ ] Implement cooldown timers for different actions
- [ ] Add debouncing for rapid inputs
- [ ] Configure different cooldown periods (movement vs rotation)
- [ ] Add cooldown state management
- [ ] Integrate with game actions

### Task 6.5: Keyboard Controls Implementation
**Objective**: Create keyboard input handling system

**Checklist:**
- [ ] Create `src/hooks/controls/useKeyboardControls.ts` file
- [ ] Implement keyboard event listeners
- [ ] Map keyboard inputs to game actions:
  - [ ] Arrow Left/Right: Move piece left/right
  - [ ] Arrow Down: Soft drop
  - [ ] Space: Hard drop
  - [ ] Arrow Up/X: Rotate clockwise
  - [ ] Z: Rotate counter-clockwise
  - [ ] C: Hold piece
  - [ ] P/Esc: Pause/Resume
  - [ ] R: Reset game (when game over)
  - [ ] Enter: Start game / Confirm actions
- [ ] Implement DAS (Delayed Auto Shift) for left/right movement
- [ ] Add proper event cleanup
- [ ] Integrate with action cooldown system

### Task 6.6: Touch Gesture Implementation
**Objective**: Create touch input system for mobile

**Checklist:**
- [ ] Create `src/hooks/controls/useTouchGestures.ts` file
- [ ] Implement touch event detection
- [ ] Add swipe gesture recognition:
  - [ ] Swipe left: Move piece left
  - [ ] Swipe right: Move piece right
  - [ ] Swipe down: Soft drop
  - [ ] Long swipe down: Hard drop
- [ ] Add tap gesture recognition:
  - [ ] Single tap: Rotate piece
  - [ ] Double tap: Hold piece
- [ ] Configure gesture thresholds (distance, time)
- [ ] Add proper touch event cleanup

### Task 6.7: Input Debouncing - Testing (TDD)
**Objective**: Test input processing and filtering

**Checklist:**
- [ ] Create tests for input debouncing utilities
- [ ] Write test for rapid input filtering
- [ ] Write test for gesture recognition accuracy
- [ ] Write test for keyboard input processing
- [ ] Test input priority handling (keyboard vs touch)

### Task 6.8: Game State Integration - Testing (TDD)
**Objective**: Test complete game state transitions

**Checklist:**
- [ ] Write integration tests for piece movement
- [ ] Write test for piece rotation with wall kicks
- [ ] Write test for line clearing sequence
- [ ] Write test for level progression
- [ ] Write test for game over condition
- [ ] Write test for pause/resume functionality
- [ ] Write test for hold system integration
- [ ] Test complete game session simulation

### Task 6.9: Game Logic Integration
**Objective**: Ensure all game systems work together

**Checklist:**
- [ ] Test piece placement and lock timing
- [ ] Verify line clearing triggers properly
- [ ] Test score updates and level progression
- [ ] Verify pause/resume state management
- [ ] Test game over condition detection
- [ ] Ensure ghost piece updates correctly
- [ ] Test hold system with cooldowns
- [ ] Verify all animations trigger properly

### Task 6.10: Performance Optimization
**Objective**: Ensure smooth gameplay performance

**Checklist:**
- [ ] Profile game loop performance
- [ ] Optimize state update frequency
- [ ] Minimize unnecessary re-renders
- [ ] Test performance on mobile devices
- [ ] Ensure consistent 60fps gameplay
- [ ] Optimize animation performance
- [ ] Test memory usage over time

### Task 6.11: Phase 6 Validation & Commit
**Objective**: Validate game loop and controls functionality

**Checklist:**
- [ ] Run all tests: `bun test`
- [ ] Test game runs at consistent 60fps
- [ ] Verify all keyboard controls respond correctly
- [ ] Test touch gestures work on mobile (or simulate)
- [ ] Test pause/resume functionality
- [ ] Verify game over conditions work
- [ ] Test hold system with all controls
- [ ] Verify level progression affects timing
- [ ] Run type checking and linting
- [ ] Commit with message: "feat(controls): implement game loop, keyboard/touch controls with comprehensive integration tests"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 6 Validation Criteria:**
- [ ] Game runs at consistent 60fps
- [ ] All controls respond correctly with appropriate cooldowns
- [ ] Touch gestures work on mobile devices
- [ ] Game state updates properly through all interactions
- [ ] Pause/resume and game over conditions function correctly

---

## Phase 7: Layout & Polish
**Duration**: Day 7  
**Goal**: Complete responsive layouts, animations, and accessibility features

### Task 7.1: Responsive Game Layout
**Objective**: Create adaptive layouts for desktop and mobile

**Checklist:**
- [ ] Create `src/components/layout/Game.tsx` file
- [ ] Implement desktop layout with sidebar
- [ ] Create mobile-optimized layout
- [ ] Add responsive breakpoints and media queries
- [ ] Test layout adaptation at different screen sizes
- [ ] Ensure proper component spacing and alignment
- [ ] Add proper semantic HTML structure

### Task 7.2: Mobile Game Layout
**Objective**: Optimize interface for mobile devices

**Checklist:**
- [ ] Create `src/components/layout/MobileGameLayout.tsx` file
- [ ] Implement touch-friendly component sizing
- [ ] Optimize board size for mobile screens
- [ ] Create mobile header with essential information
- [ ] Add mobile-specific navigation
- [ ] Test on various mobile screen sizes
- [ ] Ensure touch targets meet accessibility guidelines

### Task 7.3: Settings Dropdown
**Objective**: Create settings interface with i18n

**Checklist:**
- [ ] Create `src/components/layout/GameSettings.tsx` file
- [ ] Implement dropdown/modal for settings
- [ ] Add language switching interface
- [ ] Add ghost piece toggle
- [ ] Connect to settings store
- [ ] Add proper i18n for all settings text
- [ ] Implement proper focus management
- [ ] Test settings persistence

### Task 7.4: Game Overlays
**Objective**: Create pause and game over overlays

**Checklist:**
- [ ] Create `src/components/game/GameOverlay.tsx` file
- [ ] Implement pause overlay with resume instructions
- [ ] Implement game over overlay with score display
- [ ] Add new game functionality
- [ ] Connect to game store state
- [ ] Add proper i18n for all overlay text
- [ ] Implement proper focus management
- [ ] Test overlay transitions

### Task 7.5: Line Clear Animations
**Objective**: Add satisfying line clear effects

**Checklist:**
- [ ] Implement line flash animation with Framer Motion
- [ ] Add line clear sequence timing
- [ ] Create smooth line removal animation
- [ ] Add visual feedback for multiple line clears
- [ ] Optimize animation performance
- [ ] Test animations at different game speeds
- [ ] Ensure animations don't block gameplay

### Task 7.6: Piece Placement Effects
**Objective**: Add visual feedback for piece placement

**Checklist:**
- [ ] Implement piece lock animation
- [ ] Add visual feedback for successful placement
- [ ] Create smooth piece drop animations
- [ ] Add rotation animation effects
- [ ] Optimize for performance
- [ ] Test effects with all piece types

### Task 7.7: Score Change Animations
**Objective**: Create engaging score feedback

**Checklist:**
- [ ] Implement score increase animations
- [ ] Add level up visual effects
- [ ] Create line count change animations
- [ ] Add color changes for different scoring events
- [ ] Use spring physics for natural motion
- [ ] Test animations with rapid scoring

### Task 7.8: Smooth Transitions
**Objective**: Polish all UI transitions

**Checklist:**
- [ ] Add page transition animations
- [ ] Implement smooth modal/overlay transitions
- [ ] Add hover states for interactive elements
- [ ] Create loading state transitions
- [ ] Ensure consistent transition timing
- [ ] Test transitions on mobile devices

### Task 7.9: Accessibility Implementation
**Objective**: Ensure application is accessible to all users

**Checklist:**
- [ ] Add proper ARIA labels for all interactive elements
- [ ] Implement keyboard navigation for all UI
- [ ] Add focus management for modals and overlays
- [ ] Ensure proper heading structure
- [ ] Add alt text for visual elements
- [ ] Test with screen reader software
- [ ] Verify color contrast meets accessibility standards
- [ ] Add skip navigation links

### Task 7.10: Keyboard Navigation
**Objective**: Enable full keyboard accessibility

**Checklist:**
- [ ] Implement tab navigation through all UI elements
- [ ] Add proper focus indicators
- [ ] Enable keyboard activation for all buttons
- [ ] Add escape key handling for modals
- [ ] Implement proper focus trapping
- [ ] Test navigation with keyboard only

### Task 7.11: Focus Management
**Objective**: Provide clear focus indication and management

**Checklist:**
- [ ] Add visible focus indicators for all interactive elements
- [ ] Implement focus trapping in modals
- [ ] Restore focus after modal closure
- [ ] Add skip navigation functionality
- [ ] Test focus management with assistive technologies

### Task 7.12: Screen Reader Compatibility
**Objective**: Ensure compatibility with screen readers

**Checklist:**
- [ ] Test with professional screen readers (NVDA or JAWS)
- [ ] Test with OS built-in screen readers (macOS VoiceOver, Windows Narrator)
- [ ] Add proper ARIA live regions for game state updates
- [ ] Implement descriptive text for game board state
- [ ] Add audio cues for important game events
- [ ] Test all interactive elements are properly announced
- [ ] Verify all text is readable by screen readers
- [ ] Test navigation with both professional and built-in screen readers

### Task 7.13: Phase 7 Validation & Commit
**Objective**: Validate layout, animations, and accessibility

**Checklist:**
- [ ] Test responsive layout on multiple screen sizes
- [ ] Verify all animations play smoothly
- [ ] Test accessibility with keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Test settings functionality
- [ ] Verify game overlays work correctly
- [ ] Test mobile layout on touch devices
- [ ] Run type checking and linting
- [ ] Commit with message: "feat(ui): complete responsive layouts, animations, and accessibility features"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 7 Validation Criteria:**
- [ ] Layout adapts properly to all screen sizes
- [ ] All animations enhance user experience without hindering gameplay
- [ ] Application is fully accessible via keyboard and screen readers
- [ ] Mobile interface is optimized for touch interaction
- [ ] Settings and overlays function correctly

---

## Phase 8: Comprehensive Testing & E2E
**Duration**: Day 8  
**Goal**: Achieve comprehensive test coverage and end-to-end validation

### Task 8.1: Pure Function Test Coverage Expansion
**Objective**: Achieve >90% test coverage on all pure functions

**Checklist:**
- [ ] Run test coverage analysis: `bun test --coverage`
- [ ] Identify untested pure functions
- [ ] Add tests for edge cases in board operations
- [ ] Add tests for boundary conditions in game logic
- [ ] Test error handling in all pure functions
- [ ] Add tests for performance-critical calculations
- [ ] Verify all tetromino operations are tested
- [ ] Test all scoring and level progression functions

### Task 8.2: Edge Case Testing
**Objective**: Test all possible game scenarios and edge cases

**Checklist:**
- [ ] Test game behavior at maximum level
- [ ] Test simultaneous 4-line clear (Tetris)
- [ ] Test board full scenarios
- [ ] Test rapid input sequences
- [ ] Test piece rotation at board boundaries
- [ ] Test hold system edge cases
- [ ] Test game state with invalid inputs
- [ ] Test persistence with corrupted data

### Task 8.3: Error Handling Testing
**Objective**: Ensure robust error handling in pure functions

**Checklist:**
- [ ] Test invalid board dimensions
- [ ] Test malformed piece data
- [ ] Test invalid rotation states
- [ ] Test out-of-bounds position validation
- [ ] Test localStorage failure scenarios
- [ ] Test i18n loading failures
- [ ] Add error boundary testing
- [ ] Test graceful degradation

### Task 8.4: Performance Testing
**Objective**: Validate performance of critical calculations

**Checklist:**
- [ ] Benchmark board validation functions
- [ ] Test game loop performance under load
- [ ] Measure animation performance
- [ ] Test memory usage over extended gameplay
- [ ] Benchmark large high score lists
- [ ] Test rapid state updates
- [ ] Profile critical path functions

### Task 8.5: End-to-End Testing Setup
**Objective**: Set up comprehensive browser testing

**Checklist:**
- [ ] Install Playwright for E2E testing: `bun add -D @playwright/test`
- [ ] Configure Playwright test environment
- [ ] Create basic E2E test structure
- [ ] Set up test data and fixtures
- [ ] Configure test browser options
- [ ] Add test scripts to package.json
- [ ] Create test utilities and helpers

### Task 8.6: Complete Game Session Testing
**Objective**: Test full gameplay scenarios via browser automation

**Checklist:**
- [ ] Create test for complete game session (start to game over)
- [ ] Test piece movement and rotation
- [ ] Test line clearing functionality
- [ ] Test level progression during gameplay
- [ ] Test pause and resume functionality
- [ ] Test hold system during gameplay
- [ ] Test high score entry and persistence
- [ ] Test settings changes during gameplay

### Task 8.7: Mobile Touch Interaction Testing
**Objective**: Validate touch controls and mobile responsiveness

**Checklist:**
- [ ] Test swipe gestures for piece movement
- [ ] Test tap gestures for rotation
- [ ] Test double-tap for hold functionality
- [ ] Test mobile layout responsiveness
- [ ] Test touch target sizes and accuracy
- [ ] Test mobile keyboard interactions
- [ ] Validate mobile game performance

### Task 8.8: Language Switching Workflows
**Objective**: Test complete internationalization functionality

**Checklist:**
- [ ] Test language switching from settings
- [ ] Verify all UI text updates immediately
- [ ] Test language persistence across sessions
- [ ] Test right-to-left language support (if applicable)
- [ ] Verify translation completeness
- [ ] Test dynamic content translation
- [ ] Test language switching during gameplay

### Task 8.9: Cross-Browser Testing
**Objective**: Ensure compatibility across different browsers

**Checklist:**
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge
- [ ] Verify CSS compatibility
- [ ] Test JavaScript feature support
- [ ] Validate performance across browsers

### Task 8.10: MCP Playwright Validation (Optional)
**Objective**: Use MCP tools for visual validation

**Checklist:**
- [ ] Start development server: `bun run dev`
- [ ] Use MCP Playwright to navigate to application
- [ ] Take screenshots for visual regression testing
- [ ] Test responsive behavior with browser resize
- [ ] Validate animations and transitions
- [ ] Test user interaction flows
- [ ] Capture performance metrics

### Task 8.11: Accessibility Testing
**Objective**: Comprehensive accessibility validation

**Checklist:**
- [ ] Run automated accessibility tests
- [ ] Test with actual screen reader software
- [ ] Verify keyboard navigation completeness
- [ ] Test color contrast ratios
- [ ] Validate ARIA label correctness
- [ ] Test focus management
- [ ] Verify semantic HTML structure

### Task 8.12: Phase 8 Validation & Commit
**Objective**: Validate comprehensive testing completion

**Checklist:**
- [ ] Run all unit tests: `bun test`
- [ ] Run E2E tests: `bun run test:e2e`
- [ ] Verify >90% test coverage on pure functions
- [ ] Confirm all edge cases are tested
- [ ] Validate error handling works correctly
- [ ] Test performance meets requirements
- [ ] Verify cross-browser compatibility
- [ ] Confirm accessibility compliance
- [ ] Run type checking and linting
- [ ] Commit with message: "test: achieve comprehensive test coverage with E2E testing setup"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes

**Phase 8 Validation Criteria:**
- [ ] >90% test coverage achieved on all pure functions
- [ ] All edge cases and error conditions tested
- [ ] E2E tests cover complete user workflows
- [ ] Cross-browser compatibility verified
- [ ] Accessibility compliance confirmed

---

## Phase 9: Production Ready
**Duration**: Day 9  
**Goal**: Optimize for production, add monitoring, and create deployment-ready build

### Task 9.1: Bundle Analysis and Optimization
**Objective**: Analyze and optimize build output

**Checklist:**
- [ ] Run build with bundle analyzer: `bun run build`
- [ ] Analyze bundle size and composition
- [ ] Identify large dependencies
- [ ] Implement code splitting for routes/features
- [ ] Optimize image assets and static files
- [ ] Remove unused dependencies
- [ ] Configure tree shaking for optimal bundle size
- [ ] Verify production build works correctly

### Task 9.2: Dead Code Elimination
**Objective**: Remove unused code and dependencies

**Checklist:**
- [ ] Run Knip for dead code detection: `bun run knip`
- [ ] Remove unused exports and imports
- [ ] Remove unused TypeScript types
- [ ] Clean up unused CSS classes
- [ ] Remove development-only code
- [ ] Optimize import statements
- [ ] Verify all removed code doesn't break functionality

### Task 9.3: Performance Monitoring Setup
**Objective**: Implement performance tracking and monitoring

**Checklist:**
- [ ] Set up performance measurement utilities
- [ ] Add Core Web Vitals tracking
- [ ] Implement game performance metrics
- [ ] Add frame rate monitoring
- [ ] Set up error tracking for production
- [ ] Configure performance budgets
- [ ] Test performance monitoring in production build

### Task 9.4: Error Tracking Implementation
**Objective**: Implement comprehensive error handling and reporting

**Checklist:**
- [ ] Add global error boundary components
- [ ] Implement error logging system
- [ ] Add error reporting for unhandled exceptions
- [ ] Create user-friendly error messages
- [ ] Add error recovery mechanisms
- [ ] Test error scenarios and recovery
- [ ] Configure error notification system

### Task 9.5: Cross-Browser Testing
**Objective**: Ensure compatibility across all target browsers

**Checklist:**
- [ ] Test in Chrome (latest and previous version)
- [ ] Test in Firefox (latest and previous version)
- [ ] Test in Safari (latest version)
- [ ] Test in Edge (latest version)
- [ ] Test in mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Verify all features work correctly
- [ ] Test performance in each browser
- [ ] Document any browser-specific issues

### Task 9.6: Mobile Device Testing
**Objective**: Validate mobile experience on real devices

**Checklist:**
- [ ] Test on iOS devices (iPhone, iPad)
- [ ] Test on Android devices (various screen sizes)
- [ ] Verify touch controls work correctly
- [ ] Test performance on lower-end devices
- [ ] Validate responsive design behavior
- [ ] Test orientation changes
- [ ] Verify mobile keyboard interactions

### Task 9.7: Performance Benchmarking
**Objective**: Establish performance baselines and validate targets

**Checklist:**
- [ ] Measure initial page load time
- [ ] Benchmark game loop performance (60fps target)
- [ ] Test animation performance
- [ ] Measure memory usage over time
- [ ] Test performance under stress (rapid inputs)
- [ ] Validate performance on mobile devices
- [ ] Document performance metrics

### Task 9.8: Accessibility Audit
**Objective**: Final accessibility compliance verification

**Checklist:**
- [ ] Run automated accessibility testing tools
- [ ] Perform manual accessibility testing
- [ ] Test with screen reader software
- [ ] Verify keyboard navigation completeness
- [ ] Check color contrast compliance
- [ ] Validate ARIA implementation
- [ ] Test with assistive technologies
- [ ] Document accessibility compliance

### Task 9.9: Documentation Updates
**Objective**: Create comprehensive project documentation

**Checklist:**
- [ ] Update README with complete setup instructions
- [ ] Document all available scripts and commands
- [ ] Create user guide for game controls
- [ ] Document development workflow
- [ ] Add troubleshooting guide
- [ ] Document deployment process
- [ ] Create API documentation for stores and utilities
- [ ] Add contributing guidelines

### Task 9.10: Component Interface Documentation
**Objective**: Document all component APIs and interfaces

**Checklist:**
- [ ] Document all component props and interfaces
- [ ] Add JSDoc comments to all public functions
- [ ] Document store interfaces and actions
- [ ] Create type documentation
- [ ] Document utility function APIs
- [ ] Add code examples for key functions
- [ ] Document configuration options

### Task 9.11: Deployment Guide Creation
**Objective**: Create comprehensive deployment documentation

**Checklist:**
- [ ] Document build process and requirements
- [ ] Create deployment guide for Vercel
- [ ] Add environment variable documentation
- [ ] Document CDN and static asset optimization
- [ ] Create production deployment checklist
- [ ] Add monitoring and maintenance guidelines
- [ ] Document rollback procedures

### Task 9.12: Final Production Validation
**Objective**: Comprehensive production readiness check

**Checklist:**
- [ ] Run complete CI pipeline: `bun run ci`
- [ ] Verify production build works correctly
- [ ] Test all functionality in production build
- [ ] Validate performance meets targets
- [ ] Confirm all tests pass
- [ ] Verify bundle size is optimized
- [ ] Test error handling in production
- [ ] Validate security headers and configuration

### Task 9.13: Version Tagging and Release
**Objective**: Create official v1.0.0 release

**Checklist:**
- [ ] Update version in package.json to 1.0.0
- [ ] Run final comprehensive test suite
- [ ] Create production build
- [ ] Commit final changes
- [ ] Create Git tag: `git tag -a v1.0.0 -m "Release version 1.0.0: Complete Tetris game implementation"`
- [ ] Push to GitHub with tags: `git push origin main --tags`
- [ ] Create GitHub release with release notes
- [ ] Attach production build artifacts

### Task 9.14: Phase 9 Validation & Final Commit
**Objective**: Complete production readiness validation

**Checklist:**
- [ ] Verify all production optimizations work
- [ ] Confirm bundle size is acceptable
- [ ] Validate performance meets all targets
- [ ] Test deployment process end-to-end
- [ ] Verify monitoring and error tracking work
- [ ] Confirm documentation is complete
- [ ] Test final production build thoroughly
- [ ] Commit with message: "chore: production optimization, documentation, and final validation"
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify CI pipeline passes
- [ ] Confirm release is successful

**Phase 9 Validation Criteria:**
- [ ] Bundle size optimized and within targets
- [ ] Performance meets or exceeds requirements on all devices
- [ ] Cross-browser compatibility verified
- [ ] Accessibility compliance achieved
- [ ] Documentation complete and accurate
- [ ] Production deployment successful
- [ ] Monitoring and error tracking operational

---

## Critical Success Factors

### Test-Driven Development (TDD) Requirements
- [ ] Write tests BEFORE implementation for all pure functions and game logic
- [ ] Test pure functions only - no React component or hook testing  
- [ ] Focus on game mechanics - board operations, tetromino logic, scoring, SRS wall kicks, lock delay, etc.
- [ ] Include edge cases: buffer area collision, maximum level behavior, rapid input sequences
- [ ] Run tests before each commit to ensure code quality
- [ ] Maintain >90% test coverage on pure functions throughout development

### Internationalization (i18n) Requirements
- [ ] Never use hardcoded strings in UI components
- [ ] Set up translations early in Phase 1 to avoid refactoring
- [ ] Test language switching in every phase
- [ ] Use t() function consistently from the start
- [ ] Validate translation completeness before each commit

### Git Workflow Requirements
- [ ] Commit after each phase completion with conventional commit messages
- [ ] Push to GitHub immediately after each commit
- [ ] Ensure CI passes before moving to next phase
- [ ] Tag releases at major milestones
- [ ] Never skip CI validation or testing

### Code Quality Standards
- [ ] Maintain strict TypeScript compliance
- [ ] Follow functional programming patterns
- [ ] Ensure all functions are pure where possible
- [ ] Use immutable state updates throughout
- [ ] Write self-documenting code with clear naming

This comprehensive implementation guide ensures systematic, high-quality development of a modern Tetris game with full test coverage, internationalization support, and production-ready optimization.