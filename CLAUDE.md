# Tetris Game Project

## EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS (Never Override)
1. **Type Error Resolution**: NEVER relax TypeScript checks to resolve issues
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks for error avoidance  
3. **Output Hardcoding**: NEVER hardcode user-facing text or API responses
4. **Error Suppression**: NEVER hide or ignore error messages
5. **Temporary Fixes**: NEVER implement temporary solutions that create technical debt
6. **Any Type Usage**: NEVER use `any` type - use `unknown` with proper type guards or define explicit types

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
  - Components: button, card, dialog, badge, animated-button (located in `/src/components/ui/`)
  - Built on: Radix UI primitives + Tailwind CSS
  - Radix UI: @radix-ui/react-dialog 1.1.14, @radix-ui/react-slot 1.2.3
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
- **Property Testing**: fast-check 4.2.0 (property-based testing)
- **E2E Testing**: Playwright 1.53.2 (browser automation)
- **React Plugin**: @vitejs/plugin-react-oxc 0.2.3 (Vite React plugin)
- **Unused Dependencies Detection**: knip 5.61.3
- **Bundle Analysis**: rollup-plugin-visualizer 6.0.3
- **CSS Processing**: @tailwindcss/vite 4.1.11 plugin

### Directory Structure and Component Organization

**Principle**: Clear separation of concerns with testability as a primary consideration

```
src/
├── benchmarks/    # Performance benchmarks (TEST ALL FUNCTIONS)
├── components/    # React UI components (DO NOT TEST)
│   ├── game/      # Game-specific UI components and displays
│   ├── layout/    # Application layout and structural components
│   └── ui/        # Reusable UI primitives (shadcn/ui components)
├── game/          # Pure game logic (TEST ALL FUNCTIONS)
│   ├── ai/        # AI implementation with bitboard optimization
│   │              # Core Tetris mechanics, board operations, scoring
├── hooks/         # Custom React hooks (TEST ONLY EXTRACTED PURE FUNCTIONS)
│   ├── actions/   # Game action orchestration hooks
│   ├── common/    # Shared utility hooks
│   ├── controls/  # Input handling and user interaction hooks
│   ├── core/      # Core game lifecycle hooks
│   ├── data/      # Data access and persistence hooks
│   ├── effects/   # Side effects and animation hooks
│   ├── selectors/ # State selection and computed state hooks
│   └── ui/        # UI-specific behavior hooks
├── store/         # Zustand state management (TEST ALL STORE LOGIC)
├── types/         # TypeScript type definitions
├── utils/         # Shared utilities and constants (TEST ALL FUNCTIONS)
├── locales/       # i18n translation files (en.json, ja.json)
├── i18n/          # i18n configuration
├── lib/           # Shared utility functions
├── scripts/       # Development and maintenance scripts (i18n checker)
├── test/          # Test configuration, setup, and utilities
└── tests/         # E2E tests and visual testing
```

**Key Architectural Decisions**:
- **UI Components**: Never tested directly, focus on visual presentation
- **Pure Functions**: Always tested, located in `game/`, `utils/`, `lib/`
- **Hooks**: Only extracted pure functions tested, not hook behavior
- **State Management**: Store logic tested, selectors verified for stability

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
// ✅ CORRECT: Use useShallow for object selectors
import { useShallow } from "zustand/shallow";
const { a, b } = useStore(useShallow((state) => ({ a: state.a, b: state.b })));

// ✅ BEST: Individual primitive selectors (most stable)
const a = useStore((state) => state.a);
const b = useStore((state) => state.b);
```

### Core Game Logic Implementation
**Location**: `/src/game/` (TEST ALL FUNCTIONS)

**Key Systems**:
- **Board Operations**: 20×10 grid with collision detection and line clearing
- **Tetromino Management**: 7 standard pieces with Super Rotation System (SRS)
- **Piece Distribution**: 7-Bag randomization for fair gameplay
- **T-Spin Detection**: 3-corner rule with wall kick integration
- **Scoring System**: Level-based progression with T-Spin multipliers
- **Board Engine**: Strategy pattern for optimized performance
- **AI Implementation**: Advanced bitboard-optimized AI with configurable difficulty levels

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
bun run e2e          # Run Playwright E2E tests

# i18n Management
bun run check:i18n   # Check translation key consistency (detect missing/unused keys)

# Performance Benchmarking
bun run benchmark    # Run performance benchmarks (collision detection, board operations)

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
**TEST TARGETS**: 
- ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/store/`, `/src/benchmarks/`
- ✅ Business logic extracted from hooks
- ❌ React components, DOM interactions, UI behavior
- ❌ React hooks themselves (only extracted pure functions)

**EXECUTION**:
- Pure functions: `bun test src/game/ src/utils/ src/lib/`
- DOM-related: `bun test src/hooks/ src/store/`
- All tests: `bun test src/`
- Co-located test files (e.g., `board.test.ts` alongside `board.ts`)
- Note: Some tests in `src/hooks/controls/` are temporarily disabled (.test.ts.skip) due to parallel execution isolation issues

**MOCKING**: Mock ONLY external dependencies (localStorage, i18n)
**STORE TESTING**: Test actions and state transitions, NOT selectors

### CRITICAL: Testing with AI Assistants (Never Run Dev Server)

**❌ NEVER USE `bun run dev` for testing purposes**:
- Development server (`bun run dev`) does NOT return responses to AI assistants
- The command blocks indefinitely, preventing further work progression
- AI assistants cannot effectively test interactive applications this way

**✅ APPROVED TESTING METHODS for AI Assistants**:

1. **Unit/Integration Tests** (Preferred method):
   ```bash
   bun test src/                    # All unit tests
   bun test src/game/ai/           # Specific module tests
   bun run test:all                # Complete test suite
   ```

2. **Playwright E2E Testing** (For UI validation):
   ```bash
   # Start server in background (non-blocking)
   bun run dev > /dev/null 2>&1 &
   sleep 5  # Wait for server startup
   
   # Use Playwright MCP tools for testing
   mcp__playwright__browser_navigate "http://localhost:5173"
   mcp__playwright__browser_snapshot
   mcp__playwright__browser_click <element> <ref>
   ```

3. **Build Validation**:
   ```bash
   bun run build                   # Production build test
   bun run lint                    # Code quality checks
   bun run typecheck               # Type safety validation
   ```

4. **Performance Testing**:
   ```bash
   bun run benchmark               # Performance benchmarks
   bun run benchmark:ci            # CI-mode benchmarks
   ```

**WHY THIS MATTERS**:
- `bun run dev` is intended for human developers using browsers
- AI assistants need programmatic feedback to continue workflow
- Background server + Playwright provides automated UI testing
- Unit tests provide immediate feedback on code functionality

### CRITICAL: React useEffect Dependency Issues (Learned from Issue #102)

**❌ DANGEROUS PATTERN - useEffect Circular Dependencies**:
```typescript
// 🚨 NEVER: State in dependency array that gets updated inside useEffect
useEffect(() => {
  async function continuousLoop() {
    if (isRunning) {
      setIsRunning(true); // ← Triggers useEffect again!
      // ... do work
      setIsRunning(false);
      setTimeout(() => continuousLoop(), 200); // ← Gets overwritten by new useEffect
    }
  }
}, [isRunning]); // ← isRunning causes infinite recreation

// RESULT: Only first execution works, subsequent loops fail
```

**✅ CORRECT PATTERNS for Continuous Operations**:

1. **useRef for Loop Control**:
```typescript
const isRunningRef = useRef(false);
const enabledRef = useRef(false);

useEffect(() => {
  async function continuousLoop() {
    if (!enabledRef.current || isRunningRef.current) return;
    
    isRunningRef.current = true;
    // ... do work
    isRunningRef.current = false;
    
    setTimeout(() => continuousLoop(), 200);
  }
  
  if (enabled) continuousLoop();
}, [enabled]); // ← Only trigger-conditions, not internal state
```

2. **Custom Hook Separation**:
```typescript
const useContinuousOperation = (enabled: boolean) => {
  const operationRef = useRef<() => void>();
  
  useEffect(() => {
    // Isolated continuous logic
  }, [enabled]);
};
```

**DEBUGGING PATTERNS**:
- Always log useEffect triggers: `console.log("useEffect triggered by:", { dep1, dep2 })`
- Monitor circular patterns: Check if setTimeout callbacks reference stale functions
- Use React DevTools to track useEffect recreation frequency

**WHEN TO SUSPECT useEffect ISSUES**:
- Operations work once then stop
- "isThinking" or "isLoading" states cause infinite loops  
- setTimeout/setInterval callbacks become unresponsive
- Complex async operations in useEffect

## IMPORT PATH DECISION TREE (CRITICAL)

### IMPORT PATH RULES (Follow exactly)
```
IF importing from different directory THEN use `@/` alias
  ✅ import { GameStore } from '@/store/gameStore'
  ✅ import { BoardUtils } from '@/utils/boardUtils'
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

**Zustand v5 Debugging**:
- "getSnapshot should be cached" → Check object/array selectors
- "Maximum update depth exceeded" → Use `useShallow` for complex selectors
- Infinite rendering → Verify selector stability with React DevTools

## DEBUG MODE SYSTEM

**Purpose**: Rapid testing via URL parameters (detailed docs in README.md)
**Key Files**: `/src/utils/debugParams.ts`, `/src/utils/debugPresets.ts`

### Quick Reference
```bash
# Enable debug mode with preset
http://localhost:5173/?debug=true&preset=tetris

# Custom piece queue
http://localhost:5173/?debug=true&queue=IJLOSTZ&score=50000
```

### Implementation Requirements
- **ALWAYS** validate debug parameters for type safety
- **ALWAYS** use immutable state initialization in debug functions
- **NEVER** allow debug mode in production builds
- Debug UI shows in red panel when active

## STATE MANAGEMENT BEST PRACTICES

### Critical Zustand v5 Requirements
- **NEVER** return new objects/arrays directly from selectors
- **ALWAYS** use `useShallow` for object/array selectors
- **PREFER** individual primitive selectors when possible

### Required Patterns
```typescript
// ✅ REQUIRED: Individual primitive selectors (most stable)
const score = useGameStore((state) => state.score);
const level = useGameStore((state) => state.level);

// ✅ ACCEPTABLE: useShallow for object selectors
import { useShallow } from "zustand/shallow";
const { score, level } = useGameStore(
  useShallow((state) => ({ score: state.score, level: state.level }))
);

// ✅ REQUIRED: Functional state transitions
const moveTetrominoBy = (state: GameState, dx: number, dy: number) => {
  const newPosition = { x: state.currentPiece.x + dx, y: state.currentPiece.y + dy };
  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    state.currentPiece.x = newPosition.x;
    state.currentPiece.y = newPosition.y;
    state.ghostPosition = calculateGhostPosition(state);
  }
};

// ✅ REQUIRED: Conditional updates to prevent unnecessary renders
clearAnimationData: () => set((state) => {
  if (state.placedPositions.length > 0 || state.clearingLines.length > 0) {
    state.placedPositions = [];
    state.clearingLines = [];
    state.boardBeforeClear = null;
  }
});
```

### Testing Requirements
- **ALWAYS** test store actions and state transitions
- **ALWAYS** reset store state in `beforeEach`
- **NEVER** test selectors directly - test the business logic they access

## PERFORMANCE OPTIMIZATION STRATEGIES

### Critical Performance Requirements
- **React.memo**: Use for BoardCell and expensive components with custom comparison
- **useCallback/useMemo**: Required for game loop and animation functions
- **requestAnimationFrame**: ALWAYS use for smooth 60fps animations
- **Bundle Analysis**: Run `bun run build` → check `dist/stats.html` for size monitoring

### Key Optimization Patterns
```typescript
// ✅ REQUIRED: Memoized board cells
const BoardCell = React.memo(({ value, isGhost, isClearing }) => {
  return <div className={getCellClassName(value, isGhost, isClearing)} />;
}, shallowCompare);

// ✅ REQUIRED: Animation cleanup
useEffect(() => {
  const frameId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(frameId);
}, []);

// ✅ REQUIRED: GPU-accelerated animations only
<motion.div animate={{ scale: 1.1, opacity: 0.8 }} />
// ❌ NEVER: Layout animations
<motion.div animate={{ width: 200, height: 300 }} />
```

### Performance Monitoring
- **Benchmarks**: `bun run benchmark` for collision detection and board operations
- **Bundle Targets**: < 500KB total, < 200KB vendor chunk
- **Runtime Targets**: 60fps gameplay, < 50MB memory growth/minute

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
