/**
 * @file readingsTable.js
 * @description Reusable tabular measurement log component with explicit data
 * provenance badges for every environmental sample.
 */

import {
  escapeHtml,
  formatHumidity,
  formatTemperature,
  formatTimestamp
} from './formatters.js';
import { renderOriginBadge, renderSeverityBadge } from './statusBadge.js';

/**
 * Renders the environmental measurements table.
 *
 * @param {Array<object>} readings - Array of evaluated reading records (newest first)
 * @returns {string} HTML markup
 */
export function renderReadingsTable(readings = []) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return `
      <div class="empty-state">
        <p>No environmental readings are currently stored in the session buffer.</p>
        <p class="empty-state__hint">Use the Simulation Controls to generate a labelled demonstration sample, or submit a JSON payload to <code>POST /api/readings</code>.</p>
      </div>
    `;
  }

  const rowsHtml = readings
    .map((item) => {
      const severity = item.evaluation?.overallSeverity || 'NORMAL';
      const advisory = item.evaluation?.advisoryMessage || '';

      return `
        <tr>
          <td class="mono">${escapeHtml(item.id || '—')}</td>
          <td>${escapeHtml(formatTimestamp(item.timestamp))}</td>
          <td>
            <div class="node-cell">
              <strong>${escapeHtml(item.zone)}</strong>
              <span class="node-cell__id mono">${escapeHtml(item.sensorId)}</span>
            </div>
          </td>
          <td class="mono">${escapeHtml(formatTemperature(item.temperatureC, item.temperatureF))}</td>
          <td class="mono">${escapeHtml(formatHumidity(item.humidityPct))}</td>
          <td>${renderSeverityBadge(severity)}</td>
          <td>${renderOriginBadge(Boolean(item.isSimulated))}</td>
          <td class="advisory-cell">${escapeHtml(advisory)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-wrapper">
      <table class="readings-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Timestamp</th>
            <th scope="col">Zone / Node ID</th>
            <th scope="col">Temperature</th>
            <th scope="col">Relative Humidity</th>
            <th scope="col">Condition</th>
            <th scope="col">Data Origin</th>
            <th scope="col">Evaluation Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}
