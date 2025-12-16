from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, unique = True, index = True)
    tool_type = Column(String)
    location = Column(String)
    status = Column(String, default = "RUN")

class SensorReading(Base):
    __tablename__ = "sensor_reading"

    id = Column(Integer, primary_key = True, index = True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    temperature = Column(Float)
    pressure = Column(Float)
    vibration = Column(Float)
    timestamp = Column(DateTime(timezone = True), server_default = func.now())