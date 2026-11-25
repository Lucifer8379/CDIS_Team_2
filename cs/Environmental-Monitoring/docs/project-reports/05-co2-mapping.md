# G. CO2 Academic Mapping — Compute, Virtualization and Scaling

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)  
**Scoped Outcome:** CO2 – Compute, Virtualization and Scaling

---

## 1. Compute Instances and Virtual Machines

When deploying the Application Tier (`src/server.js`) to cloud infrastructure, a **Virtual Machine (Compute Instance)** is the most direct hosting model:

- The Node.js HTTP service listens on configurable `HOST` and `PORT` environment variables.
- Because the codebase relies solely on Node.js standard library modules (`node:http`, `node:fs`, `node:os`, `node:path`), provisioning a VM requires minimal bootstrap steps (installing the Node.js LTS runtime and copying `src/` and `package.json`), reducing boot latency and attack surface.

---

## 2. Compute Sizing and Resource Utilisation

Right-sizing compute resources requires understanding the workload profile of temperature and relative humidity monitoring:

### Workload Profile Analysis
- **Payload Size:** Each JSON telemetry reading is approximately `180–300 bytes`.
- **CPU Characteristic:** Validation (`readingValidator.js`) and threshold comparison (`thresholdMonitor.js`) execute in sub-millisecond $O(1)$ time per sample.
- **Memory Characteristic:** Without bounds, in-memory arrays eventually exhaust heap memory (`Out-Of-Memory`). To prevent memory leaks and maintain predictable RAM consumption, `InMemoryReadingRepository` implements a **bounded FIFO ring buffer** (`MAX_BUFFER_SIZE=100` by default).

### Built-In Resource Observability (`GET /api/health`)
To support empirical compute sizing rather than guesswork, `src/server.js` exposes `GET /api/health`, reporting:
- Process Resident Set Size (`rssMemoryMB`) and V8 Heap usage (`heapUsedMB`),
- Logical CPU core count and uptime,
- Ring-buffer occupancy (`bufferedCount`, `maxBufferSize`, `utilizationPct`).

For typical academic or single-building deployments (e.g., 1–50 sensor nodes reporting every 10–60 seconds), a **micro/burstable compute instance** (e.g., 1–2 vCPUs, 0.5–1 GB RAM) provides substantial headroom while preventing over-provisioning waste.

---

## 3. Containers and Docker Readiness

Although no Dockerfile is prematurely forced before deployment decisions are finalised, the application was engineered to be **container-ready by design**:

- **Zero Native Compilation Dependencies:** Pure ES modules with zero C++ add-ons ensure tiny, fast-building container images on minimal base images (such as Alpine or Distroless Node).
- **Environment-Driven Runtime:** Container runtime flags (`-e PORT=3000 -e MONITORING_MODE=EXTERNAL_INGEST`) configure behaviour cleanly without baking secrets into image layers.
- **Standard Output Logging:** Startup diagnostics write directly to `stdout` rather than local log files.

---

## 4. Kubernetes Fundamentals (Conceptual Scaling Path)

If the monitoring system were scaled from a single laboratory to an enterprise or multi-campus deployment (thousands of sensor nodes across dozens of buildings), **Kubernetes** concepts map naturally onto our architecture:

- **Pods & Deployments:** Stateless replicas of `src/server.js` packaged in containers and managed declaratively via a `Deployment`.
- **Liveness & Readiness Probes:** Kubernetes kubelet probes can query `GET /api/health` (`200 OK`) directly to detect stalled processes and route traffic only to healthy pods.
- **ConfigMaps & Secrets:** Threshold settings (`TEMP_MIN_NORMAL_C`, `HUMIDITY_MAX_NORMAL_PCT`) map to a `ConfigMap`, while `INGEST_API_TOKEN` maps to a Kubernetes `Secret`.
- **Prerequisite Note:** Before running multiple horizontal Pod replicas (`replicas > 1`), `InMemoryReadingRepository` must be swapped for an external shared database adapter so all replicas read and write a unified state.

---

## 5. Autoscaling (Vertical vs Horizontal)

| Scaling Strategy | Mechanism | Suitability for Environmental Monitoring |
| :--- | :--- | :--- |
| **Vertical Scaling (Scale Up/Down)** | Increase vCPU or RAM of a single VM instance | Simple and effective while using local/single-node storage, but incurs brief restart downtime and has a single point of failure |
| **Horizontal Autoscaling (Scale Out/In)** | Add or remove stateless compute instances behind a Load Balancer based on CPU/request-rate metrics | Ideal when thousands of distributed sensors burst telemetry simultaneously (e.g., rapid reporting triggered during HVAC failure); requires externalised persistence (`ReadingRepository` backed by cloud DB) |

---

## 6. Serverless Computing (FaaS / Scale-to-Zero)

Environmental parameters like room temperature and humidity typically change slowly, often sampled once every **1 to 15 minutes**. Under low sampling frequencies, a 24×7 VM spends over 99% of wall-clock time idle waiting for network packets.

Because our domain modules (`validateReadingPayload` in `readingValidator.js` and `evaluateReading` in `thresholdMonitor.js`) are implemented as **pure, stateless functions**, the ingestion pipeline can alternatively be hosted on **Serverless Functions (Function-as-a-Service)** or scale-to-zero container platforms:
- Compute executes **only** when a sensor transmits a reading or an operator loads the dashboard.
- Idle compute cost drops near zero for infrequent telemetry intervals, provided cold-start latency (~100–400 ms) is acceptable (which is well within tolerance for ambient temperature/humidity monitoring).

---

## 7. Workload Placement Across Edge and Cloud

Effective CO2 design considers *where* each computation belongs:

1. **Edge / Microcontroller Placement (Future Hardware Tier):** Raw sensor bus polling, basic ADC conversion, and optional local averaging/debouncing to reduce wireless transmission power.
2. **Cloud / Application Compute Placement (`src/components/core/`):** Schema validation, cross-zone threshold governance, statistical aggregation, dashboard API serving, and centralised alerting.

---

## 8. Cloud Compute Purchasing Models

Once the team selects a cloud provider and workload scale, compute purchasing models align as follows:

| Purchasing Model | Characteristics | Recommended Use in Environmental Monitoring |
| :--- | :--- | :--- |
| **On-Demand** | Pay per second/hour with no long-term commitment | **Best for academic development, prototyping, and short-term testing** |
| **Reserved / Committed-Use** | 1-year or 3-year commitment for significant discount (30–60%) | **Best for steady 24×7 production facility monitoring** on always-on VMs |
| **Spot / Preemptible Instances** | Deeply discounted spare capacity that can be reclaimed at short notice | Suitable **only** for asynchronous historical batch analytics (e.g., seasonal climate reports); **unsuitable** for primary live alert ingestion |
| **Serverless Pay-Per-Invocation** | Billed by request count and GB-seconds of execution | **Highly cost-effective** when sensor nodes transmit periodically (e.g., every 5–15 minutes) |
