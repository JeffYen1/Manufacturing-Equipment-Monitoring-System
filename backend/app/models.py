from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func
from .database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, unique = True, index = True)
    tool_type = Column(String)
    location = Column(String)
    status = Column(String, default = "RUN")
    last_seen_at = Column(DateTime, nullable = True)
    status = Column(String, default = "IDEL")

class SensorReading(Base):
    __tablename__ = "sensor_reading"

    id = Column(Integer, primary_key = True, index = True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    temperature = Column(Float)
    pressure = Column(Float)
    vibration = Column(Float)
    timestamp = Column(DateTime(timezone = True), server_default = func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key = True, index = True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index = True, nullable = False)

    severity = Column(String, nullable = False)
    reason = Column(String, nullable = False)
    create_at = Column(DateTime, default = datetime.utcnow, nullable = False)

    equipment = relationship("Equipment")