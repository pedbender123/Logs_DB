from fastapi import FastAPI, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from uuid import UUID
import models, schemas
from database import engine, get_db

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Log Collection System")

@app.post("/register", response_model=schemas.SystemResponse)
def register_system(system: schemas.SystemCreate, db: Session = Depends(get_db)):
    db_system = models.System(
        name=system.name,
        client_email=system.client_email,
        maintenance_email=system.maintenance_email
    )
    db.add(db_system)
    db.commit()
    db.refresh(db_system)
    return db_system

@app.post("/webhook")
def collect_log(
    log: schemas.LogCreate, 
    x_api_key: str = Header(..., alias="x-api-key"), # Using header for clean separation
    db: Session = Depends(get_db)
):
    # Verify API Key (System ID)
    try:
        system_uuid = UUID(x_api_key)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid API Key format")

    system = db.query(models.System).filter(models.System.id == system_uuid).first()
    if not system:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Store Log
    import json
    # Ensure content is stored as string if it's a dict, or just store as is if using JSONB in future
    # For now, models.Log.content is Text.
    content_str = json.dumps(log.content) if isinstance(log.content, dict) else str(log.content)
    
    new_log = models.Log(
        system_id=system.id,
        content=content_str
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return {"status": "received", "log_id": new_log.id}

@app.get("/")
def read_root():
    return {"message": "Log Collection System is running"}
