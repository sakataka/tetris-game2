# Tetris Game

A modern Tetris game built with React and TypeScript.

## Features

- Complete Tetris experience (7 piece types, line clearing, scoring, level progression)
- Hold piece functionality
- Ghost piece (drop preview)
- Beautiful animations with Framer Motion
- Japanese and English language support
- Desktop and mobile compatibility (touch controls)
- High score tracking with local storage
- Game settings (language toggle, ghost piece on/off)

## Tech Stack

- React 19 + TypeScript
- Bun (package management & testing)
- Rolldown-Vite (build)
- Tailwind CSS + Framer Motion
- Zustand (state management)
- shadcn/ui components

## Setup

Prerequisites: [Bun](https://bun.sh/docs/installation)

```bash
git clone https://github.com/sakataka/tetris-game2.git
cd tetris-game2
bun install
bun run dev
```

Start playing at http://localhost:5173

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