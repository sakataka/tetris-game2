# Tetris Game Project - AI Assistant Development Guide

## 🚨 EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS
1. **Type Error Resolution**: NEVER relax TypeScript checks. ALWAYS fix root cause with proper types/interfaces.
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks. ALWAYS address underlying problems.
3. **Output Hardcoding**: NEVER hardcode user-facing text. ALWAYS use i18n translation files (`/src/locales/`).
4. **Error Suppression**: NEVER hide error messages. ALWAYS implement proper error handling.
5. **Any Type Usage**: NEVER use `any` type. ALWAYS use `unknown` with type guards or explicit interfaces.
6. **Class Usage**: NEVER use classes except for external library interface compliance.

### MANDATORY PATTERNS
- **Imports**: `@/` for cross-directory, `./` for same-directory
- **i18n**: ALL user-facing text MUST use `/src/locales/` files (en.json, ja.json)
- **Functions**: Pure functions over classes for maintainability/testability
- **Testing**: ONLY test pure functions, utilities, business logic. NEVER test React components

## 📋 Development Commands

### CRITICAL COMMANDS (MUST pass before commits)
```bash
bun run lint && bun run typecheck  # MANDATORY before commits
bun test                          # Unit tests (excludes components)
bun run ci                        # Complete CI pipeline validation
```

### TESTING COMMANDS
```bash
bun test                          # Unit tests (excludes components)
bun run test:a11y                # Accessibility-specific Playwright tests
bun run audit:accessibility       # WCAG 2.2 AA compliance audit
bun run e2e                       # End-to-end tests
```

### DOCUMENTATION & ANALYSIS
```bash
bun run storybook                 # Component documentation and visual testing
bun run check:i18n               # Validate i18n translation keys
bun run analyze                  # Bundle analysis
bun run analyze:visual           # Visual bundle analysis
```

### ENGINE PACKAGE COMMANDS
```bash
cd packages/tetris-engine
bun test                         # Engine unit tests
bun run test:coverage            # Engine test coverage
bun run test:performance         # Engine performance benchmarks
bun run test:golden-master       # Golden master tests
bun run build                    # Build engine package
bun run dev                      # Build engine in watch mode
```

### EXECUTION CONDITIONS
- **Before commits**: `bun run lint && bun run typecheck` MUST pass
- **After changes**: `bun test` to verify no regressions
- **Git hooks**: Lefthook auto-runs formatting/validation (biome format & lint)
- **Major releases**: `bun run ci` for complete validation pipeline

## 🏗️ Project Architecture

**AI Decision Point**: Use Feature-Sliced Design. Test business logic in `/features/*/lib/` and `/features/*/model/`. Never test UI components.

### Monorepo Structure
This project uses a monorepo structure with internal packages:

```
tetris-game2/
├── packages/                    # Internal packages
│   └── tetris-engine/          # Core game engine package
│       ├── src/                # Engine source code
│       │   ├── core/          # BitBoard, collision, operations, tetrominos
│       │   ├── events/        # Event bus system
│       │   ├── index.ts       # Main exports
│       │   └── types.ts       # Engine type definitions
│       ├── tests/             # Comprehensive test suite
│       │   ├── bitboard.test.ts
│       │   ├── eventbus.test.ts
│       │   ├── golden-master/  # Golden master tests
│       │   └── performance/    # Performance benchmarks
│       └── package.json       # @tetris-game/engine package
├── src/                        # Main application
└── package.json               # Main application package
```

**@tetris-game/engine Package**:
- **Purpose**: Framework-agnostic, high-performance Tetris game engine
- **Architecture**: Event-driven with BitBoard implementation using Uint32Array
- **Features**: Zero dependencies, tree-shakable, 100% test coverage
- **Testing**: Unit tests, property-based testing, golden master tests, performance benchmarks
- **Build**: TypeScript with ESM/CJS dual format output

### Tech Stack
- **Runtime**: Bun 1.2 (package manager + JavaScript runtime)
- **Frontend**: React 19.1 + TypeScript 5.8 (strict mode)
- **State**: Zustand 5.0 (functional state management)
- **Styling**: Tailwind CSS 4.1 + shadcn/ui + Radix UI
- **Animation**: Motion 12.23
- **i18n**: i18next 25.3 + react-i18next 15.6 (English/Japanese)
- **Build**: Vite 7.0 (rolldown-vite implementation)
- **Quality**: Biome 2.1 (linting/formatting) + Lefthook 1.12 (Git hooks)
- **Testing**: Bun Test + Playwright 1.54 + fast-check 4.2 (property-based testing)
- **Documentation**: Storybook 9.0 (component documentation + visual testing)
- **Accessibility**: @axe-core/react 4.10 + axe-playwright 2.1

### Key Directories
```
/src/
├── app/              # Application setup layer
│   ├── providers/    # Application providers (EffectsProvider)
│   ├── router/       # Routing configuration
│   └── store/        # Store configuration
├── features/         # Feature-Sliced Design architecture (TEST ALL)
│   ├── ai-control/   # AI control feature
│   │   ├── api/      # API adapters (aiWorkerAdapter, weights-loader)
│   │   ├── lib/      # Business logic (useAIControl) - TEST ALL
│   │   ├── model/    # State management (aiSlice) - TEST ALL
│   │   └── ui/       # UI components - DO NOT TEST
│   ├── game-play/    # Game play feature
│   │   ├── api/      # Game engine adapters
│   │   ├── lib/      # Game logic (useGamePlay) - TEST ALL
│   │   ├── model/    # State management (gamePlaySlice) - TEST ALL
│   │   └── ui/       # UI components - DO NOT TEST
│   ├── scoring/      # Scoring feature
│   │   ├── api/      # Score storage
│   │   ├── lib/      # Scoring logic (useScoring) - TEST ALL
│   │   ├── model/    # State management (scoringSlice) - TEST ALL
│   │   └── ui/       # Score UI components - DO NOT TEST
│   └── settings/     # Settings feature
│       ├── api/      # Settings storage
│       ├── lib/      # Settings logic (useSettings) - TEST ALL
│       ├── model/    # State management (settingsSlice) - TEST ALL
│       └── ui/       # Settings UI components - DO NOT TEST
├── game/             # Core game logic - TEST ALL
│   ├── ai/          # AI system - weights.yaml, evaluators, search algorithms
│   │   ├── config/  # Runtime-tunable weights.yaml configuration
│   │   ├── core/    # BitBoard, collision detection, move generation
│   │   ├── evaluators/ # Dellacherie, Pattern, Stacking evaluators
│   │   └── search/  # Beam search, diversity search, pattern search
│   └── animations/  # Animation core, FrameBudgetSentinel
├── components/       # React UI - DO NOT TEST (Legacy, migrating to features/)
│   ├── accessibility/ # Skip links, WCAG 2.2 AA components
│   ├── game/        # Game UI components with Stories
│   ├── layout/      # Layout components for mobile/desktop
│   └── ui/          # shadcn/ui components
├── contexts/         # React contexts - TEST ALL
│   ├── AnimationContext.tsx # Animation orchestration
│   └── ThemeContext.tsx     # Compact/Normal/Gaming themes
├── design-tokens/    # Design system - TEST ALL
├── hooks/           # React hooks - TEST PURE FUNCTIONS ONLY
│   ├── accessibility/ # Focus management, screen reader
│   ├── ai/          # Advanced AI controller hooks
│   ├── controls/    # Input handling, keyboard/touch controls
│   └── core/        # Game loop, action handlers, performance monitoring
├── shared/          # Shared modules - TEST ALL
│   ├── effects/     # Game effects
│   ├── events/      # Type-safe event system
│   ├── types/       # Shared type definitions
│   └── utils/       # Shared utilities
├── store/           # Zustand stores - TEST ALL (Legacy, migrating to features/)
│   ├── gameStore.ts     # Game state management
│   ├── settingsStore.ts # User preferences, AI settings
│   └── highScoreStore.ts # High score persistence
├── utils/           # Utilities - TEST ALL
├── locales/         # i18n files (en.json, ja.json)
├── test/            # Test utilities, mocks, generators
└── types/           # TypeScript type definitions
```

### Architecture Pattern: Feature-Sliced Design
**Current Migration**: Transitioning from component-centric to Feature-Sliced Design
- **Features Layer**: `/src/features/` - Business logic organized by feature
- **Shared Layer**: `/src/shared/` - Reusable modules across features
- **App Layer**: `/src/app/` - Application configuration and providers
- **Legacy**: `/src/components/` and `/src/store/` - Gradually migrating to features

**Each Feature Structure**:
- `api/` - External API adapters and data fetching
- `lib/` - Business logic and custom hooks (TEST ALL)
- `model/` - State management slices (TEST ALL)
- `ui/` - React components (DO NOT TEST)

### State Management (Zustand v5)
**CRITICAL Selector Rules**:
- **NEVER** return new objects/arrays from selectors (causes re-renders)
- **ALWAYS** use `useShallow` for object/array selectors 
- **PREFER** individual primitive selectors for max performance

```typescript
// ✅ BEST: Individual primitives
const score = useStore(state => state.score);
// ✅ OK: useShallow for objects
const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));
```

### Theme System
**Modes**: Compact/Normal/Gaming with adaptive performance integration
**Design Tokens**: Auto-generated CSS variables from comprehensive token system
**Performance**: Gaming mode disabled on low-performance devices

## 🤖 AI System Architecture

**AI Decision Point**: Use `/src/game/ai/config/weights.yaml` for tuning. Target 100k+ evaluations/sec performance.

### AI Core
- **BitBoard**: High-performance Uint32Array representation (target: 100,000+ evaluations/sec)
- **Evaluators**: Dellacherie (6-feature), Pattern (PCO/DT/ST-Stack), Stacking, Advanced Features
- **Search**: Beam search, Diversity beam search, Hold search, Pattern search (80ms response target)
- **Move Generation**: SRS-compatible with collision detection (< 1ms for 1,000 checks)

### AI Configuration (weights.yaml)
**Runtime-tunable weights** without code changes:
- **Base weights**: linesCleared (1000.0), holes (-5.0), maxHeight (-15.0), bumpiness (-3.0)
- **Phase weights**: Early/Mid/Late game adaptations
- **Dynamic adjustments**: Danger zone, survival mode, cleanup mode multipliers

**Sample weights.yaml**:
```yaml
base:
  linesCleared: 1000.0
  holes: -5.0
  maxHeight: -15.0
  bumpiness: -3.0
  
phase:
  early: 1.0
  mid: 1.2
  late: 1.5
```

**AI Debug**: `?debug=true&ai=advanced&visualization=true`

## 🧪 Testing Strategy

**AI Decision Point**: Focus on pure functions and business logic. Never test React components.

### Test Targets
- ✅ **Pure functions**: `/src/game/`, `/src/utils/`, `/src/shared/`
- ✅ **Feature business logic**: `/src/features/*/lib/`, `/src/features/*/model/`
- ✅ **AI modules**: All evaluators, search algorithms, core engines
- ✅ **Engine package**: All `/packages/tetris-engine/` modules
- ❌ **React components**: UI components, DOM interactions, UI behavior

### Test Architecture
- **Unit Tests**: Pure functions, game logic, AI algorithms, feature business logic
- **Property-Based Tests**: Using fast-check for game mechanics validation
- **Accessibility Tests**: Automated WCAG 2.2 AA compliance via axe-playwright
- **E2E Tests**: Playwright tests for user workflows and cross-platform compatibility
- **Visual Tests**: Storybook stories with interaction and visual regression testing

### AI Assistant Guidelines
- **❌ NEVER** use `bun run dev` for automated testing (blocks terminal)
- **❌ NEVER** test React components - focus on pure functions and business logic

## 🔧 Development Patterns

**AI Decision Point**: Use pure functions over classes. Separate AI logic from React state for performance.

### React Best Practices
- **useEffect**: Use `useRef` for AI state, minimal dependencies to avoid infinite loops
- **AI Performance**: Separate AI logic from React state, implement timeout cleanup
- **State Updates**: Conditional updates to prevent unnecessary renders

## ♿ Accessibility (WCAG 2.2 AA)

**AI Decision Point**: Use `bun run audit:accessibility` to validate WCAG 2.2 AA compliance. Include accessibility tests in development.

- **Skip Links**: Keyboard navigation shortcuts (`/src/components/accessibility/SkipLinks.tsx`)
- **Screen Reader**: Comprehensive announcements for game state changes
- **Focus Management**: Proper tab order and focus indicators
- **Testing**: `@axe-core/react` + Playwright audits

## 📚 Component Documentation

**AI Decision Point**: Use `bun run storybook` for component development and visual testing. Create Stories for new components.

**Storybook**: Interactive documentation with a11y testing, visual testing, design token examples  
**Location**: `/src/components/*/[Component].stories.tsx`

## 🔧 MCP Tool Usage Guidelines

**AI Decision Point**: Use MCP tools selectively for their specific purposes. Always provide detailed context for better results.

### When to Use MCP Tools
Use these specialized MCP tools only when specifically needed for their intended purposes:

#### 1. **O3 MCP (`mcp__o3__o3-search`)**
- **Purpose**: Advanced web search and complex problem consultation
- **When to use**: Architecture decisions, technical research, best practices inquiry

#### 2. **Context7 MCP (`mcp__context7__resolve-library-id`, `mcp__context7__get-library-docs`)**
- **Purpose**: Library documentation lookup and API reference
- **When to use**: Need current documentation for specific libraries/frameworks
- **Process**: First resolve library ID, then fetch documentation

#### 3. **Playwright MCP (`mcp__playwright__*`)**
- **Purpose**: End-to-end testing and browser automation
- **When to use**: 
  - Running `bun run e2e` tests
  - Accessibility testing (`bun run test:a11y`)
  - Cross-platform compatibility validation
  - UI workflow testing
- **Integration**: Works with project's existing Playwright configuration

## 📖 Quick Reference

### Development Workflow
1. **Initial setup**: `bun install && bun run dev` (first time setup)
2. **Before commits**: `bun run lint && bun run typecheck` (MUST pass)
3. **Testing**: `bun test` for feedback, avoid React component tests
4. **Major changes**: `bun run ci` for complete validation

### Architecture Decisions
- **No classes**: Use pure functions and functional patterns
- **No `any` types**: Use `unknown` with type guards or explicit interfaces
- **No hardcoded text**: Use i18n translation files (`/src/locales/`)
- **Theme system**: Compact/Normal/Gaming modes with performance awareness
- **Accessibility first**: WCAG 2.2 AA compliance with automated testing

### Quick Access
- **Engine Package**: `/packages/tetris-engine/` (core game engine)
- **AI Config**: `/src/game/ai/config/weights.yaml` (runtime-tunable weights)
- **AI Debug**: `?debug=true&ai=advanced&visualization=true`
- **Design Tokens**: `/src/design-tokens/index.ts` (comprehensive token system)
- **Theme Context**: `/src/contexts/ThemeContext.tsx` (Compact/Normal/Gaming)
- **i18n Files**: `/src/locales/en.json`, `/src/locales/ja.json`
- **Accessibility**: `bun run audit:accessibility` (WCAG 2.2 AA)
- **Bundle Analysis**: `bun run analyze` (bundle size analysis)
- **Documentation**: `bun run storybook` (component docs + visual testing)