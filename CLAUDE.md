# Tetris Game Project - AI Assistant Development Guide

## 🚨 EXECUTION PRIORITY: Critical Development Rules

### ABSOLUTE PROHIBITIONS
1. **Type Error Resolution**: NEVER relax TypeScript checks. ALWAYS fix root cause with proper types/interfaces.
2. **Test Bypassing**: NEVER skip tests or use inappropriate mocks. ALWAYS address underlying problems.
3. **Output Hardcoding**: NEVER hardcode user-facing text. ALWAYS use i18n translation files (`/src/locales/`).
4. **Error Suppression**: NEVER hide error messages. ALWAYS implement proper error handling.
5. **Temporary Fixes**: NEVER implement temporary solutions. ALWAYS build sustainable solutions.
6. **Any Type Usage**: NEVER use `any` type. ALWAYS use `unknown` with type guards or explicit interfaces.
7. **Class Usage**: NEVER use classes except for external library interface compliance.

### MANDATORY PATTERNS
- **Imports**: `@/` for cross-directory, `./` for same-directory
- **i18n**: ALL user-facing text MUST use `/src/locales/` files (en.json, ja.json)
- **Functions**: Pure functions over classes for maintainability/testability
- **Testing**: ONLY test pure functions, utilities, business logic. NEVER test React components

## 📋 Development Commands

### CRITICAL COMMANDS
```bash
bun run lint && bun run typecheck  # MUST pass before commits
bun test                          # Unit tests (excludes components/benchmarks)
bun test:full                     # Full test suite including performance tests
bun run ci                        # Complete CI pipeline validation
bun run benchmark                 # AI performance benchmarks
bun run audit:accessibility       # WCAG 2.2 AA accessibility compliance
bun run audit:accessibility:comprehensive  # Comprehensive accessibility audit
bun run storybook                 # Component documentation and visual testing
bun run e2e                       # Playwright end-to-end tests
```

### ADDITIONAL COMMANDS
```bash
bun run check:i18n               # Validate i18n translation keys
bun run measure:space-efficiency  # Space usage optimization analysis
bun run test:a11y                # Accessibility-specific tests
bun run build-storybook          # Build Storybook for production
```

### EXECUTION CONDITIONS
- **Before commits**: `bun run lint && bun run typecheck` MUST pass
- **After changes**: `bun test` to verify no regressions
- **Git hooks**: Lefthook auto-runs formatting/validation (biome format & lint)
- **Major releases**: `bun run ci` for complete validation pipeline

## 🏗️ Project Architecture

### Tech Stack
- **Runtime**: Bun 1.2.18 (package manager + JavaScript runtime)
- **Frontend**: React 19.1.0 + TypeScript 5.8.3 (strict mode)
- **State**: Zustand 5.0.6 (functional state management)
- **Styling**: Tailwind CSS 4.1.11 + shadcn/ui + Radix UI
- **Animation**: Motion 12.23.3
- **i18n**: i18next 25.3.2 + react-i18next 15.6.0 (English/Japanese)
- **Build**: Vite 7.0.8 (rolldown-vite implementation)
- **Quality**: Biome 2.1.1 (linting/formatting) + Lefthook 1.12.2 (Git hooks)
- **Testing**: Bun Test + Playwright 1.54.1 + fast-check 4.2.0 (property-based testing)
- **Documentation**: Storybook 9.0.16 (component documentation + visual testing)
- **Accessibility**: @axe-core/react 4.10.2 + axe-playwright 2.1.0

### Key Directories
```
src/
├── game/             # Core game logic (TEST ALL)
│   ├── ai/          # AI system - weights.yaml, evaluators, search algorithms
│   │   ├── config/  # Runtime-tunable weights.yaml configuration
│   │   ├── core/    # BitBoard, collision detection, move generation
│   │   ├── evaluators/ # Dellacherie, Pattern, Stacking evaluators
│   │   └── search/  # Beam search, diversity search, pattern search
│   └── animations/  # Animation core, FrameBudgetSentinel
├── components/       # React UI (DO NOT TEST)
│   ├── accessibility/ # Skip links, WCAG 2.2 AA components
│   ├── game/        # Game UI components with Stories
│   ├── layout/      # Layout components for mobile/desktop
│   └── ui/          # shadcn/ui components
├── contexts/         # React contexts (TEST ALL)
│   ├── AnimationContext.tsx # Animation orchestration
│   └── ThemeContext.tsx     # Compact/Normal/Gaming themes
├── design-tokens/    # Design system (TEST ALL) - comprehensive token system
├── hooks/           # React hooks (TEST PURE FUNCTIONS ONLY)
│   ├── accessibility/ # Focus management, screen reader
│   ├── ai/          # Advanced AI controller hooks
│   ├── controls/    # Input handling, keyboard/touch controls
│   └── core/        # Game loop, action handlers, performance monitoring
├── store/           # Zustand stores (TEST ALL)
│   ├── gameStore.ts     # Game state management
│   ├── settingsStore.ts # User preferences, AI settings
│   └── highScoreStore.ts # High score persistence
├── utils/           # Utilities (TEST ALL) - game constants, validation
├── locales/         # i18n files (en.json, ja.json)
├── benchmarks/      # Performance benchmarks (TEST ALL) - AI, collision, bitboard
├── test/            # Test utilities, mocks, generators
└── types/           # TypeScript type definitions
```

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

**AI Debug**: `?debug=true&ai=advanced&visualization=true`

## 🧪 Testing Strategy

### Testing Rules
**TEST TARGETS**: 
- ✅ Pure functions: `/src/game/`, `/src/utils/`, `/src/store/`, `/src/benchmarks/`
- ✅ AI modules: All evaluators, search algorithms, core engines
- ❌ React components, DOM interactions, UI behavior

### Key Testing Commands
```bash
bun test                        # Unit tests (excludes components/benchmarks)
bun test:full                   # Full test suite including performance tests
bun run benchmark               # AI performance benchmarks
bun run test:a11y               # Accessibility-specific Playwright tests
bun run audit:accessibility     # WCAG 2.2 AA automated compliance audit
bun run e2e                     # Full Playwright end-to-end testing
bun run storybook               # Component documentation with visual testing
```

### Testing Architecture
- **Unit Tests**: Pure functions, game logic, AI algorithms, stores
- **Property-Based Tests**: Using fast-check for game mechanics validation
- **Performance Tests**: Benchmarks for AI evaluation speed (100k+ evaluations/sec target)
- **Accessibility Tests**: Automated WCAG 2.2 AA compliance via axe-playwright
- **E2E Tests**: Playwright tests for user workflows and cross-platform compatibility
- **Visual Tests**: Storybook stories with interaction and visual regression testing

### CRITICAL for AI Assistants
**❌ NEVER** use `bun run dev` for automated testing (blocks terminal)
**✅ ALWAYS** use unit tests and build validation for reliable testing
**❌ NEVER** test React components - focus on pure functions and business logic
**✅ ALWAYS** run `bun run ci` before major changes to ensure full validation

## 🔧 Development Patterns

### React Best Practices
- **useEffect**: Use `useRef` for AI state, minimal dependencies to avoid infinite loops
- **AI Performance**: Separate AI logic from React state, implement timeout cleanup
- **State Updates**: Conditional updates to prevent unnecessary renders

## ♿ Accessibility (WCAG 2.2 AA)
- **Skip Links**: Keyboard navigation shortcuts (`/src/components/accessibility/SkipLinks.tsx`)
- **Screen Reader**: Comprehensive announcements for game state changes
- **Focus Management**: Proper tab order and focus indicators
- **Testing**: `@axe-core/react` + Playwright audits

## 📚 Component Documentation
**Storybook**: Interactive documentation with a11y testing, visual testing, design token examples
**Location**: `src/components/*/[Component].stories.tsx`

## 📖 Quick Reference

### Development Workflow
1. **Before commits**: `bun run lint && bun run typecheck` (MUST pass)
2. **Testing**: `bun test` for feedback, avoid React component tests
3. **Major changes**: `bun run ci` for complete validation

### Architecture Decisions
- **No classes**: Use pure functions and functional patterns
- **No `any` types**: Use `unknown` with type guards or explicit interfaces
- **No hardcoded text**: Use i18n translation files (`/src/locales/`)
- **Theme system**: Compact/Normal/Gaming modes with performance awareness
- **Accessibility first**: WCAG 2.2 AA compliance with automated testing

### Quick Access
- **AI Config**: `/src/game/ai/config/weights.yaml` (runtime-tunable weights)
- **AI Debug**: `?debug=true&ai=advanced&visualization=true`
- **Design Tokens**: `/src/design-tokens/index.ts` (comprehensive token system)
- **Theme Context**: `/src/contexts/ThemeContext.tsx` (Compact/Normal/Gaming)
- **i18n Files**: `/src/locales/en.json`, `/src/locales/ja.json`
- **Accessibility**: `bun run audit:accessibility` (WCAG 2.2 AA)
- **Performance**: `bun run benchmark` (AI evaluation speed testing)
- **Documentation**: `bun run storybook` (component docs + visual testing)
- **Git Hooks**: `lefthook.yml` (auto-format, lint validation)
- **Code Quality**: `biome.json` (linting/formatting configuration)

### Troubleshooting
- **Build fails**: `bun run typecheck` for TypeScript errors, check import paths (`@/` vs `./`)
- **Tests fail**: Focus on pure functions, avoid React component tests, check test exclusions
- **Linting issues**: `bun run lint` with Biome auto-fix, check biome.json configuration
- **Git hooks fail**: Verify Lefthook installation (`lefthook install`), check commit message format
- **AI issues**: Check `/src/game/ai/config/weights.yaml`, use debug mode with `?debug=true`
- **State issues**: Use proper Zustand selectors with `useShallow`, avoid object returns
- **Theme issues**: Verify ThemeProvider wrapper, CSS variable injection, check design tokens
- **i18n issues**: `bun run check:i18n` to validate translation keys consistency
- **Accessibility**: `bun run audit:accessibility` for WCAG compliance, `bun run test:a11y` for Playwright tests
- **Performance**: `bun run benchmark` for AI evaluation speed, `bun run measure:space-efficiency`
- **Documentation**: `bun run storybook` for component docs, Stories files for visual testing

*Follow all rules strictly for code quality and project consistency.*