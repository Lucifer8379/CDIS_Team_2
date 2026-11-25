/**
 * @file config.js
 * @description Centralised, environment-driven configuration module.
 * Avoids hardcoding credentials, sensor models, microcontroller ports, or cloud endpoints.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * Parses a local .env file if present without requiring external dependencies.
 * Existing process.env variables take precedence over .env file entries.
 *
 * @param {string} envFilePath - Absolute path to .env file
 * @returns {Record<string, string>} Parsed key-value map
 */
export function parseEnvFile(envFilePath = path.join(PROJECT_ROOT, '.env')) {
  const parsed = {};
  if (!fs.existsSync(envFilePath)) {
    return parsed;
  }

  const content = fs.readFileSync(envFilePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function toNumber(rawValue, fallback) {
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }
  const num = Number(rawValue);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Loads application configuration from environment variables with safe defaults.
 *
 * @param {Record<string, string | undefined>} [envOverrides] - Optional custom environment source
 * @returns {object} Validated runtime configuration
 */
export function loadConfig(envOverrides = process.env) {
  const fileEnv = parseEnvFile();
  const env = { ...fileEnv, ...envOverrides };

  const rawMode = (env.MONITORING_MODE || 'SIMULATION').toUpperCase().trim();
  const mode = rawMode === 'EXTERNAL_INGEST' ? 'EXTERNAL_INGEST' : 'SIMULATION';

  return {
    host: env.HOST || '127.0.0.1',
    port: Math.max(0, Math.trunc(toNumber(env.PORT, 3000))),
    mode,
    thresholds: {
      tempMinNormalC: toNumber(env.TEMP_MIN_NORMAL_C, 18.0),
      tempMaxNormalC: toNumber(env.TEMP_MAX_NORMAL_C, 28.0),
      tempCriticalDeltaC: Math.max(0.5, toNumber(env.TEMP_CRITICAL_DELTA_C, 5.0)),
      humidityMinNormalPct: toNumber(env.HUMIDITY_MIN_NORMAL_PCT, 30.0),
      humidityMaxNormalPct: toNumber(env.HUMIDITY_MAX_NORMAL_PCT, 65.0),
      humidityCriticalDeltaPct: Math.max(1.0, toNumber(env.HUMIDITY_CRITICAL_DELTA_PCT, 15.0))
    },
    validationBounds: {
      tempValidMinC: toNumber(env.TEMP_VALID_MIN_C, -50.0),
      tempValidMaxC: toNumber(env.TEMP_VALID_MAX_C, 100.0),
      humidityValidMinPct: toNumber(env.HUMIDITY_VALID_MIN_PCT, 0.0),
      humidityValidMaxPct: toNumber(env.HUMIDITY_VALID_MAX_PCT, 100.0)
    },
    storage: {
      adapterType: 'IN_MEMORY_RING_BUFFER',
      maxBufferSize: Math.max(10, Math.trunc(toNumber(env.MAX_BUFFER_SIZE, 100)))
    },
    security: {
      ingestApiToken: (env.INGEST_API_TOKEN || '').trim()
    }
  };
}

/**
 * Produces a sanitised configuration view safe to expose to the frontend UI.
 * Never exposes secret tokens or credentials.
 *
 * @param {object} config - Full runtime configuration
 * @returns {object} Public configuration summary
 */
export function getPublicConfig(config) {
  return {
    mode: config.mode,
    thresholds: { ...config.thresholds },
    validationBounds: { ...config.validationBounds },
    storage: { ...config.storage },
    security: {
      requiresIngestToken: Boolean(config.security.ingestApiToken)
    },
    hardwareAssumptions: {
      sensorModel: 'Pending team confirmation (vendor-neutral schema)',
      controllerPlatform: 'Pending team confirmation',
      cloudProvider: 'Pending team confirmation',
      databaseEngine: 'Pending team confirmation (pluggable repository active)'
    }
  };
}
