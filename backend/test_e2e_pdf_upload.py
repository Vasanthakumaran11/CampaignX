"""
End-to-end verification script for Step 10:
1. Creates a synthetic Brand Guideline PDF with embedded vector colors, logos, voice copy, and rules using PyMuPDF.
2. Creates a Brand Profile via FastAPI.
3. Uploads the PDF via /upload-guideline.
4. Polls /status until 'ready'.
5. Inspects extracted colors, rules, logos, and voice samples.
6. Patches a color's usage_label to 'primary'.
7. Confirms the update persisted in Supabase.
"""

import sys
import os
import time
import pymupdf as fitz
from PIL import Image, ImageDraw
import io
import httpx


def generate_sample_brand_pdf() -> bytes:
    doc = fitz.open()

    # Page 1: Cover & Intro
    page1 = doc.new_page()
    page1.insert_text(
        (50, 80),
        "ACME DYNAMICS — OFFICIAL BRAND GUIDELINES 2026",
        fontsize=18,
        color=(0.1, 0.15, 0.5)
    )
    page1.insert_text(
        (50, 130),
        "Our tone of voice is bold, friendly, and relentlessly innovative in every conversation.",
        fontsize=12,
        color=(0.2, 0.2, 0.2)
    )

    # Insert a sample logo image on page 1
    logo_img = Image.new("RGBA", (200, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo_img)
    draw.rectangle([10, 10, 190, 90], fill=(79, 70, 229, 255))  # Indigo #4F46E5
    draw.ellipse([40, 25, 80, 65], fill=(245, 158, 11, 255))    # Amber #F59E0B
    
    img_byte_arr = io.BytesIO()
    logo_img.save(img_byte_arr, format='PNG')
    logo_bytes = img_byte_arr.getvalue()

    rect = fitz.Rect(50, 180, 250, 280)
    page1.insert_image(rect, stream=logo_bytes)

    # Page 2: Color Palette & Rules
    page2 = doc.new_page()
    page2.insert_text(
        (50, 80),
        "COLOR SPECIFICATIONS & USAGE",
        fontsize=16,
        color=(0.1, 0.15, 0.5)
    )
    page2.insert_text(
        (50, 120),
        "Primary color is #4F46E5 with RGB (79, 70, 229). Accent color is #F59E0B.",
        fontsize=11,
        color=(0.2, 0.2, 0.2)
    )
    page2.insert_text(
        (50, 160),
        "Leave at least 20% clear space around the main logo lockup and do not alter proportions.",
        fontsize=11,
        color=(0.2, 0.2, 0.2)
    )
    page2.insert_text(
        (50, 200),
        "Do not claim 100% market dominance without explicit legal disclaimer approval.",
        fontsize=11,
        color=(0.2, 0.2, 0.2)
    )

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def run_e2e_verification():
    print("==================================================")
    print("CampaignX Phase 1: End-to-End Pipeline Verification")
    print("==================================================")

    client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=30.0)

    # 1. Health check
    print("\n[Step 1] Checking API Health...")
    health = client.get("/health").json()
    print(f"  Health status: {health.get('status')} (Supabase: {health.get('supabase', {}).get('connected')})")
    assert health.get("status") == "healthy", "Backend is not in healthy state"

    # 2. Create Brand Profile
    print("\n[Step 2] Creating Brand Profile 'Acme Dynamics'...")
    create_res = client.post("/api/brand-profiles", json={"name": "Acme Dynamics"}).json()
    profile_id = create_res["id"]
    print(f"  [OK] Profile created with ID: {profile_id}")

    # 3. Generate and Upload Guideline PDF
    print("\n[Step 3] Uploading Brand Guideline PDF...")
    pdf_bytes = generate_sample_brand_pdf()
    files = {"file": ("Acme_Brand_Guidelines_2026.pdf", pdf_bytes, "application/pdf")}
    upload_res = client.post(f"/api/brand-profiles/{profile_id}/upload-guideline", files=files).json()
    print(f"  [OK] Upload accepted, status: {upload_res['status']}")

    # 4. Poll status until 'ready'
    print("\n[Step 4] Polling status every 1.5s...")
    status = "processing"
    for attempt in range(1, 20):
        time.sleep(1.5)
        status_res = client.get(f"/api/brand-profiles/{profile_id}/status").json()
        status = status_res["status"]
        print(f"  Attempt {attempt}: status = '{status}'")
        if status in ("ready", "failed"):
            break

    assert status == "ready", f"Expected status 'ready', but got '{status}'"
    print("  [OK] Async ingestion pipeline completed successfully!")

    # 5. Fetch full profile and verify extractions
    print("\n[Step 5] Inspecting Extracted Structured Profile...")
    profile = client.get(f"/api/brand-profiles/{profile_id}").json()

    colors = profile.get("colors", [])
    logos = profile.get("logos", [])
    voice_samples = profile.get("voice_samples", [])
    rules = profile.get("rules", [])

    print(f"  Extracted Colors ({len(colors)}): {[c['hex_code'] for c in colors]}")
    print(f"  Extracted Logos ({len(logos)}): {[l['file_path'] for l in logos]}")
    print(f"  Extracted Voice Samples ({len(voice_samples)}): {len(voice_samples)} items")
    print(f"  Extracted Rules ({len(rules)}):")
    for r in rules:
        print(f"    - [Page {r.get('page_number')}] [{r.get('category')}]: {r.get('rule_text')[:50]}...")

    assert len(colors) > 0, "Expected at least 1 extracted color"
    assert len(rules) > 0, "Expected at least 1 extracted rule"
    assert len(logos) > 0, "Expected at least 1 extracted logo"

    # 6. Correct/Label a Color (PATCH test)
    print("\n[Step 6] Testing PATCH Color Usage Label...")
    first_color = colors[0]
    color_id = first_color["id"]
    patch_res = client.patch(
        f"/api/brand-profiles/{profile_id}/colors/{color_id}",
        json={"usage_label": "primary"}
    ).json()
    print(f"  [OK] Updated color {patch_res['hex_code']} usage_label to: '{patch_res['usage_label']}'")

    # 7. Confirm persistence
    updated_profile = client.get(f"/api/brand-profiles/{profile_id}").json()
    updated_color = next((c for c in updated_profile["colors"] if c["id"] == color_id), None)
    assert updated_color and updated_color["usage_label"] == "primary", "Color update failed to persist"
    print("  [OK] PATCH persistence verified.")

    print("\n==================================================")
    print("ALL PHASE 1 END-TO-END VERIFICATION CHECKS PASSED!")
    print("Profile ID for Review UI: http://localhost:5173/brands/" + profile_id)
    print("==================================================")


if __name__ == "__main__":
    run_e2e_verification()
