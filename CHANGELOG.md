# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Unified weight management system with YAML configuration support
- Schema version management for AI evaluator weights
- Unified SearchStrategy interface with adapter pattern
- BaseEvaluator interface for standardized AI evaluator architecture
- Comprehensive AI benchmark infrastructure with performance monitoring
- Advanced pattern detection for competitive Tetris patterns (PCO, DT Cannon, ST-Stack)
- Diversified beam search for exploration-exploitation balance
- Line-clearing priority AI strategy implementation
- Stacking-focused AI evaluator with board engine unification
- Modular Dellacherie evaluator structure with separated concerns
- Pattern-search core and recognition modules separation
- GitHub Actions CI/CD pipeline integration
- Enhanced AI integration testing with cross-component validation
- Performance monitoring with 80ms time limit enforcement

### Changed
- Migrated AI evaluator weights from hardcoded values to external YAML configuration
- Refactored AI system architecture with unified interfaces and modular design
- Improved AI evaluation weights balancing for better line clearing performance
- Enhanced AI strategy parameter tuning with dynamic phase-based adjustments
- Unified AI evaluator module structure with centralized index exports
- Updated documentation to reflect current AI system architecture

### Fixed
- Resolved all AI line clearing issues and test failures
- Fixed AI evaluation weight imbalances affecting game performance
- Corrected test failures in line-clearing priority system
- Resolved AI technical debt and code quality issues

### Performance
- AI evaluators now operate within 80ms time constraints
- Benchmark results show 4.9ms average think time across all evaluators
- Zero timeout rate achieved for all AI evaluation scenarios
- Maintained 100% test pass rate (863 tests)

## [1.0.0] - 2025-01-10

### Added
- Initial release of advanced Tetris game with AI system
- Multi-level AI implementation with BitBoard optimization
- Advanced AI evaluators: Dellacherie, Stacking, and Pattern evaluators
- Comprehensive testing suite with 863+ tests
- Performance benchmarking system
- Real-time AI visualization and analysis tools
- Multi-language support (English/Japanese)
- Advanced game mechanics with T-Spin detection
- Ghost piece preview and Super Rotation System (SRS)
- Touch controls and responsive design
- High score tracking and game state persistence

### Technical Highlights
- TypeScript-first development with strict type checking
- React 19.1.0 with modern hooks and state management
- Zustand for predictable state management
- Tailwind CSS for responsive styling
- Bun runtime for fast development and testing
- Comprehensive CI/CD pipeline with automated testing
- Advanced AI architecture with 18 modules and 12,000+ lines of code
- BitBoard implementation for ultra-high-performance board operations
- Beam search algorithms with configurable parameters
- Pattern recognition system for competitive play strategies