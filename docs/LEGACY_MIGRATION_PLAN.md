# Legacy GameStore Migration Plan

## Overview

This document outlines a comprehensive plan to migrate from the legacy `GameStore` implementation to the new event-driven architecture. The migration is divided into 4 distinct phases to ensure safety, maintainability, and minimal disruption to development.

## Current State Analysis

### Legacy Components Still in Use
- **Primary Target**: `src/store/gameStore.ts` (339 lines)
- **Test File**: `src/store/gameStore.test.ts`
- **Adapter**: `src/store/adapters/legacy-gamestore.ts` (339 lines)
- **Usage Count**: 31 files currently importing `useGameStore`

### New Architecture Status
- ✅ **Feature-Sliced Structure**: Implemented in `src/features/`
- ✅ **Event Bus System**: Partially implemented
- ✅ **New Store Slices**: AI, GamePlay, Scoring, Settings
- ⚠️ **Dependency Issue**: New features still depend on legacy `useGameStore`

### Key Dependencies Map
```
Legacy GameStore (gameStore.ts)
├── 15 Component Files
├── 8 Hook Files 
├── 6 Control/Action Files
├── 2 Feature Files (new architecture)
└── Documentation & Test Files
```

## Migration Phases

### Phase 1: 依存関係の整理 (Dependency Cleanup)
**Goal**: Create independent feature implementations that don't rely on legacy GameStore

**Key Tasks**:
1. **Complete Feature Store Independence**
   - Remove `useGameStore` imports from new feature hooks
   - Implement direct Zustand stores for each feature
   - Create proper event bus integration

2. **Event Bus Enhancement**
   - Implement comprehensive event system
   - Add proper TypeScript types for all events
   - Create event subscription management

3. **State Management Decoupling**
   - Extract core game logic from legacy store
   - Implement pure function alternatives
   - Create proper state selectors

**Success Criteria**:
- [ ] All feature hooks work independently
- [ ] Event bus handles all inter-feature communication
- [ ] No circular dependencies between new and legacy code
- [ ] Tests pass: `bun run lint && bun run typecheck`

**Estimated Time**: 2-3 days

### Phase 2: 段階的置換 (Gradual Replacement)
**Goal**: Replace legacy GameStore usage in components and hooks one by one

**Key Tasks**:
1. **Component Layer Migration**
   - Update all UI components to use new feature hooks
   - Replace `useGameStore` with specific feature hooks
   - Ensure proper state subscription patterns

2. **Hook Layer Updates**
   - Migrate control hooks to use new stores
   - Update accessibility hooks for new event system
   - Refactor performance monitoring hooks

3. **Integration Testing**
   - Verify functionality after each file migration
   - Run comprehensive test suite
   - Check for performance regressions

**Migration Order**:
1. UI Components (15 files)
2. Control Hooks (8 files)
3. Accessibility & Effects (6 files)
4. Integration Points (remaining files)

**Success Criteria**:
- [ ] All components use new architecture
- [ ] No runtime errors or functionality loss
- [ ] Performance benchmarks maintained
- [ ] All tests pass: `bun test && bun run e2e`

**Estimated Time**: 3-4 days

### Phase 3: レガシー削除 (Legacy Removal)
**Goal**: Safely remove all legacy GameStore files and references

**Key Tasks**:
1. **Final Usage Verification**
   - Scan entire codebase for remaining references
   - Verify no hidden dependencies exist
   - Check import statements and dynamic imports

2. **Safe File Removal**
   - Remove `src/store/gameStore.ts`
   - Remove `src/store/gameStore.test.ts`
   - Remove legacy adapter if no longer needed
   - Update cleanup script

3. **Import Path Updates**
   - Update any remaining import statements
   - Fix TypeScript path references
   - Clean up index files

**Success Criteria**:
- [ ] No references to legacy GameStore remain
- [ ] All legacy files successfully removed
- [ ] Build and test suites pass completely
- [ ] TypeScript compilation succeeds

**Estimated Time**: 1 day

### Phase 4: クリーンアップ (Cleanup)
**Goal**: Optimize and finalize the new architecture

**Key Tasks**:
1. **Code Quality Optimization**
   - Remove unnecessary adapters and bridges
   - Optimize bundle size and performance
   - Clean up unused imports and exports

2. **Documentation Updates**
   - Update API documentation
   - Revise architecture guides
   - Update component stories and examples

3. **Testing & Verification**
   - Run complete CI pipeline
   - Performance benchmark verification
   - Cross-browser compatibility testing

**Success Criteria**:
- [ ] Bundle size optimized (target: <10% increase)
- [ ] Performance maintained (60 FPS target)
- [ ] All CI checks pass: `bun run ci`
- [ ] Documentation updated and accurate

**Estimated Time**: 1-2 days

## Risk Assessment & Mitigation

### High Risk Areas
1. **State Synchronization**: Complex game state might desync during migration
   - *Mitigation*: Implement comprehensive state validation tests
   
2. **Performance Regression**: New architecture might introduce overhead
   - *Mitigation*: Benchmark each phase, rollback if performance degrades >5%

3. **Event Race Conditions**: Event-driven system might introduce timing issues
   - *Mitigation*: Implement proper event ordering and debouncing

### Rollback Strategy
Each phase includes rollback instructions:
- **Phase 1-2**: Revert specific file changes, feature flags available
- **Phase 3-4**: Git branch protection, automated backup before file deletion

## Implementation Guidelines

### Code Quality Standards
- **No Type Errors**: All TypeScript must pass strict checks
- **Test Coverage**: Maintain >90% coverage for core game logic
- **Performance**: Maintain 60 FPS gameplay performance
- **Memory Usage**: No memory leaks in game loops

### Development Workflow
1. Create feature branch for each phase
2. Implement changes incrementally
3. Run tests after each significant change
4. Create PR with comprehensive testing checklist
5. Require code review before merging

### Testing Strategy
- **Unit Tests**: Test all pure functions and business logic
- **Integration Tests**: Verify feature interactions
- **E2E Tests**: Validate complete user workflows
- **Performance Tests**: Benchmark AI and rendering performance

## Success Metrics

### Quantitative Goals
- **Bundle Size**: <280KB gzipped (current baseline)
- **Memory Usage**: <30MB after 10 minutes (target from migration docs)
- **Performance**: Consistent 60 FPS with AI enabled
- **Test Coverage**: >90% for core game logic

### Qualitative Goals
- **Code Maintainability**: Clear separation of concerns
- **Developer Experience**: Intuitive API for future features
- **Architecture Clarity**: Well-documented event-driven patterns
- **Type Safety**: Full TypeScript coverage with no `any` types

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 1 | 2-3 days | Independent feature stores, event bus |
| Phase 2 | 3-4 days | All components migrated, tests passing |
| Phase 3 | 1 day | Legacy files removed, clean codebase |
| Phase 4 | 1-2 days | Optimized, documented, CI passing |

**Total Estimated Time**: 7-10 days

## Post-Migration Benefits

### For Developers
- **Clear Architecture**: Feature-sliced design with explicit boundaries
- **Better Testing**: Pure functions easier to test than stateful stores
- **Performance**: Optimized state management and event handling
- **Type Safety**: Full TypeScript support with explicit interfaces

### For Users
- **Improved Performance**: Reduced memory usage and better FPS
- **More Reliable**: Event-driven architecture reduces state inconsistencies
- **Future Features**: Easier to add new game modes and AI improvements

## Conclusion

This migration plan provides a safe, systematic approach to modernizing the Tetris game architecture. By following these phases sequentially and maintaining rigorous testing standards, we can achieve a cleaner, more maintainable codebase while preserving all existing functionality.

The key to success is patience and thorough testing at each phase. This approach minimizes risk while maximizing the long-term benefits of the new event-driven architecture.