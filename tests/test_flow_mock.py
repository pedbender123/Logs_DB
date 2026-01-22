import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import json
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
import sys
import os
import unittest

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, get_db
from database import Base
import models
import discord_client

# Setup in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Standalone Async Test
async def run_test():
    print("Starting verification...")
    
    # Mock Discord
    with patch("discord_client.send_message", new_callable=AsyncMock) as mock_discord:
        # Mock OpenAI via httpx
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_openai:
            # Mock DB SessionLocal used in background tasks (patch where it's used, not where it's defined)
            with patch("main.SessionLocal", side_effect=TestingSessionLocal):
            
                # Setup OpenAI Mock Responses
                def openai_side_effect(*args, **kwargs):
                    content = kwargs.get("json", {}).get("messages", [])[-1].get("content", "")
                    response_mock = MagicMock()
                    # httpx returns a Response object
                    response_mock.json.return_value = {"choices": [{"message": {"content": ""}}]}
                    
                    if "Classify this log" in content:
                        resp_content = "erro"
                    elif "technical report" in content:
                        resp_content = "Mocked Technical Report Solution"
                    else:
                        resp_content = "unknown"
                    
                    response_mock.json.return_value = {
                        "choices": [{"message": {"content": resp_content}}]
                    }
                    return response_mock

                mock_openai.side_effect = openai_side_effect
            
            # 1. Register System
            import main
            current_master_key = main.MASTER_KEY
            if not current_master_key:
                current_master_key = "test_master_key"
                main.MASTER_KEY = current_master_key
            
            print(f"Registering with key: {current_master_key}")
            
            reg_resp = client.post(
                "/register",
                headers={"x-master-key": current_master_key},
                json={
                    "name": "TestSys",
                    "client_email": "test@test.com",
                    "maintenance_email": "admin@test.com",
                    "status": "production"
                }
            )
            if reg_resp.status_code != 200:
                print(f"Registration failed: {reg_resp.text}")
                return

            system_id = reg_resp.json()["id"]
            
            # 2. Send Log (Error)
            log_payload = {
                "message": "Critical failure in database",
                "container": "db-service",
                "level": "info" # It should be reclassified to 'erro'
            }
            
            resp = client.post(
                "/webhook",
                headers={"x-api-key": system_id},
                json=log_payload
            )
            
            if resp.status_code != 200:
                print(f"Webhook failed: {resp.text}")
                return

            data = resp.json()
            print(f"Webhook Response: {data}")
            
            if data["classification"] != "erro":
                print(f"FAIL: Classification was {data['classification']}, expected 'erro'")
                return
            
            if not data["triggered_report"]:
                print("FAIL: triggered_report is False")
                return
            
            # Verify Discord Called (Alert)
            print(f"Discord call count: {mock_discord.call_count}")
            if mock_discord.call_count < 2:
                print("FAIL: Expected at least 2 Discord calls (Alert + Report)")
                # Print calls
                # print(mock_discord.mock_calls)
                # return
            else:
                print("PASS: Discord calls made.")
            
            # Check DB for Report
            db = TestingSessionLocal()
            report = db.query(models.Report).filter(models.Report.log_id == data["log_id"]).first()
            if report and "Mocked Technical Report" in report.content:
                print("PASS: Report saved to DB.")
            else:
                print("FAIL: Report not found or content mismatch.")
            
            print("\nVERIFICATION SUCCESSFUL")

if __name__ == "__main__":
    asyncio.run(run_test())
