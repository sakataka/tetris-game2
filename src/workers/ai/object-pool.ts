/**
 * Generic object pool for reducing garbage collection
 * Manages reusable objects with factory functions
 */

export interface Poolable {
  reset(): void; // Method to reset object state
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  private created = 0;
  private acquired = 0;
  private released = 0;
  private poolHits = 0;

  constructor(factory: () => T, maxSize = 1000, resetFn?: (obj: T) => void) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.resetFn = resetFn;
  }

  /**
   * Get an object from the pool
   * @returns Pooled object
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      const pooledObj = this.pool.pop();
      if (pooledObj) {
        obj = pooledObj;
        this.poolHits++;
      } else {
        obj = this.factory();
        this.created++;
      }
    } else {
      obj = this.factory();
      this.created++;
    }

    this.acquired++;
    return obj;
  }

  /**
   * Return an object to the pool
   * @param obj Object to return
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      // Pool is full, discard object
      return;
    }

    // Reset object state
    if (this.resetFn) {
      this.resetFn(obj);
    } else {
      obj.reset();
    }

    this.pool.push(obj);
    this.released++;
  }

  /**
   * Pre-warm the pool with objects
   * @param count Number of objects to pre-create
   */
  prewarm(count: number): void {
    for (let i = 0; i < count && this.pool.length < this.maxSize; i++) {
      const obj = this.factory();
      this.created++;
      this.pool.push(obj);
    }
  }

  /**
   * Clear all objects from pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      created: this.created,
      acquired: this.acquired,
      released: this.released,
      utilization: (this.pool.length / this.maxSize) * 100,
      hitRate: this.acquired > 0 ? (this.poolHits / this.acquired) * 100 : 0,
    };
  }
}

/**
 * Evaluation result object pool
 */
export interface EvaluationResult extends Poolable {
  score: number;
  position: { x: number; y: number };
  rotation: number;
  evaluation: {
    holes: number;
    bumpiness: number;
    height: number;
    lines: number;
  };
  reset(): void;
}

class PooledEvaluationResult implements EvaluationResult {
  public score = 0;
  public position = { x: 0, y: 0 };
  public rotation = 0;
  public evaluation = {
    holes: 0,
    bumpiness: 0,
    height: 0,
    lines: 0,
  };

  reset(): void {
    this.score = 0;
    this.position.x = 0;
    this.position.y = 0;
    this.rotation = 0;
    this.evaluation.holes = 0;
    this.evaluation.bumpiness = 0;
    this.evaluation.height = 0;
    this.evaluation.lines = 0;
  }
}

export const evaluationResultPool = new ObjectPool<EvaluationResult>(
  () => new PooledEvaluationResult(),
  500, // Max 500 pooled results
);
