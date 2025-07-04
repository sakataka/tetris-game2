# Super Rotation System (SRS) Documentation

## Overview

The Super Rotation System (SRS) is the standard rotation system used in modern Tetris games. It defines how tetrominoes rotate and how they behave when rotation would cause collision (wall kick system).

## Key Concepts

### Rotation States
Each tetromino has 4 rotation states, numbered 0-3:
- **State 0**: Initial spawn orientation
- **State 1**: 90° clockwise from spawn
- **State 2**: 180° from spawn
- **State 3**: 270° clockwise from spawn (90° counter-clockwise from spawn)

### Basic Rotation
Rotation is performed by transposing and reversing the piece matrix:
```
For clockwise rotation:
rotated[j][n-1-i] = original[i][j]
```

## Wall Kick System

When a rotation would cause collision, the game tests up to 5 offset positions to find a valid placement. This allows pieces to "kick" off walls and other pieces.

### JLSTZ Pieces (3×3 Bounding Box)

These pieces share the same wall kick data:

```
Rotation 0→1 (spawn to right):
Test 1: ( 0, 0)  - No offset
Test 2: (-1, 0)  - Left 1
Test 3: (-1,+1)  - Left 1, Up 1
Test 4: ( 0,-2)  - Down 2
Test 5: (-1,-2)  - Left 1, Down 2

Rotation 1→2 (right to reverse):
Test 1: ( 0, 0)  - No offset
Test 2: (+1, 0)  - Right 1
Test 3: (+1,-1)  - Right 1, Down 1
Test 4: ( 0,+2)  - Up 2
Test 5: (+1,+2)  - Right 1, Up 2

Rotation 2→3 (reverse to left):
Test 1: ( 0, 0)  - No offset
Test 2: (+1, 0)  - Right 1
Test 3: (+1,+1)  - Right 1, Up 1
Test 4: ( 0,-2)  - Down 2
Test 5: (+1,-2)  - Right 1, Down 2

Rotation 3→0 (left to spawn):
Test 1: ( 0, 0)  - No offset
Test 2: (-1, 0)  - Left 1
Test 3: (-1,-1)  - Left 1, Down 1
Test 4: ( 0,+2)  - Up 2
Test 5: (-1,+2)  - Left 1, Up 2
```

Counter-clockwise rotations use the same offsets but in reverse order.

### I Piece (4×4 Bounding Box)

The I piece has unique wall kick data due to its 4×4 bounding box:

```
Rotation 0→1:
Test 1: ( 0, 0)  - No offset
Test 2: (-2, 0)  - Left 2
Test 3: (+1, 0)  - Right 1
Test 4: (-2,-1)  - Left 2, Down 1
Test 5: (+1,+2)  - Right 1, Up 2

Rotation 1→2:
Test 1: ( 0, 0)  - No offset
Test 2: (-1, 0)  - Left 1
Test 3: (+2, 0)  - Right 2
Test 4: (-1,+2)  - Left 1, Up 2
Test 5: (+2,-1)  - Right 2, Down 1

Rotation 2→3:
Test 1: ( 0, 0)  - No offset
Test 2: (+2, 0)  - Right 2
Test 3: (-1, 0)  - Left 1
Test 4: (+2,+1)  - Right 2, Up 1
Test 5: (-1,-2)  - Left 1, Down 2

Rotation 3→0:
Test 1: ( 0, 0)  - No offset
Test 2: (+1, 0)  - Right 1
Test 3: (-2, 0)  - Left 2
Test 4: (+1,-2)  - Right 1, Down 2
Test 5: (-2,+1)  - Left 2, Up 1
```

### O Piece (2×2 Square)

The O piece doesn't rotate in SRS, so it always returns offset (0, 0).

## Visual Examples

### T-Piece Wall Kick Example

Initial position blocked by wall:
```
|........#.|
|..TTT...#.|  T piece trying to rotate
|...T....#.|  next to wall
|------------|
```

After rotation with wall kick offset (-1, 0):
```
|........#.|
|..T.....#.|  Successfully rotated
|.TT.....#.|  and kicked left
|..T.....#.|
|------------|
```

### I-Piece Special Behavior

The I piece centers on a 4×4 grid:
```
State 0:          State 1:
|....|            |.#..|
|####|            |.#..|
|....|            |.#..|
|....|            |.#..|
```

## Implementation Details

### Code Structure

The wall kick system is implemented in `/src/game/wallKick.ts`:

1. **Wall Kick Data**: Predefined offset tables for each rotation transition
2. **getWallKickOffsets()**: Returns appropriate offsets based on piece type and rotation
3. **tryRotateWithWallKick()**: Tests each offset until valid position found

### Key Functions

```typescript
// Get offsets for a specific rotation
getWallKickOffsets(
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState
): Position[]

// Try rotation with wall kicks
tryRotateWithWallKick(
  board: CellValue[][],
  rotatedShape: CellValue[][],
  position: Position,
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState,
  isValidPositionFn: Function
): Position | null
```

## Edge Cases

1. **Floor Kicks**: Pieces can kick upward when rotating near the floor
2. **Wall Climbing**: Some rotations allow pieces to "climb" walls
3. **Spin Detection**: Advanced games detect T-spins and other special moves
4. **180° Rotation**: Not implemented in basic SRS (requires double rotation)

## Testing Considerations

When testing SRS implementation:
1. Test all rotation transitions (0→1, 1→2, 2→3, 3→0, and reverse)
2. Test wall kicks against left wall, right wall, and floor
3. Test I-piece separately due to unique behavior
4. Verify O-piece doesn't rotate
5. Test piece interactions (kicks against other pieces)

## References

- Implementation: `/src/game/wallKick.ts`
- Tetromino shapes: `/src/game/tetrominos.ts`
- Tests: `/src/game/wallKick.test.ts`