from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from .database import engine, SessionLocal
from . import models
from .models import Equipment, SensorReading, Alert
from .schemas import (
    EquipmentCreate,
    SensorReadingCreate,
    EquipmentOut,
    SensorReadingOut,
    AlertOut,
)

models.Base.metadata.create_all(bind = engine)

app = FastAPI(
    title="Manufacturing Equipment Monitoring System", 
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["https://congenial-funicular-g4rp7pp5pg9gcvgx-8000.app.github.dev"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

TEMP_WARN = 85.0
TEMP_FAIL = 95.0

VIB_WARN = 0.7
VIB_FAIL = 0.9

PRESSURE_LOW = 0.8
PRESSURE_HIGH = 1.3

def evaluate_reading(temp: float, pressure: float, vibration: float) -> tuple[str, str]:
    # FAILURE rules first
    if temp > TEMP_FAIL:
        return ("FAILURE", f"temperature > {TEMP_FAIL}")
    if vibration > VIB_FAIL:
        return ("FAILURE", f"vibration > {VIB_FAIL}")
    if pressure < PRESSURE_LOW or pressure > PRESSURE_HIGH:
        return ("FAILURE", f"pressure out of reange [{PRESSURE_LOW}, {PRESSURE_HIGH}]") 
    
    # WARNING rules
    if temp > TEMP_WARN:
        return ("WARNING", f"temperature > {TEMP_WARN}")
    if vibration > VIB_WARN:
        return ("WARNING", f"vibration > {VIB_WARN}")

    return ("NORMAL", "within normal thresholds")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/equipment", response_model=EquipmentOut)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    eq = Equipment(
        name=equipment.name, tool_type=equipment.tool_type, location=equipment.location
    )
    try:
        db.add(eq)
        db.commit()
        db.refresh(eq)
        return eq
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail=f"Equipment name '{equipment.name}' already exists."
        )


@app.post("/readings", response_model=SensorReadingOut)
def add_reading(reading: SensorReadingCreate, db: Session = Depends(get_db)):
    # Make sure equipment exists (prevent FK errors)
    eq = db.query(Equipment).filter(Equipment.id == reading.equipment_id).first()
    if not eq:
        raise HTTPException(status_code = 404, detail = "Equipment not found")

    sr = SensorReading(
        equipment_id=reading.equipment_id,
        temperature=reading.temperature,
        pressure=reading.pressure,
        vibration=reading.vibration,
    )

    severity, reason = evaluate_reading(sr.temperature, sr.pressure, sr.vibration)

    alert = Alert(
        equipment_id = sr.equipment_id,
        severity = severity,
        reason = reason
    )

    db.add(sr)
    db.add(alert)
    db.commit()
    db.refresh(sr)
    return sr


@app.get("/equipment", response_model=list[EquipmentOut])
def list_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()


@app.get("/equipment/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq

@app.get("/equipment/{equipment_id}/readings", response_model = list[SensorReadingOut])
def get_readings(equipment_id: int,limit: int = 50,db: Session = Depends(get_db)):

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.equipment_id == equipment_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings
# Return latest sensor readings for a specific tool

@app.get("/equipment/{equipment_id}/alerts", response_model = list[AlertOut])
def get_equipment_alerts(equipment_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Alert)
        .filter(Alert.equipment_id == equipment_id)
        .order_by(Alert.create_at.desc())
        .limit(limit)
        .all()
    )

@app.get("/alerts/failure", response_model = list[AlertOut])
def get_failures(limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Alert)
        .filter(Alert.severity == "FAilURE")
        .order_by(Alert.create_at.desc())
        .limit(limit)
        .all()
    )
