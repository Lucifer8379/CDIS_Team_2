/**
 * @file thresholdForm.js
 * @description Reusable configuration form component for inspecting and updating
 * environmental monitoring thresholds without hardcoding limits.
 */

import { escapeHtml } from './formatters.js';

/**
 * Renders inputs for normal temperature and humidity ranges.
 *
 * @param {object} thresholds
 * @returns {string} HTML markup
 */
export function renderThresholdFields(thresholds) {
  return `
    <div class="form-grid">
      <label class="form-field">
        <span>Min Normal Temp (°C)</span>
        <input type="number" step="0.5" name="tempMinNormalC" value="${escapeHtml(thresholds.tempMinNormalC)}" required />
      </label>
      <label class="form-field">
        <span>Max Normal Temp (°C)</span>
        <input type="number" step="0.5" name="tempMaxNormalC" value="${escapeHtml(thresholds.tempMaxNormalC)}" required />
      </label>
      <label class="form-field">
        <span>Temp Critical Margin (°C)</span>
        <input type="number" step="0.5" min="0.5" name="tempCriticalDeltaC" value="${escapeHtml(thresholds.tempCriticalDeltaC)}" required />
      </label>
      <label class="form-field">
        <span>Min Normal Humidity (% RH)</span>
        <input type="number" step="1" min="0" max="99" name="humidityMinNormalPct" value="${escapeHtml(thresholds.humidityMinNormalPct)}" required />
      </label>
      <label class="form-field">
        <span>Max Normal Humidity (% RH)</span>
        <input type="number" step="1" min="1" max="100" name="humidityMaxNormalPct" value="${escapeHtml(thresholds.humidityMaxNormalPct)}" required />
      </label>
      <label class="form-field">
        <span>Humidity Critical Margin (%)</span>
        <input type="number" step="1" min="1" name="humidityCriticalDeltaPct" value="${escapeHtml(thresholds.humidityCriticalDeltaPct)}" required />
      </label>
    </div>
  `;
}
