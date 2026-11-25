# Pending Decisions Log

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## Purpose of This Document

In accordance with faculty instructions, **no unconfirmed hardware, team details, database engines, or cloud providers have been assumed or fabricated**. Every pending decision below has been isolated behind a clean configuration parameter or modular interface so the team can finalise selections without restructuring the codebase.

---

## Summary of Pending Decisions

| ID | Category | Pending Decision | Current Modular Placeholder / Mitigation | Files to Update Once Confirmed |
| :--- | :--- | :--- | :--- | :--- |
| **PD-01** | **Team Metadata** | Team Number, Member Full Names, and Student IDs | Preserved exact `[TEAM NUMBER]`, `[FULL NAME]`, and `[STUDENT ID]` placeholders | `README.md` |
| **PD-02** | **Course Handout Reference** | Upload/confirmation of institution-specific PDF handout edition (if additional rubric codes apply) | Scoped strictly to 25CS2206E CO1 and CO2 topics provided in faculty project brief | `docs/project-reports/04-co1-mapping.md`, `05-co2-mapping.md` |
| **PD-03** | **Temperature & Humidity Sensor** | Specific physical sensor IC/module selection and accuracy tolerances | `readingValidator.js` accepts standard numeric `temperatureC`/`temperatureF` and `humidityPct` with configurable bounds in `.env` | `.env`, future edge firmware |
| **PD-04** | **Microcontroller / Edge Gateway** | Selection of microcontroller or single-board gateway and transport bridge (Wi-Fi HTTP, Serial-to-HTTP bridge, etc.) | `POST /api/readings` accepts standard HTTP JSON payloads from any capable controller or local gateway script | `src/components/core/sensorAdapter.js` (optional bridge script) |
| **PD-05** | **Cloud Service Provider** | Selection of target cloud platform (e.g., AWS, Google Cloud, Microsoft Azure, or campus private cloud) | Zero vendor-specific SDKs imported; standard Node.js HTTP service listens on configurable `HOST` and `PORT` | Deployment documentation (future phase) |
| **PD-06** | **Compute Hosting Model** | Choice between Virtual Machine, Docker Container service, or Serverless Function deployment | Stateless request handling + `/api/health` endpoint supports VM, container, or FaaS adaptation | Future deployment config |
| **PD-07** | **Persistent Database Engine** | Selection of persistent time-series, relational, or NoSQL store for long-term retention | `ReadingRepository` base class in `storageRepository.js` currently uses `InMemoryReadingRepository` | Add concrete repository subclass in `src/components/core/storageRepository.js` |
| **PD-08** | **Domain-Specific Operating Thresholds** | Target facility type (e.g., general classroom vs server rack vs cold storage) | Default indoor comfort/lab range (`18–28 °C`, `30–65 % RH`) configurable via `.env` and UI form | `.env` |
