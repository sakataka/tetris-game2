# ADR-001: Event-Driven Architecture

## Status
Accepted

## Context
The legacy GameStore had become a monolithic 788-line file with 60+ actions, making it difficult to maintain and test. Cross-cutting concerns like animations, sound effects, and analytics were tightly coupled to the game logic.

## Decision
We will implement an event-driven architecture using a type-safe GameEventBus to decouple game logic from side effects.

## Consequences

### Positive
- **Loose coupling**: Features can react to events without direct dependencies
- **Testability**: Pure functions and isolated event handlers
- **Extensibility**: New features can subscribe to existing events
- **Performance**: Events can be processed asynchronously

### Negative
- **Complexity**: Additional abstraction layer to understand
- **Debugging**: Event flow can be harder to trace
- **Learning curve**: Team needs to understand event-driven patterns

## Implementation
- Use TypeScript union types for type-safe events
- Implement O(1) subscription lookup with Map
- Prevent infinite recursion with event queueing
- Provide debugging tools for event tracing