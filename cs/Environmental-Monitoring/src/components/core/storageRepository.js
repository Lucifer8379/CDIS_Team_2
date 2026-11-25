/**
 * @file storageRepository.js
 * @description Pluggable persistence layer for environmental readings.
 * Uses a bounded in-memory ring buffer by default so no specific database engine
 * or cloud storage service is assumed prior to team confirmation.
 */

/**
 * Base contract for reading persistence implementations.
 */
export class ReadingRepository {
  save(_reading) {
    throw new Error('save() must be implemented by a concrete ReadingRepository.');
  }

  getLatest(_limit) {
    throw new Error('getLatest() must be implemented by a concrete ReadingRepository.');
  }

  getAll() {
    throw new Error('getAll() must be implemented by a concrete ReadingRepository.');
  }

  replaceAll(_readings) {
    throw new Error('replaceAll() must be implemented by a concrete ReadingRepository.');
  }

  clear() {
    throw new Error('clear() must be implemented by a concrete ReadingRepository.');
  }

  getStats() {
    throw new Error('getStats() must be implemented by a concrete ReadingRepository.');
  }
}

/**
 * Bounded FIFO in-memory repository suitable for stateless compute instances
 * and modular local/cloud testing prior to database selection.
 */
export class InMemoryReadingRepository extends ReadingRepository {
  /**
   * @param {object} [options]
   * @param {number} [options.maxBufferSize=100]
   */
  constructor(options = {}) {
    super();
    this.maxBufferSize = Math.max(1, Math.trunc(options.maxBufferSize ?? 100));
    this.records = [];
    this.totalReceived = 0;
  }

  /**
   * Appends a reading and evicts oldest entry if capacity is reached.
   * @param {object} reading
   * @returns {object} Stored record with assigned `id`
   */
  save(reading) {
    this.totalReceived += 1;
    const stored = {
      id: `RD-${String(this.totalReceived).padStart(5, '0')}`,
      ...reading
    };
    this.records.push(stored);
    if (this.records.length > this.maxBufferSize) {
      this.records.shift();
    }
    return stored;
  }

  /**
   * Returns up to `limit` most recent readings ordered newest-first.
   * @param {number} [limit=50]
   * @returns {Array<object>}
   */
  getLatest(limit = 50) {
    const safeLimit = Math.max(1, Math.min(this.maxBufferSize, Math.trunc(limit)));
    return this.records.slice(-safeLimit).reverse();
  }

  /**
   * Returns all buffered readings in chronological order (oldest-first).
   * @returns {Array<object>}
   */
  getAll() {
    return [...this.records];
  }

  /**
   * Replaces stored items (used when re-evaluating buffered items after threshold change).
   * @param {Array<object>} updatedRecords
   */
  replaceAll(updatedRecords) {
    this.records = updatedRecords.slice(-this.maxBufferSize);
  }

  /**
   * Clears buffered readings in current session.
   */
  clear() {
    this.records = [];
  }

  /**
   * Reports buffer utilisation metrics (supports CO2 compute/memory sizing analysis).
   */
  getStats() {
    const bufferedCount = this.records.length;
    return {
      adapterType: 'InMemoryReadingRepository',
      bufferedCount,
      maxBufferSize: this.maxBufferSize,
      utilizationPct: Number(((bufferedCount / this.maxBufferSize) * 100).toFixed(1)),
      totalReceivedSinceStart: this.totalReceived
    };
  }
}
