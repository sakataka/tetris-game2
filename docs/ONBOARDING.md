# Developer Onboarding Guide

Welcome to the Tetris Game project! This guide will help you get up to speed with our event-driven architecture.

## Architecture Overview

Our codebase follows these principles:

1. **Event-Driven**: Components communicate via events, not direct calls
2. **Feature-Sliced**: Code organized by features, not technical layers
3. **Performance-First**: Optimized for 60 FPS gameplay with AI enabled
4. **Type-Safe**: Full TypeScript coverage with strict typing

## Project Structure

```
src/
├── features/           # Feature-based organization
│   ├── game-play/     # Core game mechanics
│   ├── ai-control/    # AI settings and control
│   ├── scoring/       # Score calculation and display
│   └── settings/      # Game configuration
├── shared/            # Shared utilities and components
│   ├── ui/           # Reusable UI components
│   ├── events/       # Event bus and communication
│   └── lib/          # Utility functions
└── app/              # Top-level app configuration
```

## Getting Started

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Enable development features
echo "FEATURE_NEW_ENGINE=true" >> .env.local
echo "FEATURE_PERFORMANCE_MONITORING=true" >> .env.local
```

### 2. Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test                    # Unit tests
npm run test:full          # All tests including performance
npm run test:watch         # Watch mode

# Code quality
npm run lint              # ESLint
npm run typecheck         # TypeScript check
npm run format            # Format code
```

### 3. Understanding the Event System

```typescript
// Subscribe to events
const eventBus = useEventBus();

useEffect(() => {
  const unsubscribe = eventBus.subscribe('LINE_CLEARED', (event) => {
    // Handle line clearing
    console.log(`Cleared ${event.payload.lines} lines`);
  });
  
  return unsubscribe; // Cleanup
}, []);

// Emit events (usually from game engine)
eventBus.emit({
  type: 'LINE_CLEARED',
  payload: { lines: 4, positions: [20, 21, 22, 23], score: 800 }
});
```

## Development Workflows

### Adding a New Feature

1. **Create feature structure**:
```bash
mkdir -p src/features/my-feature/{ui,model,lib,api}
```

2. **Implement feature slice**:
```typescript
// src/features/my-feature/index.ts
export { MyComponent } from './ui/MyComponent';
export { useMyFeature } from './lib/useMyFeature';
export { myFeatureSlice } from './model/myFeatureSlice';
```

3. **Add event handlers**:
```typescript
// Listen for relevant events
eventBus.subscribe('GAME_EVENT', handleGameEvent);
```

4. **Write tests**:
```bash
# Create test file
touch src/features/my-feature/lib/useMyFeature.test.ts
```

### Debugging

1. **Event Tracing**:
```typescript
// Enable event logging
import { enableEventLogging } from '@/shared/events';
enableEventLogging();
```

2. **Performance Monitoring**:
```typescript
// Check performance metrics
import { performanceMonitor } from '@/shared/performance';
console.log(performanceMonitor.getMetrics());
```

3. **State Inspection**:
```typescript
// Use Zustand devtools
const gameState = useGamePlayStore((state) => state, { devtools: true });
```

## Best Practices

### 1. State Management

```typescript
// ✅ Good: Use shallow selectors
const { score, level } = useStore(useShallow(state => ({
  score: state.score,
  level: state.level
})));

// ❌ Bad: Return new objects
const data = useStore(state => ({
  score: state.score,
  level: state.level
})); // Causes re-renders
```

### 2. Event Handling

```typescript
// ✅ Good: Always cleanup subscriptions
useEffect(() => {
  const unsubscribe = eventBus.subscribe('EVENT', handler);
  return unsubscribe;
}, []);

// ❌ Bad: Memory leak
useEffect(() => {
  eventBus.subscribe('EVENT', handler); // Never cleaned up
}, []);
```

### 3. Performance

```typescript
// ✅ Good: Use useMemo for expensive calculations
const expensiveValue = useMemo(() => 
  calculateComplexValue(data), [data]
);

// ✅ Good: Debounce rapid events
const debouncedHandler = useMemo(() => 
  debounce(handler, 100), []
);
```

## Testing Guidelines

### Unit Tests
- Test pure functions and business logic
- Mock external dependencies
- Use property-based testing for complex algorithms

### Integration Tests
- Test feature interactions
- Use event-driven testing patterns
- Verify state consistency

### Performance Tests
- Benchmark critical paths
- Test memory usage patterns
- Verify 60 FPS maintenance

## Common Patterns

### Feature Communication

```typescript
// Features communicate via events, not direct imports
// ✅ Good: Event-driven
eventBus.emit({ type: 'SCORE_UPDATED', payload: { score: 1000 } });

// ❌ Bad: Direct coupling
import { updateScore } from '../scoring';
updateScore(1000);
```

### Async Operations

```typescript
// ✅ Good: Handle loading states
const [loading, setLoading] = useState(false);

const handleAsyncOperation = async () => {
  setLoading(true);
  try {
    await performOperation();
  } finally {
    setLoading(false);
  }
};
```

## Troubleshooting

### Build Issues
- Check TypeScript errors: `npm run typecheck`
- Verify import paths use `@/` for absolute imports
- Ensure all dependencies are installed

### Performance Issues
- Use browser DevTools Performance tab
- Check bundle size: `npm run analyze`
- Monitor memory usage in production

### Event Issues
- Enable event logging for debugging
- Check subscription cleanup
- Verify event type definitions

## Resources

- [Architecture Decision Records](./adr/)
- [API Documentation](../packages/tetris-engine/README.md)
- [Migration Guide](./MIGRATION.md)
- [Performance Guide](./PERFORMANCE.md)

## Getting Help

- Check existing documentation first
- Use TypeScript for inline help
- Ask team members for architecture guidance
- Create issues for bugs or unclear documentation

Happy coding! 🎮