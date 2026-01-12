from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class System(Base):
    __tablename__ = "systems"

    id = Column(String, primary_key=True, index=True) # Changed from UUID to String
    name = Column(String, index=True)
    client_email = Column(String)
    maintenance_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(String, ForeignKey("systems.id")) # Changed to match System.id
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
