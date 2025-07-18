# Tetris Game Project - AI Assistant Guide

AI assistant working on a high-performance TypeScript Tetris implementation with integrated AI engine. This file provides essential context to understand the project structure and development constraints without reading all source code.

## 🚨 Critical Rules & Constraints

### ✅ Required Practices
- Pure functions only (no `class`, no `new`)
- State via Zustand slices or local React state
- `unknown` with type guards for type safety
- i18n with `t('key')` from `/src/locales/*.json`
- Tests for pure functions and business logic
- `@/` imports for cross-directory, `./` for same-directory
- WCAG 2.2 AA compliance (4.5:1 contrast, keyboard nav)
- Bun test + fast-check for property testing
- Minimal comments: only for non-obvious implementations or design intent

### ❌ Forbidden Practices
- Adding classes / OO hierarchies
- Direct writes to global objects
- `any` type usage
- Hard-coded user-facing strings
- Testing React components or UI
- Path traversals outside `/src`
- Click-only interactions
- Jest / Vitest / RTL usage
- Excessive code comments (code should be self-explanatory)

## 📁 Project Structure

```
src/
├── app/                    # Application structure
│   ├── layouts/            # Layout components
│   ├── pages/              # Page components
│   └── providers/          # App-level providers
├── game/                   # Core game logic - TEST ALL
│   ├── ai/                 # Simple AI implementation
│   │   ├── index.ts        # AI exports
│   │   └── simple-ai.ts    # Basic AI engine with heuristics
│   ├── animations/         # Animation system with FrameBudgetSentinel
│   │   ├── config/         # Animation configuration
│   │   ├── core/           # Core animation logic
│   │   └── sentinel/       # FrameBudgetSentinel implementation
│   ├── GameEngine.ts       # Game engine interface
│   ├── SimpleGameEngine.ts # Game engine implementation
│   └── *.ts               # Game logic (board, scoring, tetrominos)
├── features/               # Feature-Sliced Design - TEST lib/ and model/
│   ├── ai-control/         # AI control feature
│   ├── game-play/          # Game play feature
│   ├── scoring/            # Scoring system
│   └── settings/           # Settings management
├── hooks/                  # React hooks - TEST PURE FUNCTIONS ONLY
│   ├── accessibility/      # Accessibility hooks
│   ├── actions/            # Action hooks
│   ├── animations/         # Animation hooks
│   ├── common/             # Common hooks
│   ├── controls/           # Control hooks
│   ├── core/               # Core hooks
│   ├── data/               # Data hooks
│   ├── effects/            # Effect hooks
│   ├── game/               # Game hooks
│   ├── selectors/          # Selector hooks
│   └── ui/                 # UI hooks
├── shared/                 # Reusable modules - TEST ALL
│   ├── config/             # Configuration
│   ├── effects/            # Shared effects
│   ├── events/             # Event system
│   ├── lib/                # Shared libraries
│   ├── mocks/              # Mock implementations
│   ├── performance/        # Performance utilities
│   ├── types/              # Shared types
│   ├── ui/                 # Shared UI components (DO NOT TEST)
│   └── utils/              # Shared utilities
├── utils/                  # Utility functions - TEST ALL
├── locales/               # i18n files (en.json, ja.json)
├── types/                 # TypeScript type definitions
├── contexts/              # React contexts
├── design-tokens/         # Design tokens
├── i18n/                  # i18n configuration
├── lib/                   # Library utilities
├── styles/                # Global styles
└── test/                  # Test utilities and setup
```

## 🔧 Development Commands

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Testing
bun test                    # Unit tests (excludes components)

# Code Quality (MANDATORY before commits)
bun run lint && bun run typecheck
bun run format             # Code formatting
bun run check:i18n        # i18n validation

# Build
bun run build             # Production build

# Git hooks
bun run prepare           # Install lefthook

# Debug
bun run analyze:bundle     # Analyze bundle size
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

### Simple AI Implementation
```
/src/game/ai/
├── index.ts           # AI exports
└── simple-ai.ts      # Basic AI engine implementation
```

### AI Features
- **Basic AI**: Simple heuristic-based AI with 4 evaluation criteria:
  - Height penalty: -0.510066
  - Lines cleared reward: 0.760666
  - Holes penalty: -0.35663
  - Bumpiness penalty: -0.184483
- **Integration**: Integrated with game engine through feature slices
- **Performance**: Lightweight implementation for real-time gameplay

### AI Configuration
- AI behavior is controlled through the `/src/features/ai-control/` feature
- No external configuration files - all logic is code-based
- Simple evaluation functions for piece placement decisions

## 🎯 Feature-Sliced Design

### Layer Rules
- **App**: `/src/app/` - Application structure (layouts, pages, providers)
- **Game Logic**: `/src/game/` - Pure business logic, no UI dependencies
- **Features**: `/src/features/` - Feature-specific slices with api/lib/model/ui structure
- **Shared**: `/src/shared/` - Reusable utilities and UI components

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
- **Testing**: Bun Test + fast-check 4.2
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
- Manual: Keyboard-only navigation testing
- Focus management and screen reader announcements

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

## 🎮 Game Engine Architecture

### Engine Layer Structure
```
GameEngineAdapter → SimpleGameEngine → Game Core Logic
     ↓                    ↓                ↓
Feature Store    ← Game State Sync ← processPlacementAndClearing
```

### Key Components
- **GameEngine Interface**: `/src/game/GameEngine.ts` - Clean abstraction for UI features
- **SimpleGameEngine**: `/src/game/SimpleGameEngine.ts` - Bridge to legacy game functions
- **GameEngineAdapter**: `/src/features/game-play/api/gameEngineAdapter.ts` - Feature isolation layer
- **Game Core Logic**: `/src/game/game.ts` - Pure functions for game mechanics

### Critical Implementation Details
- **Score Synchronization**: Engine calculates scores via `processPlacementAndClearing()`, Zustand store syncs from engine state
- **Line Clearing**: `clearLines()` in `/src/game/board.ts` handles line detection and removal
- **State Management**: Engine maintains authoritative game state, UI stores sync from engine
- **Event System**: Engine emits events (line-cleared, piece-placed, game-over) for feature coordination

### AI Integration Points
- **Entry Point**: `/src/game/ai/index.ts`
- **Feature Integration**: `/src/features/ai-control/`
- **Game Engine**: AI integrates through the game engine interface

## 🔍 Quick Reference

### Essential Files
- **Game Engine Interface**: `/src/game/GameEngine.ts`
- **Game Engine Implementation**: `/src/game/SimpleGameEngine.ts`
- **Game Core Logic**: `/src/game/game.ts`
- **Game-Play Feature Store**: `/src/features/game-play/model/gamePlaySlice.ts`
- **Engine Adapter**: `/src/features/game-play/api/gameEngineAdapter.ts`
- **Board Logic**: `/src/game/board.ts`
- **Scoring System**: `/src/game/scoring.ts`
- **AI Implementation**: `/src/game/ai/simple-ai.ts`
- **i18n Config**: `/src/i18n/config.ts`
- **App Entry**: `/src/main.tsx`
- **App Component**: `/src/App.tsx`

### Debug Features
- Debug Mode: `?debug=true` - Enable debug mode
- Debug Parameters: Support for preset, queue, seed, score, level, lines parameters
- Debug Language: `debugLanguage.forceEnglish()` / `debugLanguage.forceJapanese()`
- Debug Presets: Various game state presets for testing