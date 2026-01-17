import httpx
import asyncio
import json

OLLAMA_URL = "http://localhost:11434"
MODEL = "llama3.2:1b"

TEST_LOGS = [
    {"message": "Database connection successful", "expected": "sucesso"},
    {"message": "User failed to login 5 times", "expected": "atenção"},
    {"message": "Critical: Disk space full", "expected": "erro"},
    {"message": "Service heartbeat received", "expected": "normal"},
    {"message": "Backup completed in 45s", "expected": "sucesso"},
    {"message": "Slow query detected: 5.2s", "expected": "atenção"},
    {"message": "Internal Server Error 500", "expected": "erro"},
    {"message": "Request processed in 20ms", "expected": "normal"}
]

SYSTEM_PROMPT = """You are a log classifier. 
Your output MUST be one of these exact words:
- normal (for routine, heartbeat, info)
- atenção (for warning, slow, suspicious)
- erro (for failure, crash, 500 error)
- sucesso (for success, 200 ok, completed)

Do NOT use any other words like 'atendimento'. Output ONLY 'normal', 'atenção', 'erro', or 'sucesso'."""

PROMPT_TEMPLATE = "[INST] Classify this log: {log_content} [/INST]\nCategory:"

async def test_model():
    async with httpx.AsyncClient() as client:
        print(f"Testing model: {MODEL}")
        results = []
        for test in TEST_LOGS:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": MODEL,
                    "prompt": PROMPT_TEMPLATE.format(log_content=test["message"]),
                    "system": SYSTEM_PROMPT,
                    "stream": False,
                    "options": {
                        "temperature": 0.0,
                        "num_predict": 5, # Limit tokens to prevent lists
                        "stop": ["\n", ".", " "] # Stop at first break
                    }
                },
                timeout=30.0
            )
            raw_output = response.json().get("response", "").strip().lower()
            
            # Extract just the word if the model adds fluff (though prompt says don't)
            # We want to see if it obeys.
            
            is_correct = raw_output in ["normal", "atenção", "erro", "sucesso"]
            match_expected = raw_output == test["expected"]
            
            print(f"Log: {test['message'][:30]}... | Output: '{raw_output}' | Valid: {is_correct} | Match: {match_expected}")
            results.append({
                "log": test["message"],
                "output": raw_output,
                "valid": is_correct,
                "match": match_expected
            })
            
        valid_count = sum(1 for r in results if r["valid"])
        match_count = sum(1 for r in results if r["match"])
        print(f"\nSummary: {valid_count}/{len(TEST_LOGS)} valid outputs, {match_count}/{len(TEST_LOGS)} matches.")

if __name__ == "__main__":
    try:
        asyncio.run(test_model())
    except Exception as e:
        print(f"Error: {e}. Is Ollama running?")
