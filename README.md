# Tetris Game

A modern, full-featured Tetris game built with React and TypeScript.

## Features

- Classic Tetris gameplay with all 7 tetromino types, line clearing, scoring, and level progression
- Hold piece mechanics for strategic play
- Ghost piece showing landing position
- Smooth animations powered by Framer Motion
- Bilingual support (Japanese/English)
- Cross-platform compatibility with touch controls for mobile
- Local high score tracking
- Customizable game settings

## Tech Stack

- React 19 + TypeScript
- Bun (package management & testing)
- Rolldown-Vite (build)
- Tailwind CSS + Framer Motion
- Zustand (state management)
- shadcn/ui components

## Getting Started

**Prerequisites:** [Bun](https://bun.sh/docs/installation)

```bash
git clone https://github.com/sakataka/tetris-game2.git
cd tetris-game2
bun install
bun run dev
```

Open http://localhost:5173 to start playing!

## Controls

| Key | Action |
|-----|--------|
| ← → | Move piece |
| ↓ | Soft drop |
| ↑ | Rotate |
| Space | Hard drop |
| C | Hold piece |
| P | Pause/Resume |
| Enter | Reset game |

## Development Commands

```bash
# Development
bun run dev                    # Development server
bun run build                  # Build
bun run preview                # Preview

# Testing & Quality
bun test                       # Run tests
bun run lint                   # Lint
bun run format                 # Format
bun run typecheck              # Type check
```

## License

ISC License