---
description: Execute complete build pipeline with dead code detection, formatting, linting, type checking, testing, and production build
allowed-tools: Bash(bun:*)
---

# Project Build Pipeline

This command executes a comprehensive build pipeline with the following steps in sequence:

1. **Dead Code Detection** - Identify and report unused code, exports, and dependencies
2. **Code Formatting** - Apply consistent code style across the entire codebase (including internal packages)
3. **Linting** - Perform code quality checks including import order optimization (including internal packages)
4. **Type Checking** - Validate TypeScript type safety and correctness
5. **Testing** - Execute all test suites (800+ tests) to ensure functionality
6. **Internal Package Testing** - Execute comprehensive test suites for internal packages (unit, coverage, golden-master, performance)
7. **Internal Package Build** - Verify internal packages build correctly
8. **Production Build** - Create optimized production bundle

## Execution

```bash
# Execute full pipeline with fail-fast behavior
bun run knip && \
bun run format && \
(cd packages/tetris-engine && bun x biome format --write) && \
bun run lint && \
(cd packages/tetris-engine && bun x biome check) && \
bun run typecheck && \
bun test && \
(cd packages/tetris-engine && bun test && bun run test:coverage && bun run test:golden-master && bun run test:performance) && \
(cd packages/tetris-engine && bun run build) && \
bun run build
```

The pipeline uses the `&&` operator to ensure immediate termination upon any step failure, preventing downstream steps from running with invalid code state.

## Pipeline Step Rationale

1. **knip (first)**: Detect unused code early to reduce processing time for subsequent steps and maintain clean codebase
2. **format (second)**: Ensure consistent code style before quality checks to avoid style-related linting issues
3. **internal package format (third)**: Apply consistent formatting to internal packages (packages/tetris-engine)
4. **lint (fourth)**: Check code quality on properly formatted code, including automatic import statement organization via `biome check`
5. **internal package lint (fifth)**: Verify code quality in internal packages with biome check
6. **typecheck (sixth)**: Verify type safety after code structure is validated
7. **test (seventh)**: Confirm functionality with comprehensive test suite (800+ tests) only after code passes all static analysis checks
8. **internal package test (eighth)**: Execute comprehensive internal package test suites:
   - Unit tests for core functionality
   - Coverage analysis for quality assurance
   - Golden master tests for output consistency
   - Performance benchmarks for 100k+ evaluations/sec requirement
9. **internal package build (ninth)**: Verify internal packages build correctly and generate proper distribution files
10. **build (last)**: Generate production bundle only when all quality gates pass successfully
