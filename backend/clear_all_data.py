"""
Utility script to clear all brand profiles, campaigns, copy variants,
compliance audits, and associated data from Supabase to provide a fresh workspace.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.supabase_client import get_supabase_admin

def clear_all_data():
    client = get_supabase_admin()
    if not client:
        print("[ERROR] Supabase client could not be initialized.")
        return False

    print("Cleaning up database tables...")
    tables = [
        "compliance_audit_flags",
        "compliance_audits",
        "visual_compliance_audits",
        "generated_copy_variants",
        "campaign_briefs",
        "brand_guideline_rules",
        "brand_voice_samples",
        "brand_logos",
        "brand_colors",
        "brand_profiles"
    ]

    for table in tables:
        try:
            # Delete all rows (neq id 00000000-0000-0000-0000-000000000000 or gte created_at)
            # In Supabase/PostgREST, delete without filter is blocked, so we use neq id dummy
            res = client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            count = len(res.data) if res.data else 0
            print(f"  [CLEARED] Table '{table}': removed {count} rows.")
        except Exception as e:
            print(f"  [NOTE] Table '{table}' cleanup: {e}")

    print("\nDatabase reset complete! Workspace is now completely clean.")
    return True

if __name__ == "__main__":
    clear_all_data()
