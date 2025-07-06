# Tetris Game

A modern, full-featured Tetris game built with React and TypeScript, featuring authentic gameplay mechanics, smooth animations, and cross-platform compatibility.

## 🎮 About This Game

A complete Tetris implementation with authentic gameplay mechanics, featuring all 7 tetromino pieces, advanced rotation system (SRS), and fair randomization. Includes hold system, ghost piece preview, progressive difficulty, and comprehensive scoring with local leaderboards.

**Key Features:**
- Classic Tetris gameplay with modern enhancements
- Cross-platform support (desktop & mobile with touch controls)
- Bilingual interface (English/Japanese)
- Smooth animations and visual effects
- Local high score tracking

## 🎯 How to Play

**Objective:** Arrange falling pieces to create complete horizontal lines, which clear and award points.

**Basic Controls:**
- **Arrow Keys**: Move and rotate pieces
- **Space**: Drop piece instantly
- **C**: Hold current piece for later use
- **P**: Pause/Resume game

**Scoring:** Points awarded for line clears (Tetris = 4 lines = highest points), piece drops, and level progression.

**Strategy:** Use the next piece preview and hold function strategically. Focus on creating Tetris clears for maximum points.

---

# 🔧 For Developers

## Tech Stack

- **React 19** + **TypeScript** - Modern frontend with strict typing
- **Bun** - Fast package management and testing
- **Rolldown-Vite** - High-performance build system
- **Tailwind CSS** + **Framer Motion** - Styling and animations
- **Zustand** - Lightweight state management
- **Radix UI** - Accessible component primitives
- **i18next** - Internationalization framework

## Getting Started

### Prerequisites
- **[Bun](https://bun.sh/docs/installation)** - Modern JavaScript runtime and package manager
- Modern web browser with JavaScript enabled

### Quick Start
```bash
# Clone the repository
git clone https://github.com/sakataka/tetris-game2.git
cd tetris-game2

# Install dependencies
bun install

# Start development server
bun run dev
```

**🎮 Start Playing:** Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production
```bash
# Create optimized production build
bun run build

# Preview production build locally
bun run preview
```

The production build will be generated in the `dist/` directory, ready for deployment to any static hosting service.

## Development Commands

```bash
# Development
bun run dev                    # Start development server (http://localhost:5173)
bun run build                  # Create production build
bun run preview                # Preview production build

# Testing
bun test                       # Run pure function tests (game, utils, lib)
bun run test:ci                # Run tests with reduced iterations for CI (35 iterations)
bun run test:dom               # Run DOM-related tests (hooks, store)
bun run test:all               # Run all tests (MUST pass before commits)
bun run e2e                    # Run Playwright E2E tests (headless)
bun run e2e:headed             # Run Playwright E2E tests (with browser UI)

## Fast Tests in CI

The project uses property-based testing with configurable iteration counts to balance thorough testing with CI performance:

- **Local Development**: Default 100 iterations for comprehensive testing
- **CI Environment**: Reduced to 35 iterations for faster builds (~95% confidence)
- **Custom Control**: Set `TEST_ITERATIONS` environment variable to override defaults

### Usage Examples

```bash
# Run tests with default iterations (100)
bun test

# Run tests with reduced iterations for CI (35)
bun run test:ci

# Run tests with custom iteration count
TEST_ITERATIONS=50 bun test

# Run tests with minimal iterations for quick feedback
TEST_ITERATIONS=10 bun test
```

# Code Quality
bun run lint                   # Lint code with Biome (MUST pass before commits)
bun run format                 # Format code with Biome
bun run typecheck              # TypeScript type checking (MUST pass before commits)

# i18n Management
bun run check:i18n             # Check translation key consistency

# CI Pipeline
bun run ci                     # Full CI pipeline (lint + typecheck + test + build)
```

## Detailed Controls Reference

### Desktop Controls
| Key | Action | Description |
|-----|--------|-------------|
| **← →** | Move Left/Right | Move the active piece horizontally |
| **↓** | Soft Drop | Accelerate piece descent (awards bonus points) |
| **↑** | Rotate | Rotate piece clockwise with SRS wall kicks |
| **Space** | Hard Drop | Instantly drop piece to bottom (awards bonus points) |
| **C** | Hold Piece | Save current piece for later use (once per piece) |
| **P** | Pause/Resume | Pause game with overlay (preserves game state) |
| **Enter** | Reset Game | Start new game (prompts for confirmation) |

### Mobile Touch Controls
| Gesture | Action | Description |
|---------|--------|-------------|
| **Swipe Left/Right** | Move Piece | Horizontal piece movement |
| **Swipe Down** | Soft Drop | Accelerated descent |
| **Tap Screen** | Rotate | Clockwise rotation |
| **Swipe Up** | Hard Drop | Instant drop to bottom |
| **Hold Button** | Hold Piece | Access hold functionality |
| **Pause Button** | Pause/Resume | Game state control |

### Game State Controls
- **Game Over**: Click anywhere or press any key to restart
- **Paused State**: Press 'P' or click Resume to continue
- **Settings**: Access via gear icon in top-right corner
- **Language Toggle**: Switch between English/Japanese in settings

## 🐛 Debug Mode (Development Only)

Debug mode allows developers to quickly test specific game states that would be difficult or time-consuming to reproduce during normal gameplay.

### Enabling Debug Mode

Add URL parameters to activate debug mode:
```
http://localhost:5173/?debug=true
```

### Available Debug Parameters

#### 1. Preset Board States
Use the `preset` parameter to load predefined game states:

```bash
# Single line clear setup
http://localhost:5173/?debug=true&preset=singleLine

# Double line clear setup
http://localhost:5173/?debug=true&preset=doubleLine

# Triple line clear setup
http://localhost:5173/?debug=true&preset=tripleLine

# Tetris (4-line) clear setup
http://localhost:5173/?debug=true&preset=tetris

# Near game over state
http://localhost:5173/?debug=true&preset=nearGameOver

# Near high score state
http://localhost:5173/?debug=true&preset=nearHighScore

# T-Spin setup
http://localhost:5173/?debug=true&preset=tSpinSetup

# Complex board with gaps
http://localhost:5173/?debug=true&preset=complexBoard

# Empty board
http://localhost:5173/?debug=true&preset=empty
```

#### 2. Custom Piece Queue
Control the sequence of pieces with the `queue` parameter:

```bash
# Specific piece order
http://localhost:5173/?debug=true&queue=IJLOSTZ

# All O pieces followed by all I pieces
http://localhost:5173/?debug=true&queue=OOOOIIII

# Comma-separated format also works
http://localhost:5173/?debug=true&queue=I,J,L,O,S,T,Z
```

#### 3. Game State Parameters
Set specific game values:

```bash
# Set custom score, level, and lines
http://localhost:5173/?debug=true&score=99900&level=10&lines=95

# Combine with presets
http://localhost:5173/?debug=true&preset=tetris&score=50000

# Random seed for reproducible games
http://localhost:5173/?debug=true&seed=12345
```

### Debug UI Features

When debug mode is active, a red panel appears in the top-right corner showing:
- Current debug mode status
- Active preset name (if any)
- Current piece queue
- Random seed (if set)

The debug panel also provides:
- **Quick Presets**: Buttons to instantly switch between different presets
- **Custom Queue**: Input field to dynamically change the piece sequence (press Enter to apply)

### Usage Examples

#### Testing Line Clear Animations
```bash
# Load single line clear state
http://localhost:5173/?debug=true&preset=singleLine
# Drop the I piece to trigger the animation
```

#### Testing High Score Updates
```bash
# Start with a score just below the current high score
http://localhost:5173/?debug=true&preset=nearHighScore
# Clear a few lines to trigger high score update
```

#### Testing Specific Piece Sequences
```bash
# Test handling of multiple S and Z pieces
http://localhost:5173/?debug=true&queue=SZSZSZ
```

#### Reproducing Bug Reports
```bash
# Use seed for deterministic piece generation
http://localhost:5173/?debug=true&seed=42&level=15
```

### Development Workflow Tips

1. **Quick Testing**: Use debug presets to jump directly to the game state you need to test
2. **Animation Testing**: Use line clear presets to test clearing animations without playing full games
3. **Difficulty Testing**: Set high levels to test increased game speed
4. **Edge Case Testing**: Use custom queues to test difficult piece combinations
5. **Bug Reproduction**: Use seeds to create reproducible test scenarios

## 🌟 Key Highlights

- **🎮 Authentic Experience**: Faithful implementation of classic Tetris mechanics
- **📱 Cross-Platform**: Seamless desktop and mobile gameplay
- **🌍 Bilingual**: Complete English and Japanese localization
- **⚡ High Performance**: Built with modern web technologies for smooth 60fps gameplay
- **🎨 Polished UI**: Professional design with satisfying animations and effects
- **🧪 Well Tested**: Comprehensive test coverage ensuring reliability
- **🔧 Developer Friendly**: Modern tooling with TypeScript, Bun, and Vite
- **♿ Accessible**: Keyboard navigation and screen reader friendly

## License

ISC License