# Quality Assurance (QA) Verification Checklist

**Project:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## 1. Structural & Governance Compliance

- [x] Compulsory root and nested directories match faculty specification (`src/assets/{images,media,icons}`, `src/components/`, `docs/{architecture,diagrams,wireframes,project-reports}`, `tests/`).
- [x] Root `README.md` begins with exact course title, course code (`25CS2206E`), and uninvented `[TEAM NUMBER]`, `[FULL NAME]`, and `[STUDENT ID]` placeholders.
- [x] Academic scope restricted strictly to **CO1** and **CO2**; no unrelated CO3–CO6 implementations introduced.
- [x] No unconfirmed sensor models, microcontrollers, databases, or cloud vendors assumed in code or documentation.
- [x] `.gitignore` excludes `node_modules/`, `build/`, `dist/`, `.env`, `.env.local`, credentials, private keys, temporary files, and caches.

---

## 2. Software Functional & Security QA

- [x] Payload validator normalises °C/°F inputs and rejects missing, non-numeric, or physically implausible readings (`HTTP 400`).
- [x] Threshold monitor accurately classifies `NORMAL`, `WARNING`, and `ALERT` severities and updates buffered records when thresholds change.
- [x] Every synthetic reading generated in demonstration mode carries `isSimulated: true` and renders a visible `SIMULATED` badge in the UI.
- [x] `GET /api/config` strips `INGEST_API_TOKEN` so credentials are never leaked to browser clients.
- [x] Dynamic strings rendered in UI components pass through `escapeHtml()` to prevent cross-site scripting (XSS).
- [x] Static file handler enforces path resolution within `src/` to prevent directory traversal.

---

## 3. Pending Post-Confirmation QA Items (Not Yet Executed)

- [ ] Physical sensor calibration and accuracy comparison against reference thermo-hygrometer *(Pending sensor confirmation)*.
- [ ] Microcontroller-to-API wireless/serial ingestion soak test *(Pending controller confirmation)*.
- [ ] Cloud compute instance/container deployment verification *(Pending cloud provider confirmation)*.
- [ ] Persistent database retention and query latency test *(Pending database confirmation)*.
