from fastapi import FastAPI, Depends, HTTPException, Header, Request, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import secrets
import string
import os
import json
import httpx
from datetime import datetime, timedelta
import models, schemas
import discord_client
from database import engine, get_db, SessionLocal

# Create tables with retry logic
import time
from sqlalchemy.exc import OperationalError

MAX_RETRIES = 60
RETRY_DELAY = 1

for i in range(MAX_RETRIES):
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database connected and tables created.")
        break
    except OperationalError:
        if i == MAX_RETRIES - 1:
            print("Could not connect to database after multiple retries.")
            raise
        print(f"Database not ready, retrying in {RETRY_DELAY}s...")
        time.sleep(RETRY_DELAY)

app = FastAPI(title="Log Collection System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MASTER_KEY = os.getenv("MASTER_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DISCORD_ERROR_CHANNEL_ID = os.getenv("DISCORD_ERROR_CHANNEL_ID")
DISCORD_REPORT_CHANNEL_ID = os.getenv("DISCORD_REPORT_CHANNEL_ID")


# Status tracking for logs being analyzed by AI
analyzing_logs = {}

async def classify_log_with_ai(log_content: str):
    """
    Classifies the log using OpenAI gpt-4o-mini.
    Returns: 'normal', 'atenção', 'erro', or 'sucesso'
    """
    system_prompt = """You are a log classifier. 
Your output MUST be one of these exact words:
- normal (for routine, heartbeat, info)
- atenção (for warning, slow, suspicious, potential issues)
- erro (for failure, crash, 500 error, exceptions)
- sucesso (for success, 200 ok, completed)

Do NOT use any other words. Output ONLY 'normal', 'atenção', 'erro', or 'sucesso'."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Classify this log:\n{log_content}"}
                    ],
                    "temperature": 0.0,
                    "max_tokens": 10
                },
                timeout=10.0
            )
            content = response.json()['choices'][0]['message']['content'].strip().lower()
            
            valid_categories = ["normal", "atenção", "erro", "sucesso"]
            for cat in valid_categories:
                if cat in content:
                    return cat
            return "normal" # Default fallback
    except Exception as e:
        print(f"Error classifying log: {e}")
        return "normal"


async def generate_ai_report(system_id: str, log_id: int):
    # Analyzing status kept in memory (rudimentary)
    analyzing_logs[log_id] = "analyzing"
    
    # Create a fresh session for the background task
    db = SessionLocal()
    
    try:
        system = db.query(models.System).filter(models.System.id == system_id).first()
        log = db.query(models.Log).filter(models.Log.id == log_id).first()
        
        if not system or not log:
            return

        tech_info = system.technical_info or "Nenhuma ficha técnica disponível."
        
        prompt = f"""You are a technical support AI.
A system error or warning has occurred.

SYSTEM TECHNICAL DETAILS (FICHA TÉCNICA):
{tech_info}

CLIENT INFO:
- Name: {system.client_name}
- Email: {system.client_email}
- Status: {system.status}

LOG CONTENT:
{log.content}

Generate a concise technical report explaining the possible cause and suggested solution.
Keep it professional and technical.
Output in Brazilian Portuguese."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a tech specialist assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7
                },
                timeout=60.0
            )
            report_content = response.json()['choices'][0]['message']['content']
            
            # Save report to DB
            new_report = models.Report(
                system_id=system_id,
                log_id=log_id,
                content=report_content
            )
            db.add(new_report)
            db.commit()
            
            # Send Report to Discord REPORT Channel
            discord_message = f"📋 **RELATÓRIO TÉCNICO: {system.name}**\n\n{report_content}"
            if len(discord_message) > 2000:
                discord_message = discord_message[:1990] + "..."
            
            await discord_client.send_message(DISCORD_REPORT_CHANNEL_ID, discord_message)
            
    except Exception as e:
        print(f"Error generating AI report: {e}")
    finally:
        analyzing_logs[log_id] = "completed"
        db.close()


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
    while db.query(models.System).filter(models.System.id == new_id).first():
        new_id = generate_system_id()
        
    db_system = models.System(
        id=new_id,
        name=system.name,
        client_name=system.client_name,
        client_email=system.client_email,
        client_phone=system.client_phone,
        maintenance_email=system.maintenance_email,
        status=system.status,
        technical_info=system.technical_info
    )
    db.add(db_system)
    db.commit()
    db.refresh(db_system)
    return db_system

@app.put("/systems/{system_id}", response_model=schemas.SystemResponse)
def update_system(
    system_id: str,
    update_data: schemas.SystemUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_master_key)
):
    db_system = db.query(models.System).filter(models.System.id == system_id).first()
    if not db_system:
        raise HTTPException(status_code=404, detail="System not found")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_system, key, value)
    
    db.commit()
    db.refresh(db_system)
    return db_system

@app.get("/systems/{system_id}", response_model=schemas.SystemResponse)
def get_system(system_id: str, db: Session = Depends(get_db)):
    system = db.query(models.System).filter(models.System.id == system_id).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system

@app.post("/webhook")
async def collect_log(
    log: schemas.LogCreate, 
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db)
):
    system = db.query(models.System).filter(models.System.id == x_api_key).first()
    if not system:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Store structured data in the content column
    log_data = {
        "message": log.message,
        "container": log.container
    }
    content_str = json.dumps(log_data, default=str)
    
    # --- LOG FILTERING LOGIC ---
    filters = db.query(models.LogFilter).filter(models.LogFilter.system_id == system.id).all()
    for f in filters:
        if f.pattern in log.message:
            return {"status": "filtered", "message": "Log blocked by system filter"}
    # ---------------------------

    # 1. Classify with AI immediately (gpt-4o-mini)
    classification = await classify_log_with_ai(log.message)
    
    new_log = models.Log(
        system_id=system.id,
        content=content_str,
        level=classification, # Store the AI classification
    )
    if log.created_at:
        new_log.created_at = log.created_at

    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    # 2. Handle Alerts and Reports based on classification
    if classification in ["erro", "atenção"]:
        # Send Alert to ERROR Channel
        icon = "🔴" if classification == "erro" else "⚠️"
        alert_msg = f"{icon} **{classification.upper()}: {system.name}**\nContainer: `{log.container}`\n```{log.message[:1800]}```"
        background_tasks.add_task(discord_client.send_message, DISCORD_ERROR_CHANNEL_ID, alert_msg)
        
        # Trigger detailed report generation (which sends to REPORT Channel)
        background_tasks.add_task(generate_ai_report, system.id, new_log.id)
    
    return {
        "status": "stored", 
        "log_id": new_log.id, 
        "classification": classification,
        "triggered_report": classification in ["erro", "atenção"]
    }

@app.get("/logs", response_model=list[schemas.LogResponse])
def get_logs(
    system_id: str = None, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = db.query(models.Log)
    if system_id:
        query = query.filter(models.Log.system_id == system_id)
    
    logs = query.order_by(models.Log.created_at.desc()).limit(limit).all()
    
    # Parse JSON content back to dict for response
    for log in logs:
        try:
            log.content = json.loads(log.content)
        except:
            pass
            
    return logs

@app.get("/systems", response_model=list[schemas.SystemResponse])
def get_systems(db: Session = Depends(get_db)):
    return db.query(models.System).all()



@app.get("/stats/daily")
def get_daily_stats(db: Session = Depends(get_db)):
    # Get last 7 days of activity
    days_ago = 7
    start_date = datetime.now() - timedelta(days=days_ago)
    
    # Query logs per day and system
    # This is a bit complex in SQLAlchemy for SQLite, simplifies here for logic
    results = db.query(
        func.date(models.Log.created_at).label('date'),
        models.System.name,
        func.count(models.Log.id).label('count')
    ).join(models.System).filter(models.Log.created_at >= start_date).group_by('date', models.System.name).all()
    
    # Format for Recharts
    formatted = {}
    for date, name, count in results:
        if date not in formatted:
            formatted[date] = {"date": date}
        formatted[date][name] = count
        
    return sorted(list(formatted.values()), key=lambda x: x['date'])

@app.get("/reports", response_model=list[schemas.ReportResponse])
def get_reports(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(models.Report).order_by(models.Report.created_at.desc()).limit(limit).all()

@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.get("/logs/status")
def get_analysis_status():
    return analyzing_logs

# --- LOG FILTERING ENDPOINTS ---

@app.get("/systems/{system_id}/filters", response_model=list[schemas.FilterResponse])
def get_filters(system_id: str, db: Session = Depends(get_db)):
    return db.query(models.LogFilter).filter(models.LogFilter.system_id == system_id).all()

@app.post("/systems/{system_id}/filters", response_model=schemas.FilterResponse)
def add_filter(
    system_id: str, 
    filter_data: schemas.FilterCreate, 
    db: Session = Depends(get_db),
    _: str = Depends(verify_master_key)
):
    new_filter = models.LogFilter(system_id=system_id, pattern=filter_data.pattern)
    db.add(new_filter)
    db.commit()
    db.refresh(new_filter)
    return new_filter

@app.delete("/systems/{system_id}/filters/{filter_id}")
def delete_filter(
    system_id: str, 
    filter_id: int, 
    db: Session = Depends(get_db),
    _: str = Depends(verify_master_key)
):
    f = db.query(models.LogFilter).filter(
        models.LogFilter.id == filter_id, 
        models.LogFilter.system_id == system_id
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")
    db.delete(f)
    db.commit()
    return {"status": "deleted"}

@app.post("/systems/{system_id}/cleanup")
async def cleanup_logs(
    system_id: str, 
    cleanup_data: schemas.CleanupRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: str = Depends(verify_master_key)
):
    system = db.query(models.System).filter(models.System.id == system_id).first()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
        
    pattern = cleanup_data.pattern
    # Delete logs that match the pattern
    # In SQLite/Postgres we can use LIKE or direct match
    logs_to_delete = db.query(models.Log).filter(
        models.Log.system_id == system_id,
        models.Log.content.contains(pattern)
    )
    count = logs_to_delete.count()
    logs_to_delete.delete(synchronize_session=False)
    db.commit()
    
    # Send validation to Discord
    discord_message = f"**🧹 RELATÓRIO DE LIMPEZA: {system.name}**\n\n" \
                      f"Padrão removido: `{pattern}`\n" \
                      f"Total de itens excluídos: **{count}**\n\n" \
                      f"Isso ajuda a manter o banco de dados otimizado."
                      
    background_tasks.add_task(discord_client.send_message, DISCORD_REPORT_CHANNEL_ID, discord_message)
    
    return {"status": "success", "cleaned_count": count}

@app.get("/")
def read_root():
    return {"message": "Log Collection System is running"}
