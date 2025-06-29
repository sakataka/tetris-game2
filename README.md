# Tetris Game

A modern, full-featured Tetris game built with React and TypeScript, featuring authentic gameplay mechanics, smooth animations, and cross-platform compatibility.

## 🎮 Game Features

### Core Gameplay
- **Authentic Tetris Experience**: Complete implementation of classic Tetris with all 7 standard tetromino pieces (I, O, T, S, Z, J, L)
- **7-Bag Randomization System**: Fair piece distribution ensuring balanced gameplay and preventing long droughts
- **Super Rotation System (SRS)**: Advanced rotation mechanics with wall kicks for smooth piece placement
- **Progressive Difficulty**: Dynamic level progression with increasing drop speed for continuous challenge
- **Multi-line Clearing**: Support for single, double, triple, and Tetris (4-line) clears with appropriate scoring

### Advanced Mechanics
- **Hold System**: Save any piece for later use with visual hold indicator and usage restrictions
- **Ghost Piece**: Transparent preview showing exactly where the current piece will land
- **Soft Drop & Hard Drop**: Controlled descent with soft drop (↓) and instant placement with hard drop (Space)
- **Line Clear Effects**: Satisfying visual feedback with flash animations and smooth row clearing
- **Pause/Resume**: Full game state preservation with overlay controls

### Scoring & Progression
- **Comprehensive Scoring System**: Points awarded for piece placement, line clears, and drop bonuses
- **Level Progression**: Automatic level advancement based on lines cleared with speed increases
- **High Score Tracking**: Persistent local leaderboard with top scores and player names
- **Real-time Statistics**: Live display of current score, lines cleared, and level information

### User Interface & Experience
- **Responsive Design**: Seamless adaptation from desktop to mobile devices
- **Touch Controls**: Intuitive gesture-based input for mobile play (swipe to move, tap to rotate)
- **Smooth Animations**: Framer Motion-powered transitions for piece movement and UI interactions
- **Visual Polish**: Modern UI with clean aesthetics and satisfying visual feedback
- **Settings Panel**: Integrated dropdown with customizable game preferences

### Internationalization
- **Bilingual Support**: Complete English and Japanese localization with instant language switching
- **Locale Persistence**: User language preference saved automatically across sessions
- **Cultural Adaptation**: Appropriate number formatting and text rendering for each language

## 🎯 How to Play

### Objective
Arrange falling tetromino pieces to create complete horizontal lines, which will clear and award points. The game ends when pieces reach the top of the playing field.

### Gameplay Mechanics
1. **Piece Movement**: Use arrow keys or swipe gestures to position falling pieces
2. **Rotation**: Rotate pieces to fit them into available spaces
3. **Line Clearing**: Complete horizontal lines disappear and award points
4. **Level Progression**: Clear lines to advance levels and increase game speed
5. **Hold Strategy**: Save pieces for optimal placement using the hold function

### Scoring System
- **Single Line**: 100 × level points
- **Double Lines**: 300 × level points  
- **Triple Lines**: 500 × level points
- **Tetris (4 lines)**: 800 × level points
- **Soft Drop**: 1 point per cell
- **Hard Drop**: 2 points per cell

### Pro Tips
- Plan ahead using the next piece preview
- Use the hold function strategically to save I-pieces for Tetris clears
- Focus on creating Tetris opportunities for maximum points
- Keep the playing field low to avoid game over
- Use hard drops for speed and bonus points

## 🛠 Tech Stack

- **React 19** + **TypeScript** - Modern frontend with strict typing
- **Bun** - Fast package management and testing
- **Rolldown-Vite** - High-performance build system
- **Tailwind CSS** + **Framer Motion** - Styling and animations
- **Zustand** - Lightweight state management
- **Radix UI** - Accessible component primitives
- **i18next** - Internationalization framework

## 🚀 Getting Started

### Prerequisites
- **[Bun](https://bun.sh/docs/installation)** - Modern JavaScript runtime and package manager
- **Node.js 18+** (alternative to Bun)
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

## 🎯 Controls

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

## 🔧 Development Commands

```bash
# Development
bun run dev                    # Start development server
bun run build                  # Create production build
bun run preview                # Preview production build

# Testing & Quality Assurance
bun test                       # Run test suite
bun run lint                   # Lint code with Biome
bun run format                 # Format code with Biome
bun run typecheck              # TypeScript type checking
bun run ci                     # Full CI pipeline (lint + typecheck + test + build)
```

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