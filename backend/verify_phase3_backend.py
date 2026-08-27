"""
Phase 3 Text Compliance Engine Verification Script.
Tests Tone Similarity, Deterministic Restricted Terms Check, Zero-Shot Claims Classification, and Scoring.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.supabase_client import get_supabase_admin
from app.services.compliance_service import run_text_compliance_audit


def test_phase3_compliance():
    print("==================================================")
    print("CampaignX Phase 3 Compliance Engine Verification")
    print("==================================================")

    client = get_supabase_admin()
    if not client:
        print("[ERROR] Supabase admin client unavailable.")
        return False

    # Get a brand profile ID
    profiles = client.table("brand_profiles").select("*").limit(1).execute()
    if not profiles.data or len(profiles.data) == 0:
        print("[WARNING] No brand profiles found in DB.")
        return True

    brand = profiles.data[0]
    brand_id = brand["id"]
    print(f"1. Selected Brand Profile for Testing: '{brand['name']}' (ID: {brand_id})")

    # Test Case A: Non-compliant text containing restricted terms & unrealistic claims
    non_compliant_text = "Magically land your dream job overnight with AI tricks! We guarantee 100% risk-free earnings."
    print(f"\n2. Testing Audit Case A (Non-compliant text with restricted terms):\n   \"{non_compliant_text}\"")

    res_a = run_text_compliance_audit(
        brand_profile_id=brand_id,
        text=non_compliant_text,
        user_id=brand["user_id"]
    )

    print(f"   -> Overall Score: {res_a['overall_score']} / 100")
    print(f"   -> Tone Similarity: {res_a['tone_similarity_score']:.4f}")
    print(f"   -> Status: [{res_a['status'].upper()}]")
    print(f"   -> Total Flags Raised ({len(res_a['flags'])}):")
    for idx, f in enumerate(res_a['flags'], 1):
        print(f"      #{idx} [{f['severity'].upper()}] {f['flag_type']}: {f['explanation']}")

    # Test Case B: Clean On-Brand Copy Text
    clean_text = "Empowering tech aspirants and software engineers with AI-powered career readiness tools."
    print(f"\n3. Testing Audit Case B (Clean on-brand copy):\n   \"{clean_text}\"")

    res_b = run_text_compliance_audit(
        brand_profile_id=brand_id,
        text=clean_text,
        user_id=brand["user_id"]
    )

    print(f"   -> Overall Score: {res_b['overall_score']} / 100")
    print(f"   -> Tone Similarity: {res_b['tone_similarity_score']:.4f}")
    print(f"   -> Status: [{res_b['status'].upper()}]")
    print(f"   -> Total Flags Raised ({len(res_b['flags'])}):")
    for idx, f in enumerate(res_b['flags'], 1):
        print(f"      #{idx} [{f['severity'].upper()}] {f['flag_type']}: {f['explanation']}")

    print("\n==================================================")
    print("[SUCCESS] Phase 3 Text Compliance Engine Verification Complete!")
    print("==================================================")
    return True


if __name__ == "__main__":
    test_phase3_compliance()
