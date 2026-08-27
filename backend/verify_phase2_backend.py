"""
Phase 2 Backend Pipeline Verification Script.
Tests Retrieval, Grounding Prompt Construction, and Copy Variant Generation.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.supabase_client import get_supabase_admin
from app.services.retrieval_service import retrieve_grounding_context
from app.services.generation_service import generate_copy_variants


def test_phase2_pipeline():
    print("==================================================")
    print("CampaignX Phase 2 Backend Pipeline Verification")
    print("==================================================")

    client = get_supabase_admin()
    if not client:
        print("[ERROR] Supabase client unavailable.")
        return False

    # Fetch a brand profile ID from database
    profiles = client.table("brand_profiles").select("*").limit(1).execute()
    if not profiles.data or len(profiles.data) == 0:
        print("[WARNING] No brand profiles found in DB. Ingest a brand kit first.")
        return True

    brand = profiles.data[0]
    brand_id = brand["id"]
    print(f"1. Selected Brand Profile for Testing: '{brand['name']}' (ID: {brand_id})")

    # Test Retrieval Service
    query_text = "Drive signups for new AI analytics feature launch for enterprise tech leaders"
    print(f"\n2. Testing RAG Retrieval for Query: '{query_text}'...")
    context = retrieve_grounding_context(brand_id, query_text, top_k=5)

    voice_anchors = context.get("voice_anchors", [])
    restricted_rules = context.get("restricted_rules", [])

    print(f"   -> Retained Voice Anchors ({len(voice_anchors)}):")
    for idx, a in enumerate(voice_anchors, 1):
        print(f"      #{idx} [Sim: {a.get('similarity', 0.0):.4f}] ({a['source']}): \"{a['sample_text'][:60]}...\"")

    print(f"   -> Retained Restricted Rules ({len(restricted_rules)}):")
    for idx, r in enumerate(restricted_rules, 1):
        print(f"      #{idx}: \"{r['rule_text']}\"")

    # Test Generation Service
    brief_sample = {
        "brand_profile_id": brand_id,
        "campaign_goal": "Drive signups for feature launch",
        "target_audience": "Enterprise marketing directors & tech leads",
        "channel": "linkedin",
        "product_or_feature": "CampaignX AI RAG Copilot",
        "additional_context": "Highlight speed, accuracy, and brand alignment"
    }

    print("\n3. Testing Copy Variant Generation Service...")
    variants = generate_copy_variants(brief_sample, context, generation_index=1)

    print(f"   -> Generated {len(variants)} Grounded Copy Variants:")
    for idx, v in enumerate(variants, 1):
        g_ids = v.get("grounding_voice_sample_ids", [])
        print(f"\n   Variant #{idx} [{v['variant_type'].upper()}] (Grounded in {len(g_ids)} voice anchors):")
        print(f"   \"{v['variant_text']}\"")

    print("\n==================================================")
    print("[SUCCESS] Phase 2 Backend Pipeline Verification Complete!")
    print("==================================================")
    return True


if __name__ == "__main__":
    test_phase2_pipeline()
