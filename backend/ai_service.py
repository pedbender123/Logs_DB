import os
import httpx
import json
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import SessionLocal

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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
        logger.error(f"Error classifying log: {e}")
        return "normal"

async def generate_ai_report(system_id: str, log_id: int):
    """
    Generates a technical report for a specific log and saves it to the database.
    Returns the report content or None if failed.
    """
    db = SessionLocal()
    
    try:
        system = db.query(models.System).filter(models.System.id == system_id).first()
        log = db.query(models.Log).filter(models.Log.id == log_id).first()
        
        if not system or not log:
            return None

        # Check if report already exists? 
        # For now, let's assume we might want to regenerate or just generate fresh.
        # But if we want to avoid duplicate work, we could check here.
        # existing_report = db.query(models.Report).filter(models.Report.log_id == log_id).first()
        # if existing_report:
        #     return existing_report.content

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
            
            return report_content
            
    except Exception as e:
        logger.error(f"Error generating AI report: {e}")
        return None
    finally:
        db.close()
