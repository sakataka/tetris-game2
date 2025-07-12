# Tetris Game Project - AI Assistant Development Guide

## 🚨 EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS (No Exceptions)
1. **Type Error Resolution**: NEVER relax TypeScript checks to resolve issues. ALWAYS fix the root cause by implementing proper types, interfaces, or type guards.
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks for error avoidance. ALWAYS address the underlying problem causing test failures.
3. **Output Hardcoding**: NEVER hardcode user-facing text or API responses. ALWAYS use i18n translation files and proper data sources.
4. **Error Suppression**: NEVER hide or ignore error messages. ALWAYS implement proper error handling or resolve the underlying issue.
5. **Temporary Fixes**: NEVER implement temporary solutions that create technical debt. ALWAYS build sustainable, maintainable solutions.
6. **Any Type Usage**: NEVER use `any` type. ALWAYS use `unknown` with proper type guards or define explicit interfaces/types.
7. **Class Usage**: NEVER use class-based implementations except when absolutely necessary for interface compliance with external libraries.

### MANDATORY EXECUTION PATTERNS
- **Path Import Rules**: ALWAYS use `@/` prefix for cross-directory imports. ALWAYS use `./` prefix for same-directory imports.
- **i18n Compliance**: ALL user-facing text MUST use translation files located in `/src/locales/` directory.
- **Functional Programming**: ALWAYS prefer pure functions over class-based implementations for maintainability and testability.
- **Test Focus**: ONLY test pure functions, utility modules, and business logic. NEVER test React components or framework behavior.

## 📋 Development Commands

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
- **Before ANY commit**: Execute `bun run lint` AND `bun run typecheck` (both MUST pass)
- **After code changes**: Execute `bun test` to verify no regressions
- **Before production**: Execute `bun run ci` for complete CI pipeline validation
- **Git hooks**: Lefthook automatically runs formatting and validation (pre-commit and commit-msg)

## 🏗️ Project Architecture

### Core Implementation Stack

#### Application Libraries (Confirmed Versions)
- **Frontend Framework**: React 19.1.0 with TypeScript 5.8.3 in strict mode
- **State Management**: Zustand 5.0.6 (functional state management)
- **Styling**: Tailwind CSS 4.1.11 with utility-first approach
- **Animation**: Motion 12.23.3 for physics-based animations
- **Internationalization**: i18next 25.3.2 + react-i18next 15.6.0
- **UI Components**: shadcn/ui with Radix UI primitives (@radix-ui components)
- **Utilities**: clsx 2.1.1, tailwind-merge 3.3.1, immer 10.1.1

#### Development & Build Tools
- **Runtime Environment**: Bun 1.2.18 (package manager, test runner, dev server)
- **Build System**: Vite 7.0.8+ (rolldown-vite for enhanced performance)
- **Code Quality**: Biome 2.1.1 (linting and formatting)
- **Git Hooks**: Lefthook 1.12.2 (automated pre-commit validation)
- **Testing Framework**: Bun Test, Playwright 1.54.1, fast-check 4.2.0

### Directory Structure
```
src/
├── benchmarks/    # Performance benchmarks (TEST ALL)
├── components/    # React UI components (DO NOT TEST)
│   ├── common/, game/, layout/, ui/
├── game/          # Pure game logic (TEST ALL)
│   ├── ai/        # AI system (TEST ALL)
│   │   ├── config/weights.yaml      # AI weight configuration
│   │   ├── core/                    # BitBoard, AI engine, collision detection
│   │   ├── evaluators/              # Dellacherie, pattern, stacking evaluators
│   │   └── search/                  # Beam search, hold search algorithms
│   └── [core game files]            # Board, pieces, scoring, T-spin
├── hooks/         # React hooks (TEST PURE FUNCTIONS ONLY)
│   ├── ai/, controls/, core/, ui/
├── store/         # Zustand stores (TEST ALL)
├── types/         # TypeScript definitions
├── utils/         # Utilities (TEST ALL)
├── locales/       # i18n files (en.json, ja.json)
├── i18n/          # i18n configuration
├── lib/           # Shared utilities
└── test/          # Test utilities and mocks
```

### State Management Architecture

**Store Modules**: GameStore, SettingsStore, HighScoreStore

**CRITICAL: Zustand v5 Selector Requirements**:
- **NEVER** return new objects/arrays directly from selectors (causes unnecessary re-renders)
- **ALWAYS** use `useShallow` for object/array selectors to prevent reference equality issues
- **PREFER** individual primitive selectors when possible for maximum performance

```typescript
// ✅ CORRECT: Use useShallow for object selectors
import { useShallow } from "zustand/shallow";
const { a, b } = useStore(useShallow((state) => ({ a: state.a, b: state.b })));

// ✅ BEST: Individual primitive selectors
const a = useStore((state) => state.a);
const b = useStore((state) => state.b);
```

## 🤖 AI System Architecture

### Core AI Components

**Game Systems**:
- Board Operations: 20×10 grid with collision detection
- Tetromino Management: 7 pieces with Super Rotation System (SRS)
- AI Implementation: Multi-level AI system with BitBoard optimization

**AI Core Engine**:
- **BitBoard**: High-performance board representation using Uint32Array (target: 100,000+ evaluations/sec)
- **Advanced AI Engine**: Multi-phase decision engine with beam search
- **Collision Detection**: Optimized position validation (target: < 1ms for 1,000 checks)
- **Move Generator**: Move analysis with SRS support
- **Piece Bits**: Optimized piece bit manipulation

### AI Evaluators and Strategies

**BaseEvaluator Interface**: All AI evaluators implement a unified interface for consistency:
```typescript
interface BaseEvaluator {
  evaluate(state: BoardState): number;
  calculateFeatures(board: BitBoard): FeatureSet;
  applyWeights(features: FeatureSet): number;
  getName(): string;
}
```

**Available Evaluators**:
- **Dellacherie**: Modularized 6-feature heuristic system with separate feature extractors
- **Advanced Features**: T-Spin detection, Perfect Clear opportunities, danger zone analysis
- **Pattern Evaluator**: PCO, DT Cannon, ST-Stack competitive pattern detection
- **Stacking Evaluator**: Stacking-focused evaluation with gradual line building strategy

### AI Configuration System (weights.yaml)

Runtime-tunable AI weights without code changes:

```yaml
evaluators:
  dellacherie:
    linesCleared: 1000.0     # Primary reward
    holes: -5.0              # Heavy penalty
    maxHeight: -15.0         # Height control
    bumpiness: -3.0          # Surface smoothness
    # ... other parameters
    
  phaseWeights:
    early:    # height ≤ 6: Foundation building
    mid:      # height 6-12: Aggressive clearing  
    late:     # height > 12: Survival mode
```

**Key Parameters**:
- **Positive values**: Rewards (linesCleared, rowFillRatio)
- **Negative values**: Penalties (holes, maxHeight, bumpiness)
- **Phase weights**: Multiply with base weights by game phase
- **Dynamic adjustments**: Emergency multipliers for danger/survival modes

**AI Tuning**:
- Changes take effect immediately
- Debug mode: `?debug=true&ai=advanced&visualization=true`
- Benchmarks: `bun run benchmark`

### Search Algorithms

**Search Configuration Pattern**: All search algorithms use consistent interfaces:
```typescript
interface SearchConfig {
  maxDepth: number;
  timeLimit: number;
  enablePruning: boolean;
  strategyConfig?: Record<string, unknown>;
}
```

**Available Search Strategies**:
- **Beam Search**: Multi-depth lookahead with configurable beam width (5-20)
- **Diversity Beam Search**: Exploration-exploitation balance with surface profile analysis
- **Hold Search**: Strategic Hold piece utilization with penalty system
- **Pattern Search**: Depth-first search for pattern completion opportunities
- **Performance Target**: Search algorithms target 80ms response time

## 🧪 Testing Strategy

### Testing Rules
**TEST TARGETS**: 
- ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/store/`, `/src/benchmarks/`
- ✅ AI modules in `/src/game/ai/` (all evaluators, search algorithms, core engines)
- ❌ React components, DOM interactions, UI behavior

### Testing Approaches

#### 1. Unit/Integration Tests (Preferred)
```bash
bun test src/                    # All unit tests (excludes benchmarks, visual, e2e)
bun test src/game/ai/           # Specific AI module tests
bun run test:dom                # DOM-related tests (hooks, store)
bun run test:perf               # Performance tests
bun run test:full               # Complete test suite
```

#### 2. Test Examples

**Pure Function Tests**:
```typescript
describe("boardUtils", () => {
  test("should validate board positions", () => {
    expect(isValidBoardPosition({ x: 0, y: 0 })).toBe(true);
    expect(isValidBoardPosition({ x: -1, y: 0 })).toBe(false);
  });
});
```

**AI Performance Tests**:
```typescript
describe("BitBoard", () => {
  it("should meet performance targets", () => {
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
      bitboard.hasCollision(testPosition);
    }
    expect(performance.now() - startTime).toBeLessThan(100);
  });
});
```

**Store Tests**:
```typescript
describe("GameStore", () => {
  it("should update without unnecessary renders", () => {
    const { result } = renderHook(() => useGameStore(state => state.score));
    act(() => useGameStore.getState().updateScore(100));
    expect(result.current).toBe(100);
  });
});
```

#### 3. AI Performance Testing
```bash
bun run benchmark               # CLI-based AI performance benchmarks
bun run test:perf              # Automated performance regression tests
```

### CRITICAL: Testing Guidelines for AI Assistants

**❌ NEVER USE `bun run dev` for automated testing**:
- Development server runs indefinitely and blocks terminal execution
- AI assistants cannot interact with browser-based applications effectively
- Use unit tests and build validation instead for reliable automated testing

**✅ Build Validation** (Always run for production readiness):
```bash
bun run build
bun run lint
bun run typecheck
```

## 🔧 Development Patterns

### React useEffect Best Practices

**❌ DANGEROUS**: Dependencies cause infinite loops
**✅ CORRECT**: Use `useRef` for AI state, minimal dependencies

### AI-Specific Development Patterns
- Use `useRef` for AI state that should not trigger re-renders
- Implement timeout cleanup for AI thinking loops to prevent memory leaks
- Separate AI decision logic from React state updates for performance
- Use BitBoard for high-performance board operations (target: 100,000+ evaluations/sec)
- Implement 80ms time limits for AI search algorithms (target for responsiveness)
- Use diversity beam search for exploration-exploitation balance in decision making

### State Management Best Practices
- Use individual primitive selectors: `useStore(state => state.score)`
- Use `useShallow` for object selectors
- Conditional updates to prevent unnecessary renders

## 🛠️ Development Tools and Debugging

### Debug Mode System
```bash
# Basic debug mode
http://localhost:5173/?debug=true&preset=tetris

# AI debug with visualization
http://localhost:5173/?debug=true&ai=advanced&visualization=true
```

### MCP Tools Integration
- **PLAYWRIGHT**: E2E testing and UI validation only
- **CONTEXT7**: Library documentation research
- **O3**: Complex technical problem solving

## 📏 Code Quality Enforcement

- Fix TypeScript errors at root cause, never relax checking
- Address test failures, never skip tests
- Use i18n for all user-facing text (`/src/locales/`)
- Prefer pure functions over classes
- Check existing shadcn/ui components before creating new ones

---

## 📖 Quick Reference Summary

### Daily Development Workflow
1. **Before starting**: Check `CLAUDE.md` for project-specific rules
2. **During development**: Use `bun test` for immediate feedback
3. **Before committing**: Run `bun run lint && bun run typecheck` (MUST pass)
4. **Major changes**: Run `bun run ci` for complete validation

### Key Architecture Decisions
- **No classes**: Use pure functions and functional patterns
- **No `any` types**: Use `unknown` with type guards or explicit interfaces
- **No hardcoded text**: Use i18n translation files (`/src/locales/`)
- **No component tests**: Focus on pure function and business logic testing

### AI System Quick Access
- **Config**: `/src/game/ai/config/weights.yaml` (runtime tunable)
- **Debug**: `http://localhost:5173/?debug=true&ai=advanced&visualization=true`
- **Benchmarks**: `bun run benchmark` for performance testing
- **Core**: BitBoard system for high-performance evaluations

### Emergency Troubleshooting
- **Build fails**: Check TypeScript errors, run `bun run typecheck`
- **Tests fail**: Check pure function implementations, avoid React component tests
- **AI performance**: Check weights.yaml configuration, use debug mode
- **State issues**: Verify Zustand selector patterns, use `useShallow` for objects

*This document provides comprehensive guidelines for AI assistants working on the Tetris Game project. All rules and patterns should be strictly followed to maintain code quality and project consistency.*