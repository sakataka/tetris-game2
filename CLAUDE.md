# Tetris Game Project

A complete Tetris game built with modern web technologies

## Game Overview

- **Complete Tetris Experience**: 7 piece types, line clearing, level progression system
- **Beautiful Animations**: Smooth effects powered by Framer Motion
- **Mobile Support**: Touch controls and responsive design
- **High Score Tracking**: Local storage-based score persistence
- **Multi-language Support**: Dynamic Japanese/English switching
- **Ghost Piece**: Visual preview of drop position
- **Hold System**: Piece saving and swapping functionality

## Implemented Features

### Core Game Mechanics
- 7 tetromino types (I, O, T, S, Z, J, L)
- Piece movement, rotation, and hard drop
- Hold functionality (piece saving and swapping)
- Line clearing and scoring system
- Level progression with increasing drop speed
- Game pause, resume, and reset
- Ghost piece display (drop position preview)
- **7-Bag System**: Fair piece distribution ensuring all 7 pieces appear exactly once before any repeats
- **SRS Wall Kick System**: Super Rotation System for enhanced piece rotation with wall kick compensation

### User Interface
- Real-time score, lines, and level display
- Next piece preview
- Hold piece display with availability status indication
- High score leaderboard
- Control instructions
- Game over and pause screens
- Settings UI (language switching, ghost piece toggle)

### Game Settings
- **Unified Settings Panel**: Dropdown-style access from settings button
- **Language Switching**: Dynamic Japanese/English switching with immediate effect
- **Ghost Piece Control**: Toggle for drop position preview display
- **Settings Persistence**: Auto-save to local storage
- **Visual Feedback**: Toggle switches and current setting indicators

### Mobile Support
- Touch controls (swipe and tap gestures)
- Responsive layout design
- Desktop and mobile compatibility

### Animation System
- Piece drop, placement, and rotation animations
- Line clear flash effects
- Score update spring animations
- UI transition effects

## Tech Stack

### Frontend
- **React**: 19.1.0 (functional components with Hooks)
- **TypeScript**: 5.8.3 (ES2024 target, strict type definitions)
- **Zustand**: 5.0.5 (lightweight state management)

### Build & Development
- **Bun**: 1.2.17 (package management and test runner)
- **Rolldown-Vite**: 7.0.0 (Rust-powered high-performance bundler)

### Styling & UI
- **Tailwind CSS**: 4.1.10 (with @tailwindcss/vite plugin)
- **Framer Motion**: 12.19.1 (animations)
- **shadcn/ui**: Radix UI-based components (Dialog, Button, Card, Badge, etc.)
- **class-variance-authority**: 0.7.1 (component variant management)
- **clsx + tailwind-merge**: 2.1.1/3.3.1 (styling utilities)
- **lucide-react**: 0.523.0 (icons)

### Feature Libraries
- **react-hotkeys-hook**: 5.1.0 (keyboard input management)
- **i18next + react-i18next**: 25.2.1/15.5.3 (internationalization)

### Development & Quality
- **Biome**: 2.0.5 (linting and formatting)
- **Bun Test**: 1.2.17 (test runner)
- **happy-dom**: 18.0.1 (DOM environment simulation)
- **Testing Library**: React 16.3.0 (component testing)
- **Lefthook**: 1.11.14 (Git hooks management)
- **knip**: 5.61.2 (dead code detection)
- **@vitejs/plugin-react-oxc**: 0.2.3 (high-performance React plugin)

## Architecture Design

### State Management (Zustand)
- Centralized game state with pure function reducers
- Optimized selectors for performance
- Immutable state updates

### Game State Type Definition
```typescript
interface GameState {
  board: BoardMatrix;
  boardBeforeClear: BoardMatrix | null;
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  placedPositions: Position[];
  clearingLines: number[];
  animationTriggerKey: number;
  ghostPosition: Position | null;
  showGhostPiece: boolean;
  pieceBag: TetrominoTypeName[]; // 7-Bag system state
}
```

### Tetromino Type Definition (Discriminated Union)
```typescript
type TetrominoType =
  | { type: "I"; colorIndex: 1 }
  | { type: "O"; colorIndex: 2 }
  | { type: "T"; colorIndex: 3 }
  | { type: "S"; colorIndex: 4 }
  | { type: "Z"; colorIndex: 5 }
  | { type: "J"; colorIndex: 6 }
  | { type: "L"; colorIndex: 7 };
```

### Folder Structure
```
src/
├── components/          # React components
│   ├── game/           # Game-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── game/               # Core game logic (pure functions)
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── locales/            # Internationalization resources
└── i18n/               # i18n configuration
```

## Custom Hooks Design

### Game Control Hooks
- **useGameLoop**: requestAnimationFrame-based game loop management
- **useKeyboardControls**: Declarative keyboard input handling via react-hotkeys-hook
- **useTouchGestures**: Mobile touch controls (swipe and tap)
- **useGameSelectors**: Efficient game state selection with memoization
- **executeGameAction**: Helper function for game action execution

### Animation Hooks
- **useAnimatedValue**: Animation value management and spring control
- **useAnimationCompletionHandler**: Animation completion state management
- **useCellAnimation**: Individual cell animation state management

### Data Management & Side Effect Hooks
- **useHighScore**: High score local storage management
- **useHighScoreSideEffect**: High score persistence side effects
- **useSettingsSideEffect**: Settings persistence side effects

## Game Logic (Pure Functions)

### game/game.ts
- `createInitialGameState()`: Initial game state generation (including ghost position)
- `moveTetrominoBy()`: Piece movement processing (with ghost position update)
- `rotateTetrominoCW()`: Clockwise rotation processing (with ghost position update)  
- `hardDropTetromino()`: Hard drop processing
- `holdCurrentPiece()`: Hold functionality (piece saving and swapping)
- `calculateGhostPosition()`: Ghost piece position calculation (drop preview)
- `updateGhostPosition()`: Game state ghost position updates

### game/board.ts
- `createEmptyBoard()`: Empty board generation
- `isValidPosition()`: Piece placement validation
- `placeTetromino()`: Piece board placement
- `clearLines()`: Complete line detection and clearing

### game/tetrominos.ts
- `getTetrominoShape()`: Piece shape data retrieval
- `rotateTetromino()`: 90-degree rotation algorithm
- `getRandomTetrominoType()`: Random piece type generation
- `createTetromino()`: Tetromino object creation
- `getTetrominoColorIndex()`: Color index mapping for piece types

### game/pieceBag.ts
- **7-Bag System**: `PieceBagManager` class implementing fair tetromino distribution
- `getNextPiece()`: Retrieve next piece from bag with automatic refill
- `refillBag()`: Shuffle and refill bag with all 7 piece types
- Fisher-Yates shuffle algorithm for randomization

### game/wallKick.ts
- **SRS Wall Kick System**: Super Rotation System implementation
- `getWallKickOffsets()`: Retrieve wall kick offset data for piece type and rotation
- `tryRotateWithWallKick()`: Attempt rotation with wall kick compensation
- Separate offset tables for I-piece and JLSTZ pieces
- Support for both clockwise and counter-clockwise rotations

## Data Persistence

### Local Storage Management (utils/localStorage.ts)
- High score list saving, retrieval, and management
- Game settings persistence (language, ghost piece display)
- Type-safe JSON operations
- Error handling
- Custom events (high score update notifications)

## Animation System

### Framer Motion Integration
- **Piece Drop**: Spring animations for new piece appearance
- **Piece Rotation**: 360-degree rotation effects
- **Piece Placement**: Scale animations (shrink → expand)
- **Line Clear**: Flash, pulse, and glow effects
- **Score Updates**: Spring animations for value changes
- **UI Transitions**: Modal and overlay fade effects

## Internationalization

### i18next Configuration
- Default language: English
- Fallback language: Japanese
- Runtime language switching
- Structured resource files (game terminology, controls, UI text, settings)

## Mobile Support

### Touch Controls (useTouchGestures)
- **Horizontal Swipe**: Left/right movement
- **Short Vertical Swipe**: Soft drop
- **Long Vertical Swipe**: Hard drop
- **Tap**: Rotation

### Responsive Design
- CSS Grid-based layout
- Desktop: Grid layout
- Mobile: Vertical stack layout
- Fixed 30×30px cell size

## Testing Strategy

### Bun Test + TypeScript
- **Game Logic**: Comprehensive testing of pure functions
- **Hooks**: Custom hook behavior testing
- **Components**: React Testing Library rendering tests
- **CI/CD**: Vercel and GitHub Actions support

## Development Guidelines

### Code Quality
- **TypeScript Strict Mode**: ES2024 target
- **Functional Programming**: Pure functions and immutable updates
- **Test-Driven Development**: All new features require tests
- **Type Safety**: Discriminated union types and type guards

### Performance Optimization
- **React Compiler**: Automatic optimization (no React.memo usage)
- **useTransition**: UI responsiveness maintenance
- **Zustand**: Lightweight state management
- **Rolldown-Vite**: Rust-powered high-speed bundler

### Naming Conventions
- **Components**: PascalCase (Board.tsx, Game.tsx)
- **Custom Hooks**: camelCase (useGameLoop.ts)
- **Utilities**: camelCase (gameStore.ts, colors.ts)
- **Test Files**: `*.test.ts` (co-located with source files)

## Development Commands

```bash
# Development & Build
bun run dev                    # Start development server
bun run build                  # Production build
bun run preview                # Preview build output

# Testing & Quality
bun test                       # Run all tests
bun test --watch               # Watch mode
bun run test:ci                # CI tests
bun run lint                   # Run Biome lint
bun run format                 # Run Biome format
bun run typecheck              # TypeScript type checking
bun run knip                   # Dead code detection
bun run check                  # Type check + dead code detection

# Package Management
bun install                    # Install dependencies
bun add <package>              # Add package
bun remove <package>           # Remove package
```

## Development Server Testing

For testing in the development server, use MCP (Model Context Protocol) Playwright integration:

```bash
# 1. Start development server
bun run dev

# 2. Use Playwright in Claude Code:
# - mcp__playwright__browser_navigate to open pages
# - mcp__playwright__browser_click for element interaction
# - mcp__playwright__browser_take_screenshot for screenshots
# - mcp__playwright__browser_snapshot for page structure analysis
```

This enables actual browser environment testing, particularly useful for:
- Visual UI confirmation
- Interactive feature testing
- Animation behavior verification
- Responsive design validation

## Prohibited Practices

- **Condition Relaxation**: Loosening conditions to resolve test or type errors
- **Test Skipping**: Inappropriate mocking to bypass issues
- **Hard Coding**: Hard-coded outputs or responses
- **Error Concealment**: Ignoring or hiding error messages
- **Temporary Fixes**: Postponing problems with temporary solutions

## Technical Decision Principles

- **Bun Priority**: Package management, test execution, and script running
- **Tailwind Setup**: Using @tailwindcss/vite plugin
- **UI Literals**: No source code embedding (use internationalization resources)