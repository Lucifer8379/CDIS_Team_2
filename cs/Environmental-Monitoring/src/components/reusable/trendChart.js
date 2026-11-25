/**
 * @file trendChart.js
 * @description Zero-dependency SVG line chart component for visualising
 * recent temperature (°C) and relative humidity (% RH) time-series trends
 * alongside configured normal operating boundaries.
 */

import { escapeHtml } from './formatters.js';

function buildSingleSeriesSvg({
  title,
  unit,
  points,
  minNormal,
  maxNormal,
  strokeColor,
  yFloor,
  yCeiling
}) {
  const width = 520;
  const height = 190;
  const pad = { top: 20, right: 20, bottom: 28, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (!points || points.length === 0) {
    return `
      <div class="chart-panel">
        <h4 class="chart-panel__title">${escapeHtml(title)}</h4>
        <div class="chart-panel__empty">No measurements buffered yet.</div>
      </div>
    `;
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values, minNormal - 2, yFloor);
  const rawMax = Math.max(...values, maxNormal + 2, yCeiling);
  const span = Math.max(1, rawMax - rawMin);

  const toX = (index) =>
    points.length === 1
      ? pad.left + plotW / 2
      : pad.left + (index / (points.length - 1)) * plotW;

  const toY = (val) => pad.top + plotH - ((val - rawMin) / span) * plotH;

  const yMaxNormal = toY(maxNormal);
  const yMinNormal = toY(minNormal);
  const bandTop = Math.min(yMaxNormal, yMinNormal);
  const bandHeight = Math.max(2, Math.abs(yMinNormal - yMaxNormal));

  const polylinePoints = points
    .map((pt, idx) => `${toX(idx).toFixed(1)},${toY(pt.value).toFixed(1)}`)
    .join(' ');

  const circles = points
    .map((pt, idx) => {
      const cx = toX(idx).toFixed(1);
      const cy = toY(pt.value).toFixed(1);
      const label = `${pt.value.toFixed(1)} ${unit} (${pt.isSimulated ? 'Simulated' : 'Ingested'})`;
      return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${escapeHtml(strokeColor)}"><title>${escapeHtml(label)}</title></circle>`;
    })
    .join('');

  return `
    <div class="chart-panel">
      <div class="chart-panel__header">
        <h4 class="chart-panel__title">${escapeHtml(title)}</h4>
        <span class="chart-panel__legend">Normal Band: ${minNormal.toFixed(1)}–${maxNormal.toFixed(1)} ${escapeHtml(unit)}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="${escapeHtml(title)} trend chart">
        <!-- Normal threshold band -->
        <rect x="${pad.left}" y="${bandTop.toFixed(1)}" width="${plotW}" height="${bandHeight.toFixed(1)}" fill="#e6f4ea" opacity="0.7" />
        <line x1="${pad.left}" y1="${yMaxNormal.toFixed(1)}" x2="${width - pad.right}" y2="${yMaxNormal.toFixed(1)}" stroke="#2e7d32" stroke-dasharray="4 3" stroke-width="1" />
        <line x1="${pad.left}" y1="${yMinNormal.toFixed(1)}" x2="${width - pad.right}" y2="${yMinNormal.toFixed(1)}" stroke="#2e7d32" stroke-dasharray="4 3" stroke-width="1" />

        <!-- Axes -->
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" stroke="#94a3b8" stroke-width="1" />
        <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" stroke="#94a3b8" stroke-width="1" />

        <!-- Y Axis Labels -->
        <text x="${pad.left - 6}" y="${pad.top + 4}" text-anchor="end" class="chart-axis-text">${rawMax.toFixed(0)}</text>
        <text x="${pad.left - 6}" y="${(pad.top + plotH / 2 + 4).toFixed(1)}" text-anchor="end" class="chart-axis-text">${((rawMax + rawMin) / 2).toFixed(0)}</text>
        <text x="${pad.left - 6}" y="${height - pad.bottom}" text-anchor="end" class="chart-axis-text">${rawMin.toFixed(0)}</text>

        <!-- X Axis Labels -->
        <text x="${pad.left}" y="${height - 8}" text-anchor="start" class="chart-axis-text">Oldest (${points.length} samples)</text>
        <text x="${width - pad.right}" y="${height - 8}" text-anchor="end" class="chart-axis-text">Latest</text>

        <!-- Data Polyline & Nodes -->
        ${points.length > 1 ? `<polyline fill="none" stroke="${escapeHtml(strokeColor)}" stroke-width="2.2" points="${polylinePoints}" />` : ''}
        ${circles}
      </svg>
    </div>
  `;
}

/**
 * Renders side-by-side Temperature and Relative Humidity trend charts.
 *
 * @param {Array<object>} readingsNewestFirst - Readings returned by snapshot
 * @param {object} thresholds - Active threshold configuration
 * @returns {string} HTML markup
 */
export function renderTrendCharts(readingsNewestFirst = [], thresholds) {
  const chronological = [...readingsNewestFirst].slice(0, 25).reverse();

  const tempPoints = chronological.map((r) => ({
    value: r.temperatureC,
    isSimulated: r.isSimulated
  }));

  const humidityPoints = chronological.map((r) => ({
    value: r.humidityPct,
    isSimulated: r.isSimulated
  }));

  return `
    <div class="charts-grid">
      ${buildSingleSeriesSvg({
        title: 'Temperature Trend (°C)',
        unit: '°C',
        points: tempPoints,
        minNormal: thresholds.tempMinNormalC,
        maxNormal: thresholds.tempMaxNormalC,
        strokeColor: '#1d4ed8',
        yFloor: 10,
        yCeiling: 35
      })}
      ${buildSingleSeriesSvg({
        title: 'Relative Humidity Trend (% RH)',
        unit: '%',
        points: humidityPoints,
        minNormal: thresholds.humidityMinNormalPct,
        maxNormal: thresholds.humidityMaxNormalPct,
        strokeColor: '#0f766e',
        yFloor: 20,
        yCeiling: 80
      })}
    </div>
  `;
}
