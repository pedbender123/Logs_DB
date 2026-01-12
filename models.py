import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class System(Base):
    __tablename__ = "systems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True)
    client_email = Column(String)
    maintenance_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(UUID(as_uuid=True), ForeignKey("systems.id"))
    content = Column(Text) # Storing JSON as text or could use JSONB if strictly Postgres
    created_at = Column(DateTime(timezone=True), server_default=func.now())
