/**
 * @file server.js
 * @description Lightweight, zero-dependency HTTP server implementing the
 * Application/API tier and serving the Presentation tier from `src/`.
 *
 * Designed for stateless execution and configurable deployment (CO1 Multi-Tier
 * Architecture & CO2 Compute/Container/VM readiness).
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { getPublicConfig, loadConfig } from './components/core/config.js';
import { MonitoringService } from './components/core/monitoringService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_ROOT = path.resolve(__dirname);

const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
});

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

async function readJsonBody(req, maxBytes = 32_768) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error('Request payload exceeds maximum allowed size (32 KB).');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('Malformed JSON request body.');
    err.statusCode = 400;
    throw err;
  }
}

function isAuthorisedForIngest(req, ingestApiToken) {
  if (!ingestApiToken) {
    return true;
  }
  const authHeader = req.headers.authorization || '';
  const customHeader = req.headers['x-ingest-token'] || '';
  if (authHeader === `Bearer ${ingestApiToken}` || customHeader === ingestApiToken) {
    return true;
  }
  return false;
}

/**
 * Creates a configured HTTP server instance without binding to a port automatically,
 * enabling clean integration testing as well as standalone execution.
 *
 * @param {object} [options]
 * @param {object} [options.config] - Pre-loaded configuration object
 * @param {boolean} [options.seedDemoData=true] - Seed simulated readings when in SIMULATION mode
 * @returns {{ server: http.Server, service: MonitoringService, config: object }}
 */
export function createAppServer(options = {}) {
  const config = options.config || loadConfig();
  const service = new MonitoringService({
    mode: config.mode,
    thresholds: config.thresholds,
    validationBounds: config.validationBounds,
    maxBufferSize: config.storage.maxBufferSize
  });

  if (options.seedDemoData !== false && config.mode === 'SIMULATION') {
    service.seedInitialSimulation(6);
  }

  const startedAt = Date.now();

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = requestUrl.pathname;
      const method = (req.method || 'GET').toUpperCase();

      // --- Health & Compute Utilisation Endpoint (CO2 Observability) ---
      if (pathname === '/api/health' && method === 'GET') {
        const mem = process.memoryUsage();
        return sendJson(res, 200, {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
          mode: config.mode,
          computeMetrics: {
            nodeVersion: process.version,
            platform: process.platform,
            cpuLogicalCores: os.cpus().length,
            rssMemoryMB: Number((mem.rss / (1024 * 1024)).toFixed(2)),
            heapUsedMB: Number((mem.heapUsed / (1024 * 1024)).toFixed(2))
          },
          bufferMetrics: service.repository.getStats()
        });
      }

      // --- Public Configuration Endpoint ---
      if (pathname === '/api/config' && method === 'GET') {
        return sendJson(res, 200, getPublicConfig({
          ...config,
          thresholds: service.thresholds
        }));
      }

      // --- Query Environmental Readings ---
      if (pathname === '/api/readings' && method === 'GET') {
        const limitParam = Number(requestUrl.searchParams.get('limit') || 50);
        const limit = Number.isFinite(limitParam) ? limitParam : 50;
        return sendJson(res, 200, service.getSnapshot(limit));
      }

      // --- Ingest External or Test Environmental Reading ---
      if (pathname === '/api/readings' && method === 'POST') {
        if (!isAuthorisedForIngest(req, config.security.ingestApiToken)) {
          return sendJson(res, 401, {
            error: 'Unauthorised ingestion request. Provide a valid ingestion token.'
          });
        }
        const body = await readJsonBody(req);
        const result = service.ingestReading({
          ...body,
          isSimulated: Boolean(body.isSimulated)
        });
        if (!result.ok) {
          return sendJson(res, 400, {
            error: 'Validation failed for environmental reading.',
            details: result.errors
          });
        }
        return sendJson(res, 201, {
          message: 'Environmental reading recorded.',
          record: result.record
        });
      }

      // --- Clear Buffered Session Readings ---
      if (pathname === '/api/readings' && method === 'DELETE') {
        service.clearReadings();
        return sendJson(res, 200, {
          message: 'In-memory reading buffer cleared.',
          snapshot: service.getSnapshot(50)
        });
      }

      // --- Trigger Clearly Labelled Simulated Reading ---
      if (pathname === '/api/simulate' && method === 'POST') {
        const body = await readJsonBody(req);
        const result = service.generateSimulatedReading({
          scenario: body.scenario || 'normal',
          zone: body.zone
        });
        if (!result.ok) {
          return sendJson(res, 403, {
            error: 'Simulated sample generation unavailable.',
            details: result.errors
          });
        }
        return sendJson(res, 201, {
          message: 'Simulated demonstration reading generated.',
          record: result.record,
          snapshot: service.getSnapshot(50)
        });
      }

      // --- Update Configurable Thresholds ---
      if (pathname === '/api/thresholds' && method === 'PUT') {
        const body = await readJsonBody(req);
        const result = service.updateThresholds(body);
        if (!result.ok) {
          return sendJson(res, 400, {
            error: 'Invalid threshold configuration.',
            details: result.errors
          });
        }
        return sendJson(res, 200, {
          message: 'Thresholds updated and buffered readings re-evaluated.',
          thresholds: result.thresholds,
          snapshot: service.getSnapshot(50)
        });
      }

      // --- Unknown API Route ---
      if (pathname.startsWith('/api/')) {
        return sendJson(res, 404, { error: `API endpoint not found: ${method} ${pathname}` });
      }

      // --- Static Presentation Tier Serving (from src/) ---
      if (method !== 'GET' && method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Method Not Allowed');
      }

      const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const resolvedPath = path.resolve(SRC_ROOT, relativePath);

      // Prevent directory traversal outside `src/` and hide server.js source if not needed
      if (!resolvedPath.startsWith(SRC_ROOT + path.sep) && resolvedPath !== path.join(SRC_ROOT, 'index.html')) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Forbidden');
      }

      const stat = await fs.stat(resolvedPath).catch(() => null);
      if (!stat || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not Found');
      }

      const ext = path.extname(resolvedPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await fs.readFile(resolvedPath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(method === 'HEAD' ? undefined : content);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return sendJson(res, statusCode, {
        error: statusCode === 500 ? 'Internal server error.' : error.message
      });
    }
  });

  return { server, service, config };
}

// Execute server if launched directly via `node src/server.js`
const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  const { server, config } = createAppServer();
  server.listen(config.port, config.host, () => {
    const bound = server.address();
    const actualPort = typeof bound === 'object' && bound ? bound.port : config.port;
    console.log('==================================================================');
    console.log(' Environmental Monitoring using Temperature and Humidity Sensors');
    console.log(' Course: Cloud Infrastructure and Services (CDIS - 25CS2206E)');
    console.log('------------------------------------------------------------------');
    console.log(` Local Dashboard URL : http://${config.host}:${actualPort}`);
    console.log(` Operating Mode      : ${config.mode}`);
    console.log(' Hardware Status     : Pending confirmation (modular adapter active)');
    console.log('==================================================================');
  });
}
