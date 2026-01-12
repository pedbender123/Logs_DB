from fastapi import FastAPI, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session
import secrets
import string
import os
import models, schemas
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Log Collection System")

MASTER_KEY = os.getenv("MASTER_KEY")

def generate_system_id():
    """Generates a key like pbpm-<random_64_chars>"""
    random_str = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(64))
    return f"pbpm-{random_str}"

def verify_master_key(x_master_key: str = Header(..., alias="x-master-key")):
    if x_master_key != MASTER_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Master Key"
        )
    return x_master_key

@app.post("/register", response_model=schemas.SystemResponse)
def register_system(
    system: schemas.SystemCreate, 
    db: Session = Depends(get_db),
    _: str = Depends(verify_master_key)
):
    new_id = generate_system_id()
    # Ensure uniqueness (unlikely collision but good practice in real apps to check)
    while db.query(models.System).filter(models.System.id == new_id).first():
        new_id = generate_system_id()
        
    db_system = models.System(
        id=new_id,
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
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db)
):
    system = db.query(models.System).filter(models.System.id == x_api_key).first()
    if not system:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    import json
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
