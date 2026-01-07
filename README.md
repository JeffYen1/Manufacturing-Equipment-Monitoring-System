Manufacturing Equipment Monitoring & Predictive Maintenance System
📌 Overview

-This project is a fullstack manufacturing automation system that simulates semiconductor fabrication equipment, ingests real-time sensor data, detects abnormal conditions, and visualizes equipment health for predictive maintenance and reliability monitoring.

-The system is designed to mirror fab software and Computer Integrated Manufacturing (CIM) use cases, focusing on automation, monitoring, data analysis, and system reliability rather than consumer-facing applications.

🎯 Problem Statement

-Modern semiconductor fabs rely on continuous equipment monitoring to:

-Detect abnormal tool behavior early

-Minimize unplanned downtime

-Improve productivity and yield

-Support data-driven decision-making on the production line

-This project demonstrates how software systems can integrate equipment data, perform diagnostics, and surface actionable insights to manufacturing engineers.

-System Architecture
[ Equipment Simulator ]
           ↓
     [ FastAPI Backend ]
           ↓
        [ Database ]
           ↓
 [ React Dashboard (Charts & Status) ]

Components:

-Simulator generates realistic equipment sensor data

-Backend ingests, analyzes, and stores data

-Database persists equipment state, alerts, and history

-Frontend visualizes system health and trends

⚙️ Features
🧪 Equipment Simulation

-Simulates multiple fab tools (e.g., Etcher, CVD, Lithography)

-Generates time-series sensor data:

-Temperature

-Pressure

-Vibration

-Power consumption

-Injects realistic failure scenarios (e.g., vibration spikes, thermal drift)

🚨 Alerting & Diagnostics

-Threshold-based alert detection

-Trend-based anomaly detection using rolling statistics

-Alert severity classification:

-LOW

-MEDIUM

-HIGH

-Alert history tracking and acknowledgment

🔮 Predictive Maintenance (Rule-Based)

-Rolling averages and trend slope analysis

-Health scoring system:

-LOW RISK

-MEDIUM RISK

-HIGH RISK

-Designed for interpretability and reliability, reflecting real manufacturing environments

📊 Visualization Dashboard

-Equipment status overview (RUN / IDLE / DOWN)

-Color-coded health indicators

-Time-series charts for key sensors

-Alert and downtime history per tool

🛠 Technology Stack
Backend

-Python

-FastAPI

-SQLite (upgradeable to PostgreSQL)

-SQLAlchemy

-pytest (unit & integration testing)

-Frontend

-React

-Recharts (time-series visualization)

-HTML / CSS

-Tooling

-Git & GitHub

-RESTful APIs

-JSON-based communication

## Manufacturing Equipment Monitoring System

A fullstack backend system that ingests real-time sensor telemetry
from manufacturing equipment, detects abnormal behavior, and
summarizes equipment health for operators.

### Key Features
- Equipment registration with uniqueness constraints
- Real-time sensor ingestion (temperature, pressure, vibration)
- Deterministic alert generation (WARNING / FAILURE)
- Window-based health scoring with hysteresis (LOW / MED / HIGH)
- Telemetry simulator for end-to-end validation
- Automated API tests with isolated test database

### Architecture Overview
- FastAPI backend
- SQLAlchemy ORM with SQLite
- Simulator injects telemetry via REST API
- Alerts and health computed synchronously

### Why This Matters for Manufacturing
Operators need fast, reliable insight into tool health.
This system reduces alert noise while highlighting
real degradation and failure patterns.

### How to Run (Backend)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
python simulate.py (in different terminal)

### Frontend Development Notes
The frontend calls the backend via a vite proxy (`/api/*`) to avoid CORS and Codespaces tunnel authentication redirects. Backend must be running on port 8000.

### What changed
- Added a dedicated WARNING generator (`generate_warning_reading`) that produces readings
  in the WARNING range (temp 86–94 or vibration 0.71–0.89) without triggering FAILURE.
- Tuned simulator probabilities so WARNING and FAILURE appear at controlled rates
  (demo preset), making health levels change visibly in the UI.

### Why it matters (manufacturing/CIM context)
Real fab monitoring systems need to distinguish:
- normal operating noise
- early degradation signals (WARNING)
- critical conditions (FAILURE)