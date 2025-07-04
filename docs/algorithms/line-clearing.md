# Line Clearing Algorithm Documentation

## Overview

Line clearing is the core scoring mechanism in Tetris. When a horizontal row is completely filled with blocks, it clears from the board, and rows above drop down to fill the gap.

## Algorithm Steps

### 1. Detection Phase
Scan each row to find complete lines:
```typescript
for each row from bottom to top:
  if every cell in row is filled:
    mark row for clearing
```

### 2. Removal Phase
Remove all marked rows from the board:
```typescript
remainingRows = board.filter(row => !isComplete(row))
```

### 3. Gravity Phase
Add empty rows at the top to maintain board height:
```typescript
emptyRows = createEmptyRows(clearedCount)
newBoard = [...emptyRows, ...remainingRows]
```

## Visual Example

### Single Line Clear
```
Before:                After:
|..........|          |..........|  ← New empty row
|....#.....|          |..........|
|...###....|          |....#.....|  ← Dropped down
|##########|  →       |...###....|
|#..####.##|          |#..####.##|
```

### Multiple Line Clear (Tetris)
```
Before:                After:
|....#.....|          |..........|  ← 4 new empty rows
|...###....|          |..........|
|##########|          |..........|
|##########|  →       |..........|
|##########|          |....#.....|  ← All pieces dropped
|##########|          |...###....|
```

## Implementation Details

### Core Function
```typescript
function clearLines(board: GameBoard): {
  board: GameBoard;
  linesCleared: number;
  clearedLineIndices: number[];
} {
  // Find complete lines
  const clearedLineIndices = board
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.every(cell => cell !== 0))
    .map(({ index }) => index);

  // Early exit if no lines to clear
  if (clearedLineIndices.length === 0) {
    return { board, linesCleared: 0, clearedLineIndices: [] };
  }

  // Remove cleared lines
  const remainingRows = board.filter((_, index) => 
    !clearedLineIndices.includes(index)
  );

  // Add empty rows at top
  const emptyRows = Array.from({ length: clearedLineIndices.length }, 
    () => Array(BOARD_WIDTH).fill(0)
  );

  const newBoard = [...emptyRows, ...remainingRows];

  return {
    board: newBoard,
    linesCleared: clearedLineIndices.length,
    clearedLineIndices,
  };
}
```

## Scoring System

### Line Clear Types
- **Single**: 1 line × 100 points
- **Double**: 2 lines × 300 points
- **Triple**: 3 lines × 500 points
- **Tetris**: 4 lines × 800 points

### Level Multiplier
```
Score = BasePoints × (Level + 1)
```

Example at Level 9:
- Tetris: 800 × 10 = 8,000 points

## Performance Characteristics

### Time Complexity
- Detection: **O(rows × cols)** = O(20 × 10) = O(200)
- Filtering: **O(rows)** = O(20)
- Overall: **O(1)** constant for standard board size

### Space Complexity
- **O(rows × cols)** for new board creation
- In practice: O(200) cells

## Edge Cases

### 1. No Lines to Clear
```
|....#.....|
|...###....|  → No complete lines
|#..####.##|     Return unchanged
```

### 2. Non-contiguous Lines
```
|##########|  ← Line 2
|#..####.##|
|##########|  ← Line 4
```
Both lines clear, middle row drops to bottom.

### 3. Top Row Clear
```
|##########|  ← Rare but possible
|....#.....|
```
Creates empty row at top naturally.

### 4. All Lines Clear (Theoretical)
Would result in completely empty board.

## Animation Considerations

### Clear Animation Sequence
1. **Flash**: Highlight completed lines (100-200ms)
2. **Disappear**: Remove blocks with fade/particle effect
3. **Drop**: Animate remaining rows falling
4. **Score**: Display points earned

### Timing
```typescript
const ANIMATION_DURATION = {
  flash: 100,      // Line flash
  clear: 200,      // Disappear effect
  drop: 150,       // Gravity animation
  total: 450       // Total duration
};
```

## Advanced Mechanics

### 1. T-Spin Detection
Special scoring for pieces locked in place via rotation:
```
|#...#|
|#.T.#|  ← T-piece rotated into position
|#TTT#|     Awards bonus points
```

### 2. Back-to-Back Bonus
Consecutive Tetrises or T-spins multiply score:
- 1st Tetris: 800 points
- 2nd Tetris: 1200 points (1.5× bonus)

### 3. Combo System
Continuous line clears without placing pieces:
- Tracks consecutive clears
- Multiplier increases with combo length

## Integration with Game Loop

### Execution Order
1. Piece locks in place
2. Check for line clears
3. Update score
4. Play clear animation
5. Apply gravity
6. Spawn next piece

### State Updates
```typescript
// After piece placement
const { board: newBoard, linesCleared } = clearLines(currentBoard);
if (linesCleared > 0) {
  updateScore(linesCleared);
  playAnimation(clearedLineIndices);
}
```

## Optimization Strategies

### 1. Row Caching
Track "dirty" rows that need checking:
```typescript
// Only check rows affected by last piece
const affectedRows = getAffectedRows(lastPiece);
checkRows(affectedRows);
```

### 2. Bitwise Operations
Represent rows as integers for fast comparison:
```typescript
// Each cell as bit: 1111111111 = complete row
const isComplete = (row & FULL_ROW_MASK) === FULL_ROW_MASK;
```

### 3. Incremental Updates
Update only changed portions during animation.

## Testing Strategies

### Unit Tests
1. **Empty board**: No lines should clear
2. **Single line**: Verify correct removal and drop
3. **Multiple lines**: Test non-contiguous clears
4. **Edge positions**: Top and bottom row clears
5. **Score calculation**: Verify point awards

### Integration Tests
1. Place piece → Clear lines → Score update
2. Animation timing and sequencing
3. Level progression after clears
4. Performance under rapid clearing

## Common Bugs

### 1. Index Shifting
When removing multiple rows, indices change:
```typescript
// Wrong: Indices shift during iteration
for (index of linesToClear) {
  board.splice(index, 1);  // Bug!
}

// Correct: Filter approach
board.filter((_, i) => !linesToClear.includes(i));
```

### 2. Row Order
Ensure empty rows added at top, not bottom.

### 3. Score Timing
Award points after clear completes, not during animation.

## Variations in Other Games

### Cascade Gravity
Blocks fall individually after clears (Puyo Puyo style).

### Sticky Gravity
Some blocks remain floating (Dr. Mario style).

### Line Clear Delay
Modern games add slight delay for dramatic effect.

## References

- Implementation: `/src/game/board.ts` - `clearLines()`
- Score calculation: `/src/game/game.ts`
- Animation: `/src/components/game/Board.tsx`
- Tests: `/src/game/board.test.ts`