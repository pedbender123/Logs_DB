import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
API_URL = "http://localhost:8001"
MASTER_KEY = "pbpm_secret_master_key"

TEST_LOGS = [
    {"message": "Critical: Memory leak detected in auth-service", "expected": "erro"},
    {"message": "User 'admin' logged in from a new IP address", "expected": "atenção"},
    {"message": "Daily database optimization complete", "expected": "sucesso"},
    {"message": "API Health Check: healthy", "expected": "normal"},
    {"message": "Connection timeout after 30s in payment module", "expected": "erro"},
    {"message": "High CPU usage on worker-3 (89%)", "expected": "atenção"},
    {"message": "System shutdown signal received", "expected": "normal"},
    {"message": "Payment processed for order #9942", "expected": "sucesso"}
]

SYSTEM_PROMPT = """You are a log classifier. 
Your output MUST be one of these exact words:
- normal (for routine, heartbeat, info)
- atenção (for warning, slow, suspicious)
- erro (for failure, crash, critical errors)
- sucesso (for success, completed, 200 ok)

Output ONLY the category word and nothing else."""

async def get_openai_classification(log_message):
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
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Classify this log: {log_message}"}
                ],
                "temperature": 0.0,
                "max_tokens": 10
            },
            timeout=30.0
        )
        result = response.json()
        return result['choices'][0]['message']['content'].strip().lower()

async def run_openai_test_and_seed():
    print(f"--- Starting GPT-4o-mini Log Verification & Seeding ---")
    
    # 1. Register system to get API key if needed
    async with httpx.AsyncClient() as client:
        try:
            reg_resp = await client.post(
                f"{API_URL}/register",
                headers={"x-master-key": MASTER_KEY},
                json={
                    "name": "GPT-4o Verification System",
                    "client_email": "gpt@pbpm.com",
                    "maintenance_email": "admin@pbpm.com"
                }
            )
            system = reg_resp.json()
            api_key = system["id"]
            print(f"System Registered! API Key: {api_key}")
        except:
            # Fallback if already exists (need to handle in next update or use placeholder)
            api_key = "pbpm-placeholder-key"
            print("Using existing system/placeholder.")

        # 2. Iterate tests, classify with GPT-4o-mini, and send to dashboard
        for test in TEST_LOGS:
            print(f"Processing: '{test['message'][:40]}...'")
            
            # Classification
            gpt_category = await get_openai_classification(test['message'])
            
            # Map GPT output to valid levels if needed (though prompt should be exact)
            valid_level = gpt_category
            if valid_level not in ["normal", "atenção", "erro", "sucesso"]:
                print(f"  Warning: GPT returned unexpected category: {gpt_category}")
                # Simple fallback
                valid_level = "info" if "normal" in gpt_category else "error"
            
            # Send to webhook
            webhook_resp = await client.post(
                f"{API_URL}/webhook",
                headers={"x-api-key": api_key},
                json={
                    "message": test['message'],
                    "level": valid_level,
                    "container": "gpt-tester"
                }
            )
            
            status = "MATCH" if valid_level == test['expected'] else f"DIFF (GPT: {valid_level}, Exp: {test['expected']})"
            print(f"  Result: {status} | Sent to DB (ID: {webhook_resp.json().get('log_id')})")
            
    print("\nVerification and Seeding complete.")

if __name__ == "__main__":
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in .env")
    else:
        asyncio.run(run_openai_test_and_seed())
