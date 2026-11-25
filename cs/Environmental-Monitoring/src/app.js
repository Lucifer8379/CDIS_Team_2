/**
 * @file app.js
 * @description Presentation-tier controller coordinating API communication
 * (with automatic client-side simulation fallback when hosted statically)
 * and rendering modular UI components.
 */

import { MonitoringService } from './components/core/monitoringService.js';
import {
  escapeHtml,
  formatHumidity,
  formatTemperature,
  formatTimestamp
} from './components/reusable/formatters.js';
import { renderMetricCard } from './components/reusable/metricCard.js';
import { renderReadingsTable } from './components/reusable/readingsTable.js';
import { renderOriginBadge, renderSeverityBadge } from './components/reusable/statusBadge.js';
import { renderThresholdFields } from './components/reusable/thresholdForm.js';
import { renderTrendCharts } from './components/reusable/trendChart.js';

const state = {
  backendConnected: false,
  localFallbackService: null,
  snapshot: null,
  autoSimTimer: null,
  thresholdsInitialised: false
};

function showFeedback(message, type = 'info') {
  const banner = document.getElementById('status-feedback');
  if (!banner) return;
  banner.textContent = message;
  banner.className = `status-feedback status-feedback--visible status-feedback--${type}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(payload.details) ? payload.details.join(' ') : payload.error;
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return payload;
}

async function initialiseDataSource() {
  try {
    const snapshot = await apiRequest('/api/readings?limit=50');
    state.backendConnected = true;
    state.snapshot = snapshot;
  } catch {
    // Graceful standalone browser mode if static server without Node API is used
    state.backendConnected = false;
    state.localFallbackService = new MonitoringService({ mode: 'SIMULATION' });
    state.localFallbackService.seedInitialSimulation(6);
    state.snapshot = state.localFallbackService.getSnapshot(50);
  }
}

function renderDashboard() {
  const snap = state.snapshot;
  if (!snap) return;

  // Update header pills
  const modePill = document.getElementById('header-mode-pill');
  const runtimePill = document.getElementById('header-runtime-pill');
  if (modePill) {
    modePill.textContent =
      snap.mode === 'SIMULATION' ? 'Mode: Simulated Demonstration' : 'Mode: External Sensor Ingest';
  }
  if (runtimePill) {
    runtimePill.textContent = state.backendConnected
      ? 'Tier Connection: Local HTTP API Active'
      : 'Tier Connection: Browser Standalone Fallback';
  }

  // Update disclosure banner visibility
  const disclosureEl = document.getElementById('simulation-disclosure');
  if (disclosureEl) {
    const hasSim = snap.mode === 'SIMULATION' || snap.summary.simulatedCount > 0;
    disclosureEl.style.display = hasSim ? 'block' : 'none';
  }

  const latest = snap.latestReading;
  const sum = snap.summary;

  // Render 4 KPI Metric Cards
  const metricsContainer = document.getElementById('metrics-grid');
  if (metricsContainer) {
    const tempCard = renderMetricCard({
      title: 'Temperature',
      primaryValue: latest ? `${latest.temperatureC.toFixed(1)} °C` : '—',
      secondaryValue: latest ? `${latest.temperatureF.toFixed(1)} °F` : 'Awaiting sample',
      iconPath: './assets/icons/thermometer.svg',
      badgeHtml: latest ? renderOriginBadge(latest.isSimulated) : '',
      footerHtml:
        sum.count > 0
          ? `Min: <strong>${sum.temperature.min} °C</strong> &middot; Avg: <strong>${sum.temperature.avg} °C</strong> &middot; Max: <strong>${sum.temperature.max} °C</strong>`
          : 'No buffered samples'
    });

    const humidityCard = renderMetricCard({
      title: 'Relative Humidity',
      primaryValue: latest ? formatHumidity(latest.humidityPct) : '—',
      secondaryValue: latest ? `Zone: ${latest.zone}` : 'Awaiting sample',
      iconPath: './assets/icons/humidity.svg',
      badgeHtml: latest ? renderOriginBadge(latest.isSimulated) : '',
      footerHtml:
        sum.count > 0
          ? `Min: <strong>${sum.humidity.min}%</strong> &middot; Avg: <strong>${sum.humidity.avg}%</strong> &middot; Max: <strong>${sum.humidity.max}%</strong>`
          : 'No buffered samples'
    });

    const statusSeverity = latest?.evaluation?.overallSeverity || 'NORMAL';
    const conditionCard = renderMetricCard({
      title: 'Environmental Status',
      primaryValue: latest ? statusSeverity : 'STANDBY',
      secondaryValue: latest
        ? latest.evaluation.advisoryMessage
        : 'System ready to evaluate incoming measurements.',
      iconPath: './assets/icons/status-shield.svg',
      badgeHtml: latest ? renderSeverityBadge(statusSeverity) : '',
      footerHtml: `Normal: <strong>${sum.statusBreakdown.NORMAL}</strong> &middot; Warning: <strong>${sum.statusBreakdown.WARNING}</strong> &middot; Alert: <strong>${sum.statusBreakdown.ALERT}</strong>`
    });

    const bufferCard = renderMetricCard({
      title: 'Buffer & Provenance',
      primaryValue: `${snap.storage.bufferedCount} / ${snap.storage.maxBufferSize}`,
      secondaryValue: `Buffer Utilisation: ${snap.storage.utilizationPct}%`,
      iconPath: './assets/icons/sensor-node.svg',
      footerHtml: `Simulated: <strong>${sum.simulatedCount}</strong> &middot; External Ingest: <strong>${sum.ingestedCount}</strong>`
    });

    metricsContainer.innerHTML = tempCard + humidityCard + conditionCard + bufferCard;
  }

  // Render Trend Charts
  const chartsContainer = document.getElementById('charts-container');
  if (chartsContainer) {
    chartsContainer.innerHTML = renderTrendCharts(snap.readings, snap.thresholds);
  }

  // Render Threshold Form Fields (initialise or refresh)
  const thresholdFields = document.getElementById('threshold-fields');
  if (thresholdFields && !state.thresholdsInitialised) {
    thresholdFields.innerHTML = renderThresholdFields(snap.thresholds);
    state.thresholdsInitialised = true;
  }

  // Render Readings Log Table
  const tableContainer = document.getElementById('readings-table-container');
  if (tableContainer) {
    tableContainer.innerHTML = renderReadingsTable(snap.readings);
  }

  const lastUpdatedEl = document.getElementById('last-updated-label');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = latest
      ? `Latest sample timestamp: ${formatTimestamp(latest.timestamp)} (${escapeHtml(formatTemperature(latest.temperatureC))})`
      : 'Buffer empty';
  }
}

async function handleGenerateSimulated(scenario = 'normal') {
  try {
    if (state.backendConnected) {
      const res = await apiRequest('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({ scenario })
      });
      state.snapshot = res.snapshot;
    } else {
      const res = state.localFallbackService.generateSimulatedReading({ scenario });
      if (!res.ok) throw new Error(res.errors.join(' '));
      state.snapshot = state.localFallbackService.getSnapshot(50);
    }
    renderDashboard();
    showFeedback(`Generated labelled simulated sample (profile: ${scenario}).`, 'info');
  } catch (err) {
    showFeedback(err.message, 'error');
  }
}

async function handleManualIngestSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const payload = {
    sensorId: String(formData.get('sensorId') || '').trim() || 'MANUAL-TEST-INPUT',
    zone: String(formData.get('zone') || '').trim() || 'Test Zone',
    temperatureC: Number(formData.get('temperatureC')),
    humidityPct: Number(formData.get('humidityPct')),
    isSimulated: formData.get('originType') === 'simulated'
  };

  try {
    if (state.backendConnected) {
      await apiRequest('/api/readings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      state.snapshot = await apiRequest('/api/readings?limit=50');
    } else {
      const res = state.localFallbackService.ingestReading(payload);
      if (!res.ok) throw new Error(res.errors.join(' '));
      state.snapshot = state.localFallbackService.getSnapshot(50);
    }
    renderDashboard();
    showFeedback(
      `Recorded ${payload.isSimulated ? 'simulated' : 'external test'} payload (${payload.temperatureC} °C, ${payload.humidityPct}% RH).`,
      'info'
    );
  } catch (err) {
    showFeedback(err.message, 'error');
  }
}

async function handleThresholdsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const candidate = Object.fromEntries(formData.entries());

  try {
    if (state.backendConnected) {
      const res = await apiRequest('/api/thresholds', {
        method: 'PUT',
        body: JSON.stringify(candidate)
      });
      state.snapshot = res.snapshot;
    } else {
      const res = state.localFallbackService.updateThresholds(candidate);
      if (!res.ok) throw new Error(res.errors.join(' '));
      state.snapshot = state.localFallbackService.getSnapshot(50);
    }
    state.thresholdsInitialised = false;
    renderDashboard();
    showFeedback('Advisory thresholds updated and buffered measurements re-evaluated.', 'info');
  } catch (err) {
    showFeedback(err.message, 'error');
  }
}

async function handleClearBuffer() {
  try {
    if (state.backendConnected) {
      const res = await apiRequest('/api/readings', { method: 'DELETE' });
      state.snapshot = res.snapshot;
    } else {
      state.localFallbackService.clearReadings();
      state.snapshot = state.localFallbackService.getSnapshot(50);
    }
    renderDashboard();
    showFeedback('Session reading buffer cleared.', 'info');
  } catch (err) {
    showFeedback(err.message, 'error');
  }
}

function toggleAutoSimulation(buttonEl) {
  if (state.autoSimTimer) {
    clearInterval(state.autoSimTimer);
    state.autoSimTimer = null;
    buttonEl.textContent = 'Start 5s Demo Auto-Sample';
    showFeedback('Periodic demonstration sampling paused.', 'info');
  } else {
    state.autoSimTimer = setInterval(() => {
      handleGenerateSimulated('normal');
    }, 5000);
    buttonEl.textContent = 'Stop 5s Demo Auto-Sample';
    showFeedback('Started periodic simulated sampling every 5 seconds.', 'info');
  }
}

function bindEvents() {
  document.querySelectorAll('[data-sim-scenario]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleGenerateSimulated(btn.getAttribute('data-sim-scenario'));
    });
  });

  const autoBtn = document.getElementById('btn-toggle-autosim');
  if (autoBtn) {
    autoBtn.addEventListener('click', () => toggleAutoSimulation(autoBtn));
  }

  const clearBtn = document.getElementById('btn-clear-buffer');
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearBuffer);
  }

  const ingestForm = document.getElementById('manual-ingest-form');
  if (ingestForm) {
    ingestForm.addEventListener('submit', handleManualIngestSubmit);
  }

  const thresholdForm = document.getElementById('threshold-config-form');
  if (thresholdForm) {
    thresholdForm.addEventListener('submit', handleThresholdsSubmit);
  }
}

async function bootstrap() {
  await initialiseDataSource();
  bindEvents();
  renderDashboard();
}

bootstrap();
