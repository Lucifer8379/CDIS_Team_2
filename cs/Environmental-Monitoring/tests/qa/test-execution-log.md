# Test Execution Report

**Project:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## 1. Automated Software Test Suite Summary

Command executed from `Environmental-Monitoring/`:

```bash
npm test
```
*(Executes `node --test tests/test-scripts/*.test.js` — Verified result: **12 tests executed, 12 passed, 0 failed**)*

| Test Suite File | Scope Verified | Status |
| :--- | :--- | :--- |
| `tests/test-scripts/readingValidator.test.js` | °C/°F conversion, valid JSON normalisation, simulation provenance flags, rejection of invalid/out-of-bounds readings | Verified (Software) |
| `tests/test-scripts/thresholdMonitor.test.js` | `NORMAL`/`WARNING`/`ALERT` classification, threshold update validation, min/max/avg summary calculation | Verified (Software) |
| `tests/test-scripts/monitoringService.test.js` | Mandatory `isSimulated: true` tagging, `EXTERNAL_INGEST` simulation lock, ring-buffer FIFO eviction, retroactive re-evaluation | Verified (Software) |
| `tests/test-scripts/apiServer.test.js` | Ephemeral HTTP server startup, `/api/health`, token sanitisation on `/api/config`, `401`/`201` ingestion auth, `/api/simulate`, and HTML serving | Verified (Software) |

---

## 2. Important Disclosure on Hardware & Cloud Testing

- **Hardware Sensor Testing:** **Not conducted.** Physical temperature and humidity sensors and microcontrollers have not yet been finalised or connected by the team.
- **Cloud Deployment Testing:** **Not conducted.** No paid or commercial cloud resources have been provisioned in this initial software phase.
