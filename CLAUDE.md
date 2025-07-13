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
- **i18n**: ALL user-facing text MUST use `/src/locales/` files
- **Functions**: Pure functions over classes for maintainability/testability
- **Testing**: ONLY test pure functions, utilities, business logic. NEVER test React components

## 📋 Development Commands

### CRITICAL COMMANDS
```bash
bun run lint && bun run typecheck  # MUST pass before commits
bun test                          # Verify no regressions
bun run ci                        # Complete CI pipeline
bun run benchmark                 # AI performance testing
bun run audit:accessibility       # Accessibility compliance
bun run storybook                 # Component documentation
```

### EXECUTION CONDITIONS
- **Before commits**: `bun run lint && bun run typecheck` MUST pass
- **After changes**: `bun test` to verify no regressions
- **Git hooks**: Lefthook auto-runs formatting/validation

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: React 19.1.0 + TypeScript 5.8.3 (strict mode)
- **State**: Zustand 5.0.6 (functional state management)
- **Styling**: Tailwind CSS 4.1.11 + shadcn/ui + Radix UI
- **Animation**: Motion 12.23.3
- **i18n**: i18next 25.3.2 + react-i18next 15.6.0
- **Build**: Bun 1.2.18 + Vite 7.0.8+ (rolldown-vite)
- **Quality**: Biome 2.1.1 + Lefthook 1.12.2
- **Testing**: Bun Test + Playwright 1.54.1 + fast-check 4.2.0

### Key Directories
```
src/
├── game/ai/          # AI system (TEST ALL) - weights.yaml, evaluators, search
├── components/       # React UI (DO NOT TEST) - accessibility, game, ui
├── contexts/         # Theme management (TEST ALL) - Compact/Normal/Gaming
├── design-tokens/    # Design system (TEST ALL) - comprehensive tokens
├── hooks/           # React hooks (TEST PURE FUNCTIONS ONLY)
├── store/           # Zustand stores (TEST ALL) - game, settings, highscore
├── utils/           # Utilities (TEST ALL)
├── locales/         # i18n files (en.json, ja.json)
└── benchmarks/      # Performance tests (TEST ALL)
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
bun test src/                    # Unit tests (excludes components)
bun run benchmark               # AI performance benchmarks
bun run audit:accessibility     # WCAG 2.2 AA compliance
bun run storybook               # Component documentation
```

### CRITICAL for AI Assistants
**❌ NEVER** use `bun run dev` for automated testing (blocks terminal)
**✅ ALWAYS** use unit tests and build validation for reliable testing

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
- **AI Config**: `/src/game/ai/config/weights.yaml` (runtime tunable)
- **AI Debug**: `?debug=true&ai=advanced&visualization=true`
- **Design Tokens**: `/src/design-tokens/index.ts`
- **Theme Context**: `/src/contexts/ThemeContext.tsx`
- **Accessibility**: `bun run audit:accessibility`

### Troubleshooting
- **Build fails**: `bun run typecheck` for TypeScript errors
- **Tests fail**: Focus on pure functions, avoid React component tests
- **AI issues**: Check weights.yaml, use debug mode
- **State issues**: Use proper Zustand selectors with `useShallow`
- **Theme issues**: Verify ThemeProvider wrapper, CSS variable injection
- **Accessibility**: Run audit, check WCAG compliance

*Follow all rules strictly for code quality and project consistency.*