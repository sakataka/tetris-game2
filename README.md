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
bun run test:dom               # Run DOM-related tests (hooks, store)
bun run test:all               # Run all tests (MUST pass before commits)
bun run e2e                    # Run Playwright E2E tests (headless)
bun run e2e:headed             # Run Playwright E2E tests (with browser UI)

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