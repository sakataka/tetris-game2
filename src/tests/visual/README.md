# E2E Tests

This directory contains end-to-end tests for the Tetris game using Playwright.

## Working Tests ✅

### Minimal Desktop Tests (`minimal-desktop.spec.ts`)
- ✅ **Desktop layout detection**: Confirms game loads in desktop mode
- ✅ **Game board visibility**: Verifies game board is rendered
- ✅ **Keyboard input**: Tests arrow keys, rotation, hard drop
- ✅ **Basic gameplay**: Automated piece dropping and game over detection

### Gameplay Tests (`line-clear-test.spec.ts`)
- ✅ **Strategic line filling**: Attempts to clear lines with methodical piece placement
- ✅ **Tetris mechanics demo**: Tests all basic controls (move, rotate, hold, drop)
- ✅ **Score tracking**: Monitors score changes during gameplay
- ✅ **Screenshot capture**: Documents gameplay progress

### Visual Demo Tests (`demo-gameplay.spec.ts`)
- ✅ **Slow-motion gameplay**: Demonstrates controls with visible delays
- ✅ **Step-by-step mechanics**: Shows each control individually
- ✅ **Automated gameplay sequence**: 8-round piece placement demonstration

### Strategic Line Clear Tests (`strategic-line-clear.spec.ts`)
- ✅ **Bottom-fill strategy**: Systematic bottom-row targeting
- ✅ **Visual gameplay observation**: Browser-visible test execution
- ✅ **Multiple strategies**: Two different approach implementations

## Legacy Tests (Require Fixes)

- **game-flow.spec.ts**: Tests basic game flow (selector issues)
- **game-controls.spec.ts**: Tests keyboard and touch controls (selector issues)  
- **game-features.spec.ts**: Tests hold piece, reset, language switching (selector issues)

## Running E2E Tests

### Essential Test Scripts (Minimal Set)

```bash
# Run basic functionality tests (headless)
bun run e2e

# Run strategic line clear tests with visible browser (recommended)
bun run e2e:headed
```

### Manual Execution (Advanced)

```bash
# Run specific test files directly
bun x playwright test --config=playwright.config.ts src/tests/visual/minimal-desktop.spec.ts --project=chromium --headed
bun x playwright test --config=playwright.config.ts src/tests/visual/strategic-line-clear.spec.ts --project=chromium --headed
```

### Test Configuration

- **Browsers**: Desktop Chrome, Mobile (iPhone 12 simulation)
- **Base URL**: http://localhost:5173
- **Screenshots**: Saved to `/screenshots/` directory on test actions
- **Reports**: HTML reports generated in `playwright-report/`

## Current Status Summary

### ✅ Successfully Implemented
1. **Visual Browser Testing**: Tests run with visible browser showing actual gameplay
2. **Desktop Layout Support**: Full compatibility with desktop game layout (1280x800)
3. **Complete Input Testing**: All keyboard controls work (movement, rotation, hold, drop)
4. **Automated Gameplay**: Can automatically play Tetris with piece placement strategies
5. **Game State Detection**: Reliably detects game loading, game over, and score changes
6. **Multiple Test Strategies**: Various approaches to gameplay testing

### ❌ Current Problem: Line Clear Achievement

**Issue**: Despite strategic piece placement, tests consistently result in game over (8-10 pieces) before achieving a complete line clear.

**Symptoms**:
- Pieces accumulate in bottom rows but don't form complete lines
- Game ends too quickly due to height buildup
- Score remains low (0-40 points) indicating no line clears achieved

**Root Causes**:
1. **Insufficient Strategy Precision**: Current left-focused placement doesn't account for piece shapes
2. **No Gap Management**: Strategy doesn't consider filling specific holes
3. **Random Piece Sequence**: Can't predict which pieces will come next
4. **Game Difficulty**: Normal difficulty may be too challenging for automated play

### 📋 Next Approaches to Try

#### Approach 1: Enhanced Bottom-Fill Strategy
- **Target**: Focus on specific columns (e.g., columns 0-3) for systematic filling
- **Method**: Track piece shapes and optimize placement for gap reduction
- **Implementation**: Add piece-shape detection and position optimization logic

#### Approach 2: Hold Piece Utilization
- **Target**: Use hold piece functionality to save favorable pieces
- **Method**: Hold I-pieces and long pieces for line completion
- **Implementation**: Strategic hold piece management in test logic

#### Approach 3: Multi-Row Strategy
- **Target**: Build foundation across multiple rows simultaneously
- **Method**: Fill bottom 2-3 rows systematically rather than focusing on single row
- **Implementation**: Row-based piece placement algorithm

#### Approach 4: Game State Analysis
- **Target**: Read actual board state to make informed placement decisions
- **Method**: Extract board grid data from DOM or game state
- **Implementation**: Board analysis integration with placement strategy

#### Approach 5: Slower Gameplay
- **Target**: Increase piece placement timing for better strategic positioning
- **Method**: Longer delays between movements and drops
- **Implementation**: Extended `waitForTimeout` values and movement refinement

### 🎯 Success Criteria
- **Primary Goal**: Achieve at least one line clear (score increase >100 points)
- **Secondary Goal**: Maintain gameplay for 15+ pieces before game over
- **Verification**: Visual confirmation in browser and score detection

### 🔧 Technical Debt
- **Legacy Tests**: Original comprehensive test suite needs selector fixes
- **Mobile Support**: Tests currently only work on desktop layout
- **Error Handling**: Improve robustness of DOM element detection

## Test File Structure

```
src/tests/visual/
├── pages/
│   └── GamePage.ts                    # Page Object Model (legacy, needs fixes)
├── minimal-desktop.spec.ts            # ✅ Working: Basic functionality tests
├── line-clear-test.spec.ts           # ✅ Working: Gameplay and mechanics tests
├── demo-gameplay.spec.ts             # ✅ Working: Visual demo with slow motion
├── strategic-line-clear.spec.ts      # ✅ Working: Line clear strategy tests
├── game-flow.spec.ts                 # ❌ Legacy: Needs selector fixes
├── game-controls.spec.ts             # ❌ Legacy: Needs selector fixes
├── game-features.spec.ts             # ❌ Legacy: Needs selector fixes
└── README.md                         # This documentation
```

## Development Progress

### Phase 1: Foundation ✅ (Completed)
- Basic E2E test framework setup with Playwright
- Desktop layout detection and interaction
- Keyboard input testing and validation
- Game state detection (loading, game over)

### Phase 2: Gameplay Automation ✅ (Completed)
- Automated piece placement strategies
- Visual browser testing with observable gameplay
- Multiple test approaches and strategies
- Score tracking and progress monitoring

### Phase 3: Line Clear Achievement ⏳ (In Progress)
- **Current Challenge**: Achieving actual line clears in automated gameplay
- **Status**: Multiple strategies implemented, but line clear not yet achieved
- **Focus**: Strategy refinement and placement optimization

### Phase 4: Comprehensive Testing 📅 (Planned)
- Fix legacy test suite selector issues
- Implement mobile layout support
- Add comprehensive feature testing
- Integration with CI/CD pipeline

## Implementation Notes

- Tests are excluded from regular unit test runs (`bun test` ignores `**/visual/**`)
- Working tests use browser-visible execution for validation
- Desktop viewport only (1280x800) for current working tests
- Strategic gameplay focuses on bottom-row line completion
- All tests include game over detection and score monitoring