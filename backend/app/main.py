"""
Manufacturing Equipment Monitoring System (FastAPI)

This service provides:
- CRUD for equipment records
- Ingestion of sensor readings (temperature, pressure, vibration)
- Rule-based classification of readings into NORMAL / WARNING / FAILURE
- Storage and querying of alerts per equipment

"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from datetime import datetime, timezone

from .database import engine, SessionLocal
from . import models
from .models import Equipment, SensorReading, Alert
from .schemas import (
    EquipmentCreate,
    SensorReadingCreate,
    EquipmentOut,
    SensorReadingOut,
    AlertOut,
    HealthOut,
    DashboardSummaryOut
)

# Create database tables at app startup (simple approach for development).
# NOTE: Dev-only convenience. In production you'd use migration (Alembic).
models.Base.metadata.create_all(bind = engine)

# FastAPI application instance (defines metadata shown in Swagger /docs)
app = FastAPI(
    title="Manufacturing Equipment Monitoring System", 
    version="0.1.0",
)

# CORS allows browser clients (Swagger UI, React frontend) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# -----------------------------
# Rule thresholds (v1: deterministic)
# -----------------------------
# These thresholds are intentionally simple + explainable:
# - Great for early monitoring systems
# - Easy to test
# - Easy for engineers to trust and act on
TEMP_WARN = 85.0
TEMP_FAIL = 95.0

VIB_WARN = 0.7
VIB_FAIL = 0.9

PRESSURE_LOW = 0.8
PRESSURE_HIGH = 1.3

def evaluate_reading(temp: float, pressure: float, vibration: float) -> tuple[str, str]:

    """
    Classify a single sensor reading into NORMAL / WARNING / FAILURE.

    Returns:
        (severity, reason)
        severity: "NORMAL" | "WARNING" | "FAILURE"

    Design principle:
    FAILURE conditions have priority. If any critical limit is exceeded, we raise FAILURE
    even if other fields are normal.
    """

    # FAILURE rules first
    if temp > TEMP_FAIL:
        return ("FAILURE", f"temperature > {TEMP_FAIL}")
    if vibration > VIB_FAIL:
        return ("FAILURE", f"vibration > {VIB_FAIL}")
    if pressure < PRESSURE_LOW or pressure > PRESSURE_HIGH:
        return ("FAILURE", f"pressure out of range [{PRESSURE_LOW}, {PRESSURE_HIGH}]") 
    
    # WARNING rules
    if temp > TEMP_WARN:
        return ("WARNING", f"temperature > {TEMP_WARN}")
    if vibration > VIB_WARN:
        return ("WARNING", f"vibration > {VIB_WARN}")

    return ("NORMAL", "within normal thresholds")

def get_db():

    """
    Dependency that provides a SQLAlchemy DB session per request.

    Why:
    - Ensures each request has a clean session
    - Always closes session to avoid connection leaks
    """

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -----------------------------
# Basic health check
# -----------------------------
@app.get("/")
def root():

    """Simple endpoint to confirm the service is running."""

    return {"status": "ok"}

# -----------------------------
# Equipment APIs
# -----------------------------
@app.post("/equipment", response_model=EquipmentOut)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):

    """
    Create a new equipment record.

    Note:
    - Equipment names are unique to prevent duplicate tool identities,
      which is important for data integrity in manufacturing environments.
    """

    eq = Equipment(
        name=equipment.name, tool_type=equipment.tool_type, location=equipment.location
    )
    try:
        db.add(eq)
        db.commit()
        db.refresh(eq)
        return eq
    except IntegrityError:
        # If name is unique and already exists, return a clear client error (409 Conflict)
        db.rollback()
        raise HTTPException(
            status_code=409, detail=f"Equipment name '{equipment.name}' already exists."
        )


@app.get("/equipment", response_model=list[EquipmentOut])
def list_equipment(db: Session = Depends(get_db)):
    equipment = db.query(Equipment).all()

    """
    List all equipment.

    Useful for dashboards and admin views.
    """

    return [
        {
            "id": e.id,
            "name": e.name,
            "tool_type": e.tool_type,
            "location": e.location,
            "last_seen_at": e.last_seen_at,
            "status": compute_status(e.last_seen_at),
        }
        for e in equipment
    ]


@app.get("/equipment/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):

    """
    Fetch a single equipment record by ID.

    Returns 404 if the tool does not exist.
    """

    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {
        "id": eq.id,
        "name": eq.name,
        "tool_type": eq.tool_type,
        "location": eq.location,
        "last_seen_at": eq.last_seen_at,
        "status": compute_status(eq.last_seen_at),  
    }


# -----------------------------
# Sensor Reading APIs
# -----------------------------
@app.post("/readings", response_model=SensorReadingOut)
def add_reading(reading: SensorReadingCreate, db: Session = Depends(get_db)):


    """
    Ingest a sensor reading for a tool.

    Design choice:
    - Each reading also generates an Alert record.
      This converts raw time-series data into actionable events.
    """

    # Validate equipment exists to avoid foreign key issues and provide a clean error to client
    eq = db.query(Equipment).filter(Equipment.id == reading.equipment_id).first()
    eq.last_seen_at = datetime.utcnow()
    eq.status = "RUN"
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # Store the raw sensor reading (ground truth / historical record)
    sr = SensorReading(
        equipment_id=reading.equipment_id,
        temperature=reading.temperature,
        pressure=reading.pressure,
        vibration=reading.vibration,
    )

    # Convert the reading into an interpreted alert state (NORMAL/WARNING/FAILURE)
    severity, reason = evaluate_reading(sr.temperature, sr.pressure, sr.vibration)

    # Store the alert event so clients can query failures/warnings without re-processing raw data
    alert = Alert(
        equipment_id=sr.equipment_id,
        severity=severity,
        reason=reason,
    )

    # Persist both reading + alert in one transaction for consistency
    db.add(sr)
    db.add(alert)
    db.commit()
    db.refresh(sr)
    return sr


@app.get("/equipment/{equipment_id}/readings", response_model=list[SensorReadingOut])
def get_readings(equipment_id: int, limit: int = 50, db: Session = Depends(get_db)):

    """
    Return the most recent sensor readings for a specific tool.

    Why:
    - Engineers typically review a recent window of readings to diagnose issues
    - Sorted newest-first for quick inspection
    """

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.equipment_id == equipment_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings


# -----------------------------
# Alert APIs
# -----------------------------
@app.get("/equipment/{equipment_id}/alerts", response_model=list[AlertOut])
def get_equipment_alerts(equipment_id: int, limit: int = 50, db: Session = Depends(get_db)):

    """
    Return recent alerts for a specific tool.

    This is the "actionable" view engineers use to quickly see if a tool is drifting (WARNING)
    or in a critical state (FAILURE).
    """

    return (
        db.query(Alert)
        .filter(Alert.equipment_id == equipment_id)
        .order_by(Alert.create_at.desc())
        .limit(limit)
        .all()
    )


@app.get("/alerts/failure", response_model=list[AlertOut])
def get_failures(limit: int = 50, db: Session = Depends(get_db)):

    """
    Return the most recent FAILURE alerts across all equipment.

    Useful for a "global" dashboard that prioritizes urgent attention.
    """

    return (
        db.query(Alert)
        # BUG FIX: "FAilURE" -> "FAILURE"
        .filter(Alert.severity == "FAILURE")
        .order_by(Alert.create_at.desc())
        .limit(limit)
        .all()
    )


def compute_health(readings: list[SensorReading]) -> tuple[str, int, int]:

    """
    We compute health from the last N readings using the same deterministic
    rules for transparency and testability.

    Returns:
        (level, warning_count, failure_count = compute_health(readings))
    """
    warning_count = 0
    failure_count = 0

    for r in readings:
        severity, _ = evaluate_reading(r.temperature, r.pressure, r.vibration)
        if severity == "FAILURE":
            failure_count += 1
        elif severity == "WARNING":
            warning_count += 1

    n = len(readings)
    if n == 0:
        return "LOW", 0 ,0
    
    failure_rate = failure_count / n
    warning_rate = warning_count / n

    if failure_rate >= 0.10 or failure_count >= 3:
        level = "HIGH"
    elif failure_rate >= 0.02 or warning_rate >= 0.10 or warning_count >= 3:
        level = "MED"
    else:
        level = "LOW"
    
    return level,warning_count, failure_count

@app.get("/equipment/{equipment_id}/health", response_model = HealthOut)
def get_equipment_health(equipment_id: int, window: int = 50, db: Session = Depends(get_db)):
    #Ensure equipment exists
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code = 404, detail = "Equipment not found")
    
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.equipment_id == equipment_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(window)
        .all()
    )

    level, warning_count, failure_count = compute_health(readings)

    return {
        "equipment_id": equipment_id,
        "level": level,
        "window":   window,
        "warning_count": warning_count,
        "failure_count": failure_count,
    }

DOWN_AFTER_SECONDS = 30

def compute_status(last_seen_at):
    if last_seen_at is None:
        return "IDEL"
    
    now = datetime.utcnow()
    return "DOWN" if (now - last_seen_at).total_seconds() > DOWN_AFTER_SECONDS else "RUN"

@app.get("/dashboard/summary", response_model = DashboardSummaryOut)
def dashboard_summary(window: int = 50, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).all()

    # Status Counts
    run = idle = down = 0
    for eq in equipment:
        s = compute_status(eq.last_seen_at)
        if s == "RUN":
            run += 1
        elif s == "DOWN":
            down += 1
        else:
            idle += 1

    # Health Counts
    high = med = low = 0
    for eq in equipment:
        readings = (
            db.query(SensorReading)
            .filter(SensorReading.equipment_id == eq.id)
            .order_by(SensorReading.timestamp.desc())
            .limit(window)
            .all()
        )
        level, _, _ = compute_health(readings)
        if level == "HIGH":
            high += 1
        elif level == "MED":
            med += 1
        else:
            low += 1

    return {
        "total": len(equipment),
        "run": run,
        "idle": idle,
        "down": down,
        "high": high,
        "med": med,
        "low": low,
    }