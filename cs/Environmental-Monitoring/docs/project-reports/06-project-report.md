# H. Academic Project Report

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS)  
**Course Code:** 25CS2206E  
**Team Number:** [TEAM NUMBER]  
**Academic Scope:** CO1 (Cloud Fundamentals and Architecture) & CO2 (Compute, Virtualization and Scaling)

---

## 1. Introduction

Environmental conditions—specifically ambient temperature and relative humidity—exert a direct impact on human comfort, industrial process stability, electronic hardware longevity, and biological or pharmaceutical preservation. Historically, facility operators monitored indoor environments using standalone analogue or digital thermo-hygrometers checked manually at scheduled intervals. While inexpensive, manual observation cannot provide continuous surveillance, remote accessibility, or automated threshold classification.

In modern Cloud Infrastructure and Services engineering, environmental monitoring systems bridge local sensing devices with modular cloud-ready software tiers capable of validating, processing, storing, and visualising telemetry streams over standard network protocols. This project develops the foundational multi-tier software application and architectural documentation for **Environmental Monitoring using Temperature and Humidity Sensors**, adhering strictly to modular design principles so hardware sensors, microcontrollers, persistence engines, and cloud platforms remain configurable until confirmed by the project team.

---

## 2. Problem Statement

Conventional manual temperature and humidity monitoring exhibits critical operational shortcomings:

- **Observation Gaps:** Unattended intervals (nights, weekends, holidays) leave thermal or humidity excursions undetected until manual inspection resumes.
- **Delayed Response to Threshold Breaches:** Passive local displays cannot automatically classify warning vs critical states or maintain centralised status dashboards.
- **Transcription Inaccuracy:** Manual paper logs and spreadsheet entry suffer from human error, missing timestamps, and unit inconsistencies.
- **Architectural Rigidity in Early Prototypes:** Monolithic prototypes that hardcode specific sensor libraries, serial ports, credentials, and cloud vendor APIs are brittle and difficult to maintain when hardware or cloud targets change.

---

## 3. Objectives

1. Design a **modular multi-tier architecture** cleanly separating presentation, domain processing, data acquisition adapters, and persistence repositories.
2. Implement **vendor-neutral validation and unit normalisation** (°C and °F, % RH) with configurable physical plausibility bounds.
3. Develop a **configurable threshold monitoring engine** supporting normal, advisory warning, and critical alert classifications alongside statistical summaries (minimum, average, maximum).
4. Build a **clean, professional web dashboard** presenting KPI cards, native SVG time-series trend graphs, threshold configuration forms, and provenance-labelled logs.
5. Enforce **explicit simulation transparency**, ensuring synthetic readings used during software demonstration are unmistakably tagged as `SIMULATED`.
6. Document rigorous **CO1 and CO2 academic connections** covering multi-tier cloud architecture, service/deployment models, shared responsibility, compute sizing, container/serverless suitability, autoscaling, and purchasing models.

---

## 4. Proposed Methodology

The engineering methodology proceeds through six structured stages:

1. **Domain Contract Definition:** Establish canonical measurement attributes (`sensorId`, `zone`, `temperatureC`, `temperatureF`, `humidityPct`, `timestamp`, `isSimulated`, `source`) independent of physical sensor hardware.
2. **Core Module Implementation:** Build pure, testable JavaScript ES modules for environment configuration (`config.js`), payload validation (`readingValidator.js`), threshold classification (`thresholdMonitor.js`), pluggable sensor sources (`sensorAdapter.js`), and pluggable storage (`storageRepository.js`).
3. **Stateless API Tier Construction:** Expose RESTful HTTP endpoints (`src/server.js`) using Node.js built-in modules for ingestion, simulation, threshold updates, configuration inspection, and compute health monitoring.
4. **Modular Frontend Development:** Create reusable UI components (`metricCard.js`, `statusBadge.js`, `trendChart.js`, `readingsTable.js`, `thresholdForm.js`) styled for academic clarity and accessibility.
5. **Automated Software Verification:** Validate unit behaviour and HTTP API endpoints using automated test scripts under `tests/test-scripts/`.
6. **Architectural & CO1/CO2 Documentation:** Produce system diagrams, UI wireframes, and formal syllabus mappings under `docs/`.

---

## 5. Architecture

The system follows a **Three-Tier Architecture** with decoupled edge/persistence adapters:

- **Presentation Tier (`src/index.html`, `src/app.js`, `src/components/reusable/*`):** Renders KPI metrics, SVG trend plots with shaded normal operating bands, interactive demonstration/threshold controls, and provenance-tagged tabular logs.
- **Application / Compute Tier (`src/server.js`, `src/components/core/monitoringService.js`, `readingValidator.js`, `thresholdMonitor.js`):** Stateless HTTP service performing payload validation, unit conversion, severity classification, statistical aggregation, and health/memory reporting (`GET /api/health`).
- **Data & Acquisition Abstraction Tier (`src/components/core/sensorAdapter.js`, `storageRepository.js`):** Isolates data sources (`SimulatedSensorAdapter` vs `ExternalIngestAdapter`) and persistence (`InMemoryReadingRepository` bounded ring buffer, swappable for a future cloud database).

Refer to [`../architecture/system-architecture.md`](../architecture/system-architecture.md) and [`../diagrams/data-flow-architecture.svg`](../diagrams/data-flow-architecture.svg) for visual architecture diagrams.

---

## 6. Implementation Overview

- **Zero External Dependencies:** Built entirely with Node.js standard library modules and native browser ES6 modules + SVG, eliminating supply-chain bloat and simplifying future VM or container deployment.
- **Configurable Environment Settings:** `.env.example` and `config.js` manage network bindings (`HOST`, `PORT`), operating mode (`SIMULATION` vs `EXTERNAL_INGEST`), normal operating thresholds, validation bounds, ring-buffer size (`MAX_BUFFER_SIZE`), and optional ingestion authentication (`INGEST_API_TOKEN`).
- **Retroactive Threshold Re-Evaluation:** When an operator updates normal or critical thresholds via the UI or `PUT /api/thresholds`, all buffered readings are re-evaluated dynamically so summary statistics and status badges remain consistent.
- **Dual Execution Resilience:** The web UI communicates with the local HTTP API (`http://127.0.0.1:3000`) when started via `npm start`, and includes an automatic standalone client-side simulation fallback if hosted on a static file server.

---

## 7. Expected Results

 *(Note: Physical hardware and cloud deployment have not yet been executed; the outcomes below distinguish verified software behaviour from expected post-integration results.)*

### Verified Initial Software Capabilities
1. Validated ingestion of vendor-neutral JSON payloads over `POST /api/readings` with automatic °C/°F normalisation and rejection of malformed or out-of-bounds inputs (`HTTP 400`).
2. Accurate real-time classification of readings into `NORMAL`, `WARNING`, and `ALERT` severities across configurable temperature and humidity ranges.
3. Clear visual presentation of KPIs, SVG time-series charts, and tabular logs with mandatory `SIMULATED` vs `EXTERNAL INGEST` provenance badges.
4. Bounded memory footprint via ring-buffer eviction and live process telemetry at `GET /api/health`.

### Expected Post-Hardware & Cloud Integration Outcomes
1. Seamless transmission of real ambient temperature and humidity readings from the team's chosen microcontroller to `POST /api/readings` in `EXTERNAL_INGEST` mode without modifying validation or UI modules.
2. Persistent multi-day historical retention once a concrete cloud database repository is plugged into `ReadingRepository`.

---

## 8. Conclusion

This initial phase establishes a clean, modular, well-documented software foundation for **Environmental Monitoring using Temperature and Humidity Sensors**. By strictly separating presentation, stateless processing, sensor ingestion contracts, and storage repositories—while avoiding premature hardware or vendor lock-in—the project satisfies professional software engineering standards and demonstrates practical alignment with **CDIS CO1 (Cloud Fundamentals and Architecture)** and **CO2 (Compute, Virtualization and Scaling)**. The codebase is ready for immediate faculty demonstration in clearly labelled simulation mode and seamless team extension once physical hardware and cloud infrastructure decisions are finalised.

---

## 9. Pending Decisions Summary

- **Team Identification:** Team number, member names, and student IDs (`README.md`).
- **Sensing Hardware:** Specific temperature/humidity sensor model and microcontroller/gateway board.
- **Cloud & Persistence Selection:** Target cloud provider, compute hosting model (VM / Container / Serverless), and persistent database engine.

Full details are maintained in [`07-pending-decisions.md`](07-pending-decisions.md).

---

## 10. References

1. Mell, P., & Grance, T. (2011). *The NIST Definition of Cloud Computing* (SP 800-145). NIST.
2. ASHRAE. (2021). *Thermal Environmental Conditions for Human Occupancy* (ANSI/ASHRAE Standard 55).
3. Erl, T., Puttini, R., & Mahmood, Z. (2013). *Cloud Computing: Concepts, Technology & Architecture*. Prentice Hall.
4. Burns, B., Beda, J., & Hightower, K. (2022). *Kubernetes: Up and Running* (3rd ed.). O'Reilly Media.
5. Wiggins, A. (2017). *The Twelve-Factor App*. https://12factor.net/
6. Course Specification: *Cloud Infrastructure and Services (25CS2206E)* — CO1 & CO2 Syllabus Units.
