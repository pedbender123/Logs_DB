import sqlite3
import httpx
import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_NAME = "finetune_logs.db"

# Initialize DB
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS training_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

async def generate_logs_gpt(count=20):
    prompt = f"""Generate {count} varied and realistic system/application/server log messages. 
For each log, assign exactly one of these categories: normal, atenção, erro, sucesso.
The logs should cover different scenarios: 
- Systems: Linux, Windows, Docker, Kubernetes
- Languages: Python, JavaScript, Java, C++, Go
- Events: Web servers (Nginx/Apache), Databases (Postgres/Redis), Auth, Security (SSH attempts), Custom application prints, Test confirmations.
- Success logs: Include confirmations of successful tests or useful info prints that indicate success.

Output a JSON list of objects with "message" and "category" keys.
The "category" MUST be one of: normal, atenção, erro, sucesso.
ONLY output the raw JSON list, no markdown, no explanation."""

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
                    {"role": "system", "content": "You are a professional log generator and classifier for machine learning datasets."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 1.0, # High temperature for maximum variety
            },
            timeout=120.0
        )
        
        if response.status_code != 200:
            print(f"Error from OpenAI: {response.text}")
            return []
            
        content = response.json()['choices'][0]['message']['content'].strip()
        
        # Extract JSON from potential markdown blocks if GPT ignores the "ONLY raw JSON" instruction
        if content.startswith("```"):
            if "json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            else:
                content = content.split("```")[1].split("```")[0].strip()
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}\nRaw content: {content}")
            return []

async def main():
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found. Please check your .env file.")
        return

    init_db()
    total_needed = 1000
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM training_logs")
    current_count = cursor.fetchone()[0]
    
    print(f"--- Fine-tuning Data Generation Started ---")
    print(f"Current logs in database: {current_count}")
    print(f"Target: {total_needed}")
    
    while current_count < total_needed:
        batch_size = 50 # Process in batches of 50 to avoid token limits and for variety
        if current_count + batch_size > total_needed:
            batch_size = total_needed - current_count
            
        print(f"\nRequesting batch of {batch_size} logs... (Progress: {current_count}/{total_needed})")
        
        logs = await generate_logs_gpt(batch_size)
        
        if not logs:
            print("Received empty batch or error. Retrying in 5 seconds...")
            await asyncio.sleep(5)
            continue
            
        valid_batch_count = 0
        for log in logs:
            if 'message' in log and 'category' in log:
                # Ensure category is valid
                cat = log['category'].strip().lower()
                if cat in ["normal", "atenção", "erro", "sucesso"]:
                    cursor.execute(
                        "INSERT INTO training_logs (message, category) VALUES (?, ?)",
                        (log['message'], cat)
                    )
                    valid_batch_count += 1
        
        conn.commit()
        current_count += valid_batch_count
        print(f"Saved {valid_batch_count} valid logs. Current total: {current_count}")
        
        # Subtle delay to avoid rate limits and let the system breathe
        await asyncio.sleep(1)
            
    conn.close()
    print("\n[SUCCESS] 1000 logs generated and stored in finetune_logs.db")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Progress saved.")
