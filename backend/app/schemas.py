from pydantic import BaseModel
from datetime import datetime

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