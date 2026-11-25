# B. Problem Statement

**Project Title:** Environmental Monitoring using Temperature and Humidity Sensors  
**Course:** Cloud Infrastructure and Services (CDIS – 25CS2206E)

---

## 1. Background

Controlled indoor environments—such as computer server rooms, electronics laboratories, medical cold-chain storage, seed banks, and cleanrooms—depend on maintaining ambient temperature and relative humidity within defined operational tolerances. Despite the availability of digital sensing components, many small-to-medium facilities and academic laboratories still rely on manual observation or isolated point-of-use displays.

## 2. Limitations of Manual Temperature and Humidity Monitoring

1. **Temporal Blind Spots (Discontinuous Sampling):**  
   Manual inspection typically occurs only once or twice per shift during working hours. Environmental excursions caused by HVAC malfunctions, power interruptions, or weather shifts frequently occur overnight or during weekends and go unrecorded until damage has already occurred.

2. **Absence of Automated Threshold Evaluation:**  
   A passive wall display cannot proactively classify measurements into normal, warning, or critical states. Human observers must mentally compare readings against operational guidelines, leading to inconsistent judgement across personnel.

3. **Human Transcription and Logging Errors:**  
   Recording readings on paper sheets or manually typing values into spreadsheets introduces typographical errors, missing timestamps, illegible entries, and inconsistent measurement units (°C vs °F).

4. **Inability to Track Trends or Aggregate Multi-Zone Data:**  
   Single-point manual readings provide instantaneous snapshots without immediate visibility into gradual upward thermal drift, humidity oscillations, or comparative conditions across multiple rooms.

5. **Poor Maintainability of Ad-Hoc Prototypes:**  
   Even when basic automated scripts are attempted, early student or laboratory prototypes frequently tightly couple hardware-specific sensor drivers, hardcoded Wi-Fi/cloud credentials, and presentation markup inside a single monolithic file. Changing a sensor model, switching microcontrollers, or migrating compute infrastructure then requires rewriting the entire project.

## 3. Core Engineering Problem Addressed

There is a clear need for a **modular, vendor-neutral environmental monitoring application** capable of collecting, validating, classifying, storing, and visualising temperature and relative humidity measurements through cleanly separated software tiers—allowing software verification to proceed immediately using transparently labelled simulation while preserving plug-and-play adaptability for future hardware sensors and cloud compute infrastructure.
