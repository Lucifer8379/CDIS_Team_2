/**
 * @file metricCard.js
 * @description Reusable summary KPI card component for displaying environmental
 * metrics, statistical bounds, and data provenance indicators.
 */

import { escapeHtml } from './formatters.js';

/**
 * Renders a structured dashboard metric card.
 *
 * @param {object} props
 * @param {string} props.title - Card heading
 * @param {string} props.primaryValue - Main formatted value
 * @param {string} [props.secondaryValue] - Optional secondary unit or subtitle
 * @param {string} [props.iconPath] - Relative path to SVG icon in `src/assets/icons/`
 * @param {string} [props.footerHtml] - Pre-escaped HTML for card footer metadata
 * @param {string} [props.badgeHtml] - Pre-escaped HTML badge
 * @returns {string} HTML markup
 */
export function renderMetricCard({
  title,
  primaryValue,
  secondaryValue = '',
  iconPath = '',
  footerHtml = '',
  badgeHtml = ''
}) {
  const iconMarkup = iconPath
    ? `<img src="${escapeHtml(iconPath)}" alt="" class="metric-card__icon" width="24" height="24" />`
    : '';

  return `
    <article class="metric-card">
      <div class="metric-card__header">
        <div class="metric-card__title-group">
          ${iconMarkup}
          <h3 class="metric-card__title">${escapeHtml(title)}</h3>
        </div>
        ${badgeHtml}
      </div>
      <div class="metric-card__body">
        <p class="metric-card__value">${escapeHtml(primaryValue)}</p>
        ${secondaryValue ? `<p class="metric-card__subvalue">${escapeHtml(secondaryValue)}</p>` : ''}
      </div>
      ${footerHtml ? `<div class="metric-card__footer">${footerHtml}</div>` : ''}
    </article>
  `;
}
