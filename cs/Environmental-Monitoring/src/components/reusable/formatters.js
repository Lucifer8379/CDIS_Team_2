/**
 * @file formatters.js
 * @description Reusable formatting and HTML-escaping helpers shared across
 * presentation components.
 */

const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
});

/**
 * Escapes untrusted strings prior to HTML interpolation.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Formats temperature in Celsius (with optional Fahrenheit secondary label).
 * @param {number | null | undefined} tempC
 * @param {number | null | undefined} [tempF]
 * @returns {string}
 */
export function formatTemperature(tempC, tempF) {
  if (typeof tempC !== 'number' || !Number.isFinite(tempC)) {
    return '—';
  }
  const cStr = `${tempC.toFixed(1)} °C`;
  if (typeof tempF === 'number' && Number.isFinite(tempF)) {
    return `${cStr} (${tempF.toFixed(1)} °F)`;
  }
  return cStr;
}

/**
 * Formats relative humidity percentage.
 * @param {number | null | undefined} humidityPct
 * @returns {string}
 */
export function formatHumidity(humidityPct) {
  if (typeof humidityPct !== 'number' || !Number.isFinite(humidityPct)) {
    return '—';
  }
  return `${humidityPct.toFixed(1)} % RH`;
}

/**
 * Formats an ISO-8601 timestamp into a concise, readable local date-time string.
 * @param {string | null | undefined} isoString
 * @returns {string}
 */
export function formatTimestamp(isoString) {
  if (!isoString) {
    return '—';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid timestamp';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Maps internal state identifiers to readable academic labels.
 * @param {string} stateCode
 * @returns {string}
 */
export function formatStateLabel(stateCode) {
  const labels = {
    NORMAL: 'Normal Range',
    WARNING: 'Advisory Warning',
    ALERT: 'Critical Alert',
    LOW_WARNING: 'Below Normal',
    HIGH_WARNING: 'Above Normal',
    LOW_ALERT: 'Critically Low',
    HIGH_ALERT: 'Critically High'
  };
  return labels[stateCode] || String(stateCode || 'Unknown');
}
