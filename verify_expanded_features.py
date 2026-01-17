import requests
import time
import json

API_URL = "http://localhost:8001"
MASTER_KEY = "pbpm_secret_master_key"

def verify_system_flow():
    print("--- Starting End-to-End Verification ---")
    
    # 1. Register a complex system
    print("\n1. Registering 'Prod-API-Server'...")
    reg_data = {
        "name": "Prod-API-Server",
        "client_name": "Empresa XPTO",
        "client_email": "pedro@xpto.com",
        "client_phone": "11999999999",
        "maintenance_email": "admin@pbpm.com",
        "status": "production",
        "technical_info": "Server: AWS EC2 t3.medium\nOS: Ubuntu 22.04\nDB: RDS Postgres 15\nApp: FastAPI v0.100\nMemory: 4GB"
    }
    
    resp = requests.post(
        f"{API_URL}/register",
        headers={"x-master-key": MASTER_KEY},
        json=reg_data
    )
    if resp.status_code != 200:
        print(f"Error registering system: {resp.text}")
        return
    
    system = resp.json()
    api_key = system["id"]
    print(f"Success! System ID: {api_key}")

    # 2. Send a Success Log
    print("\n2. Sending success log...")
    requests.post(
        f"{API_URL}/webhook",
        headers={"x-api-key": api_key},
        json={"message": "Backup concluído com sucesso.", "level": "sucesso"}
    )

    # 3. Send an Error Log (Trigger AI)
    print("\n3. Sending error log (triggering AI Report)...")
    err_log = {
        "message": "CRITICAL: Connection pool exhausted. Too many open connections to RDS.",
        "level": "erro",
        "container": "api-gateway-v2"
    }
    err_resp = requests.post(
        f"{API_URL}/webhook",
        headers={"x-api-key": api_key},
        json=err_log
    )
    log_id = err_resp.json()["log_id"]
    print(f"Log ID: {log_id}. Waiting for AI background task...")

    # Wait for AI report generation
    time.sleep(10)

    # 4. Check Reports
    print("\n4. Checking if report was generated...")
    rep_resp = requests.get(f"{API_URL}/reports")
    if rep_resp.status_code != 200:
        print(f"Error fetching reports: {rep_resp.text}")
        return

    reports = rep_resp.json()
    if not isinstance(reports, list):
        print(f"Unexpected reports format: {reports}")
        return

    found = False
    for r in reports:
        if isinstance(r, dict) and r.get("log_id") == log_id:
            found = True
            print("FOUND REPORT CONTENT:")
            print("-" * 50)
            print(r.get("content"))
            print("-" * 50)
            break
    
    if not found:
        print("FAILED: Report not found in DB after timeout.")

    # 5. Check Stats
    print("\n5. Checking Daily Stats...")
    stats_resp = requests.get(f"{API_URL}/stats/daily")
    print(f"Stats received: {json.dumps(stats_resp.json(), indent=2)}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_system_flow()
