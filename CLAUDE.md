# Tetris Game Project

## EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS (Never Override)
1. **Type Error Resolution**: NEVER relax TypeScript checks to resolve issues
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks for error avoidance  
3. **Output Hardcoding**: NEVER hardcode user-facing text or API responses
4. **Error Suppression**: NEVER hide or ignore error messages
5. **Temporary Fixes**: NEVER implement temporary solutions that create technical debt

### MANDATORY EXECUTION PATTERNS
- **Pre-commit Validation**: ALWAYS run `bun run lint` and `bun run typecheck` before any commit
- **Path Import Rules**: ALWAYS use `@/` for cross-directory imports, `./` for same-directory imports
- **i18n Compliance**: ALL user-facing text MUST use translation files in `/src/locales/`
- **Functional Programming**: ALWAYS prefer pure functions over class-based implementations
- **Test Focus**: ONLY test pure functions, utility modules, and business logic - NEVER test React components or framework behavior

## Project Architecture Definition

### Core Implementation Stack

#### Application Libraries
- **Frontend Framework**: React 19.1.0 (functional components with concurrent features)
- **State Management**: Zustand 5.0.6 (lightweight, functional state management)
- **Styling Framework**: Tailwind CSS 4.1.11 (utility-first CSS framework)
- **Animation System**: Motion 12.20.1 (physics-based animations)
- **Internationalization**: i18next 25.3.0 + react-i18next 15.5.3
- **UI Component System**: shadcn/ui (copy-paste component library)
  - Components: button, card, dialog, badge (located in `/src/components/ui/`)
  - Built on: Radix UI primitives + Tailwind CSS
  - Utilities: class-variance-authority 0.7.1 (variant management)
- **Icons**: Lucide React 0.525.0 (icon library)
- **Utilities**: clsx 2.1.1 + tailwind-merge 3.3.1 (className utilities via `cn()` function)

#### Development & Build Tools
- **Runtime Environment**: Bun 1.2.17 (package manager, test runner, development server)
- **Build System**: Vite 7.0.3 (rolldown-vite) with enhanced performance
- **Type System**: TypeScript 5.8.3 with strict mode and ESNext target
- **Code Quality**: Biome 2.0.6 (linting, formatting, static analysis)
- **Git Hooks**: Lefthook 1.11.14 (pre-commit validation, commit message linting)
- **Testing**: Bun Test with happy-dom 18.0.1 (DOM simulation)
- **E2E Testing**: Playwright 1.53.2 (browser automation)
- **Bundle Analysis**: rollup-plugin-visualizer 6.0.3
- **CSS Processing**: @tailwindcss/vite 4.1.11 plugin

### Directory Structure and Component Organization

```
src/
├── components/     # React UI components (DO NOT TEST)
│   ├── game/      # Game-specific components: Board, BoardCell, Controls, GameOverlay, 
│   │              # HighScore, HoldPiece, NextPiece, ScoreBoard, TetrominoGrid, TouchControls
│   ├── layout/    # Layout components: Game, GameSettings, MobileGameLayout, MobileHeader
│   └── ui/        # Reusable UI components: AnimatedButton, badge, button, card, dialog
├── game/          # Pure game logic (TEST ALL FUNCTIONS)
│   │              # Files: board.ts, game.ts, pieceBag.ts, tetrominos.ts, wallKick.ts
├── hooks/         # Custom React hooks (TEST ONLY EXTRACTED PURE FUNCTIONS)
│   ├── actions/   # Game action hooks: useGameActions
│   ├── common/    # Shared utility hooks: useHapticFeedback, useInputDebounce
│   ├── controls/  # Input handling: useActionCooldown, useGameInputActions, useKeyboardControls,
│   │              # useKeyboardInput, useMovementControls, useRotationControl, useTouchActions
│   ├── core/      # Core game hooks: useGameActionHandler, useGameLoop
│   ├── data/      # Data hooks: useHighScore
│   ├── effects/   # Visual effect hooks: useHighScoreSideEffect
│   ├── selectors/ # State selector hooks: useBoardSelectors, useScoreSelectors
│   └── ui/        # UI-specific hooks: useAnimatedValue, useAnimationCompletionHandler,
│                  # useCellAnimation, useResponsiveBoard
├── store/         # Zustand state management (TEST ALL STORE LOGIC)
│   │              # Files: gameStore.ts, highScoreStore.ts, settingsStore.ts
├── types/         # TypeScript definitions: game.ts, storage.ts
├── utils/         # Shared utilities and constants (TEST ALL FUNCTIONS)
│   │              # Files: animationConstants.ts, boardUtils.ts, colors.ts, debugLanguage.ts,
│   │              # gameConstants.ts, gameValidation.ts, styles.ts, typeGuards.ts
├── locales/       # i18n translation files: en.json, ja.json
├── i18n/          # i18n configuration: config.ts
├── lib/           # Shared utility functions: utils.ts
├── test/          # Test configuration and utilities: setup.ts, __mocks__/
```

### State Management Architecture
**Store Implementation**: Zustand with functional programming patterns

**Store Modules** (Located in `/src/store/`):
1. **GameStore** (`gameStore.ts`): 
   - Centralized game state with immutable updates
   - Contains: board state, current piece, score, level, game status
   - Pattern: Pure functions for all state transitions
2. **SettingsStore** (`settingsStore.ts`):
   - User preferences with localStorage persistence
   - Contains: language, controls, audio settings
3. **HighScoreStore** (`highScoreStore.ts`):
   - Score tracking and leaderboard management
   - Persistent storage with validation

**State Access Pattern**:
- Use memoized selectors from `/src/hooks/selectors/`
- Prefer specific selectors over direct store access
- All state mutations through pure functions

### Core Game Logic Implementation
**Game Mechanics** (Located in `/src/game/`):

1. **Board System** (`board.ts`):
   - Standard 20×10 Tetris grid with collision detection
   - Function signatures for testing: `isValidPosition()`, `placePiece()`, `clearLines()`

2. **Tetromino System** (`tetrominos.ts`):
   - All 7 standard pieces (I, O, T, S, Z, J, L) with matrix-based operations
   - Function signatures for testing: `rotatePiece()`, `getTetrominoData()`

3. **Piece Distribution** (`pieceBag.ts`):
   - 7-Bag randomization for fair piece distribution
   - Function signatures for testing: `generatePieceBag()`, `getNextPiece()`

4. **Rotation System** (`wallKick.ts`):
   - Super Rotation System (SRS) with I-piece handling
   - Function signatures for testing: `performWallKick()`, `getKickData()`

**Game State Management** (`game.ts`):
- Pure functional approach, UI-agnostic logic
- Function signatures for testing: `updateGameState()`, `processGameTick()`

## Development Commands and Execution

### REQUIRED COMMANDS (Execute in this order for development)
```bash
# Development Workflow
bun run dev          # Start development server (http://localhost:5173)
bun test             # Run all tests (MUST pass before commits)
bun run lint         # Code linting (MUST pass before commits)
bun run typecheck    # Type checking (MUST pass before commits)
bun run build        # Production build (MUST succeed before commits)

# Quality Assurance Pipeline
bun run ci           # Complete CI pipeline (lint + typecheck + test + build)
```

### EXECUTION CONDITIONS
- **Before ANY commit**: Run `bun run lint` AND `bun run typecheck`
- **After code changes**: Run `bun test` to verify no regressions
- **Before production deployment**: Run `bun run ci` to ensure all checks pass
- **Git hooks**: Lefthook automatically runs formatting and validation

## TESTING STRATEGY AND IMPLEMENTATION

### TESTING RULES (Strict Enforcement)
1. **TEST TARGETS**: 
   - ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/store/`
   - ✅ Business logic extracted from hooks
   - ❌ React components, DOM interactions, UI behavior
   - ❌ React hooks themselves (only extracted pure functions)
   - ❌ Framework-specific behavior (React, Zustand)

2. **TEST EXECUTION**:
   - Command: `bun test src/ --ignore '**/visual/**'`
   - Environment: Bun Test with happy-dom
   - Pattern: Co-located test files (e.g., `board.test.ts` alongside `board.ts`)

3. **MOCKING STRATEGY**:
   - Use real implementations whenever possible
   - Mock ONLY external dependencies (localStorage, i18n)
   - Available mocks: `/src/test/__mocks__/react-i18next.ts`

### TEST IMPLEMENTATION PRIORITIES
**High Priority** (Must have comprehensive coverage):
- `/src/game/board.ts` - Board collision detection and line clearing
- `/src/game/tetrominos.ts` - Piece rotation and positioning
- `/src/game/pieceBag.ts` - 7-bag randomization algorithm
- `/src/game/wallKick.ts` - SRS wall kick implementation
- `/src/utils/gameValidation.ts` - Game state validation
- `/src/utils/boardUtils.ts` - Board utility functions

**Medium Priority** (Store logic testing):
- `/src/store/gameStore.ts` - Pure state transition functions
- `/src/store/highScoreStore.ts` - Score persistence logic
- `/src/store/settingsStore.ts` - Settings validation and persistence

**E2E Testing** (Playwright - Use sparingly):
- Critical user journey: Start game → Play → Score → Game over
- Mobile touch controls functionality
- Language switching behavior

## IMPORT PATH DECISION TREE (CRITICAL)

### IMPORT PATH RULES (Follow exactly)
```
IF importing from different directory THEN use `@/` alias
  ✅ import { GameStore } from '@/store/gameStore'
  ✅ import { BoardUtils } from '@/utils/boardUtils'
  ❌ import { GameStore } from '../store/gameStore'
  ❌ import { BoardUtils } from '../../utils/boardUtils'

IF importing from same directory THEN use `./` relative path
  ✅ import { helper } from './utils'
  ✅ import { Component } from './Component'
  ❌ import { helper } from '@/current-dir/utils'

EXCEPTION: Test mocks may use relative paths when required by testing framework
  ✅ import mockData from '../__mocks__/data'
```

### CODE QUALITY ENFORCEMENT

**Error Handling Policy**:
- IF TypeScript error occurs THEN fix root cause, NEVER relax checks
- IF test fails THEN address root cause, NEVER skip test
- IF error message appears THEN investigate cause, NEVER suppress

**Text Content Policy**:
- IF user-facing text needed THEN use i18n from `/src/locales/`
- IF hardcoded string detected THEN move to translation files
- Available languages: English (`en.json`), Japanese (`ja.json`)

**Architecture Enforcement**:
- IF new code needed THEN prefer pure functions over classes
- IF state management needed THEN use Zustand functional patterns
- IF styling needed THEN use Tailwind CSS classes
- IF UI component needed THEN check existing shadcn/ui components first
- IF custom component needed THEN follow shadcn/ui patterns (Radix UI + Tailwind + CVA)

### DEVELOPMENT TOOLS CONFIGURATION
- **Primary Runtime**: Bun (package management, testing, development)
- **Code Quality**: Biome with strict rules (auto-format via Lefthook)
- **Type Checking**: TypeScript strict mode with ESNext target
- **Git Workflow**: Conventional commits enforced via Lefthook hooks

## MCP TOOLS USAGE PROTOCOLS

### PLAYWRIGHT MCP - Browser Testing
**ACTIVATION CONDITIONS**:
- IF visual UI validation needed THEN use Playwright
- IF user interaction testing required THEN use browser automation
- IF responsive design verification needed THEN use Playwright
- IF animation behavior analysis required THEN use Playwright

**EXECUTION WORKFLOW**:
```bash
# Step 1: Start development server
bun run dev

# Step 2: Navigate to application
mcp__playwright__browser_navigate "http://localhost:5173"

# Step 3: Analyze page structure
mcp__playwright__browser_snapshot

# Step 4: Interact with elements (if needed)
mcp__playwright__browser_click <element> <ref>

# Step 5: Capture results
mcp__playwright__browser_take_screenshot
```

### CONTEXT7 MCP - Library Documentation
**ACTIVATION CONDITIONS**:
- IF researching latest library features THEN use Context7
- IF checking breaking changes before updates THEN use Context7
- IF discovering performance optimization techniques THEN use Context7
- IF troubleshooting with current documentation THEN use Context7

**EXECUTION WORKFLOW**:
```bash
# Step 1: Resolve library ID
mcp__context7__resolve-library-id "<library-name>"

# Step 2: Get documentation
mcp__context7__get-library-docs "<context7-library-id>"

# Example for Bun:
mcp__context7__resolve-library-id "bun"
# Returns: `/oven-sh/bun`
mcp__context7__get-library-docs "/oven-sh/bun"
```

### AIVISSPEECH MCP - Task Completion Notifications
**ACTIVATION CONDITIONS**:
- IF ALL TodoWrite task list items completed THEN use AivisSpeech
- IF long-running task completed THEN use AivisSpeech
- IF background process completion awareness needed THEN use AivisSpeech

**EXECUTION RULES**:
- ✅ Trigger ONLY when ALL todo items marked as completed
- ✅ Use reasonable volume settings (volumeScale=0.1)
- ✅ Prefer Japanese completion messages
