# @tetris-game/engine

Pure TypeScript Tetris Game Engine with BitBoard implementation and event-driven architecture.

## Features

- **High-Performance BitBoard**: Uint32Array-based board representation for optimal performance
- **Type-Safe Event System**: Event-driven architecture with O(1) subscription lookup
- **SRS-Compatible**: Standard Rotation System implementation with wall kicks
- **Zero Dependencies**: No external runtime dependencies
- **Framework Agnostic**: Works with any UI framework or vanilla JavaScript

## Performance Targets

- `evaluatePosition()`: < 10μs median
- `clearLines()`: < 50μs for 4 lines
- Memory usage: < 1MB for engine core
- Bundle size: < 15KB gzipped

## Usage

```typescript
import { GameEngine, GameEventBus } from '@tetris-game/engine';

// Create game engine
const engine = new GameEngine();

// Subscribe to events
const eventBus = new GameEventBus();
eventBus.subscribe('LINE_CLEARED', (event) => {
  console.log(`Lines cleared: ${event.payload.lines}`);
});

// Game loop
engine.tick();
```

## API Reference

### Core Classes

- `GameEngine`: Main game engine
- `GameEventBus`: Type-safe event system
- `Matrix`: Uint32Array-based board representation

### Core Operations

- `createMatrix()`: Create empty game board
- `setCell()`, `clearCell()`: Immutable cell operations
- `isOccupied()`: Check cell state
- `clearLine()`: Remove completed lines

## Development

```bash
# Install dependencies
bun install

# Build package
bun run build

# Run tests
bun run test

# Run performance tests
bun run test:performance

# Run golden master tests
bun run test:golden-master
```

## License

MIT