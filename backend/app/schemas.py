from pydantic import BaseModel
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class EquipmentCreate(BaseModel):
     
    name: str
    tool_type: str
    location: str
    
class SensorReadingCreate(BaseModel):

    equipment_id: int 
    temperature: float
    pressure: float
    vibration: float

class EquipmentOut(BaseModel):

    id: int 
    name: str
    tool_type: str
    location: str
    status: str
    last_seen_at: Optional[datetime] = None

class Config: 
    from_attributes = True

class SensorReadingOut(BaseModel):

    id: int 
    equipment_id: int 
    temperature: float
    pressure: float
    vibration: float
    timestamp: datetime

class Config:
    from_attributes = True

class AlertOut(BaseModel):

    id: int
    equipment_id: int
    severity: str
    reason: str
    create_at: datetime

class Config:
    from_attributes = True

class HealthOut(BaseModel):

    equipment_id: int
    level: str
    window: int
    warning_count: int
    failure_count: int

class DashboardSummaryOut(BaseModel):
    total: int
    run: int 
    idle: int
    down: int
    high: int
    med: int
    low: int