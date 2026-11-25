# F. CO1 Academic Mapping — Cloud Fundamentals and Architecture

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)  
**Scoped Outcome:** CO1 – Cloud Fundamentals and Architecture

> **Scope Note:** In accordance with faculty instructions, academic mapping is strictly limited to **CO1** and **CO2** without introducing unrelated CO3–CO6 features or forcing unconfirmed cloud provider tools into the codebase.

---

## 1. Cloud Computing Fundamentals

The NIST definition of cloud computing highlights five essential characteristics—**on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service**. In an environmental monitoring context:

- **Broad Network Access:** Instead of requiring technicians to physically inspect wall-mounted thermometers in separate rooms, hosting the monitoring web interface and HTTP API over standard TCP/HTTP enables authorised users on laptops, tablets, or workstations to inspect temperature and humidity conditions remotely.
- **Resource Pooling & Measured Service:** Continuous telemetry ingestion sends small, periodic payloads (typically `< 300 bytes` per reading). Running such a lightweight workload on pooled cloud infrastructure avoids dedicating an entire physical server to a low-duty-cycle monitoring application.

---

## 2. Cloud Service Models (IaaS, PaaS, SaaS)

Because the team has not yet finalised a target cloud platform, keeping the application modular preserves flexibility across service models:

| Service Model | Relevance to This Environmental Monitoring Project | Trade-Off Analysis |
| :--- | :--- | :--- |
| **IaaS (Infrastructure as a Service)** | Deploy `src/server.js` onto a cloud Virtual Machine where the team manages the guest Linux OS, Node.js runtime, firewall rules, and process supervisor | Maximum control over custom serial/network gateway ports; higher OS maintenance overhead |
| **PaaS (Platform as a Service)** | Deploy the repository directly onto a managed application runtime using `package.json` (`npm start`) and `.env` variables | Eliminates OS patching; rapid academic deployment once cloud provider is selected |
| **SaaS (Software as a Service)** | Commercial turnkey IoT dashboards | Fast initial setup for commercial buyers, **not suitable** as the core implementation when building custom academic validation and modular software architecture |

---

## 3. Cloud Deployment Models

Environmental monitoring requirements vary by facility sensitivity, making deployment model selection an important architectural decision:

- **Public Cloud:** Suitable for general smart-agriculture, greenhouse, or classroom comfort monitoring where remote accessibility and low upfront capital expenditure are priorities.
- **Private Cloud / On-Premises Campus Cloud:** Appropriate for university data centres, cleanrooms, or restricted research laboratories where internal network policies prohibit transmitting facility telemetry outside institutional boundaries.
- **Hybrid Cloud:** Highly relevant to sensor systems—an **on-premises edge/gateway node** aggregates local microcontroller readings inside the laboratory network (surviving temporary internet outages) while forwarding summarised telemetry and alert states to a **public cloud dashboard** for remote monitoring.
- **Community Cloud:** Applicable when multiple research departments or regional meteorological/agricultural stations share a common environmental monitoring infrastructure governed by shared compliance standards.

---

## 4. Shared Responsibility Model

Even before selecting a commercial cloud vendor, our project design reflects the **Shared Responsibility Model** by clearly separating infrastructure concerns from application-level responsibilities owned by the project team:

- **Cloud Provider Responsibility ("Security *of* the Cloud"):** Physical data centre security, power/HVAC redundancy, host server hardware, physical network fabric, and hypervisor isolation.
- **Project Team Responsibility ("Security *in* the Cloud"):**
  1. **Input Validation (`readingValidator.js`):** Rejecting malformed JSON, oversized payloads (`> 32 KB` guard in `server.js`), and physically implausible readings.
  2. **Credential & Secret Hygiene (`.gitignore`, `.env.example`, `config.js`):** Never hardcoding API tokens or committing `.env` files; stripping sensitive keys in `getPublicConfig()`.
  3. **Ingestion Authentication (`server.js`):** Supporting optional bearer/header token verification (`INGEST_API_TOKEN`) on `POST /api/readings`.
  4. **Output Encoding (`formatters.js`):** Escaping untrusted strings (`escapeHtml`) before rendering node names or zones in the browser DOM.

---

## 5. Virtualization and Cloud Infrastructure

Physical servers in cloud data centres use **hypervisors** to partition underlying CPU cores, memory, storage volumes, and network interfaces into isolated virtual execution environments. For an environmental monitoring system:

- Virtualization enables running the application tier on a right-sized virtual slice (e.g., 1 vCPU, 512 MB–1 GB RAM) rather than under-utilising physical hardware.
- Network virtualization (Virtual Private Networks, virtual firewalls/security groups) allows restricting write access on the ingestion route while permitting read access to the presentation dashboard.

---

## 6. Multi-Tier Architecture & Cloud Architecture Fundamentals

Rather than forcing cloud buzzwords artificially, the codebase directly implements core **Cloud Architecture Fundamentals** in `src/`:

1. **Three-Tier Separation of Concerns:**
   - **Presentation Tier:** `src/index.html`, `src/app.js`, `src/styles/main.css`, and `src/components/reusable/*`
   - **Application / Logic Tier:** `src/server.js`, `monitoringService.js`, `readingValidator.js`, and `thresholdMonitor.js`
   - **Data & Source Abstraction Tier:** `storageRepository.js` and `sensorAdapter.js`
2. **Loose Coupling via Contracts:** `MonitoringService` interacts with `ReadingRepository` methods (`save`, `getLatest`, `getAll`, `getStats`) rather than raw SQL or vendor SDK calls.
3. **Externalised Configuration:** Port bindings, operating mode (`SIMULATION` vs `EXTERNAL_INGEST`), and threshold values are injected via environment variables (`config.js`), enabling promotion from local workstation to cloud staging/production without source-code edits.
