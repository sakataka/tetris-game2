# Tetris Game Project

A complete Tetris game implementation using modern web technologies with comprehensive test coverage, bilingual support, and cross-platform compatibility.

## Project Overview

This project implements a fully-featured Tetris game using functional programming patterns, strict TypeScript typing, and modular architecture. The game includes all standard Tetris mechanics, responsive design for desktop and mobile, bilingual interface (English/Japanese), and comprehensive visual effects.

## Architecture & Design

### Project Structure
```
src/
├── components/     # React UI components (game, layout, ui)
├── game/          # Pure game logic (board, tetrominos, mechanics)
├── hooks/         # Custom React hooks (controls, game loop, UI)
├── store/         # Zustand state management
├── types/         # TypeScript definitions
├── utils/         # Shared utilities and constants
├── locales/       # i18n translation files
├── i18n/          # i18n configuration
├── lib/           # Shared utility functions
├── test/          # Test configuration and utilities
```

### State Management
Built on **Zustand** with functional programming principles:
- **GameStore**: Centralized game state with immutable updates
- **SettingsStore**: User preferences with local persistence
- **HighScoreStore**: Score tracking and leaderboard management
- Memoized selectors for optimized state access
- Pure functions for predictable state transitions

### Core Game Logic
- **Board System**: Standard 20×10 Tetris grid with collision detection
- **Tetromino System**: All 7 standard pieces with matrix-based operations
- **7-Bag Randomization**: Fair piece distribution system
- **SRS Wall Kicks**: Super Rotation System with I-piece handling
- **Game State**: Pure functional approach, UI-agnostic logic

## Technology Stack

### Runtime & Build
- **Bun**: 1.2.17 — Package management, testing, development
- **Vite**: 7.0.3 (rolldown-vite) — Enhanced build performance
- **TypeScript**: 5.8.3 — Strict typing with ESNext target

### Frontend Framework
- **React**: 19.1.0 — Functional components with concurrent features
- **Zustand**: 5.0.6 — Lightweight state management

### UI & Styling
- **Tailwind CSS**: 4.1.11 — Utility-first CSS via Vite plugin
- **Framer Motion**: 12.19.2 — Animation framework
- **Radix UI**: Headless accessible components
- **Lucide React**: 0.525.0 — SVG icons
- **class-variance-authority**: 0.7.1 — Component variant utilities
- **clsx**: 2.1.1 — Conditional CSS class names
- **tailwind-merge**: 3.3.1 — Tailwind class merging

### Internationalization
- **i18next**: 25.2.1 — Core i18n framework
- **react-i18next**: 15.5.3 — React i18n integration

### Development Tools
- **Biome**: 2.0.6 — Rust-based linter and formatter
- **Playwright**: 1.53.1 — Browser testing framework
- **happy-dom**: 18.0.1 — Lightweight DOM environment
- **Lefthook**: 1.11.14 — Git hooks automation
- **Knip**: 5.61.3 — Dead code elimination
- **Bundle Analyzer**: Via rollup-plugin-visualizer for performance monitoring

## Development Setup

### Commands
```bash
# Core Development
bun run dev          # Development server
bun run build        # Production build
bun test             # Run all tests

# Quality Assurance
bun run lint         # Code linting
bun run format       # Code formatting
bun run typecheck    # Type checking
bun run ci           # CI pipeline (lint + typecheck + test + build)
```

### Configuration
- **Bun Runtime**: Primary toolchain for all operations
- **Rolldown-Vite**: Enhanced performance and dev/build consistency
- **React OXC Plugin**: High-performance React transformation
- **TypeScript**: Strict mode with cutting-edge JavaScript features
- **Git Hooks**: Automated formatting and conventional commits via Lefthook

## Core Features

### Game Mechanics
- **Standard Tetris Gameplay**: All 7 tetromino types (I, O, T, S, Z, J, L)
- **7-Bag System**: Fair piece distribution ensuring balanced gameplay
- **SRS Wall Kicks**: Intelligent rotation with proper collision handling
- **Ghost Piece**: Preview showing landing position
- **Hold System**: Piece saving with usage restrictions
- **Line Clearing**: Multi-line support with scoring system
- **Progressive Difficulty**: Level-based speed increases
- **Pause/Resume**: Game state preservation

### User Interface
- **Live Statistics**: Score, lines cleared, current level display
- **Next Piece Preview**: Upcoming tetromino visibility
- **Hold Indicator**: Current held piece with availability status
- **High Score Leaderboard**: Persistent score tracking
- **Settings Panel**: Integrated dropdown with customization options
- **Game State Overlays**: Pause, game over, and control reference

### Cross-Platform Support
- **Responsive Design**: Adaptive layouts for desktop and mobile
- **Touch Controls**: Intuitive gesture-based input (swipe and tap)
- **Keyboard Controls**: Full keyboard support with customizable bindings
- **Bilingual Interface**: English/Japanese with instant switching
- **Local Persistence**: Settings and scores saved automatically

### Visual Polish
- **Smooth Animations**: Framer Motion-powered piece movements
- **Visual Effects**: Line clear animations with flash and glow
- **Responsive Feedback**: Spring physics for score updates
- **UI Transitions**: Polished modal and overlay animations

## Quality Assurance

### Testing Strategy
- **Pure Function Testing**: Complete coverage of game logic and business rules
- **UI Component Policy**: No automated tests for React UI components - focus on pure function testing
- **Integration Testing**: Full game flow scenarios for core game mechanics
- **Hook Testing**: Isolated custom hook behavior (pure logic only)
- **Browser Testing**: Playwright for E2E and visual validation when necessary
- **Minimal Mocking**: Focus on isolated unit testing of pure functions

### Testing Infrastructure
- **Test Runner**: Bun Test with happy-dom environment
- **Test Organization**: Co-located test files with descriptive naming
- **Type-Safe Testing**: Full TypeScript integration
- **Fast Execution**: Lightweight DOM environment for speed

## Development Standards

### Code Quality Rules
- **Zero Type Errors**: Never relax TypeScript checks to resolve issues
- **No Test Skipping**: Address root causes instead of bypassing tests
- **Anti-Hardcoding**: All user-facing text must use i18n resources
- **Transparent Errors**: Never suppress or hide error messages
- **Permanent Solutions**: No temporary fixes or technical debt

### Technology Decisions
- **Bun Everywhere**: Primary choice for package management, testing, and scripts
- **Tailwind Via Vite**: Using @tailwindcss/vite plugin for optimal performance
- **i18n Required**: No hardcoded UI strings—everything through translation files
- **Functional Programming**: Prefer pure functions over class-based approaches

### Import Guidelines
- **Cross-directory imports**: MUST use `@/` path aliases
- **Same directory imports**: Use relative `./` paths for performance
- **Test mocks**: Exception for test frameworks requiring relative paths

### Development Configuration
- **Bun Runtime**: Primary toolchain for all operations
- **Code Quality**: Biome for linting and formatting with strict rules
- **Git Hooks**: Automated formatting and conventional commit enforcement
- **TypeScript**: Strict mode with ESNext target
- **Deployment**: Vercel with Bun-optimized build pipeline

## Tools & Utilities

### Playwright MCP - Browser Testing

**When to use:**
- Visual UI validation and layout verification
- User interaction testing (click, input, navigation)
- Responsive design behavior verification
- Animation timing and behavior analysis

**Key functions:**
- `mcp__playwright__browser_navigate` — Page navigation
- `mcp__playwright__browser_click` — Element interaction
- `mcp__playwright__browser_take_screenshot` — Visual capture
- `mcp__playwright__browser_snapshot` — Page structure analysis

**Usage example:**
```bash
bun run dev  # Run development server
mcp__playwright__browser_navigate "http://localhost:5173"
mcp__playwright__browser_snapshot  # Analyze page structure
```

### Context7 MCP - Library Documentation

**When to use:**
- Researching latest library features and changes
- Checking breaking changes before updates
- Discovering performance optimization techniques
- Troubleshooting with current documentation

**Usage workflow:**
1. Resolve library ID: `mcp__context7__resolve-library-id <library-name>`
2. Get documentation: `mcp__context7__get-library-docs <context7-library-id>`

**Usage example:**
```bash
mcp__context7__resolve-library-id "bun"
# → Returns `/oven-sh/bun`
mcp__context7__get-library-docs "/oven-sh/bun"
# → Latest Bun features, API changes, configuration options
```

### AivisSpeech MCP - Task Completion Notifications

**When to use:**
- Multi-step todo list completion notifications
- Long-running task completion alerts  
- Background process completion awareness
- Extended development session progress tracking

**Key functions:**
- `mcp__aivisspeech__speak` — Text-to-speech with customizable settings
- `mcp__aivisspeech__get_speakers` — Available voice character list
- `mcp__aivisspeech__check_engine_status` — Service availability check

**Usage guidelines:**
- Trigger notifications ONLY when ALL items in a TodoWrite task list are completed
- Do not notify for individual task completions - wait for entire list completion
- Use for extended multi-step tasks where user may step away from terminal
- Apply reasonable volume settings (volumeScale=0.1) for non-intrusive alerts
- Prefer Japanese completion messages for consistent user experience

**Usage example:**
```bash
# Only after ALL todo items are marked as completed
mcp__aivisspeech__speak "すべてのタスクが完了しました" --volumeScale=0.1
```
