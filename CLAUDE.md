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

#### Application Libraries (Latest Versions)
- **Frontend**: React 19.1.0, Zustand 5.0.6, Tailwind CSS 4.1.11
- **Animation**: Motion 12.23.0 (physics-based animations)
- **i18n**: i18next 25.3.1 + react-i18next 15.6.0
- **UI Components**: shadcn/ui with Radix UI primitives
- **Utilities**: clsx 2.1.1, tailwind-merge 3.3.1, immer 10.1.1

#### Development & Build Tools
- **Runtime**: Bun 1.2.18 (package manager, test runner, dev server)
- **Build**: Vite 7.0.4 (rolldown-vite)
- **TypeScript**: 5.8.3 with strict mode
- **Quality**: Biome 2.0.6, Lefthook 1.11.16
- **Testing**: Bun Test, Playwright 1.53.2, fast-check 4.2.0

### Directory Structure
```
src/
├── benchmarks/    # Performance benchmarks (TEST ALL)
├── components/    # React UI components (DO NOT TEST)
│   ├── game/      # Game UI components with AI visualization
│   ├── layout/    # Layout components
│   └── ui/        # shadcn/ui components
├── game/          # Pure game logic (TEST ALL)
│   └── ai/        # Advanced AI system (21 modules, TEST ALL)
│       ├── core/      # Core AI engine, BitBoard, collision detection
│       ├── evaluators/ # Dellacherie and advanced feature evaluators
│       └── search/    # Beam search and Hold search algorithms
├── hooks/         # Custom React hooks (TEST ONLY EXTRACTED PURE FUNCTIONS)
│   ├── ai/        # AI controller hooks
│   ├── controls/  # Input and touch control hooks
│   ├── core/      # Core game hooks
│   └── ui/        # UI and animation hooks
├── store/         # Zustand state management (TEST ALL)
├── types/         # TypeScript type definitions
├── utils/         # Shared utilities (TEST ALL)
├── locales/       # i18n translation files
└── tests/         # E2E tests
```

### State Management Architecture
**Store Modules**: GameStore, SettingsStore, HighScoreStore

**CRITICAL: Zustand v5 Selector Requirements**:
- **NEVER** return new objects/arrays directly from selectors
- **ALWAYS** use `useShallow` for object/array selectors
- **PREFER** individual primitive selectors when possible

```typescript
// ✅ CORRECT: Use useShallow for object selectors
import { useShallow } from "zustand/shallow";
const { a, b } = useStore(useShallow((state) => ({ a: state.a, b: state.b })));

// ✅ BEST: Individual primitive selectors
const a = useStore((state) => state.a);
const b = useStore((state) => state.b);
```

### Core Game Logic & AI System

**Game Systems**:
- Board Operations: 20×10 grid with collision detection
- Tetromino Management: 7 pieces with Super Rotation System (SRS)
- AI Implementation: Multi-level AI system with BitBoard optimization

**AI Architecture** (21 AI modules, 145+ TypeScript files):
1. **Core AI Engine**:
   - **BitBoard**: Ultra-high-performance board representation using Uint32Array
   - **Advanced AI Engine**: Multi-phase decision engine with beam search
   - **Collision Detection**: Optimized position validation system
   - **Move Generator**: Comprehensive move analysis with SRS support

2. **AI Evaluators**:
   - **Dellacherie**: 6-feature heuristic system (Landing Height, Lines Cleared, Transitions, Holes, Wells)
   - **Advanced Features**: T-Spin detection, Perfect Clear opportunities, danger zone analysis
   - **Dynamic Weights**: Adaptive strategy based on game phases (early, mid, late, danger)

3. **Search Algorithms**:
   - **Beam Search**: Multi-depth lookahead with configurable beam width
   - **Hold Search**: Strategic Hold piece utilization
   - **Performance Benchmarks**: Optimized search with time limits

4. **AI User Interface**:
   - **Advanced AI Controls**: Real-time AI parameter adjustment
   - **AI Visualization**: Move heatmaps, search tree visualization, thinking process
   - **AI Replay System**: Complete game replay with decision analysis
   - **Performance Metrics**: Real-time AI performance monitoring

## Development Commands

### REQUIRED COMMANDS
```bash
bun run dev          # Start development server
bun test             # Run pure function tests
bun run test:all     # Run all tests (MUST pass before commits)
bun run lint         # Code linting (MUST pass before commits)
bun run typecheck    # Type checking (MUST pass before commits)
bun run build        # Production build (MUST succeed before commits)
bun run ci           # Complete CI pipeline
bun run benchmark    # Run AI performance benchmarks
bun run e2e          # Run Playwright E2E tests
```

### EXECUTION CONDITIONS
- **Before ANY commit**: Run `bun run lint` AND `bun run typecheck`
- **After code changes**: Run `bun test` to verify no regressions
- **Git hooks**: Lefthook automatically runs formatting and validation

## TESTING STRATEGY

### TESTING RULES
**TEST TARGETS**: 
- ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/store/`
- ❌ React components, DOM interactions, UI behavior

### CRITICAL: Testing with AI Assistants

**❌ NEVER USE `bun run dev` for testing purposes**:
- Development server blocks indefinitely
- AI assistants cannot effectively test interactive applications

**✅ APPROVED TESTING METHODS**:

1. **Unit/Integration Tests** (Preferred):
```bash
bun test src/                    # All unit tests
bun test src/game/ai/           # Specific module tests
```

2. **Playwright E2E Testing**:
```bash
bun run dev > /dev/null 2>&1 &
sleep 5
mcp__playwright__browser_navigate "http://localhost:5173"
mcp__playwright__browser_snapshot
```

3. **Build Validation**:
```bash
bun run build
bun run lint
bun run typecheck
```

### CRITICAL: React useEffect Dependency Issues

**❌ DANGEROUS PATTERN**:
```typescript
useEffect(() => {
  async function continuousLoop() {
    if (isRunning) {
      setIsRunning(true); // ← Triggers useEffect again!
      setTimeout(() => continuousLoop(), 200); // ← Gets overwritten
    }
  }
}, [isRunning]); // ← Causes infinite recreation
```

**✅ CORRECT PATTERN (AI Controller Implementation)**:
```typescript
const aiEnabledRef = useRef(false);
const isThinkingRef = useRef(false);
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  async function aiLoop() {
    if (!aiEnabledRef.current || isThinkingRef.current) return;
    
    isThinkingRef.current = true;
    // ... AI decision making
    isThinkingRef.current = false;
    
    timeoutRef.current = setTimeout(() => aiLoop(), aiSpeed);
  }
  
  if (enabled) aiLoop();
}, [enabled]); // ← Only trigger-conditions, not internal state
```

**AI-Specific Patterns**:
- Use `useRef` for AI state that shouldn't trigger re-renders
- Implement timeout cleanup for AI thinking loops
- Separate AI decision logic from React state updates

## CODE QUALITY ENFORCEMENT

**Error Handling Policy**:
- IF TypeScript error occurs THEN fix root cause, NEVER relax checks
- IF test fails THEN address root cause, NEVER skip test

**Text Content Policy**:
- IF user-facing text needed THEN use i18n from `/src/locales/`
- Available languages: English (`en.json`), Japanese (`ja.json`)

**Architecture Enforcement**:
- IF new code needed THEN prefer pure functions over classes
- IF state management needed THEN use Zustand functional patterns
- IF UI component needed THEN check existing shadcn/ui components first

## DEBUG MODE SYSTEM

```bash
# Enable debug mode with preset
http://localhost:5173/?debug=true&preset=tetris

# Custom piece queue
http://localhost:5173/?debug=true&queue=IJLOSTZ&score=50000

# AI debug mode
http://localhost:5173/?debug=true&ai=advanced&visualization=true
```

**Requirements**:
- Validate debug parameters for type safety
- Use immutable state initialization
- Never allow debug mode in production builds
- AI debug mode enables advanced visualization and performance metrics

## STATE MANAGEMENT BEST PRACTICES

### Required Patterns
```typescript
// Individual primitive selectors (most stable)
const score = useGameStore((state) => state.score);

// Functional state transitions
const moveTetrominoBy = (state: GameState, dx: number, dy: number) => {
  const newPosition = { x: state.currentPiece.x + dx, y: state.currentPiece.y + dy };
  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    state.currentPiece.x = newPosition.x;
    state.currentPiece.y = newPosition.y;
  }
};

// Conditional updates to prevent unnecessary renders
clearAnimationData: () => set((state) => {
  if (state.placedPositions.length > 0 || state.clearingLines.length > 0) {
    state.placedPositions = [];
    state.clearingLines = [];
  }
});
```

## MCP TOOLS USAGE

### PLAYWRIGHT MCP - Browser Testing
Use for visual UI validation, user interaction testing, animation behavior analysis

### CONTEXT7 MCP - Library Documentation  
Use for researching latest features, checking breaking changes, troubleshooting

### AIVISSPEECH MCP - Task Completion
Trigger ONLY when ALL todo items completed (volumeScale=0.1, Japanese messages preferred)

### O3 MCP - Technical Problem Solving
Use for technical blockers, complex errors, architectural decisions