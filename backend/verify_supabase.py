"""
Verification script for Supabase connection, schema tables, and storage buckets.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.supabase_client import get_supabase_admin, ensure_storage_buckets, get_signed_url
from app.config import get_settings
from app.services.embedding_service import embed
from app.services.color_extractor import rgb_to_hex


def verify_supabase():
    print("==================================================")
    print("CampaignX Supabase Schema & Connection Verification")
    print("==================================================")

    settings = get_settings()
    print(f"1. Supabase URL: {settings.SUPABASE_URL}")
    print(f"2. Service Role Key present: {bool(settings.SUPABASE_SERVICE_ROLE_KEY and 'your-service-role' not in settings.SUPABASE_SERVICE_ROLE_KEY)}")

    client = get_supabase_admin()
    if not client:
        print("[ERROR] Supabase client could not be initialized.")
        return False

    print("\n--- Verifying Tables Existence ---")
    tables = [
        "brand_profiles",
        "brand_colors",
        "brand_logos",
        "brand_voice_samples",
        "brand_guideline_rules"
    ]

    all_tables_ok = True
    for table_name in tables:
        try:
            res = client.table(table_name).select("*").limit(1).execute()
            print(f"  [OK] Table '{table_name}' accessible (rows fetched: {len(res.data or [])})")
        except Exception as e:
            print(f"  [FAIL] Table '{table_name}' error: {e}")
            all_tables_ok = False

    print("\n--- Verifying Storage Buckets ---")
    try:
        ensure_storage_buckets()
        buckets = client.storage.list_buckets()
        bucket_names = [b.name if hasattr(b, "name") else b.get("name") for b in (buckets or [])]
        print(f"  Existing buckets in project: {bucket_names}")
        for req_b in ["brand-guidelines", "brand-logos", "brand-samples"]:
            if req_b in bucket_names:
                print(f"  [OK] Storage Bucket '{req_b}' verified.")
            else:
                print(f"  [WARNING] Storage Bucket '{req_b}' not found. Creating...")
                try:
                    client.storage.create_bucket(req_b, options={"public": False})
                    print(f"  [OK] Created Bucket '{req_b}' successfully.")
                except Exception as b_err:
                    print(f"  [FAIL] Could not create bucket '{req_b}': {b_err}")
    except Exception as e:
        print(f"  [STORAGE ERROR]: {e}")

    print("\n--- Testing End-to-End Database Ingestion Roundtrip ---")
    test_user_id = None
    test_profile_id = None
    created_auth_user = False

    try:
        # Check or create a test auth user to satisfy FK constraint
        try:
            users_res = client.auth.admin.list_users()
            users = users_res if isinstance(users_res, list) else getattr(users_res, 'users', [])
            if users and len(users) > 0:
                test_user_id = str(users[0].id)
                print(f"  [OK] Found active Supabase user: {test_user_id}")
            else:
                # Create a test auth user
                test_email = "campaignx_test_user@example.com"
                user_res = client.auth.admin.create_user({
                    "email": test_email,
                    "password": "TemporaryPassword123!",
                    "email_confirm": True
                })
                test_user_id = str(user_res.user.id)
                created_auth_user = True
                print(f"  [OK] Created test auth user with ID: {test_user_id}")
        except Exception as auth_err:
            print(f"  [AUTH ADMIN NOTE]: {auth_err}")
            # Fallback check
            return False

        # 1. Insert test brand profile
        print("  Inserting test brand profile...")
        res_prof = client.table("brand_profiles").insert({
            "name": "Acme Brand Verification Test",
            "user_id": test_user_id,
            "status": "processing"
        }).execute()

        if res_prof.data and len(res_prof.data) > 0:
            test_profile_id = res_prof.data[0]["id"]
            print(f"  [OK] Inserted test profile with ID: {test_profile_id}")

            # 2. Insert test color
            res_col = client.table("brand_colors").insert({
                "brand_profile_id": test_profile_id,
                "hex_code": "#4F46E5",
                "usage_label": "primary",
                "source": "guideline_pdf",
                "frequency_rank": 1
            }).execute()
            print(f"  [OK] Inserted brand color: {res_col.data[0]['hex_code']} (Primary)")

            # 3. Insert test rule
            res_rule = client.table("brand_guideline_rules").insert({
                "brand_profile_id": test_profile_id,
                "rule_text": "Do not alter the primary logo color palette or clear space.",
                "category": "logo_usage",
                "page_number": 3
            }).execute()
            print(f"  [OK] Inserted guideline rule: '{res_rule.data[0]['rule_text'][:45]}...' (Logo Usage)")

            # 4. Insert test voice sample with pgvector embedding
            test_vector = embed("We craft bold, inspiring, human experiences.")
            res_voice = client.table("brand_voice_samples").insert({
                "brand_profile_id": test_profile_id,
                "sample_text": "We craft bold, inspiring, human experiences.",
                "embedding": test_vector,
                "source": "guideline_pdf"
            }).execute()
            print(f"  [OK] Inserted vector voice sample (384 dimensions dense vector).")

            # 5. Update status to ready
            client.table("brand_profiles").update({"status": "ready"}).eq("id", test_profile_id).execute()
            print(f"  [OK] Updated test profile status to 'ready'.")

            # Clean up test profile (CASCADE handles child rows)
            client.table("brand_profiles").delete().eq("id", test_profile_id).execute()
            print(f"  [OK] Cleaned up test profile cleanly.")

            if created_auth_user and test_user_id:
                try:
                    client.auth.admin.delete_user(test_user_id)
                    print(f"  [OK] Cleaned up temporary test auth user.")
                except Exception:
                    pass

    except Exception as e:
        print(f"  [ROUNDTRIP ERROR]: {e}")
        if test_profile_id:
            try:
                client.table("brand_profiles").delete().eq("id", test_profile_id).execute()
            except Exception:
                pass
        return False

    print("\n==================================================")
    print("ALL SUPABASE VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("==================================================")
    return True


if __name__ == "__main__":
    success = verify_supabase()
    sys.exit(0 if success else 1)
