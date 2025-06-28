# Tetris Game Project

A fully-featured Tetris game built with modern web technologies.

## Key Features

- **Classic Tetris Gameplay**: All 7 tetromino types with line clearing and progressive difficulty
- **Smooth Animations**: Polished visual effects powered by Framer Motion
- **Mobile-Friendly**: Touch controls and responsive design for all devices
- **High Score System**: Persistent local score tracking and leaderboards
- **Bilingual Support**: Real-time English/Japanese language switching (English default)
- **Ghost Piece**: Landing position preview for better gameplay
- **Hold Mechanics**: Save and swap pieces for strategic play

## Game Features

### Core Mechanics
- All 7 standard tetromino types (I, O, T, S, Z, J, L)
- Fluid piece movement, rotation, and instant drop
- Hold system for piece saving and swapping
- Line clearing with combo scoring
- Progressive difficulty with faster piece drops
- Pause, resume, and restart functionality
- Ghost piece preview showing landing position
- 7-Bag System: Ensures fair piece distribution—all 7 pieces appear once before any repeat
- SRS Wall Kicks: Super Rotation System with intelligent wall kick mechanics for smoother gameplay

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

### Frontend Framework
- **React**: 19.1.0 — Modern functional components with Hooks
- **TypeScript**: 5.8.3 — ESNext target with strict type checking for cutting-edge JS features
- **Zustand**: 5.0.6 — Lightweight, scalable state management

### Build Tools & Runtime
- **Bun**: 1.2.17 — Fast package manager and test runner
- **Rolldown-Vite**: 7.0.3 — Rust-powered bundler for optimal performance

### UI & Styling
- **Tailwind CSS**: 4.1.11 — Utility-first CSS framework via Vite plugin
- **Framer Motion**: 12.19.2 — Production-ready animation library
- **Radix UI**: Dialog 1.1.14, Slot 1.2.3 — Headless UI components
- **class-variance-authority**: 0.7.1 — Type-safe component variants
- **clsx + tailwind-merge**: 2.1.1/3.3.1 — Intelligent class name utilities
- **Lucide React**: 0.524.0 — Beautiful, customizable icon library

### Core Features
- **react-hotkeys-hook**: 5.1.0 — Declarative keyboard shortcut handling
- **i18next + react-i18next**: 25.2.1/15.5.3 — Robust internationalization

### Development & Quality Assurance
- **Biome**: 2.0.6 — Fast linter and formatter in Rust
- **Bun Test**: 1.2.17 — Native test runner with Jest compatibility
- **happy-dom**: 18.0.1 — Lightweight DOM environment for testing
- **Testing Library**: React 16.3.0, DOM 10.4.0, jest-dom 6.6.3 — Simple, intuitive component testing
- **Lefthook**: 1.11.14 — Fast Git hooks manager
- **knip**: 5.61.2 — Finds unused files, dependencies, and exports
- **@vitejs/plugin-react-oxc**: 0.2.3 — High-performance React plugin with oxc parser

## Architecture & Design

### State Management
Built on **Zustand** for clean, scalable state management:
- **GameStore**: Centralized game state using pure function reducers
- **SettingsStore**: User preferences (language, ghost piece visibility) with persistence
- **HighScoreStore**: Score tracking and leaderboard management
- Performance-optimized selectors with automatic memoization  
- Immutable updates ensuring predictable state transitions

### Project Structure
```
src/
├── components/          # React UI components
│   ├── game/           # Game-specific components
│   ├── layout/         # Layout and shell components
│   └── ui/             # Reusable UI primitives
├── game/               # Pure game logic functions
├── hooks/              # Custom React hooks
├── store/              # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Shared utility functions
├── locales/            # Translation files
└── i18n/               # Internationalization config
```

## Custom Hooks

### Game Controls
- **useGameLoop**: Manages the core game loop using requestAnimationFrame
- **useKeyboardControls**: Handles keyboard input with react-hotkeys-hook
- **useTouchGestures**: Processes touch gestures for mobile gameplay
- **useTouchActions**: Handles touch-based game actions
- **useTouchDetection**: Processes gesture detection logic
- **useGameActions**: Provides game action dispatchers
- **useGameActionHandler**: Coordinates action execution

### Animation System
- **useAnimatedValue**: Manages animation triggers and spring controls
- **useAnimationCompletionHandler**: Handles animation lifecycle events
- **useCellAnimation**: Controls individual cell animation states

### State Selection & Data
- **useBoardData**: Provides memoized board state selections
- **useScoreState**: Provides memoized score state selections
- **useHighScore**: Manages high score data and local storage
- **useHighScoreSideEffect**: Handles high score persistence

## Core Game Logic

### game/game.ts
- `createInitialGameState()` — Initializes game state with ghost piece positioning
- `moveTetrominoBy()` — Handles piece movement with ghost updates
- `rotateTetrominoCW()` — Processes clockwise rotation with ghost recalculation
- `hardDropTetromino()` — Executes instant piece drops
- `holdCurrentPiece()` — Manages piece saving and swapping
- `calculateGhostPosition()` — Computes landing position preview
- `placePieceOnBoard()` — Places pieces on the board with collision detection
- `clearCompletedLines()` — Handles line clearing logic and scoring
- `spawnNextPiece()` — Generates next tetromino from piece bag
- `checkGameOver()` — Validates game over conditions

### game/board.ts
- `createEmptyBoard()` — Generates clean game board
- `isValidPosition()` — Validates piece placement
- `placeTetromino()` — Places pieces on the board
- `clearLines()` — Detects and removes completed lines

### game/tetrominos.ts
- `getTetrominoShape()` — Returns piece shape matrices
- `rotateTetromino()` — 90-degree clockwise rotation logic
- `createTetromino()` — Creates new tetromino instances
- `getTetrominoColorIndex()` — Maps piece types to color indices

### game/pieceBag.ts
**7-Bag System** — Ensures fair piece distribution:
- `PieceBagManager` class managing the bag state
- `getNextPiece()` — Retrieves pieces with automatic bag refill
- `refillBag()` — Shuffles and replenishes the bag
- Fisher-Yates shuffle for true randomization

### game/wallKick.ts
**SRS Wall Kick System** — Advanced rotation mechanics:
- `getWallKickOffsets()` — Provides rotation offset data
- `tryRotateWithWallKick()` — Attempts rotation with fallback positions
- Separate tables for I-piece vs. JLSTZ pieces
- Full clockwise and counter-clockwise support

## Data Persistence

### Local Storage (utils/localStorage.ts)
Robust client-side data management:
- High score tracking with leaderboard functionality
- Persistent game settings (language, ghost piece visibility)  
- Type-safe JSON serialization
- Graceful error handling and fallbacks
- Custom event system for score updates

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
Intuitive mobile controls via **useTouchGestures**:
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

### Testing Approach
Comprehensive test coverage with **Bun Test**:
- **Pure Functions**: Exhaustive game logic testing
- **Custom Hooks**: Behavior verification in isolation
- **React Components**: Rendering and interaction tests
- **CI/CD Ready**: Seamless integration with Vercel and GitHub Actions

## Development Standards

### Code Excellence
- **Strict TypeScript**: ESNext target with zero tolerance for type errors, enabling cutting-edge JavaScript features
- **Functional Paradigm**: Pure functions and immutable data patterns
- **Test-First Development**: Every feature backed by comprehensive tests
- **Type Safety**: Leveraging discriminated unions and type guards

### Performance Focus
- **React Compiler**: Automatic optimizations eliminating manual memoization
- **Concurrent Features**: useTransition for responsive UI updates
- **Lightweight State**: Zustand's minimal overhead approach
- **Fast Builds**: Rust-powered Rolldown-Vite bundler

### Code Organization
- **Components**: PascalCase naming (Board.tsx, Game.tsx)
- **Hooks**: camelCase with 'use' prefix (useGameLoop.ts)
- **Utilities**: camelCase for consistency (gameStore.ts, colors.ts)
- **Tests**: Co-located `*.test.ts` files for easy maintenance

## Development Commands

```bash
# Development & Build
bun run dev                    # Start development server
bun run build                  # Production build
bun run preview                # Preview build output

# Testing & Quality
bun test                       # Run all tests
bun run test:fast              # Fast subset tests (game logic & hooks)
bun run lint                   # Run Biome lint
bun run format                 # Run Biome format
bun run typecheck              # TypeScript type checking
bun run knip                   # Dead code detection
bun run check                  # Type check + dead code detection
bun run prepare                # Setup Git hooks with Lefthook

# Package Management
bun install                    # Install dependencies
bun add <package>              # Add package
bun remove <package>           # Remove package
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