from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class System(Base):
    __tablename__ = "systems"

    id = Column(String, primary_key=True, index=True) # API Key
    name = Column(String, index=True)
    client_name = Column(String, nullable=True)
    client_email = Column(String)
    client_phone = Column(String, nullable=True)
    maintenance_email = Column(String)
    status = Column(String, default="development") # development / production
    technical_info = Column(Text, nullable=True) # "Ficha Técnica"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to filters
    filters = relationship("LogFilter", backref="system")

class LogFilter(Base):
    __tablename__ = "log_filters"
    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(String, ForeignKey("systems.id"))
    pattern = Column(String) # The exact text or regex to match
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(String, ForeignKey("systems.id"))
    log_id = Column(Integer, ForeignKey("logs.id"))
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(String, ForeignKey("systems.id")) # Changed to match System.id
    content = Column(Text)
    level = Column(String, default="info") # info, warning, error, success
    created_at = Column(DateTime(timezone=True), server_default=func.now())
