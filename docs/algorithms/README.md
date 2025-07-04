# Tetris Game Algorithms Documentation

This directory contains comprehensive documentation for the core algorithms that power our Tetris game implementation. Each algorithm is explained with visual examples, implementation details, and performance characteristics.

## 📚 Algorithm Documentation

### 1. [Super Rotation System (SRS)](./srs-rotation-system.md)
The standard rotation system used in modern Tetris games.
- Rotation states and basic mechanics
- Wall kick data for all piece types
- Special I-piece behavior
- Visual examples and edge cases

### 2. [7-Bag Randomization System](./7-bag-randomization.md)
Fair piece distribution algorithm preventing droughts and floods.
- How the bag system works
- Statistical properties and benefits
- Implementation with functional programming
- Comparison with other randomization methods

### 3. [Collision Detection](./collision-detection.md)
Core algorithm for validating piece positions on the board.
- Boundary and overlap checking
- Performance optimizations
- Integration with movement and rotation
- Edge cases and defensive programming

### 4. [Line Clearing](./line-clearing.md)
Mechanism for detecting and removing completed rows.
- Detection, removal, and gravity phases
- Scoring system and multipliers
- Animation considerations
- Advanced mechanics (T-spins, combos)

## 🔗 Quick Reference

### Key Files
- **Rotation Logic**: `/src/game/wallKick.ts`
- **Piece Generation**: `/src/game/pieceBag.ts`
- **Board Operations**: `/src/game/board.ts`
- **Tetromino Data**: `/src/game/tetrominos.ts`

### Core Functions
```typescript
// SRS Wall Kick
tryRotateWithWallKick(board, rotatedShape, position, pieceType, fromRotation, toRotation, isValidPositionFn)

// 7-Bag System
getNextPiece(bag): [TetrominoTypeName, PieceBag]

// Collision Detection
isValidPosition(board: GameBoard, shape: number[][], position: Position): boolean

// Line Clearing
clearLines(board: GameBoard): { board: GameBoard; linesCleared: number; clearedLineIndices: number[] }
```

## 🎮 Game Constants

- **Board Size**: 20 rows × 10 columns
- **Tetromino Types**: I, O, T, S, Z, J, L
- **Rotation States**: 0 (spawn), 1 (90°), 2 (180°), 3 (270°)
- **Preview Pieces**: 3-5 upcoming pieces shown

## 🧪 Testing

Each algorithm has comprehensive test coverage:
- `/src/game/wallKick.test.ts` - Rotation and wall kick tests
- `/src/game/pieceBag.test.ts` - Randomization tests
- `/src/game/board.test.ts` - Collision and line clearing tests

## 🚀 Performance Notes

All algorithms are optimized for real-time gameplay:
- Collision detection: O(1) constant time (max 16 checks)
- Line clearing: O(1) for standard board size
- Piece generation: O(1) amortized
- Rotation: O(1) with up to 5 wall kick attempts

## 📖 Further Reading

- [Tetris Guideline](https://tetris.wiki/Tetris_Guideline) - Official Tetris standards
- [SRS Documentation](https://tetris.wiki/Super_Rotation_System) - Detailed SRS specification
- [Randomizer Theory](https://tetris.wiki/Random_Generator) - Various randomization algorithms

## 💡 Contributing

When modifying algorithms:
1. Maintain pure functional approach
2. Update relevant documentation
3. Add/update unit tests
4. Consider performance impact
5. Follow existing code patterns

---

*Last Updated: 2025-07-04*