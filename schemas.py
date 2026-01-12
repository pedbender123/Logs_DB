from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class SystemCreate(BaseModel):
    name: str
    client_email: EmailStr
    maintenance_email: EmailStr

class SystemResponse(SystemCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class LogCreate(BaseModel):
    # Depending on requirements, content can be strict or loose.
    # User said "Receber um log... em tempo real".
    # We will accept any valid JSON dict for flexibility.
    content: dict | str

class LogResponse(BaseModel):
    id: int
    system_id: UUID
    content: dict | str
    created_at: datetime

    class Config:
        from_attributes = True
