/**
 * @file thresholdMonitor.test.js
 * @description Unit tests for threshold classification rules and summary statistics.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_THRESHOLDS,
  computeSummaryStatistics,
  evaluateReading,
  validateThresholds
} from '../../src/components/core/thresholdMonitor.js';

test('classifies normal, warning, and critical alert readings accurately', () => {
  const normal = evaluateReading({ temperatureC: 23.0, humidityPct: 48.0 }, DEFAULT_THRESHOLDS);
  assert.equal(normal.overallSeverity, 'NORMAL');
  assert.equal(normal.temperatureState, 'NORMAL');
  assert.equal(normal.humidityState, 'NORMAL');

  const highTempWarn = evaluateReading({ temperatureC: 29.5, humidityPct: 48.0 }, DEFAULT_THRESHOLDS);
  assert.equal(highTempWarn.overallSeverity, 'WARNING');
  assert.equal(highTempWarn.temperatureState, 'HIGH_WARNING');

  const criticalHumidity = evaluateReading(
    { temperatureC: 24.0, humidityPct: 81.0 },
    DEFAULT_THRESHOLDS
  );
  assert.equal(criticalHumidity.overallSeverity, 'ALERT');
  assert.equal(criticalHumidity.humidityState, 'HIGH_ALERT');

  const criticalLowTemp = evaluateReading(
    { temperatureC: 12.5, humidityPct: 45.0 },
    DEFAULT_THRESHOLDS
  );
  assert.equal(criticalLowTemp.overallSeverity, 'ALERT');
  assert.equal(criticalLowTemp.temperatureState, 'LOW_ALERT');
});

test('validates threshold updates and prevents inverted min/max bounds', () => {
  const invalid = validateThresholds({ tempMinNormalC: 30, tempMaxNormalC: 25 });
  assert.equal(invalid.valid, false);

  const valid = validateThresholds({ tempMinNormalC: 19.5, tempMaxNormalC: 26.5 });
  assert.equal(valid.valid, true);
  assert.equal(valid.thresholds.tempMinNormalC, 19.5);
  assert.equal(valid.thresholds.tempMaxNormalC, 26.5);
});

test('computes accurate aggregate statistics and provenance counts', () => {
  const sampleRecords = [
    {
      temperatureC: 20,
      humidityPct: 40,
      timestamp: '2026-11-25T10:00:00.000Z',
      isSimulated: true,
      evaluation: { overallSeverity: 'NORMAL' }
    },
    {
      temperatureC: 30,
      humidityPct: 60,
      timestamp: '2026-11-25T10:05:00.000Z',
      isSimulated: false,
      evaluation: { overallSeverity: 'WARNING' }
    }
  ];

  const stats = computeSummaryStatistics(sampleRecords);
  assert.equal(stats.count, 2);
  assert.equal(stats.simulatedCount, 1);
  assert.equal(stats.ingestedCount, 1);
  assert.equal(stats.temperature.min, 20);
  assert.equal(stats.temperature.max, 30);
  assert.equal(stats.temperature.avg, 25);
  assert.equal(stats.temperature.latest, 30);
  assert.equal(stats.statusBreakdown.NORMAL, 1);
  assert.equal(stats.statusBreakdown.WARNING, 1);
});
