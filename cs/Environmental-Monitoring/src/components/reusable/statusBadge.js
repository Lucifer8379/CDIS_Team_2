/**
 * @file statusBadge.js
 * @description Reusable badge component for rendering environmental condition
 * severity and data-origin provenance (Simulated vs External Ingest).
 */

import { escapeHtml, formatStateLabel } from './formatters.js';

/**
 * Renders a semantic severity badge (`NORMAL`, `WARNING`, `ALERT`).
 * @param {string} severity
 * @param {string} [customLabel]
 * @returns {string} HTML markup
 */
export function renderSeverityBadge(severity = 'NORMAL', customLabel) {
  const normalised = ['NORMAL', 'WARNING', 'ALERT'].includes(severity) ? severity : 'NORMAL';
  const cssModifier = normalised.toLowerCase();
  const label = customLabel || formatStateLabel(normalised);

  return `<span class="badge badge--${escapeHtml(cssModifier)}">${escapeHtml(label)}</span>`;
}

/**
 * Renders an explicit provenance badge distinguishing simulated demonstration
 * readings from external sensor ingestion.
 *
 * @param {boolean} isSimulated
 * @returns {string} HTML markup
 */
export function renderOriginBadge(isSimulated) {
  if (isSimulated) {
    return '<span class="badge badge--simulated" title="Synthetic software value generated for demonstration">SIMULATED</span>';
  }
  return '<span class="badge badge--ingested" title="Received via external sensor ingestion interface">EXTERNAL INGEST</span>';
}
