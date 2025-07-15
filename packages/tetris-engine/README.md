# @tetris/engine

High-performance, event-driven Tetris game engine built with TypeScript.

## Features

- 🚀 **Performance Optimized**: BitBoard implementation using Uint32Array
- 📡 **Event-Driven**: Type-safe event system for loose coupling
- 🧪 **Fully Tested**: 100% test coverage with property-based testing
- 🔧 **Framework Agnostic**: Zero dependencies on UI frameworks
- 📦 **Tree-Shakable**: ES modules with optimal bundle size
- 🎯 **Type Safe**: Full TypeScript support with strict typing

## Installation

```bash
npm install @tetris/engine
```

## Quick Start

```typescript
import { GameEngine, GameEventBus } from '@tetris/engine';

// Create game engine
const engine = new GameEngine({
  randomSeed: 12345 // Optional for deterministic games
});

// Setup event handling
const eventBus = new GameEventBus();
eventBus.subscribe('LINE_CLEARED', (event) => {
  console.log(`Cleared ${event.payload.lines} lines!`);
});

// Start game loop
engine.startGame();
```

## Core Concepts

### BitBoard Representation

The engine uses an optimized BitBoard representation for maximum performance:

```typescript
import { createMatrix, setCell, isOccupied } from '@tetris/engine';

// Create 24-row matrix (20 visible + 4 buffer)
const board = createMatrix(24);

// Set cell at row 23, column 5
const newBoard = setCell(board, 23, 5);

// Check if cell is occupied
const occupied = isOccupied(newBoard, 23, 5); // true
```

### Event System

Type-safe event handling with automatic TypeScript inference:

```typescript
import { GameEventBus } from '@tetris/engine/events';

const eventBus = new GameEventBus();

// Strongly typed event subscription
eventBus.subscribe('PIECE_PLACED', (event) => {
  // event.payload is automatically typed as:
  // { piece: Piece; position: Vec2; rotation: number }
  console.log(`Placed ${event.payload.piece.type} at (${event.payload.position.x}, ${event.payload.position.y})`);
});

// Type-safe event emission
eventBus.emit({
  type: 'PIECE_PLACED',
  payload: {
    piece: { type: 'T', /* ... */ },
    position: { x: 5, y: 20 },
    rotation: 1
  }
});
```

## API Reference

### GameEngine

#### Constructor

```typescript
new GameEngine(config?: GameConfig)
```

**Parameters:**
- `config.randomSeed?: number` - Seed for deterministic gameplay
- `config.fallSpeed?: number` - Base fall speed in milliseconds
- `config.enableHold?: boolean` - Enable hold piece functionality

#### Methods

##### `startGame(): void`
Initializes a new game session.

##### `tick(): boolean`
Advances game by one frame. Returns `false` if game over.

##### `moveLeft(): boolean`
Moves current piece left. Returns `true` if successful.

##### `moveRight(): boolean`
Moves current piece right. Returns `true` if successful.

##### `rotateClockwise(): boolean`
Rotates current piece clockwise. Returns `true` if successful.

##### `hardDrop(): { distance: number; score: number }`
Instantly drops current piece. Returns drop distance and score awarded.

##### `getState(): GameState`
Returns current game state (read-only).

### GameEventBus

#### Methods

##### `subscribe<T>(eventType: T, handler: EventHandler<T>): UnsubscribeFunction`
Subscribe to events with full type safety.

##### `emit(event: GameEvent): void`
Emit an event to all subscribers.

### BitBoard Operations

#### `createMatrix(rows: number): Matrix`
Creates empty game matrix.

#### `setCell(matrix: Matrix, row: number, col: number): Matrix`
Sets cell in matrix (immutable operation).

#### `clearCell(matrix: Matrix, row: number, col: number): Matrix`
Clears cell in matrix (immutable operation).

#### `isOccupied(matrix: Matrix, row: number, col: number): boolean`
Checks if cell is occupied.

#### `clearLine(matrix: Matrix, row: number): Matrix`
Clears line and shifts remaining rows down.

#### `findCompleteLines(matrix: Matrix): number[]`
Returns array of complete line indices.

## Performance Guidelines

### Memory Optimization

```typescript
// ✅ Good: Reuse matrices
const boardPool = new RingBuffer(100, () => createMatrix(24));
const reusedBoard = boardPool.acquire();

// ❌ Bad: Create new matrices frequently
const newBoard = createMatrix(24); // Causes GC pressure
```

### Event Handling

```typescript
// ✅ Good: Unsubscribe when done
const unsubscribe = eventBus.subscribe('GAME_OVER', handler);
// ... later
unsubscribe();

// ❌ Bad: Memory leak
eventBus.subscribe('GAME_OVER', handler); // Never unsubscribed
```

## Testing

Run the test suite:

```bash
npm test                  # Unit tests
npm run test:coverage     # Coverage report
npm run test:golden       # Golden master tests
npm run benchmark         # Performance benchmarks
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file.