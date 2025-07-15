/**
 * Performance monitoring system
 * Tracks memory usage, GC pauses, and AI performance
 */

export interface PerformanceMetrics {
  // Memory metrics
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;

  // AI performance metrics
  aiEvaluationsPerSecond: number;
  averageEvaluationTime: number;
  maxEvaluationTime: number;

  // GC metrics
  gcPauses: number[];
  maxGCPause: number;
  averageGCPause: number;

  // Frame metrics
  fps: number;
  frameDrops: number;
  averageFrameTime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private gcObserver: PerformanceObserver | null = null;
  private evaluationTimes: number[] = [];
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  private createInitialMetrics(): PerformanceMetrics {
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      aiEvaluationsPerSecond: 0,
      averageEvaluationTime: 0,
      maxEvaluationTime: 0,
      gcPauses: [],
      maxGCPause: 0,
      averageGCPause: 0,
      fps: 0,
      frameDrops: 0,
      averageFrameTime: 0,
    };
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupMemoryMonitoring();
    this.setupGCMonitoring();
    this.setupFrameMonitoring();

    console.log("📊 Performance monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = null;
    }

    console.log("📊 Performance monitoring stopped");
  }

  /**
   * Setup memory usage monitoring
   */
  private setupMemoryMonitoring(): void {
    this.monitoringInterval = window.setInterval(() => {
      if ("memory" in performance) {
        const memory = (
          performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }
        ).memory;
        this.metrics.heapUsed = memory.usedJSHeapSize;
        this.metrics.heapTotal = memory.totalJSHeapSize;
        this.metrics.external = memory.usedJSHeapSize;
      }
    }, 1000);
  }

  /**
   * Setup garbage collection monitoring
   */
  private setupGCMonitoring(): void {
    if ("PerformanceObserver" in window) {
      try {
        this.gcObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "measure" && entry.name.includes("gc")) {
              const duration = entry.duration;
              this.metrics.gcPauses.push(duration);

              // Keep only last 100 GC measurements
              if (this.metrics.gcPauses.length > 100) {
                this.metrics.gcPauses.shift();
              }

              this.metrics.maxGCPause = Math.max(this.metrics.maxGCPause, duration);
              this.metrics.averageGCPause =
                this.metrics.gcPauses.reduce((a, b) => a + b, 0) / this.metrics.gcPauses.length;
            }
          }
        });

        this.gcObserver.observe({ entryTypes: ["measure"] });
      } catch (error) {
        console.warn("GC monitoring not available:", error);
      }
    }
  }

  /**
   * Setup frame rate monitoring
   */
  private setupFrameMonitoring(): void {
    const measureFrame = () => {
      const now = performance.now();

      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime;
        this.frameTimes.push(frameTime);

        // Keep only last 60 frame measurements (1 second at 60 FPS)
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }

        // Calculate FPS and frame drops
        this.metrics.averageFrameTime =
          this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.metrics.fps = 1000 / this.metrics.averageFrameTime;

        // Count frame drops (frames > 20ms = below 50 FPS)
        this.metrics.frameDrops = this.frameTimes.filter((t) => t > 20).length;
      }

      this.lastFrameTime = now;
      this.frameCount++;

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  /**
   * Record AI evaluation performance
   */
  recordAIEvaluation(duration: number): void {
    this.evaluationTimes.push(duration);

    // Keep only last 1000 evaluations
    if (this.evaluationTimes.length > 1000) {
      this.evaluationTimes.shift();
    }

    this.metrics.averageEvaluationTime =
      this.evaluationTimes.reduce((a, b) => a + b, 0) / this.evaluationTimes.length;
    this.metrics.maxEvaluationTime = Math.max(...this.evaluationTimes);

    // Calculate evaluations per second (last 1 second)
    const recentEvaluations = this.evaluationTimes.filter(
      (_, index) => this.evaluationTimes.length - index <= 60, // Approximate 1 second
    );
    this.metrics.aiEvaluationsPerSecond = recentEvaluations.length;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    return (
      (this.metrics.fps > 0 && this.metrics.fps < 55) || // Below 55 FPS (only if monitoring)
      this.metrics.maxGCPause > 10 || // GC pause > 10ms
      this.metrics.averageEvaluationTime > 10 || // AI evaluation > 10μs
      this.metrics.heapUsed > 100 * 1024 * 1024 // Memory > 100MB
    );
  }

  /**
   * Get performance warnings
   */
  getWarnings(): string[] {
    const warnings: string[] = [];

    if (this.metrics.fps < 55) {
      warnings.push(`Low FPS: ${this.metrics.fps.toFixed(1)}`);
    }

    if (this.metrics.maxGCPause > 10) {
      warnings.push(`High GC pause: ${this.metrics.maxGCPause.toFixed(1)}ms`);
    }

    if (this.metrics.averageEvaluationTime > 10) {
      warnings.push(`Slow AI evaluation: ${this.metrics.averageEvaluationTime.toFixed(1)}μs`);
    }

    if (this.metrics.heapUsed > 100 * 1024 * 1024) {
      warnings.push(`High memory usage: ${(this.metrics.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    }

    return warnings;
  }
}
