# E2E Tests

This directory contains end-to-end tests for the Tetris game using Playwright.

## Current State

The E2E test framework has been implemented with the following test suites:

- **game-flow.spec.ts**: Tests basic game flow (start, play, score, game over)
- **game-controls.spec.ts**: Tests keyboard and touch controls, pause/resume
- **game-features.spec.ts**: Tests hold piece, reset, language switching

## Manual Testing Required

⚠️ **Important**: These tests currently require manual adjustment of selectors to work properly. The tests were designed for the component structure but need refinement to match the actual DOM structure.

## Running E2E Tests

### Manual Execution Scripts

```bash
# Run all E2E tests
bun run e2e

# Run with browser visible (headed mode)
bun run e2e:headed

# Run with debugging (step through tests)
bun run e2e:debug

# Run with Playwright UI
bun run e2e:ui
```

### Test Configuration

- **Browsers**: Desktop Chrome, Mobile (iPhone 12 simulation)
- **Base URL**: http://localhost:5173
- **Screenshots**: Saved to `/screenshots/` directory on test actions
- **Reports**: HTML reports generated in `playwright-report/`

## Known Issues

1. **Selector Specificity**: Game board selector needs refinement for mobile/desktop layouts
2. **Element Visibility**: Some elements may be hidden due to responsive design
3. **Language Switching**: Language selector needs proper DOM targeting

## Next Steps

1. Manually adjust selectors in `pages/GamePage.ts` to match actual DOM structure
2. Test each spec file individually to ensure proper element targeting
3. Verify touch controls work correctly on mobile viewport
4. Ensure language switching works across both layouts

## Test Structure

```
src/tests/visual/
├── pages/
│   └── GamePage.ts          # Page Object Model for game interactions
├── game-flow.spec.ts        # Basic game functionality tests
├── game-controls.spec.ts    # Input and control tests
├── game-features.spec.ts    # Feature-specific tests
└── README.md               # This file
```

## Implementation Notes

- Tests are excluded from regular unit test runs (`bun test` ignores `**/visual/**`)
- Screenshots are captured at key test points for visual verification
- Tests cover both desktop and mobile viewports
- Page Object Model used for maintainable test code