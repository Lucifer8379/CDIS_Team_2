/**
 * @file thresholdMonitor.js
 * @description Evaluates validated temperature and relative humidity measurements
 * against configurable operating ranges and computes summary statistics.
 */

export const DEFAULT_THRESHOLDS = Object.freeze({
  tempMinNormalC: 18.0,
  tempMaxNormalC: 28.0,
  tempCriticalDeltaC: 5.0,
  humidityMinNormalPct: 30.0,
  humidityMaxNormalPct: 65.0,
  humidityCriticalDeltaPct: 15.0
});

/**
 * Validates and merges partial threshold updates against current thresholds.
 *
 * @param {object} partial - Candidate threshold values
 * @param {object} [current] - Baseline thresholds
 * @returns {{ valid: boolean, errors: string[], thresholds: object | null }}
 */
export function validateThresholds(partial, current = DEFAULT_THRESHOLDS) {
  if (!partial || typeof partial !== 'object') {
    return { valid: false, errors: ['Threshold update must be an object.'], thresholds: null };
  }

  const merged = { ...current };
  const numericKeys = [
    'tempMinNormalC',
    'tempMaxNormalC',
    'tempCriticalDeltaC',
    'humidityMinNormalPct',
    'humidityMaxNormalPct',
    'humidityCriticalDeltaPct'
  ];

  const errors = [];
  for (const key of numericKeys) {
    if (partial[key] !== undefined) {
      const val = Number(partial[key]);
      if (!Number.isFinite(val)) {
        errors.push(`"${key}" must be a valid number.`);
      } else {
        merged[key] = Number(val.toFixed(2));
      }
    }
  }

  if (merged.tempMinNormalC >= merged.tempMaxNormalC) {
    errors.push('Minimum normal temperature must be strictly less than maximum normal temperature.');
  }
  if (merged.humidityMinNormalPct >= merged.humidityMaxNormalPct) {
    errors.push('Minimum normal humidity must be strictly less than maximum normal humidity.');
  }
  if (merged.tempCriticalDeltaC <= 0 || merged.humidityCriticalDeltaPct <= 0) {
    errors.push('Critical delta margins must be greater than zero.');
  }
  if (merged.humidityMinNormalPct < 0 || merged.humidityMaxNormalPct > 100) {
    errors.push('Normal humidity thresholds must lie within 0% and 100% RH.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, thresholds: null };
  }

  return { valid: true, errors: [], thresholds: merged };
}

function classifyMetric(value, minNormal, maxNormal, criticalDelta) {
  if (value <= minNormal - criticalDelta) {
    return { state: 'LOW_ALERT', severity: 'ALERT' };
  }
  if (value < minNormal) {
    return { state: 'LOW_WARNING', severity: 'WARNING' };
  }
  if (value >= maxNormal + criticalDelta) {
    return { state: 'HIGH_ALERT', severity: 'ALERT' };
  }
  if (value > maxNormal) {
    return { state: 'HIGH_WARNING', severity: 'WARNING' };
  }
  return { state: 'NORMAL', severity: 'NORMAL' };
}

/**
 * Evaluates a validated environmental reading against configured thresholds.
 *
 * @param {object} reading - Normalised reading from readingValidator
 * @param {object} [thresholds] - Configured threshold boundaries
 * @returns {object} Evaluation details including overall severity and advisory text
 */
export function evaluateReading(reading, thresholds = DEFAULT_THRESHOLDS) {
  const tempCheck = classifyMetric(
    reading.temperatureC,
    thresholds.tempMinNormalC,
    thresholds.tempMaxNormalC,
    thresholds.tempCriticalDeltaC
  );

  const humidityCheck = classifyMetric(
    reading.humidityPct,
    thresholds.humidityMinNormalPct,
    thresholds.humidityMaxNormalPct,
    thresholds.humidityCriticalDeltaPct
  );

  const severityRank = { NORMAL: 0, WARNING: 1, ALERT: 2 };
  const overallSeverity =
    severityRank[tempCheck.severity] >= severityRank[humidityCheck.severity]
      ? tempCheck.severity
      : humidityCheck.severity;

  const advisories = [];
  if (tempCheck.state === 'LOW_ALERT' || tempCheck.state === 'LOW_WARNING') {
    advisories.push(
      `Temperature (${reading.temperatureC} °C) is below normal minimum (${thresholds.tempMinNormalC} °C).`
    );
  } else if (tempCheck.state === 'HIGH_ALERT' || tempCheck.state === 'HIGH_WARNING') {
    advisories.push(
      `Temperature (${reading.temperatureC} °C) exceeds normal maximum (${thresholds.tempMaxNormalC} °C).`
    );
  }

  if (humidityCheck.state === 'LOW_ALERT' || humidityCheck.state === 'LOW_WARNING') {
    advisories.push(
      `Relative humidity (${reading.humidityPct} %) is below normal minimum (${thresholds.humidityMinNormalPct} %).`
    );
  } else if (humidityCheck.state === 'HIGH_ALERT' || humidityCheck.state === 'HIGH_WARNING') {
    advisories.push(
      `Relative humidity (${reading.humidityPct} %) exceeds normal maximum (${thresholds.humidityMaxNormalPct} %).`
    );
  }

  if (advisories.length === 0) {
    advisories.push('Temperature and relative humidity are within normal operating limits.');
  }

  return {
    overallSeverity,
    temperatureState: tempCheck.state,
    humidityState: humidityCheck.state,
    advisoryMessage: advisories.join(' ')
  };
}

/**
 * Computes statistical summaries across an array of evaluated readings.
 *
 * @param {Array<object>} readings - Array of stored reading records
 * @returns {object} Aggregate statistics for dashboard presentation
 */
export function computeSummaryStatistics(readings) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return {
      count: 0,
      simulatedCount: 0,
      ingestedCount: 0,
      temperature: { min: null, max: null, avg: null, latest: null },
      humidity: { min: null, max: null, avg: null, latest: null },
      statusBreakdown: { NORMAL: 0, WARNING: 0, ALERT: 0 }
    };
  }

  let tempMin = Infinity;
  let tempMax = -Infinity;
  let tempSum = 0;

  let humMin = Infinity;
  let humMax = -Infinity;
  let humSum = 0;

  let simulatedCount = 0;
  let ingestedCount = 0;
  const statusBreakdown = { NORMAL: 0, WARNING: 0, ALERT: 0 };

  for (const item of readings) {
    const t = item.temperatureC;
    const h = item.humidityPct;

    if (t < tempMin) tempMin = t;
    if (t > tempMax) tempMax = t;
    tempSum += t;

    if (h < humMin) humMin = h;
    if (h > humMax) humMax = h;
    humSum += h;

    if (item.isSimulated) {
      simulatedCount += 1;
    } else {
      ingestedCount += 1;
    }

    const sev = item.evaluation?.overallSeverity || 'NORMAL';
    if (statusBreakdown[sev] !== undefined) {
      statusBreakdown[sev] += 1;
    }
  }

  // Assuming readings are ordered oldest -> newest or newest -> oldest; inspect timestamps
  const latestRecord = readings.reduce((latest, current) =>
    new Date(current.timestamp).getTime() >= new Date(latest.timestamp).getTime() ? current : latest
  );

  return {
    count: readings.length,
    simulatedCount,
    ingestedCount,
    temperature: {
      min: Number(tempMin.toFixed(2)),
      max: Number(tempMax.toFixed(2)),
      avg: Number((tempSum / readings.length).toFixed(2)),
      latest: latestRecord.temperatureC
    },
    humidity: {
      min: Number(humMin.toFixed(2)),
      max: Number(humMax.toFixed(2)),
      avg: Number((humSum / readings.length).toFixed(2)),
      latest: latestRecord.humidityPct
    },
    statusBreakdown
  };
}
