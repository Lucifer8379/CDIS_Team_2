# A. Project Abstract

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## Abstract

Accurate and continuous monitoring of ambient temperature and relative humidity is critical in environments such as academic and research laboratories, data centres, pharmaceutical storage rooms, agricultural greenhouses, and archival facilities. Variations outside acceptable thermal or hygrometric ranges can degrade sensitive electronic equipment, spoil perishable inventory, invalidate experimental conditions, and reduce occupant safety. Traditional manual monitoring relies on periodic visual readings of standalone thermometers and hygrometers followed by manual logbook entry—a process susceptible to observation gaps, delayed anomaly awareness, transcription mistakes, and lack of remote visibility.

This project designs and implements a clean, modular, cloud-ready software system for **Environmental Monitoring using Temperature and Humidity Sensors**. Rather than prematurely binding the codebase to an unconfirmed sensor IC, microcontroller board, database engine, or commercial cloud vendor, the system employs a decoupled **Multi-Tier Architecture** comprising:

1. **A Pluggable Data Acquisition & Ingestion Layer** (`sensorAdapter.js` and `POST /api/readings`) that accepts vendor-neutral JSON measurements containing temperature and relative humidity values alongside node and zone metadata.
2. **A Stateless Application & Processing Layer** (`readingValidator.js`, `thresholdMonitor.js`, `monitoringService.js`, and `server.js`) that enforces physical plausibility checks, normalises temperature scales (°C and °F), evaluates measurements against runtime-configurable normal, warning, and critical alert bounds, and computes statistical summaries.
3. **A Pluggable Persistence Layer** (`storageRepository.js`) backed initially by a bounded in-memory ring buffer so persistence can transition cleanly to a relational, document, or time-series cloud database once finalised.
4. **A Modular Web Presentation Tier** (`index.html`, `app.js`, and reusable UI components) providing KPI summary cards, SVG time-series trend visualisations, runtime threshold controls, and a provenance-aware measurement log.

Until physical sensing hardware is connected, the application supports an explicitly disclosed **Simulated Demonstration Mode**, stamping every synthetic sample as `SIMULATED` so software testing and academic demonstrations remain transparent and verifiable. Academically, the system serves as a practical reference case for **CO1 (Cloud Fundamentals and Architecture)** and **CO2 (Compute, Virtualization and Scaling)** by demonstrating multi-tier separation, externalised configuration, stateless compute execution, and resource-aware workload design.
