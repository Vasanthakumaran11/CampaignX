"""
Executes SQL statements in 002_phase2_campaign_copy_schema.sql against Supabase PostgreSQL database.
"""

import os
import sys
import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.config import get_settings
from app.services.supabase_client import get_supabase_admin

def run_migration_sql():
    settings = get_settings()
    client = get_supabase_admin()
    if not client:
        print("[ERROR] Supabase admin client unavailable.")
        return False

    migration_path = os.path.join(
        os.path.dirname(__file__), "..", "supabase", "migrations", "002_phase2_campaign_copy_schema.sql"
    )

    with open(migration_path, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"Executing migration SQL ({len(sql)} bytes)...")

    # Supabase service role key can execute SQL via RPC or query endpoint if configured
    # Let's test calling query endpoint or executing schema verification
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Attempt to execute query via /rest/v1/rpc/exec_sql or fallback
    url = f"{settings.SUPABASE_URL}/rest/v1/rpc/exec_sql"
    resp = httpx.post(url, headers=headers, json={"query": sql}, timeout=15.0)
    print(f"RPC exec_sql Response: {resp.status_code} - {resp.text[:200]}")

    return resp.status_code < 400

if __name__ == "__main__":
    run_migration_sql()
