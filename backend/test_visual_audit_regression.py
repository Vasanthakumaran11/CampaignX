"""
CampaignX AI - Phase 4 Visual Compliance Regression Test Suite

Regression tests to prevent False-PASS bugs:
1. Known-Bad Test Case: Off-palette poster, no logo, prohibited claim text. MUST NOT pass.
2. Known-Good Test Case: Genuine brand colors, approved slogan. MUST pass.
"""

import os
import sys
from PIL import Image, ImageDraw
from app.services.visual_compliance_service import audit_poster_visual_compliance

def create_test_posters(test_dir: str):
    os.makedirs(test_dir, exist_ok=True)

    # 1. Known-Bad Poster (Neon Green/Magenta background, prohibited guarantee claim text)
    bad_path = os.path.join(test_dir, "known_bad_poster.png")
    img_bad = Image.new("RGB", (600, 800), (0, 255, 128)) # Neon green background
    draw_bad = ImageDraw.Draw(img_bad)
    # Magenta header bar
    draw_bad.rectangle([0, 0, 600, 150], fill=(255, 0, 255))
    draw_bad.text((30, 40), "ONE PLATFORM. ZERO WORRIES. 100% SUCCESS.", fill=(255, 255, 255))
    draw_bad.text((30, 300), "100% JOB GUARANTEE... we will pay you INR 1,00,000 CASH", fill=(255, 255, 0))
    img_bad.save(bad_path)

    # 2. Known-Good Poster (Dark Navy/Cyan palette, approved slogan)
    good_path = os.path.join(test_dir, "known_good_poster.png")
    img_good = Image.new("RGB", (600, 800), (11, 15, 25)) # #0B0F19 Dark Navy background
    draw_good = ImageDraw.Draw(img_good)
    # Cyan accent header bar
    draw_good.rectangle([0, 0, 600, 120], fill=(6, 182, 212)) # #06B6D4 Cyan
    # Brand logo block
    draw_good.rectangle([40, 30, 140, 90], fill=(99, 102, 241), outline=(255, 255, 255), width=2) # #6366F1 Indigo
    draw_good.text((50, 50), "FutureReady", fill=(255, 255, 255))
    # Approved slogan text
    draw_good.text((40, 250), "Scale Marketing with Confidence", fill=(255, 255, 255))
    img_good.save(good_path)

    # 3. Create sample logo file for testing
    logo_path = os.path.join(test_dir, "brand_logo_sample.png")
    img_logo = Image.new("RGB", (100, 60), (99, 102, 241))
    draw_logo = ImageDraw.Draw(img_logo)
    draw_logo.text((10, 20), "FutureReady", fill=(255, 255, 255))
    img_logo.save(logo_path)

    return bad_path, good_path, logo_path

def test_known_bad_poster():
    print("\n[+] Running Regression Test 1: Known-Bad Poster (Off-palette, no logo, prohibited claim)...")
    test_dir = os.path.join(os.path.dirname(__file__), "test_assets")
    bad_path, _, logo_path = create_test_posters(test_dir)

    future_ready_colors = ["#0B0F19", "#131B2E", "#6366F1", "#06B6D4"]
    approved_slogan = "Scale Marketing with Confidence"
    restricted_terms = ["100% JOB GUARANTEE", "pay you", "1,00,000 CASH", "CASH"]

    audit_result = audit_poster_visual_compliance(
        poster_image_path=bad_path,
        brand_logo_path=logo_path,
        brand_colors_hex=future_ready_colors,
        approved_slogan=approved_slogan,
        restricted_terms=restricted_terms
    )

    print("  └─ Audit Result:", audit_result)

    # Strict Assertions
    assert audit_result["status"] != "pass", f"FAIL REGRESSION: Known-bad poster status was '{audit_result['status']}', expected 'fail' or 'warning'."
    assert audit_result["overall_visual_score"] < 60.0, f"FAIL REGRESSION: Score was {audit_result['overall_visual_score']}%, expected < 60.0%."
    assert "Bold Brands Begin Here" not in audit_result["text_match_result"]["extracted_text"], "FAIL REGRESSION: Hardcoded placeholder text detected in OCR output."
    assert len(audit_result["text_match_result"]["flags"]) > 0, "FAIL REGRESSION: Expected prohibited claim flags, none were generated."

    print("  ✅ TEST 1 PASSED: Known-bad poster correctly rejected & flagged!")

def test_known_good_poster():
    print("\n[+] Running Regression Test 2: Known-Good Poster (Brand colors, approved slogan)...")
    test_dir = os.path.join(os.path.dirname(__file__), "test_assets")
    _, good_path, logo_path = create_test_posters(test_dir)

    future_ready_colors = ["#0B0F19", "#131B2E", "#6366F1", "#06B6D4"]
    approved_slogan = "Scale Marketing with Confidence"

    audit_result = audit_poster_visual_compliance(
        poster_image_path=good_path,
        brand_logo_path=logo_path,
        brand_colors_hex=future_ready_colors,
        approved_slogan=approved_slogan
    )

    print("  └─ Audit Result:", audit_result)

    # Assertions
    assert audit_result["color_match_score"] >= 0.70, f"FAIL REGRESSION: Color match was {audit_result['color_match_score']}, expected >= 0.70."
    assert audit_result["text_match_result"]["matches_approved_slogan"] == True, f"FAIL REGRESSION: Slogan match was False, OCR extracted: '{audit_result['text_match_result']['extracted_text']}'."
    assert "Bold Brands Begin Here" not in audit_result["text_match_result"]["extracted_text"], "FAIL REGRESSION: Hardcoded placeholder text detected."

    print("  ✅ TEST 2 PASSED: Known-good poster color & OCR slogan verified!")

if __name__ == "__main__":
    try:
        test_known_bad_poster()
        test_known_good_poster()
        print("\n🎉 ALL VISUAL COMPLIANCE REGRESSION TESTS PASSED CLEANLY!")
    except AssertionError as ae:
        print(f"\n❌ REGRESSION TEST ASSERTION FAILED: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        sys.exit(1)
