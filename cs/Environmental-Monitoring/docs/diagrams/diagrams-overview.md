# Architecture & Flow Diagrams Catalogue

**Project:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## 1. End-to-End Environmental Measurement Flow (`data-flow-architecture.svg`)

![Data Flow Architecture](data-flow-architecture.svg)

Illustrates how simulated demonstration readings (`SimulatedSensorAdapter`) and future physical microcontroller telemetry (`ExternalIngestAdapter`) pass through stateless HTTP validation, configurable threshold classification, pluggable persistence, and the web presentation dashboard.

---

## 2. Multi-Tier & CO1/CO2 Compute Portability Diagram (`multi-tier-cloud-mapping.svg`)

![Multi-Tier Cloud Mapping](multi-tier-cloud-mapping.svg)

Illustrates how the three software tiers map onto CO1 architectural concepts and CO2 compute execution models (Virtual Machines, Containers/Kubernetes, and Serverless Functions).

---

## 3. Environmental Severity State Classification Diagram

```mermaid
flowchart TD
    IN["Validated Reading (Temperature °C & Humidity % RH)"] --> CHK_T["Evaluate Temperature Bounds"]
    IN --> CHK_H["Evaluate Relative Humidity Bounds"]

    CHK_T --> T_RES["NORMAL | LOW/HIGH WARNING | LOW/HIGH ALERT"]
    CHK_H --> H_RES["NORMAL | LOW/HIGH WARNING | LOW/HIGH ALERT"]

    T_RES --> AGG["Max Severity Aggregation"]
    H_RES --> AGG

    AGG --> NORM["Overall: NORMAL (Green Badge)"]
    AGG --> WARN["Overall: WARNING (Amber Badge)"]
    AGG --> ALRT["Overall: ALERT (Red Badge)"]
```
