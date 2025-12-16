from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from .database import engine, SessionLocal
from . import models
from .models import Equipment, SensorReading
from .schemas import EquipmentCreate, SensorReadingCreate, EquipmentOut, SensorReadingOut

models.Base.metadata.create_all(bind = engine)

app = FastAPI(
    title = "Manufacturing Equipment Monitoring System",
    version = "0.1.0"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/equipment", response_model = EquipmentOut)
def create_equipment(
    equipment: EquipmentCreate, 
    db: Session = Depends(get_db)
):
    eq = Equipment(
        name = equipment.name,
        tool_type = equipment.tool_type,
        location = equipment.location
      )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq

@app.post("/readings", response_model = SensorReadingOut)
def add_reading(
    reading: SensorReadingCreate, 
    db: Session = Depends(get_db)
):
    sr = SensorReading(
        equipment_id = reading.equipment_id,
        temperature = reading.temperature,
        pressure = reading.pressure,
        vibration = reading.vibration
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)
    return sr

@app.get("/equipment", response_model = list[EquipmentOut])
def list_equipment(
    db: Session = Depends(get_db)
):
    return db.query(Equipment).all()
