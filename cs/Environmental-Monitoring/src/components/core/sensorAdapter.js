/**
 * @file sensorAdapter.js
 * @description Pluggable data-source abstraction so hardware sensor and microcontroller
 * selection can be finalised later without rewriting core application modules.
 *
 * IMPORTANT: Simulated readings generated for demonstration are ALWAYS explicitly
 * stamped with `isSimulated: true` and `source: "SIMULATED_DEMONSTRATION"`.
 */

/**
 * Base contract for environmental data acquisition adapters.
 */
export class SensorDataSource {
  getMetadata() {
    return {
      adapterName: 'AbstractSensorDataSource',
      isHardwareConnected: false,
      description: 'Base interface for temperature and humidity data sources'
    };
  }
}

/**
 * Demonstration-only adapter that generates bounded synthetic readings.
 * Clearly marks all generated samples as simulated rather than physical measurements.
 */
export class SimulatedSensorAdapter extends SensorDataSource {
  /**
   * @param {object} [options]
   * @param {number} [options.baselineTempC=23.5]
   * @param {number} [options.baselineHumidityPct=48.0]
   * @param {string} [options.sensorId='SIM-DEMO-NODE-01']
   * @param {string} [options.zone='Simulated Lab Zone (Demo)']
   */
  constructor(options = {}) {
    super();
    this.currentTempC = options.baselineTempC ?? 23.5;
    this.currentHumidityPct = options.baselineHumidityPct ?? 48.0;
    this.sensorId = options.sensorId ?? 'SIM-DEMO-NODE-01';
    this.zone = options.zone ?? 'Simulated Lab Zone (Demo)';
    this.sequence = 0;
  }

  getMetadata() {
    return {
      adapterName: 'SimulatedSensorAdapter',
      isHardwareConnected: false,
      isSimulation: true,
      description:
        'Generates synthetic temperature and relative humidity values strictly for software demonstration and UI testing.'
    };
  }

  /**
   * Generates a single synthetic reading with optional profile ('normal', 'high_temp', 'high_humidity').
   *
   * @param {object} [params]
   * @param {'normal'|'high_temp'|'low_temp'|'high_humidity'|'low_humidity'} [params.scenario='normal']
   * @param {string} [params.zone]
   * @returns {object} Raw reading payload explicitly flagged as simulated
   */
  generateSample(params = {}) {
    this.sequence += 1;
    const scenario = params.scenario || 'normal';

    // Gentle bounded drift for realistic demonstration curves
    const tempDrift = (Math.random() - 0.5) * 1.4;
    const humidityDrift = (Math.random() - 0.5) * 3.2;

    this.currentTempC = Math.max(12, Math.min(38, this.currentTempC + tempDrift));
    this.currentHumidityPct = Math.max(20, Math.min(85, this.currentHumidityPct + humidityDrift));

    let tempValue = this.currentTempC;
    let humidityValue = this.currentHumidityPct;

    if (scenario === 'high_temp') {
      tempValue = 30.8 + Math.random() * 3.5;
    } else if (scenario === 'low_temp') {
      tempValue = 14.5 - Math.random() * 2.5;
    } else if (scenario === 'high_humidity') {
      humidityValue = 72.0 + Math.random() * 10.0;
    } else if (scenario === 'low_humidity') {
      humidityValue = 22.0 - Math.random() * 5.0;
    }

    return {
      sensorId: this.sensorId,
      zone: params.zone || this.zone,
      temperatureC: Number(tempValue.toFixed(2)),
      humidityPct: Number(humidityValue.toFixed(2)),
      timestamp: new Date().toISOString(),
      isSimulated: true,
      source: 'SIMULATED_DEMONSTRATION',
      note: `Simulated demonstration sample #${this.sequence} (hardware not connected)`
    };
  }
}

/**
 * Passive adapter representing external hardware/gateway ingestion via HTTP JSON.
 * Keeps sensor model, communication bus, and microcontroller completely decoupled.
 */
export class ExternalIngestAdapter extends SensorDataSource {
  getMetadata() {
    return {
      adapterName: 'ExternalIngestAdapter',
      isHardwareConnected: null, // Dependent on external device pushing payloads
      isSimulation: false,
      description:
        'Accepts vendor-neutral JSON payloads over POST /api/readings once sensor and controller hardware are finalised.'
    };
  }
}
