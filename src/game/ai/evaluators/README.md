# AI Evaluators

This directory contains the AI evaluation system for the Tetris game. The evaluators are responsible for scoring board states and moves to guide the AI's decision-making process.

## Architecture

The evaluator system is built around the `BaseEvaluator` interface, which provides a unified contract for all evaluation strategies. This design enables:

- **Consistency**: All evaluators follow the same interface
- **Extensibility**: Easy to add new evaluation strategies
- **Testability**: Uniform testing patterns across evaluators
- **Maintainability**: Clear separation of concerns

## Core Interfaces

### BaseEvaluator

The fundamental interface that all evaluators must implement:

```typescript
interface BaseEvaluator {
  evaluate(state: BoardState): number;
  calculateFeatures(board: BitBoard): FeatureSet;
  applyWeights(features: FeatureSet): number;
  getName(): string;
}
```

### Optional Interfaces

- **WeightedEvaluator**: For evaluators that support dynamic weight adjustment
- **MoveEvaluator**: For evaluators that can evaluate specific moves

## Existing Evaluators

### DellacherieEvaluator

**Location**: `src/game/ai/evaluators/dellacherie/`

**Purpose**: Implements the classic Dellacherie heuristic with 6 core features:
- Landing height
- Lines cleared
- Row/column transitions
- Holes and wells
- Advanced features (bumpiness, escape routes)

**Usage**:
```typescript
const evaluator = new DellacherieEvaluator();
const score = evaluator.evaluateMove(board, move);
```

### StackingEvaluator

**Location**: `src/game/ai/evaluators/stacking-evaluator.ts`

**Purpose**: Focuses on gradual line building with single-well strategy:
- Stacking-focused features
- Edge penalties
- Well depth management
- I-piece wait opportunities

**Usage**:
```typescript
const evaluator = new StackingEvaluator();
const score = evaluator.evaluateMove(board, move);
```

### PatternEvaluator

**Location**: `src/game/ai/evaluators/pattern-evaluator.ts`

**Purpose**: Extends Dellacherie with advanced pattern recognition:
- PCO (Perfect Clear Opener) detection
- DT Cannon pattern matching
- ST-Stack recognition
- Dynamic weight adjustment

**Usage**:
```typescript
const evaluator = new PatternEvaluator();
evaluator.updateGameState(pieceQueue, lines, level);
const score = evaluator.evaluateMove(board, move);
```

## Adding a New Evaluator

Follow these steps to add a new evaluator:

### 1. Create the Evaluator Class

Create a new file `src/game/ai/evaluators/my-evaluator.ts`:

```typescript
import type { BitBoard } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";
import type { BaseEvaluator, BoardState, FeatureSet, MoveEvaluator } from "./base-evaluator";

export interface MyFeatures {
  feature1: number;
  feature2: number;
  // ... define your features
}

export class MyEvaluator implements BaseEvaluator, MoveEvaluator {
  private weights = {
    feature1: 1.0,
    feature2: -0.5,
    // ... define your weights
  };

  // Required BaseEvaluator methods
  evaluate(state: BoardState): number {
    const features = this.calculateFeatures(state.board);
    return this.applyWeights(features);
  }

  calculateFeatures(board: BitBoard): FeatureSet {
    return {
      feature1: this.calculateFeature1(board),
      feature2: this.calculateFeature2(board),
      // ... calculate your features
    };
  }

  applyWeights(features: FeatureSet): number {
    return (
      features.feature1 * this.weights.feature1 +
      features.feature2 * this.weights.feature2
      // ... apply your weights
    );
  }

  getName(): string {
    return "MyEvaluator";
  }

  // Optional MoveEvaluator method
  evaluateMove(board: BitBoard, move: Move): number {
    // Simulate the move and evaluate the resulting board
    const tempBoard = board.clone();
    // ... simulate move placement
    const state: BoardState = { board: tempBoard };
    return this.evaluate(state);
  }

  // Your custom feature calculation methods
  private calculateFeature1(board: BitBoard): number {
    // Implement your feature calculation
    return 0;
  }

  private calculateFeature2(board: BitBoard): number {
    // Implement your feature calculation
    return 0;
  }
}
```

### 2. Add Optional Interfaces

If your evaluator supports weight adjustment, implement `WeightedEvaluator`:

```typescript
export class MyEvaluator implements BaseEvaluator, MoveEvaluator, WeightedEvaluator {
  // ... existing code

  getWeights(): Record<string, number> {
    return { ...this.weights };
  }

  updateWeights(newWeights: Partial<Record<string, number>>): void {
    Object.assign(this.weights, newWeights);
  }

  resetWeights(): void {
    this.weights = {
      feature1: 1.0,
      feature2: -0.5,
      // ... reset to default values
    };
  }
}
```

### 3. Export from Index

Update `src/game/ai/evaluators/index.ts`:

```typescript
export * from "./my-evaluator";
```

### 4. Add Tests

Create `src/game/ai/evaluators/my-evaluator.test.ts`:

```typescript
import { describe, expect, it } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import { MyEvaluator } from "./my-evaluator";

describe("MyEvaluator", () => {
  it("should implement BaseEvaluator interface", () => {
    const evaluator = new MyEvaluator();
    expect(evaluator.getName()).toBe("MyEvaluator");
    expect(typeof evaluator.evaluate).toBe("function");
    expect(typeof evaluator.calculateFeatures).toBe("function");
    expect(typeof evaluator.applyWeights).toBe("function");
  });

  it("should evaluate board states", () => {
    const evaluator = new MyEvaluator();
    const board = new BitBoard(20, 10);
    const state = { board };
    
    const score = evaluator.evaluate(state);
    expect(typeof score).toBe("number");
  });

  // Add more tests for your specific features
});
```

### 5. Integration with AI Engine

To use your evaluator with the AI engine:

```typescript
import { MyEvaluator } from "@/game/ai/evaluators/my-evaluator";
import { AIEngine } from "@/game/ai/core/ai-engine";

const evaluator = new MyEvaluator();
const aiEngine = new AIEngine({
  evaluator: evaluator,
  // ... other config
});
```

## Best Practices

### Performance Considerations

- **Optimize feature calculation**: Use bitwise operations when possible
- **Cache expensive calculations**: Store results that can be reused
- **Profile your evaluator**: Ensure it meets the 80ms time limit
- **Use BitBoard efficiently**: Leverage the optimized board representation

### Feature Design

- **Keep features independent**: Avoid correlated features that double-count effects
- **Normalize feature values**: Ensure features are on comparable scales
- **Test feature effectiveness**: Validate that features improve AI performance
- **Document feature meaning**: Clear comments explaining what each feature measures

### Testing Strategy

- **Unit tests**: Test individual feature calculations
- **Integration tests**: Test evaluator with AI engine
- **Performance tests**: Ensure evaluator meets timing requirements
- **Regression tests**: Verify backward compatibility

### Weight Tuning

- **Start with reasonable defaults**: Based on domain knowledge
- **Use systematic tuning**: Grid search, genetic algorithms, or gradient descent
- **Validate on multiple scenarios**: Test different board states and game phases
- **Document tuning process**: Keep notes on what works and what doesn't

## Common Patterns

### Board State Analysis

```typescript
// Get column heights
const columnHeights = this.getColumnHeights(board);

// Count holes
let holes = 0;
for (let x = 0; x < width; x++) {
  let foundFilled = false;
  for (let y = 0; y < height; y++) {
    if (board.getRowBits(y) & (1 << x)) {
      foundFilled = true;
    } else if (foundFilled) {
      holes++;
    }
  }
}
```

### Move Simulation

```typescript
// Simulate piece placement
const tempBoard = board.clone();
const pieceBits = getPieceBitsAtPosition(piece, rotation, x);
tempBoard.place(pieceBits, y);
const clearedLines = tempBoard.clearLines();
```

### Feature Normalization

```typescript
// Normalize by board area
const normalizedFeature = featureValue / (width * height);

// Normalize by maximum possible value
const normalizedFeature = featureValue / maxPossibleValue;
```

## Troubleshooting

### Common Issues

1. **Type errors**: Ensure proper imports and interface implementation
2. **Performance issues**: Profile feature calculations and optimize bottlenecks
3. **Incorrect evaluations**: Verify feature calculations with test cases
4. **Integration problems**: Check that evaluator works with AI engine

### Debugging Tips

- Use console.log to trace feature calculations
- Test with known board states
- Compare with existing evaluators
- Use the AI visualization tools to understand decision-making

## Related Documentation

- [AI System Architecture](../README.md)
- [BitBoard Documentation](../core/bitboard.md)
- [Move Generation](../core/move-generator.md)
- [AI Engine](../core/ai-engine.md)