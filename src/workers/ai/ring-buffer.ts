/**
 * High-performance ring buffer for reusing board copies
 * Prevents garbage collection during AI evaluation
 */

export class RingBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private head = 0;
  private tail = 0;
  private size = 0;

  constructor(capacity: number, factory: () => T) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);

    // Pre-allocate all objects
    for (let i = 0; i < capacity; i++) {
      this.buffer[i] = factory();
    }
    this.size = capacity; // All slots are initially available
    // When buffer is full initially, tail should be at 0 (next position to fill)
    this.tail = 0;
  }

  /**
   * Get next available object from buffer
   * @returns Reusable object
   */
  acquire(): T | null {
    if (this.size === 0) {
      return null; // Buffer empty
    }

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return item;
  }

  /**
   * Return object to buffer for reuse
   * @param item Object to return
   */
  release(item: T): void {
    if (this.size >= this.capacity) {
      console.warn("Ring buffer overflow, discarding object");
      return;
    }

    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
  }

  /**
   * Get current buffer utilization
   * @returns Utilization percentage (0-100)
   */
  getUtilization(): number {
    return (this.size / this.capacity) * 100;
  }

  /**
   * Clear all objects from buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = this.capacity; // Reset to full capacity
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      capacity: this.capacity,
      size: this.size,
      utilization: this.getUtilization(),
      head: this.head,
      tail: this.tail,
    };
  }
}

/**
 * Board-specific ring buffer with optimized copying
 */
export class BoardRingBuffer {
  private ringBuffer: RingBuffer<Uint32Array>;
  private boardSize: number;

  constructor(capacity: number, boardSize = 24) {
    this.boardSize = boardSize;
    this.ringBuffer = new RingBuffer(capacity, () => new Uint32Array(boardSize));
  }

  /**
   * Get a board copy for AI evaluation
   * @param sourceBoard Original board to copy
   * @returns Reusable board copy
   */
  acquireBoardCopy(sourceBoard: Uint32Array): Uint32Array {
    let boardCopy = this.ringBuffer.acquire();

    if (!boardCopy) {
      // Fallback: create new board if buffer is empty
      console.warn("Board ring buffer exhausted, creating new board");
      boardCopy = new Uint32Array(this.boardSize);
    }

    // Fast copy using set()
    boardCopy.set(sourceBoard);

    return boardCopy;
  }

  /**
   * Return board copy to buffer
   * @param board Board to return
   */
  releaseBoardCopy(board: Uint32Array): void {
    // Clear the board before returning to pool
    board.fill(0);
    this.ringBuffer.release(board);
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return this.ringBuffer.getStats();
  }
}
