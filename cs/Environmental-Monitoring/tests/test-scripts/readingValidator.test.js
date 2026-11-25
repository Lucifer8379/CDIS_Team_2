/**
 * @file readingValidator.test.js
 * @description Unit tests for vendor-neutral environmental payload validation
 * and temperature scale conversions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  validateReadingPayload
} from '../../src/components/core/readingValidator.js';

test('converts accurately between Celsius and Fahrenheit', () => {
  assert.equal(celsiusToFahrenheit(0), 32);
  assert.equal(celsiusToFahrenheit(25), 77);
  assert.equal(fahrenheitToCelsius(32), 0);
  assert.equal(fahrenheitToCelsius(77), 25);
});

test('validates a well-formed external sensor payload', () => {
  const result = validateReadingPayload({
    sensorId: 'NODE-A1',
    zone: 'Server Room',
    temperatureC: 22.456,
    humidityPct: 45.678,
    timestamp: '2026-11-25T10:00:00.000Z',
    isSimulated: false
  });

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data.sensorId, 'NODE-A1');
  assert.equal(result.data.zone, 'Server Room');
  assert.equal(result.data.temperatureC, 22.46);
  assert.equal(result.data.humidityPct, 45.68);
  assert.equal(result.data.isSimulated, false);
  assert.equal(result.data.source, 'EXTERNAL_SENSOR_INGEST');
});

test('accepts Fahrenheit input and normalises to Celsius', () => {
  const result = validateReadingPayload({
    temperatureF: 68,
    humidityPct: 50,
    isSimulated: true
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.temperatureC, 20);
  assert.equal(result.data.temperatureF, 68);
  assert.equal(result.data.isSimulated, true);
  assert.equal(result.data.source, 'SIMULATED_DEMONSTRATION');
});

test('rejects missing or out-of-bounds environmental values', () => {
  const missingTemp = validateReadingPayload({ humidityPct: 50 });
  assert.equal(missingTemp.valid, false);

  const implausibleTemp = validateReadingPayload({ temperatureC: 145, humidityPct: 50 });
  assert.equal(implausibleTemp.valid, false);

  const implausibleHumidity = validateReadingPayload({ temperatureC: 24, humidityPct: 112 });
  assert.equal(implausibleHumidity.valid, false);

  const badTimestamp = validateReadingPayload({
    temperatureC: 24,
    humidityPct: 50,
    timestamp: 'not-a-valid-date'
  });
  assert.equal(badTimestamp.valid, false);
});
