from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from .database import engine, SessionLocal
from . import models
from .models import Equipment, SensorReading
from .schemas import (
    EquipmentCreate,
    SensorReadingCreate,
    EquipmentOut,
    SensorReadingOut,
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Manufacturing Equipment Monitoring System", version="0.1.0")


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
    sr = SensorReading(
        equipment_id=reading.equipment_id,
        temperature=reading.temperature,
        pressure=reading.pressure,
        vibration=reading.vibration,
    )

    db.add(sr)
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