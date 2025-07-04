# Collision Detection Algorithm Documentation

## Overview

Collision detection determines whether a tetromino can be placed at a specific position on the game board. It's fundamental to Tetris gameplay, affecting movement, rotation, and piece placement.

## Core Algorithm

### Basic Principle
For each filled cell in the tetromino shape:
1. Calculate its position on the game board
2. Check if that position is valid (within bounds and not occupied)
3. If any cell would be invalid, the entire position is invalid

```typescript
function isValidPosition(board, shape, position) {
  for each cell in shape:
    if cell is filled:
      boardX = position.x + cellX
      boardY = position.y + cellY
      
      if boardX < 0 or boardX >= width:     return false  // Out of bounds
      if boardY < 0 or boardY >= height:    return false  // Out of bounds
      if board[boardY][boardX] is occupied:  return false  // Collision
  
  return true  // All cells valid
}
```

## Visual Examples

### Valid Position
```
Board (10×4 shown):        T-piece at (3,1):
|..........|              Shape:
|..........|              |.1.|
|..........|              |111|
|##.....###|              |...|
                          
Combined view:
|..........|
|...T......|  ← Valid: All T cells in empty spaces
|..TTT.....|
|##.....###|
```

### Collision Examples

**Left Wall Collision:**
```
T-piece at (-1,1):
|T.........|  ← Invalid: Left cell at x=-1
|TTT.......|
|..........|
```

**Bottom Collision:**
```
T-piece at (3,2):
|..........|
|..........|
|...T......|
|##TTT..###|  ← Invalid: Cells overlap with blocks
```

**Right Wall Collision:**
```
I-piece horizontal at (7,1):
|..........|
|.......III|I  ← Invalid: Rightmost cell at x=10
|..........|
```

## Implementation Details

### Boundary Checks
```
1. Left boundary:   x >= 0
2. Right boundary:  x < BOARD_WIDTH (10)
3. Top boundary:    y >= 0
4. Bottom boundary: y < BOARD_HEIGHT (20)
```

### Optimization Techniques

#### 1. Early Exit
Stop checking as soon as first collision found:
```typescript
for (y = 0; y < shape.length; y++) {
  for (x = 0; x < shape[y].length; x++) {
    if (shape[y][x]) {
      // Check collision
      if (invalid) return false;  // Early exit
    }
  }
}
```

#### 2. Sparse Checking
Only check filled cells (skip empty cells in shape matrix):
```typescript
if (shape[y][x] !== 0) {  // Only check filled cells
  // Perform collision check
}
```

#### 3. Cached Board Dimensions
Store board dimensions as constants to avoid repeated lookups.

## Special Cases

### 1. Spawn Collision (Game Over)
When a new piece spawns and immediately collides:
```
|....II....|  ← New I-piece spawns
|...####...|  ← But collides with existing blocks
|##########|  → Game Over
```

### 2. Ceiling Collision
Pieces can be partially above the visible board:
```
y=-2: |..TTT.....|  ← T-piece partially above board
y=-1: |...T......|  ← Only this part visible
y=0:  |..........|  ← Top of visible board
```

### 3. Rotation Collision
Used with wall kick system to find valid rotation:
```typescript
// Try rotation at multiple positions
for (offset of wallKickOffsets) {
  testPos = position + offset;
  if (isValidPosition(board, rotatedShape, testPos)) {
    return testPos;  // Found valid position
  }
}
```

## Performance Characteristics

### Time Complexity
- **O(w × h)** where w,h are tetromino dimensions
- In practice: **O(1)** since tetromino size is constant (max 4×4)

### Space Complexity
- **O(1)** - No additional space needed beyond input

### Typical Performance
- Standard pieces (3×3): Max 9 checks
- I-piece (4×4): Max 16 checks
- With early exit: Often fewer checks

## Edge Cases and Validation

### 1. Empty Shape
An empty shape is technically valid anywhere:
```typescript
shape = [[0,0],[0,0]]  // Empty 2×2
isValidPosition() → true  // No filled cells to collide
```

### 2. Out-of-Bounds Positioning
Position can be negative or beyond board:
```typescript
position = {x: -5, y: -3}  // Far outside
// Algorithm correctly handles via boundary checks
```

### 3. Corrupted Board State
Defensive programming for invalid board:
```typescript
if (!board[boardY] || !board[boardY][boardX]) {
  // Handle missing row/column
}
```

## Integration Points

### Movement Validation
```typescript
// Before moving piece
newPosition = { x: current.x + deltaX, y: current.y + deltaY };
if (isValidPosition(board, shape, newPosition)) {
  current = newPosition;  // Apply movement
}
```

### Rotation Validation
```typescript
// Before rotating piece
rotatedShape = rotatePiece(currentShape);
if (isValidPosition(board, rotatedShape, position)) {
  currentShape = rotatedShape;  // Apply rotation
} else {
  // Try wall kicks
}
```

### Drop Validation
```typescript
// Find landing position
dropPosition = position;
while (isValidPosition(board, shape, {x: dropPosition.x, y: dropPosition.y + 1})) {
  dropPosition.y++;
}
```

## Helper Functions

### forEachPieceCell
Utility to iterate over filled cells:
```typescript
function forEachPieceCell(shape, position, callback) {
  for (y = 0; y < shape.length; y++) {
    for (x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        boardX = position.x + x;
        boardY = position.y + y;
        callback(boardX, boardY, x, y);
      }
    }
  }
}
```

### isValidBoardPosition
Validates single board coordinate:
```typescript
function isValidBoardPosition({x, y}) {
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
}
```

## Testing Strategies

### Boundary Tests
1. Place piece at each corner
2. Place piece partially outside each edge
3. Place piece completely outside board

### Collision Tests
1. Empty board (should always be valid)
2. Full board (should always collide)
3. Single block collision
4. Complex shape interactions

### Performance Tests
1. Worst-case scenarios (full board checks)
2. Average gameplay scenarios
3. Stress test with rapid checks

## Common Bugs to Avoid

1. **Off-by-one errors**: Board indices are 0-based
2. **Shape iteration**: Check shape bounds before board bounds
3. **Negative positions**: Handle pieces above board
4. **Type safety**: Ensure consistent CellValue types

## References

- Implementation: `/src/game/board.ts` - `isValidPosition()`
- Board utilities: `/src/utils/boardUtils.ts`
- Integration: `/src/game/game.ts`
- Tests: `/src/game/board.test.ts`