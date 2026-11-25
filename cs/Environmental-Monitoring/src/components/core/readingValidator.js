/**
 * @file readingValidator.js
 * @description Vendor-neutral validation and normalisation module for environmental
 * temperature and relative humidity measurements. Does not assume any specific
 * physical sensor model or microcontroller payload format.
 */

export const DEFAULT_VALIDATION_BOUNDS = Object.freeze({
  tempValidMinC: -50.0,
  tempValidMaxC: 100.0,
  humidityValidMinPct: 0.0,
  humidityValidMaxPct: 100.0
});

/**
 * Converts Celsius to Fahrenheit rounded to 2 decimal places.
 * @param {number} celsius
 * @returns {number}
 */
export function celsiusToFahrenheit(celsius) {
  return Number(((celsius * 9) / 5 + 32).toFixed(2));
}

/**
 * Converts Fahrenheit to Celsius rounded to 2 decimal places.
 * @param {number} fahrenheit
 * @returns {number}
 */
export function fahrenheitToCelsius(fahrenheit) {
  return Number((((fahrenheit - 32) * 5) / 9).toFixed(2));
}

/**
 * Validates and normalises an incoming sensor or simulation payload.
 *
 * @param {unknown} payload - Incoming measurement object
 * @param {object} [bounds] - Physical plausibility limits
 * @returns {{ valid: boolean, errors: string[], data: object | null }}
 */
export function validateReadingPayload(payload, bounds = DEFAULT_VALIDATION_BOUNDS) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      errors: ['Payload must be a non-null JSON object.'],
      data: null
    };
  }

  // Resolve temperature in Celsius (accepts temperatureC or temperatureF)
  let temperatureC;
  if (payload.temperatureC !== undefined && payload.temperatureC !== null && payload.temperatureC !== '') {
    temperatureC = Number(payload.temperatureC);
  } else if (payload.temperatureF !== undefined && payload.temperatureF !== null && payload.temperatureF !== '') {
    const tempF = Number(payload.temperatureF);
    temperatureC = Number.isFinite(tempF) ? fahrenheitToCelsius(tempF) : NaN;
  } else {
    errors.push('Temperature measurement is required ("temperatureC" or "temperatureF").');
  }

  if (temperatureC !== undefined && !Number.isFinite(temperatureC)) {
    errors.push('Temperature measurement must be a finite numeric value.');
  } else if (
    temperatureC !== undefined &&
    (temperatureC < bounds.tempValidMinC || temperatureC > bounds.tempValidMaxC)
  ) {
    errors.push(
      `Temperature (${temperatureC} °C) is outside configured plausible bounds [${bounds.tempValidMinC}, ${bounds.tempValidMaxC}] °C.`
    );
  }

  // Resolve relative humidity percentage
  let humidityPct;
  if (payload.humidityPct !== undefined && payload.humidityPct !== null && payload.humidityPct !== '') {
    humidityPct = Number(payload.humidityPct);
  } else {
    errors.push('Relative humidity measurement is required ("humidityPct").');
  }

  if (humidityPct !== undefined && !Number.isFinite(humidityPct)) {
    errors.push('Relative humidity ("humidityPct") must be a finite numeric value.');
  } else if (
    humidityPct !== undefined &&
    (humidityPct < bounds.humidityValidMinPct || humidityPct > bounds.humidityValidMaxPct)
  ) {
    errors.push(
      `Relative humidity (${humidityPct} %) is outside configured plausible bounds [${bounds.humidityValidMinPct}, ${bounds.humidityValidMaxPct}] %.`
    );
  }

  // Resolve timestamp
  let timestampIso;
  if (payload.timestamp) {
    const parsedDate = new Date(payload.timestamp);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push('Provided "timestamp" is not a valid ISO-8601 date string.');
    } else {
      timestampIso = parsedDate.toISOString();
    }
  } else {
    timestampIso = new Date().toISOString();
  }

  // Sanitise optional identifiers without assuming specific hardware
  const sensorId =
    typeof payload.sensorId === 'string' && payload.sensorId.trim().length > 0
      ? payload.sensorId.trim().slice(0, 64)
      : 'NODE-UNASSIGNED';

  const zone =
    typeof payload.zone === 'string' && payload.zone.trim().length > 0
      ? payload.zone.trim().slice(0, 64)
      : 'General Monitoring Zone';

  const isSimulated = Boolean(payload.isSimulated);
  const source = isSimulated ? 'SIMULATED_DEMONSTRATION' : 'EXTERNAL_SENSOR_INGEST';

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  const roundedTempC = Number(temperatureC.toFixed(2));
  const roundedHumidity = Number(humidityPct.toFixed(2));

  return {
    valid: true,
    errors: [],
    data: {
      sensorId,
      zone,
      temperatureC: roundedTempC,
      temperatureF: celsiusToFahrenheit(roundedTempC),
      humidityPct: roundedHumidity,
      timestamp: timestampIso,
      isSimulated,
      source,
      note:
        typeof payload.note === 'string' && payload.note.trim().length > 0
          ? payload.note.trim().slice(0, 160)
          : isSimulated
            ? 'Simulated demonstration reading (no physical sensor connected)'
            : 'External environmental reading'
    }
  };
}
