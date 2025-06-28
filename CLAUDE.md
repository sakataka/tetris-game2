# Tetris Game Project

A fully-featured Tetris game implementation using modern web technologies and comprehensive test coverage.

## Architecture Overview

This project implements a complete Tetris game using a modular architecture with functional programming patterns, comprehensive test coverage, and strict TypeScript typing.

## Implemented Features

### Core Tetris Mechanics
- All 7 standard tetromino types (I, O, T, S, Z, J, L) with complete gameplay
- 7-Bag System for fair piece distribution (all pieces appear once before repeat)
- SRS Wall Kick System with intelligent rotation mechanics
- Ghost piece preview showing landing position
- Hold system for piece saving and swapping with usage restrictions
- Line clearing with multi-line support and scoring
- Progressive difficulty with level-based speed increases
- Pause/resume functionality with game state preservation

### Platform & Interface
- Touch gesture controls for mobile devices (swipe and tap)
- Responsive design adapting to desktop and mobile
- Bilingual interface (English/Japanese) with instant switching
- High score tracking with persistent local storage
- Settings panel with customizable options
- Smooth animations powered by Framer Motion

### User Interface
- Live game stats (score, lines cleared, current level)
- Next piece preview window
- Hold piece indicator with availability status
- High score leaderboard
- Built-in control reference
- Game over and pause overlays
- Settings panel with customization options

### Settings & Customization
- **Integrated Settings**: Clean dropdown interface accessible from the settings button
- **Language Toggle**: Instant switching between English and Japanese (English default)
- **Ghost Piece Toggle**: Show/hide landing position preview
- **Persistent Preferences**: Settings automatically saved locally
- **Visual Indicators**: Clear feedback for all toggle states

### Cross-Platform Support
- Touch gesture controls (swipe and tap)
- Responsive design adapting to any screen size
- Optimized for both desktop and mobile play

### Visual Polish
- Smooth piece animations for drops, placements, and rotations
- Satisfying line clear effects with visual feedback
- Animated score updates with spring physics
- Polished UI transitions throughout

## Technology Stack

### Runtime & Build System
- **Bun**: 1.2.17 — Primary runtime for package management, testing, and development scripts
- **Vite**: 7.0.3 (rolldown-vite) — Rolldown-powered bundler for enhanced performance and dev/build consistency
- **TypeScript**: 5.8.3 — ESNext target with strict type checking, incremental compilation

### Frontend Framework
- **React**: 19.1.0 — Functional components with latest concurrent features
- **@vitejs/plugin-react-oxc**: 0.2.3 — High-performance React plugin with oxc parser

### State Management & Data Flow
- **Zustand**: 5.0.6 — Lightweight state management with immutable state updates
- **react-hotkeys-hook**: 5.1.0 — Declarative keyboard input handling

### UI Framework & Styling
- **Tailwind CSS**: 4.1.11 — Utility-first CSS via @tailwindcss/vite plugin
- **Framer Motion**: 12.19.2 — Animation library for smooth transitions and effects
- **Radix UI**: Dialog 1.1.14, Slot 1.2.3 — Headless accessible components
- **class-variance-authority**: 0.7.1 — Type-safe component variants
- **clsx + tailwind-merge**: 2.1.1/3.3.1 — Class name composition utilities
- **Lucide React**: 0.524.0 — SVG icon library

### Internationalization
- **i18next**: 25.2.1 — Core i18n framework
- **react-i18next**: 15.5.3 — React-specific i18n hooks and components

### Development & Quality Tools
- **Biome**: 2.0.6 — Rust-based linter and formatter with strict rules
- **Testing Library**: React 16.3.0, DOM 10.4.0, jest-dom 6.6.3 — Component testing utilities
- **happy-dom**: 18.0.1 — Lightweight DOM environment for test execution
- **Lefthook**: 1.11.14 — Git hooks manager with parallel execution
- **knip**: 5.61.2 — Dead code detection and dependency analysis

## Architecture & Design

### State Management
Built on **Zustand** for clean, scalable state management:
- **GameStore**: Centralized game state with immutable updates
- **SettingsStore**: User preferences (language, ghost piece visibility) with persistence
- **HighScoreStore**: Score tracking and leaderboard management
- Performance-optimized selectors for efficient state access
- Functional approach ensuring predictable state transitions

### Project Structure
- **components/**: React UI components organized by domain (game, layout, ui)
- **game/**: Pure game logic functions (board manipulation, tetrominos, piece bag, wall kicks)
- **hooks/**: Custom React hooks categorized by purpose (controls, core game loop, UI, selectors)
- **store/**: Zustand state stores for game state, settings, and high scores
- **types/**: TypeScript type definitions for game entities
- **utils/**: Shared utility functions and constants
- **locales/**: i18n translation files (English/Japanese)
- **test/**: Test configuration and utilities

## Custom Hooks Strategy

### Game Controls
Custom hooks handle input management across keyboard and touch interfaces, with debouncing and cooldown systems to ensure responsive gameplay.

### Animation System
Hooks manage Framer Motion animations for piece movements, line clears, and UI transitions with proper lifecycle handling.

### State Selection & Data
Memoized selectors provide optimized access to game state slices, while data hooks handle persistence and side effects.

## Core Game Logic

### Game State Management
Pure functional approach to game state with immutable updates. All game logic separated from UI concerns for easy testing and maintenance.

### Board System
Standard 20×10 Tetris board with collision detection, line clearing, and immutable state updates.

### Tetromino System
Complete implementation of all 7 standard Tetris pieces with matrix-based rotation and positioning.

### 7-Bag Randomization
Fair piece distribution system ensuring balanced gameplay by guaranteeing all 7 pieces appear before any repeat.

### SRS Wall Kick System
Super Rotation System implementation with proper wall kick mechanics for smooth rotation behavior, including separate handling for I-pieces vs. other pieces.

## Data Persistence

### Local Storage
Robust client-side data management:
- High score tracking with leaderboard functionality
- Persistent game settings (language, ghost piece visibility)  
- Type-safe JSON serialization with error handling
- Automatic data persistence and retrieval

## Visual Effects

### Animation Framework
Powered by **Framer Motion** for smooth, engaging visuals:
- **Piece Drops**: Satisfying spring animations on piece spawn
- **Rotations**: Fluid 360-degree rotation effects
- **Placements**: Subtle scale feedback (shrink → expand)
- **Line Clears**: Eye-catching flash and glow effects
- **Score Changes**: Bouncy spring animations for number updates
- **UI Flow**: Polished modal and overlay transitions

## Localization

### Internationalization Setup
Built with **i18next** for seamless language support:
- Primary language: English
- Secondary language: Japanese  
- Instant language switching without reload
- Organized translation files covering all UI text, controls, and game terminology

## Cross-Platform Design

### Touch Interface
Intuitive mobile controls with gesture detection:
- **Horizontal Swipes**: Natural left/right piece movement
- **Quick Down Swipe**: Soft drop for faster placement
- **Long Down Swipe**: Instant hard drop
- **Single Tap**: Piece rotation

### Responsive Layout
Adaptive design for any screen:
- CSS Grid foundation for flexible layouts
- Desktop: Spacious side-by-side arrangement
- Mobile: Optimized vertical stacking
- Consistent 30×30px cell sizing across devices

## Quality Assurance

### Testing Infrastructure
- **Test Runner**: Bun Test with happy-dom environment for fast execution
- **Coverage**: Comprehensive testing of game logic, hooks, and components
- **Environment**: Type-safe happy-dom setup with proper DOM mocking
- **Test Organization**: Co-located test files with descriptive naming

### Testing Strategy
- **Pure Function Testing**: Complete coverage of game logic in `src/game/`
- **Hook Testing**: Isolated behavior verification using React Testing Library
- **Component Testing**: Rendering and interaction testing with proper accessibility
- **Integration Testing**: Full game flow testing with realistic scenarios
- **Mocking Strategy**: Minimal mocking with focus on isolated unit testing

## Development Standards

### Development Configuration

- **Bun Runtime**: Primary toolchain for package management, testing, and development
- **Code Quality**: Biome for linting and formatting with strict rules
- **Git Hooks**: Automated formatting and conventional commit enforcement
- **TypeScript**: Strict mode with ESNext target and cutting-edge JavaScript features
- **Build Optimization**: Rolldown-vite for enhanced performance and improved dev/build consistency
- **Testing**: Bun Test with happy-dom for fast, lightweight test execution
- **Deployment**: Vercel with Bun-optimized build pipeline

## Development Commands

```bash
# Core Development
bun run dev          # Development server
bun run build        # Production build
bun test             # Run all tests

# Quality Assurance
bun run lint         # Code linting
bun run format       # Code formatting
bun run typecheck    # Type checking
bun run check        # Full quality check
bun run ci           # CI pipeline
```

## Browser Testing

### Live Development Testing
Interactive testing using **MCP (Model Context Protocol)** with Playwright:
- mcp__playwright__browser_navigate — Navigate to pages
- mcp__playwright__browser_click — Interact with elements  
- mcp__playwright__browser_take_screenshot — Capture visuals
- mcp__playwright__browser_snapshot — Analyze page structure

**Perfect for:**
- Visual UI validation and screenshot comparison
- Interactive feature testing and user flow verification
- Animation timing and behavior analysis
- Responsive design testing across viewports

## Library Documentation & Updates

### Context7 Integration for Latest Library Information
Use **Context7** MCP tools to get up-to-date documentation and specifications for libraries:

```bash
# Get library documentation for any technology stack component
mcp__context7__resolve-library-id <library-name>
mcp__context7__get-library-docs <context7-library-id>
```

**Examples:**
- `mcp__context7__resolve-library-id "bun"` → `/oven-sh/bun`
- `mcp__context7__get-library-docs "/oven-sh/bun"` → Latest Bun features, API changes, configuration options

**Benefits:**
- **Always Current**: Get the latest features, breaking changes, and best practices
- **Comprehensive Coverage**: Detailed API documentation with code examples
- **Performance Insights**: Discover new optimization techniques and configurations
- **Migration Guidance**: Find deprecation notices and upgrade paths

**Use Cases:**
- Before major dependency updates to understand breaking changes
- When exploring new features or configuration options
- During performance optimization to discover latest techniques
- For troubleshooting with most current documentation

This approach helped identify modern Bun features like bytecode generation, improved test runner options, and advanced configuration settings that weren't in older documentation.

## Code Standards

### Non-Negotiable Rules
- **Zero Type Errors**: Never relax TypeScript checks to "fix" issues
- **No Test Skipping**: Address root causes instead of bypassing tests
- **Anti-Hardcoding**: All user-facing text must use i18n resources
- **Transparent Errors**: Never suppress or hide error messages
- **Permanent Solutions**: No temporary fixes or technical debt

### Technology Decisions
- **Bun Everywhere**: Primary choice for package management, testing, and scripts
- **Tailwind Via Vite**: Using @tailwindcss/vite plugin for optimal performance
- **i18n Required**: No hardcoded UI strings—everything through translation files