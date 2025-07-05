# Tetris Game Project

## EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS (Never Override)
1. **Type Error Resolution**: NEVER relax TypeScript checks to resolve issues
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks for error avoidance  
3. **Output Hardcoding**: NEVER hardcode user-facing text or API responses
4. **Error Suppression**: NEVER hide or ignore error messages
5. **Temporary Fixes**: NEVER implement temporary solutions that create technical debt

### MANDATORY EXECUTION PATTERNS
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
- **Animation System**: Motion 12.23.0 (physics-based animations)
- **Internationalization**: i18next 25.3.1 + react-i18next 15.6.0
- **UI Component System**: shadcn/ui (copy-paste component library)
  - Components: button, card, dialog, badge (located in `/src/components/ui/`)
  - Built on: Radix UI primitives + Tailwind CSS
  - Utilities: class-variance-authority 0.7.1 (variant management)
- **Icons**: Lucide React 0.525.0 (icon library)
- **State Management**: immer 10.1.1 (immutable state updates, used with Zustand)
- **Utilities**: clsx 2.1.1 + tailwind-merge 3.3.1 (className utilities via `cn()` function)

#### Development & Build Tools
- **Runtime Environment**: Bun 1.2.18 (package manager, test runner, development server)
- **Build System**: Vite 7.0.4 (rolldown-vite) with enhanced performance
- **Type System**: TypeScript 5.8.3 with strict mode and ESNext target
- **Code Quality**: Biome 2.0.6 (linting, formatting, static analysis)
- **Git Hooks**: Lefthook 1.11.16 (pre-commit validation, commit message linting)
- **Testing**: Bun Test with happy-dom 18.0.1 (DOM simulation)
- **Testing Libraries**: @testing-library/jest-dom 6.6.3, @testing-library/react 16.3.0
- **Property Testing**: fast-check 4.1.1 (property-based testing)
- **E2E Testing**: Playwright 1.53.2 (browser automation)
- **React Plugin**: @vitejs/plugin-react-oxc 0.2.3 (Vite React plugin)
- **Unused Dependencies Detection**: knip 5.61.3
- **Bundle Analysis**: rollup-plugin-visualizer 6.0.3
- **CSS Processing**: @tailwindcss/vite 4.1.11 plugin

### Directory Structure and Component Organization

```
src/
├── components/     # React UI components (DO NOT TEST)
│   ├── game/      # Game-specific components: AnimatedScoreItem, Board, BoardCell, Controls,
│   │              # CurrentHighScore, GameOverlay, HighScore, HighScoreItem, HighScoreList,
│   │              # HoldPiece, NextPiece, NoHighScore, ResetConfirmationDialog, ScoreBoard,
│   │              # TetrominoGrid, TouchControls
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
├── tests/         # E2E tests and visual testing
```

### State Management Architecture
**Store Implementation**: Zustand 5.0.6 with functional programming patterns

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

**CRITICAL: Zustand v5 Selector Requirements** (MUST FOLLOW):
- **NEVER** return new objects/arrays directly from selectors
- **ALWAYS** use `useShallow` for object/array selectors
- **AVOID** `useStore((state) => ({ key: state.value }))` patterns
- **PREFER** individual primitive selectors when possible

```typescript
// ❌ WRONG: Creates new object every render → infinite loop
const { a, b } = useStore((state) => ({ a: state.a, b: state.b }));

// ✅ CORRECT: Use useShallow for object selectors
import { useShallow } from "zustand/shallow";
const { a, b } = useStore(useShallow((state) => ({ a: state.a, b: state.b })));

// ✅ BEST: Individual primitive selectors (most stable)
const a = useStore((state) => state.a);
const b = useStore((state) => state.b);
```

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
bun test             # Run pure function tests (game, utils, lib directories)
bun run test:dom     # Run DOM-related tests (hooks, store directories)
bun run test:all     # Run all tests (MUST pass before commits)
bun run lint         # Code linting (MUST pass before commits)
bun run format       # Code formatting with Biome
bun run typecheck    # Type checking (MUST pass before commits)
bun run build        # Production build (MUST succeed before commits)

# E2E Testing
bun run e2e          # Run Playwright E2E tests (headless)
bun run e2e:headed   # Run Playwright E2E tests (with browser UI)

# i18n Management
bun run check:i18n   # Check translation key consistency (detect missing/unused keys)

# Quality Assurance Pipeline
bun run ci           # Complete CI pipeline (lint + typecheck + test + build)
```

### EXECUTION CONDITIONS
- **Before ANY commit**: Run `bun run lint` AND `bun run typecheck`
- **After code changes**: Run `bun test` to verify no regressions
- **After i18n changes**: Run `bun run check:i18n` to verify translation key consistency
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
   - Pure function tests: `bun test src/game/ src/utils/ src/lib/ --ignore '**/visual/**'`
   - DOM-related tests: `bun test src/hooks/ src/store/ --ignore '**/visual/**'`
   - All tests: `bun test src/ --ignore '**/visual/**'`
   - Environment: Bun Test with happy-dom
   - Pattern: Co-located test files (e.g., `board.test.ts` alongside `board.ts`)

3. **MOCKING STRATEGY**:
   - Use real implementations whenever possible
   - Mock ONLY external dependencies (localStorage, i18n)
   - Available mocks: `/src/test/__mocks__/react-i18next.ts`

4. **ZUSTAND TESTING PATTERNS**:
   - Test store actions and state transitions, NOT selectors
   - Use `act()` wrapper for store updates in React components
   - Test custom hooks with `useShallow` pattern separately from component integration
   - Verify selector stability with multiple renders in test environment
   - Mock external store dependencies (localStorage, persist middleware)

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

**Zustand v5 Debugging Guidelines**:
- IF "getSnapshot should be cached" error occurs THEN check for object/array selectors
- IF "Maximum update depth exceeded" error occurs THEN use `useShallow` for complex selectors
- IF infinite rendering detected THEN verify all selectors return stable references
- IF custom hook returns objects THEN wrap with `useShallow` or split into primitives
- IF debugging selector issues THEN use React DevTools Profiler to identify re-render sources

### DEVELOPMENT TOOLS CONFIGURATION
- **Primary Runtime**: Bun (package management, testing, development)
- **Code Quality**: Biome with strict rules (auto-format via Lefthook)
- **Type Checking**: TypeScript strict mode with ESNext target
- **Git Workflow**: Conventional commits enforced via Lefthook hooks
- **Trusted Dependencies**: @tailwindcss/oxide (explicit trust for native dependencies)

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

### O3 MCP - Technical Problem Solving
**ACTIVATION CONDITIONS**:
- IF encountering technical blockers during design/implementation THEN use o3 MCP
- IF unable to resolve complex errors THEN consult o3 MCP
- IF uncertain about architectural decisions THEN use o3 MCP
- IF needing alternative implementation approaches THEN use o3 MCP

**USAGE GUIDELINES**:
- Provide detailed context about the problem
- Include relevant code snippets and error messages
- Specify what solutions have been attempted
- Ask specific questions for targeted assistance
