/**
 * Priority Queue for Animation Orchestrator
 * Manages animation execution order based on priority (1-10, where 10 is highest)
 */

export interface QueueItem {
  id: string;
  priority: number;
  timestamp: number;
}

/**
 * Minimal Priority Queue implementation for prototype validation
 * Uses simple array-based priority sorting for technical feasibility testing
 */
export class MinimalPriorityQueue {
  private queue: QueueItem[] = [];

  /**
   * Add item to queue with priority-based insertion
   */
  enqueue(id: string, priority: number): void {
    const item: QueueItem = {
      id,
      priority,
      timestamp: Date.now(),
    };

    // Find insertion point based on priority (higher priority = earlier in queue)
    // For same priority, maintain FIFO order using timestamp
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const current = this.queue[i];
      if (
        current.priority > priority ||
        (current.priority === priority && current.timestamp <= item.timestamp)
      ) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }

    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Remove and return highest priority item
   */
  dequeue(): string | null {
    const item = this.queue.shift();
    return item ? item.id : null;
  }

  /**
   * Remove specific item by ID
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Peek at next item without removing it
   */
  peek(): string | null {
    const item = this.queue[0];
    return item ? item.id : null;
  }

  /**
   * Get all items for debugging (returns copy)
   */
  getAll(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.queue.length = 0;
  }
}
