/**
 * @file monitoringService.js
 * @description Core domain service orchestrating payload validation, threshold
 * evaluation, pluggable sensor simulation/ingestion, and repository storage.
 */

import { DEFAULT_VALIDATION_BOUNDS, validateReadingPayload } from './readingValidator.js';
import {
  DEFAULT_THRESHOLDS,
  computeSummaryStatistics,
  evaluateReading,
  validateThresholds
} from './thresholdMonitor.js';
import { ExternalIngestAdapter, SimulatedSensorAdapter } from './sensorAdapter.js';
import { InMemoryReadingRepository } from './storageRepository.js';

export class MonitoringService {
  /**
   * @param {object} [options]
   * @param {'SIMULATION'|'EXTERNAL_INGEST'} [options.mode='SIMULATION']
   * @param {object} [options.thresholds]
   * @param {object} [options.validationBounds]
   * @param {object} [options.repository]
   * @param {object} [options.simulatedAdapter]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'SIMULATION';
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds || {}) };
    this.validationBounds = {
      ...DEFAULT_VALIDATION_BOUNDS,
      ...(options.validationBounds || {})
    };
    this.repository =
      options.repository || new InMemoryReadingRepository({ maxBufferSize: options.maxBufferSize ?? 100 });
    this.simulatedAdapter = options.simulatedAdapter || new SimulatedSensorAdapter();
    this.externalAdapter = new ExternalIngestAdapter();
  }

  /**
   * Validates, evaluates, and stores an environmental measurement payload.
   *
   * @param {object} rawPayload - Incoming payload
   * @returns {{ ok: boolean, errors?: string[], record?: object }}
   */
  ingestReading(rawPayload) {
    const validation = validateReadingPayload(rawPayload, this.validationBounds);
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }

    const evaluation = evaluateReading(validation.data, this.thresholds);
    const enriched = {
      ...validation.data,
      evaluation
    };

    const saved = this.repository.save(enriched);
    return { ok: true, record: saved };
  }

  /**
   * Generates and records an explicitly labelled simulated measurement.
   * Disabled when operating strictly in EXTERNAL_INGEST mode.
   *
   * @param {object} [params]
   * @returns {{ ok: boolean, errors?: string[], record?: object }}
   */
  generateSimulatedReading(params = {}) {
    if (this.mode === 'EXTERNAL_INGEST') {
      return {
        ok: false,
        errors: [
          'Simulation is disabled because MONITORING_MODE is set to EXTERNAL_INGEST.'
        ]
      };
    }

    const sample = this.simulatedAdapter.generateSample(params);
    return this.ingestReading(sample);
  }

  /**
   * Seeds an initial set of clearly labelled simulated samples for demonstration.
   *
   * @param {number} [count=5]
   */
  seedInitialSimulation(count = 5) {
    if (this.mode !== 'SIMULATION') {
      return;
    }
    const baseTime = Date.now() - count * 60_000;
    for (let i = 0; i < count; i += 1) {
      const sample = this.simulatedAdapter.generateSample({ scenario: 'normal' });
      sample.timestamp = new Date(baseTime + i * 60_000).toISOString();
      this.ingestReading(sample);
    }
  }

  /**
   * Updates advisory thresholds and re-evaluates buffered records consistently.
   *
   * @param {object} candidateThresholds
   * @returns {{ ok: boolean, errors?: string[], thresholds?: object }}
   */
  updateThresholds(candidateThresholds) {
    const check = validateThresholds(candidateThresholds, this.thresholds);
    if (!check.valid) {
      return { ok: false, errors: check.errors };
    }

    this.thresholds = check.thresholds;
    const reEvaluated = this.repository.getAll().map((item) => ({
      ...item,
      evaluation: evaluateReading(item, this.thresholds)
    }));
    this.repository.replaceAll(reEvaluated);

    return { ok: true, thresholds: { ...this.thresholds } };
  }

  /**
   * Clears buffered readings in the active repository.
   */
  clearReadings() {
    this.repository.clear();
  }

  /**
   * Returns a complete snapshot for the presentation tier.
   *
   * @param {number} [limit=50]
   * @returns {object}
   */
  getSnapshot(limit = 50) {
    const chronological = this.repository.getAll();
    const latestFirst = this.repository.getLatest(limit);
    const summary = computeSummaryStatistics(chronological);
    const activeAdapter =
      this.mode === 'SIMULATION'
        ? this.simulatedAdapter.getMetadata()
        : this.externalAdapter.getMetadata();

    return {
      mode: this.mode,
      adapter: activeAdapter,
      thresholds: { ...this.thresholds },
      storage: this.repository.getStats(),
      summary,
      latestReading: latestFirst[0] || null,
      readings: latestFirst
    };
  }
}
