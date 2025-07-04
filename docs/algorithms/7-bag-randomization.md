# 7-Bag Randomization System Documentation

## Overview

The 7-bag randomization system is a piece distribution algorithm that ensures fair and balanced tetromino generation. It prevents long droughts of specific pieces while maintaining unpredictability.

## How It Works

### Basic Algorithm

1. **Create a "bag"** containing one of each tetromino type (I, O, T, S, Z, J, L)
2. **Shuffle the bag** randomly
3. **Draw pieces** from the bag in order
4. **Refill and shuffle** when the bag is empty

```
Initial bag: [I, O, T, S, Z, J, L]
     ↓ shuffle
Shuffled:    [T, Z, O, L, I, J, S]
     ↓ draw pieces
Draw order:   T → Z → O → L → I → J → S
     ↓ bag empty
Refill:      [I, O, T, S, Z, J, L]
     ↓ shuffle again
Continue...
```

## Benefits Over Pure Random

### Traditional Random Problems
- **Droughts**: Could go 20+ pieces without seeing an I-piece
- **Floods**: Could receive 4 S-pieces in a row
- **Unpredictable difficulty**: Random clusters create unfair situations

### 7-Bag Advantages
- **Maximum drought**: 12 pieces (end of one bag + start of next)
- **Guaranteed variety**: Every 7 pieces contains all types exactly once
- **Predictable difficulty**: Consistent piece distribution
- **Fair gameplay**: All players face similar challenges

## Statistical Properties

### Piece Frequency
- Each piece appears exactly **14.29%** of the time (1/7)
- Perfect distribution over any multiple of 7 pieces

### Drought Analysis
```
Best case (piece appears last in bag 1, first in bag 2):
[. . . . . . I] [I . . . . . .]
              ↑   ↑
            0 pieces between

Worst case (piece appears first in bag 1, last in bag 2):
[I . . . . . .] [. . . . . . I]
  ↑                           ↑
            12 pieces between
```

### Pattern Prevention
The shuffle ensures no predictable sequences while maintaining fairness.

## Implementation Details

### Data Structure

```typescript
interface PieceBag {
  readonly currentBag: readonly TetrominoTypeName[];  // Remaining pieces
  readonly generatedPieces: readonly TetrominoTypeName[];  // History
  readonly bagCount: number;  // Number of bags used
  readonly seed?: number;  // For reproducible randomness
}
```

### Key Functions

1. **createPieceBag()**: Initialize with shuffled first bag
2. **getNextPiece()**: Draw piece and return updated state
3. **shuffleWithSeed()**: Fisher-Yates shuffle algorithm

### Functional Programming Approach

The implementation follows immutable, pure functional patterns:
- No side effects
- Returns new state instead of modifying
- Supports time-travel debugging
- Easy to test with deterministic seeds

## Shuffle Algorithm

### Fisher-Yates Shuffle
```typescript
for (let i = array.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [array[i], array[j]] = [array[j], array[i]];
}
```

### Seeded Random (for testing)
Uses Linear Congruential Generator for reproducible shuffles:
```typescript
seed = (seed * 9301 + 49297) % 233280;
randomValue = seed / 233280;
```

## Visual Example

### First 14 Pieces (2 Bags)
```
Bag 1: [T, Z, O, L, I, J, S]
Bag 2: [L, S, I, T, J, O, Z]

Piece sequence:
|T|Z|O|L|I|J|S|L|S|I|T|J|O|Z|
 └─── Bag 1 ──┘└─── Bag 2 ──┘

Piece count after 14 pieces:
I: 2, O: 2, T: 2, S: 2, Z: 2, J: 2, L: 2
Perfect distribution!
```

## Edge Cases and Considerations

### 1. Preview System Integration
Modern Tetris shows upcoming pieces. The 7-bag system needs to generate enough pieces for the preview.

### 2. Hold Piece Interaction
When players hold pieces, it doesn't affect the bag - the next piece comes from the bag as normal.

### 3. Game Start
The first bag is shuffled immediately on game initialization.

### 4. Multiplayer Synchronization
In versus modes, players can have:
- **Same sequence**: Using same seed for fair competition
- **Different sequences**: Independent bags for variety

## Testing Strategy

### Unit Tests Should Verify:
1. **Distribution**: Each piece appears exactly once per bag
2. **No repeats**: Within a bag, no piece appears twice
3. **Seeded behavior**: Same seed produces same sequence
4. **State immutability**: Original state unchanged after operations

### Example Test Case:
```typescript
// Test perfect distribution
const bag = createPieceBag(12345); // Fixed seed
const pieces = [];
for (let i = 0; i < 7; i++) {
  const [piece, newBag] = getNextPiece(bag);
  pieces.push(piece);
  bag = newBag;
}
// pieces should contain each type exactly once
```

## Performance Considerations

### Time Complexity
- Shuffle: O(n) where n=7 (constant time)
- Get next piece: O(1)
- Memory: O(n) for storing current bag

### Optimizations
- Pre-generate multiple bags for smooth gameplay
- Use efficient shuffle algorithm
- Immutable updates using spread operator

## Alternative Systems

### History (for context)
1. **Pure Random**: Original Tetris - completely random
2. **Random with History**: Reduces repeats by tracking recent pieces
3. **Multiple Bags**: Uses larger bags (14-bag, 21-bag) for more variety
4. **Memoryless**: Weights adjust based on recent pieces

The 7-bag remains the gold standard for competitive play.

## References

- Implementation: `/src/game/pieceBag.ts`
- Tests: `/src/game/pieceBag.test.ts`
- Constants: `/src/utils/gameConstants.ts`