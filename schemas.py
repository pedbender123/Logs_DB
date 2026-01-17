from pydantic import BaseModel, EmailStr
from datetime import datetime

class SystemCreate(BaseModel):
    name: str
    client_name: str | None = None
    client_email: EmailStr
    client_phone: str | None = None
    maintenance_email: EmailStr
    status: str = "development"
    technical_info: str | None = None

class SystemUpdate(BaseModel):
    name: str | None = None
    client_name: str | None = None
    client_email: EmailStr | None = None
    client_phone: str | None = None
    maintenance_email: EmailStr | None = None
    status: str | None = None
    technical_info: str | None = None

class SystemResponse(BaseModel):
    id: str
    name: str
    client_name: str | None
    client_email: str
    client_phone: str | None
    maintenance_email: str
    status: str
    technical_info: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class LogCreate(BaseModel):
    message: dict | str
    container: str | None = None
    level: str | None = "info" # info, warning, error, success
    created_at: datetime | None = None

class LogResponse(BaseModel):
    id: int
    system_id: str
    content: dict | str
    level: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: int
    system_id: str
    log_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class FilterCreate(BaseModel):
    pattern: str

class FilterResponse(BaseModel):
    id: int
    system_id: str
    pattern: str
    created_at: datetime

    class Config:
        from_attributes = True

class CleanupRequest(BaseModel):
    pattern: str
