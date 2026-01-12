from pydantic import BaseModel, EmailStr
from datetime import datetime

class SystemCreate(BaseModel):
    name: str
    client_email: EmailStr
    maintenance_email: EmailStr

class SystemResponse(SystemCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class LogCreate(BaseModel):
    content: dict | str

class LogResponse(BaseModel):
    id: int
    system_id: str
    content: dict | str
    created_at: datetime

    class Config:
        from_attributes = True
