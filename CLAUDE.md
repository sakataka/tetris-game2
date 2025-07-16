# Tetris Game Project - AI Assistant Guide

AI assistant working on a high-performance TypeScript Tetris implementation with integrated AI engine. This file provides essential context to understand the project structure and development constraints without reading all source code.

## 🚨 Critical Rules & Constraints

| ✅ Required | ❌ Forbidden |
|-------------|-------------|
| Pure functions only (no `class`, no `new`) | Adding classes / OO hierarchies |
| State via Zustand slices or local React state | Direct writes to global objects |
| `unknown` with type guards | `any` type usage |
| i18n with `t('key')` from `/src/locales/*.json` | Hard-coded user-facing strings |
| Tests for pure functions, business logic | Testing React components or UI |
| `@/` imports for cross-directory, `./` for same-directory | Path traversals outside `/src` |
| WCAG 2.2 AA compliance (4.5:1 contrast, keyboard nav) | Click-only interactions |
| Bun test + fast-check for property testing | Jest / Vitest / RTL |

## 📁 Project Structure

```
src/
├── game/                    # Core game logic - TEST ALL
│   ├── ai/                 # Integrated AI engine
│   │   ├── config/         # weights.yaml, runtime configuration
│   │   ├── core/           # BitBoard, collision, move generation
│   │   ├── evaluators/     # Dellacherie, pattern, stacking evaluators
│   │   └── search/         # Beam search, diversity search algorithms
│   ├── animations/         # Animation system with FrameBudgetSentinel
│   └── *.ts               # Game engine (board, scoring, tetrominos)
├── features/               # Feature-Sliced Design - TEST lib/ and model/
│   ├── ai-control/         # AI control feature
│   ├── game-play/          # Game play feature
│   ├── scoring/            # Scoring system
│   └── settings/           # Settings management
├── components/             # Legacy UI components - DO NOT TEST
│   ├── accessibility/      # WCAG 2.2 AA components
│   ├── game/              # Game UI components
│   └── ui/                # shadcn/ui components
├── hooks/                  # React hooks - TEST PURE FUNCTIONS ONLY
├── shared/                 # Reusable modules - TEST ALL
├── utils/                  # Utility functions - TEST ALL
├── locales/               # i18n files (en.json, ja.json)
└── types/                 # TypeScript type definitions
```

## 🔧 Development Commands

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Testing
bun test                    # Unit tests (excludes components)
bun run test:a11y          # Accessibility tests
bun run e2e                # End-to-end tests with Playwright

# Code Quality (MANDATORY before commits)
bun run lint && bun run typecheck
bun run format             # Code formatting
bun run knip               # Dead code detection

# Build & Analysis
bun run build             # Production build
bun run ci                # Complete CI pipeline
bun run analyze           # Bundle analysis
bun run check:i18n        # i18n validation
```

## 🧪 Testing Strategy

### Test These
- ✅ Pure functions in `/src/game/`, `/src/utils/`, `/src/shared/`
- ✅ Feature business logic in `/src/features/*/lib/` and `/src/features/*/model/`
- ✅ AI modules: evaluators, search algorithms, core engines
- ✅ Zustand slices and selectors
- ✅ Property-based tests with fast-check for game mechanics

### Don't Test These
- ❌ React components and UI behavior
- ❌ DOM interactions and rendering
- ❌ Third-party library internals
- ❌ Visual layouts and styling

## 🤖 AI System Architecture

### Core Components
```
/src/game/ai/
├── config/
│   ├── weights.yaml        # Runtime-tunable AI weights
│   └── weight-loader.ts    # Configuration loader
├── core/
│   ├── ai-engine.ts        # Main AI engine
│   ├── bitboard.ts         # High-performance board representation
│   └── collision-detection.ts # SRS-compatible collision detection
├── evaluators/
│   ├── dellacherie.ts      # 6-feature Dellacherie evaluator
│   ├── pattern-evaluator.ts # Pattern-based evaluation
│   └── stacking-evaluator.ts # Stacking strategy evaluation
└── search/
    ├── beam-search.ts      # Beam search algorithm
    ├── diversity-beam-search.ts # Diversity beam search
    └── search-strategy.ts  # Search strategy configuration
```

### Performance Targets
- **BitBoard**: 100,000+ evaluations/second
- **Search Response**: 80ms target for move decisions
- **Move Generation**: <1ms for 1,000 collision checks

### AI Configuration
Runtime-tunable weights in `/src/game/ai/config/weights.yaml`:
```yaml
base:
  linesCleared: 1000.0
  holes: -5.0
  maxHeight: -15.0
  bumpiness: -3.0
```

## 🎯 Feature-Sliced Design

### Layer Rules
- **Game Logic**: `/src/game/` - Pure business logic, no UI dependencies
- **Features**: `/src/features/` - Feature-specific slices with api/lib/model/ui structure
- **Shared**: `/src/shared/` - Reusable utilities, must be dependency-free
- **Components**: `/src/components/` - Legacy UI components (migrating to features)

### Feature Structure
```
feature-name/
├── api/      # External adapters and data fetching
├── lib/      # Business logic and custom hooks (TEST ALL)
├── model/    # Zustand slices and state management (TEST ALL)
└── ui/       # React components (DO NOT TEST)
```

## 🎨 Tech Stack

- **Runtime**: Bun 1.2.18
- **Frontend**: React 19.1 + TypeScript 5.8
- **State**: Zustand 5.0.6 (functional state management)
- **Styling**: Tailwind CSS 4.1 + shadcn/ui + Radix UI
- **Animation**: Motion 12.23
- **Build**: Vite 7.0 (rolldown-vite)
- **Testing**: Bun Test + Playwright + fast-check
- **Quality**: Biome 2.1 + Lefthook 1.12
- **i18n**: i18next 25.3 + react-i18next 15.6

## ♿ Accessibility Requirements

### Mandatory for All UI Contributions
- All interactive elements reachable by Tab in logical order
- ARIA roles and labels properly implemented
- Color contrast ≥ 4.5:1 for normal text
- Keyboard navigation fully functional
- Screen reader announcements for game state changes

### Testing
- Automated: `@axe-core/react` + `axe-playwright`
- Manual: Keyboard-only navigation testing
- Run: `bun run test:a11y`

## 🌍 Internationalization

### Rules
- Use `useTranslation()` hook from `react-i18next`
- All user-facing text must use translation keys
- Keys stored in `/src/locales/{en,ja}.json`
- Default language: English
- Validation: `bun run check:i18n`

### Usage
```typescript
const { t } = useTranslation();
return <button>{t('game.start')}</button>;
```

## 🔄 Development Workflow

1. **Start**: `git switch -c feature/my-change`
2. **Code**: Write code + tests following this guide
3. **Validate**: Run `bun run lint && bun run typecheck && bun test`
4. **Commit**: Follow Conventional Commits format
5. **Test**: E2E tests with `bun run e2e`
6. **Review**: Open PR with clear description

## 📝 State Management (Zustand)

### Critical Rules
- **NEVER** return new objects/arrays from selectors (causes re-renders)
- **ALWAYS** use `useShallow` for object/array selectors
- **PREFER** individual primitive selectors for performance

```typescript
// ✅ Best: Individual primitives
const score = useStore(state => state.score);

// ✅ OK: useShallow for objects
const { a, b } = useStore(useShallow(state => ({ a: state.a, b: state.b })));

// ❌ Never: New objects in selectors
const data = useStore(state => ({ score: state.score })); // Causes re-renders
```

## 🎮 Game Engine Integration

### Core Game Loop
```
Game Loop → AI Engine → Move Evaluation → Board Update → State Sync
```

### AI Integration Points
- **Configuration**: `/src/game/ai/config/weights.yaml`
- **Entry Point**: `/src/game/ai/index.ts`
- **Feature Integration**: `/src/features/ai-control/`

## 🔍 Quick Reference

### Essential Files
- **AI Configuration**: `/src/game/ai/config/weights.yaml`
- **Game Engine**: `/src/game/GameEngine.ts`
- **Main Store**: `/src/app/store/`
- **Theme System**: `/src/contexts/ThemeContext.tsx`
- **i18n Config**: `/src/i18n/config.ts`

### Debug Features
- AI Debug: `?debug=true&ai=advanced&visualization=true`
- Performance: `?debug=true&performance=true`

---

**Last Updated**: 2025-07-16 (Bun 1.2.18, React 19.1, Zustand 5.0.6)