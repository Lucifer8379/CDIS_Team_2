# C. Project Objectives

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## Primary Objectives

1. **Establish a Clean Multi-Tier Application Structure**  
   Design and implement separated Presentation, Application/Processing, Sensor Ingestion, and Storage Repository layers so each tier can evolve, scale, and be tested independently.

2. **Implement Vendor-Neutral Measurement Collection and Validation**  
   Define a hardware-agnostic JSON telemetry contract supporting temperature (°C/°F) and relative humidity (% RH) readings, enforcing type safety, timestamp validity, and configurable physical plausibility bounds.

3. **Build Configurable Threshold & Condition Monitoring**  
   Classify incoming environmental measurements into `NORMAL`, `WARNING` (low/high advisory), and `ALERT` (critical excursion) states using runtime-configurable operating thresholds without hardcoded constants.

4. **Provide Clear Visualisation and Statistical Aggregation**  
   Display real-time environmental KPIs, rolling statistical summaries (minimum, maximum, arithmetic mean), SVG time-series trend charts with normal operating bands, and a structured measurement log.

5. **Guarantee Data Provenance and Honest Simulation Labelling**  
   Support a dedicated `SIMULATION` mode for software demonstration and verification in which every generated sample is explicitly tagged as `SIMULATED` and clearly distinguished from `EXTERNAL INGEST` data.

6. **Ensure Security and Configuration Hygiene**  
   Externalise operational settings (port, mode, thresholds, buffer capacity, optional ingestion token) via environment variables and `.gitignore` rules so credentials and secret files are never hardcoded or committed.

7. **Map System Design to CDIS CO1 and CO2 Concepts**  
   Demonstrate and document how environmental telemetry workloads relate to Cloud Fundamentals and Architecture (**CO1**) and Compute, Virtualization, Sizing, Containers, Autoscaling, and Serverless Models (**CO2**).
