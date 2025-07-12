# Tetris Game Project

## EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS (No Exceptions)
1. **Type Error Resolution**: NEVER relax TypeScript checks to resolve issues - always fix the root cause
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks for error avoidance - address the underlying problem
3. **Output Hardcoding**: NEVER hardcode user-facing text or API responses - use i18n and proper data sources
4. **Error Suppression**: NEVER hide or ignore error messages - errors must be properly handled or resolved
5. **Temporary Fixes**: NEVER implement temporary solutions that create technical debt - build sustainable solutions
6. **Any Type Usage**: NEVER use `any` type - use `unknown` with proper type guards or define explicit types
7. **Class Usage**: NEVER use class-based implementations except when absolutely necessary for interface compliance

### MANDATORY EXECUTION PATTERNS
- **Path Import Rules**: ALWAYS use `@/` for cross-directory imports, `./` for same-directory imports
- **i18n Compliance**: ALL user-facing text MUST use translation files in `/src/locales/`
- **Functional Programming**: ALWAYS prefer pure functions over class-based implementations
- **Test Focus**: ONLY test pure functions, utility modules, and business logic - NEVER test React components or framework behavior

## Project Architecture Definition

### Core Implementation Stack

#### Application Libraries (Confirmed Versions)
- **Frontend**: React 19.1.0, Zustand 5.0.6, Tailwind CSS 4.1.11
- **Animation**: Motion 12.23.3 (physics-based animations)
- **i18n**: i18next 25.3.2 + react-i18next 15.6.0
- **UI Components**: shadcn/ui with Radix UI primitives (@radix-ui components)
- **Utilities**: clsx 2.1.1, tailwind-merge 3.3.1, immer 10.1.1

#### Development & Build Tools
- **Runtime**: Bun 1.2.18 (package manager, test runner, dev server)
- **Build**: Vite 7.0.8+ (rolldown-vite) 
- **TypeScript**: 5.8.3 with strict mode
- **Quality**: Biome 2.1.1, Lefthook 1.12.2
- **Testing**: Bun Test, Playwright 1.54.1, fast-check 4.2.0

### Directory Structure
```
src/
├── benchmarks/    # Performance benchmarks (TEST ALL)
├── components/    # React UI components (DO NOT TEST)
│   ├── game/      # Game UI components with AI visualization
│   ├── layout/    # Layout components
│   └── ui/        # shadcn/ui components
├── game/          # Pure game logic (TEST ALL)
│   └── ai/        # Advanced AI system (18 modules, 12,000+ lines, TEST ALL)
│       ├── config/    # YAML-based weight configuration system
│       │   ├── weight-loader.ts  # Dynamic weight loading from YAML
│       │   └── weights.yaml      # AI evaluator weight configurations
│       ├── core/      # Core AI engine, BitBoard, collision detection, piece bits
│       ├── evaluators/ # BaseEvaluator interface, unified evaluator architecture
│       │   ├── dellacherie/     # Modular Dellacherie evaluator
│       │   │   ├── calculator/  # Score calculation logic
│       │   │   ├── core/       # Core evaluator implementation
│       │   │   └── features/   # Individual feature extractors
│       │   ├── base-evaluator.ts # Unified evaluator interface
│       │   └── ... # Other evaluators (pattern, stacking, advanced-features)
│       ├── search/    # Unified SearchStrategy interface and implementations
│       │   ├── search-strategy.ts # Common search interface
│       │   └── ... # Search algorithms with adapter pattern
│       └── tests/     # AI integration tests and strategy validation
├── hooks/         # Custom React hooks (TEST ONLY EXTRACTED PURE FUNCTIONS)
│   ├── actions/   # Game action hooks
│   ├── ai/        # AI controller hooks
│   ├── common/    # Common utility hooks
│   ├── controls/  # Input and touch control hooks
│   ├── core/      # Core game hooks
│   ├── data/      # Data management hooks
│   ├── effects/   # Side effect hooks
│   ├── selectors/ # State selector hooks
│   └── ui/        # UI and animation hooks
├── store/         # Zustand state management (TEST ALL)
├── types/         # TypeScript type definitions
│   ├── errors.ts  # Error type definitions
│   ├── game.ts    # Game type definitions
│   ├── result.ts  # Result type definitions
│   ├── rotation.ts # Rotation type definitions
│   └── storage.ts # Storage type definitions
├── utils/         # Shared utilities (TEST ALL)
├── locales/       # i18n translation files
├── i18n/          # i18n configuration
│   └── config.ts  # i18n setup and configuration
├── lib/           # Shared library utilities
│   └── utils.ts   # General utility functions
├── test/          # Test utilities and mocks
│   ├── __mocks__/ # Mock implementations
│   ├── generators/ # Test data generators
│   └── setup.ts   # Test setup configuration
└── tests/         # Performance tests
    └── performance/   # Performance benchmarks and tests
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

**AI Architecture** (Advanced AI system with modular design):
1. **Core AI Engine**:
   - **BitBoard**: Ultra-high-performance board representation using Uint32Array (100,000+ evaluations/sec)
   - **Advanced AI Engine**: Multi-phase decision engine with diversified beam search
   - **Collision Detection**: Optimized position validation system (< 1ms for 1,000 checks)
   - **Move Generator**: Comprehensive move analysis with SRS support
   - **Piece Bits**: Optimized piece bit manipulation for collision detection
   - **BaseEvaluator Interface**: Unified evaluator interface for consistent AI strategy implementation

2. **AI Evaluators**:
   - **Dellacherie**: Modularized 6-feature heuristic system with separate feature extractors
   - **Advanced Features**: T-Spin detection, Perfect Clear opportunities, danger zone analysis
   - **Pattern Evaluator**: PCO, DT Cannon, ST-Stack competitive pattern detection
   - **Phase-Based Weights**: Dynamic strategy adaptation (early/mid/late/danger phases)
   - **Terrain Analysis**: Surface smoothness, accessibility, and strategic position evaluation
   - **Stacking Evaluator**: Stacking-focused evaluation with gradual line building strategy (DT-20 system)
   - **YAML Weight Management**: Dynamic weight configuration system for easy AI tuning (weights.yaml)

3. **Search Algorithms**:
   - **Beam Search**: Multi-depth lookahead with configurable beam width (5-20)
   - **Diversity Beam Search**: Exploration-exploitation balance with surface profile analysis
   - **Hold Search**: Strategic Hold piece utilization with penalty system
   - **Pattern Search**: Depth-first search for pattern completion opportunities
   - **Performance Benchmarks**: Optimized search with 80ms time limits
   - **Modular Search Strategies**: Multiple search algorithms with shared configuration patterns

4. **Pattern Recognition System**:
   - **PCO (Perfect Clear Opener)**: Complete board clearing opening patterns
   - **DT Cannon**: Double-Triple cannon attack patterns
   - **ST-Stack**: S-T stacking continuous attack patterns
   - **Mid-game Pattern Detection**: Advanced pattern recognition for competitive play

5. **AI User Interface**:
   - **Advanced AI Controls**: Real-time AI parameter adjustment (beam width, thinking time, Hold usage)
   - **AI Visualization**: Move heatmaps, search tree visualization, thinking process display
   - **AI Replay System**: Complete game replay with decision analysis and performance metrics
   - **Performance Monitoring**: Real-time AI performance tracking and optimization insights

## AI Architecture Patterns

### BaseEvaluator Interface
All AI evaluators implement a unified interface for consistency:
```typescript
interface BaseEvaluator {
  evaluate(state: BoardState): number;
  calculateFeatures(board: BitBoard): FeatureSet;
  applyWeights(features: FeatureSet): number;
  getName(): string;
}
```

### Search Configuration Pattern
Search algorithms use consistent configuration interfaces:
```typescript
interface SearchConfig {
  maxDepth: number;
  timeLimit: number;
  enablePruning: boolean;
  strategyConfig?: Record<string, unknown>;
}
```

### YAML Weight Configuration
AI weights are now managed through `weights.yaml` for easy tuning without code changes

## Development Commands

### REQUIRED COMMANDS
```bash
bun run dev          # Start development server
bun test             # Run pure function tests
bun run test:full    # Run all tests (MUST pass before commits)
bun run test:ci      # Run CI tests with verbose output
bun run test:dom     # Run DOM-related tests (hooks, store)
bun run test:perf    # Run performance tests
bun run lint         # Code linting (MUST pass before commits)
bun run typecheck    # Type checking (MUST pass before commits)
bun run build        # Production build (MUST succeed before commits)
bun run ci           # Complete CI pipeline
bun run benchmark    # Run AI performance benchmarks (CLI mode available)
bun run e2e          # Run Playwright E2E tests
bun run check:i18n   # Check i18n key consistency
```

### EXECUTION CONDITIONS
- **Before ANY commit**: Run `bun run lint` AND `bun run typecheck`
- **After code changes**: Run `bun test` to verify no regressions
- **Before production**: Run `bun run ci` for complete CI pipeline
- **Git hooks**: Lefthook automatically runs formatting and validation (pre-commit and commit-msg)

## TESTING STRATEGY

### TESTING RULES
**TEST TARGETS**: 
- ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/store/`, `/src/benchmarks/`
- ✅ AI modules in `/src/game/ai/` (all evaluators, search algorithms, core engines)
- ❌ React components, DOM interactions, UI behavior

### CRITICAL: Testing Guidelines for AI Assistants

**❌ NEVER USE `bun run dev` for automated testing**:
- Development server runs indefinitely and blocks terminal
- AI assistants cannot interact with browser-based applications effectively
- Use unit tests and build validation instead

**✅ RECOMMENDED TESTING APPROACHES**:

1. **Unit/Integration Tests** (Preferred):
```bash
bun test src/                    # All unit tests (excludes benchmarks, visual, e2e)
bun test src/game/ai/           # Specific AI module tests
bun run test:dom                # DOM-related tests (hooks, store)
bun run test:perf               # Performance tests
bun run test:full               # Complete test suite
```

2. **Playwright E2E Testing** (When MCP Playwright tools are available):
```bash
# Start dev server in background (for E2E testing only)
bun run dev > /dev/null 2>&1 &
sleep 5
# Use MCP Playwright tools for browser automation
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
- Use BitBoard for high-performance board operations
- Implement 80ms time limits for AI search algorithms
- Use diversity beam search for exploration-exploitation balance

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

## MCP TOOLS INTEGRATION

### PLAYWRIGHT MCP - Browser Automation
- Visual UI validation and screenshot capture  
- User interaction testing and gesture simulation
- Animation behavior analysis and timing validation
- **Usage Criteria**: Only when E2E testing is required

### CONTEXT7 MCP - Documentation Research  
- Research latest library features and capabilities
- Check for breaking changes and compatibility issues
- Troubleshoot technical problems with authoritative documentation
- **Usage Timing**: When investigating new libraries or unfamiliar functionality

### O3 MCP - Advanced Problem Solving
- Resolve complex technical challenges beyond standard solutions
- Architectural design consultation and best practices
- Performance optimization strategies and recommendations
- **Usage Criteria**: When conventional solutions are insufficient or unclear