---
description: Execute complete build pipeline with dead code detection, formatting, linting, type checking, testing, and production build
allowed-tools: Bash(bun:*)
---

# Project Build Pipeline

This command executes a comprehensive build pipeline with the following steps in sequence:

1. **Dead Code Detection** - Identify and report unused code, exports, and dependencies
2. **Code Formatting** - Apply consistent code style across the entire codebase
3. **Linting** - Perform code quality checks including import order optimization
4. **Type Checking** - Validate TypeScript type safety and correctness
5. **Testing** - Execute all test suites (800+ tests) to ensure functionality
6. **Production Build** - Create optimized production bundle

## Execution

```bash
# Execute full pipeline with fail-fast behavior
bun run knip && \
bun run format && \
bun run lint && \
bun run typecheck && \
bun test && \
bun run build
```

The pipeline uses the `&&` operator to ensure immediate termination upon any step failure, preventing downstream steps from running with invalid code state.

## Pipeline Step Rationale

1. **knip (first)**: Detect unused code early to reduce processing time for subsequent steps and maintain clean codebase
2. **format (second)**: Ensure consistent code style before quality checks to avoid style-related linting issues
3. **lint (third)**: Check code quality on properly formatted code, including automatic import statement organization via `biome check`
4. **typecheck (fourth)**: Verify type safety after code structure is validated
5. **test (fifth)**: Confirm functionality with comprehensive test suite (800+ tests) only after code passes all static analysis checks
6. **build (last)**: Generate production bundle only when all quality gates pass successfully
