/**
 * @file monitoringService.test.js
 * @description Unit tests for MonitoringService, explicit simulation tagging,
 * ring-buffer capacity enforcement, and retroactive threshold re-evaluation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { MonitoringService } from '../../src/components/core/monitoringService.js';

test('explicitly flags generated simulation readings with isSimulated: true', () => {
  const service = new MonitoringService({ mode: 'SIMULATION', maxBufferSize: 10 });
  const result = service.generateSimulatedReading({ scenario: 'normal' });

  assert.equal(result.ok, true);
  assert.equal(result.record.isSimulated, true);
  assert.equal(result.record.source, 'SIMULATED_DEMONSTRATION');
});

test('blocks synthetic sample generation when operating in EXTERNAL_INGEST mode', () => {
  const service = new MonitoringService({ mode: 'EXTERNAL_INGEST' });
  const result = service.generateSimulatedReading({ scenario: 'normal' });

  assert.equal(result.ok, false);
  assert.ok(result.errors[0].includes('EXTERNAL_INGEST'));
});

test('enforces bounded ring-buffer eviction to cap memory utilisation', () => {
  const service = new MonitoringService({ mode: 'SIMULATION', maxBufferSize: 3 });

  for (let i = 1; i <= 5; i += 1) {
    service.ingestReading({
      sensorId: `NODE-${i}`,
      temperatureC: 20 + i,
      humidityPct: 50,
      isSimulated: true
    });
  }

  const snapshot = service.getSnapshot(10);
  assert.equal(snapshot.storage.bufferedCount, 3);
  assert.equal(snapshot.storage.totalReceivedSinceStart, 5);
  assert.equal(snapshot.readings[0].sensorId, 'NODE-5');
  assert.equal(snapshot.readings[2].sensorId, 'NODE-3');
});

test('re-evaluates buffered readings when thresholds are updated', () => {
  const service = new MonitoringService({ mode: 'SIMULATION' });
  service.ingestReading({
    temperatureC: 26.0,
    humidityPct: 50.0,
    isSimulated: true
  });

  assert.equal(service.getSnapshot().latestReading.evaluation.overallSeverity, 'NORMAL');

  const update = service.updateThresholds({ tempMaxNormalC: 24.0 });
  assert.equal(update.ok, true);
  assert.equal(service.getSnapshot().latestReading.evaluation.overallSeverity, 'WARNING');
});
