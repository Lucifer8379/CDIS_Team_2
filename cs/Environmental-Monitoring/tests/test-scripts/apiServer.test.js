/**
 * @file apiServer.test.js
 * @description End-to-end HTTP integration tests verifying REST endpoints,
 * secret-token sanitisation, authentication guards, and static dashboard serving.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../../src/components/core/config.js';
import { createAppServer } from '../../src/server.js';

test('HTTP server exposes health, sanitised config, simulation, ingestion, and UI routes', async (t) => {
  const customConfig = loadConfig({
    HOST: '127.0.0.1',
    PORT: '0',
    MONITORING_MODE: 'SIMULATION',
    MAX_BUFFER_SIZE: '20',
    INGEST_API_TOKEN: 'test-token-not-real'
  });

  const { server } = createAppServer({ config: customConfig, seedDemoData: false });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // 1. Health check endpoint
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const healthBody = await healthRes.json();
  assert.equal(healthBody.status, 'ok');
  assert.ok(typeof healthBody.computeMetrics.rssMemoryMB === 'number');

  // 2. Public config endpoint must NOT expose secret token value
  const cfgRes = await fetch(`${baseUrl}/api/config`);
  assert.equal(cfgRes.status, 200);
  const cfgBody = await cfgRes.json();
  assert.equal(cfgBody.security.requiresIngestToken, true);
  assert.equal(cfgBody.security.ingestApiToken, undefined);

  // 3. Unauthorised POST /api/readings rejected with 401
  const unauthRes = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperatureC: 24.2, humidityPct: 51.0 })
  });
  assert.equal(unauthRes.status, 401);

  // 4. Authorised POST /api/readings succeeds with 201
  const authRes = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token-not-real'
    },
    body: JSON.stringify({
      sensorId: 'INTEGRATION-NODE-01',
      zone: 'QA Lab',
      temperatureC: 24.2,
      humidityPct: 51.0,
      isSimulated: false
    })
  });
  assert.equal(authRes.status, 201);
  const authBody = await authRes.json();
  assert.equal(authBody.record.isSimulated, false);

  // 5. POST /api/simulate generates explicitly labelled simulated record
  const simRes = await fetch(`${baseUrl}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'high_temp' })
  });
  assert.equal(simRes.status, 201);
  const simBody = await simRes.json();
  assert.equal(simBody.record.isSimulated, true);

  // 6. Static dashboard root returns HTML
  const htmlRes = await fetch(`${baseUrl}/`);
  assert.equal(htmlRes.status, 200);
  const htmlText = await htmlRes.text();
  assert.ok(htmlText.includes('Environmental Monitoring using Temperature and Humidity Sensors'));
});
