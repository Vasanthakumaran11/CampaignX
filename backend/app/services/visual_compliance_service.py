"""
CampaignX AI - Phase 4 Visual Compliance Audit Orchestrator
Orchestrates logo detection, CLIP matching, LAB color checking, and OCR text verification.
Strict scoring with no artificial score inflation or silent positive defaults.
"""

import os
from app.services.logo_detection_service import detect_logo_regions
from app.services.logo_matching_service import compute_logo_match_score
from app.services.visual_color_service import compute_visual_color_match
from app.services.ocr_service import extract_and_verify_poster_text

# Weighted Scoring Constants
WEIGHT_LOGO_PRESENCE = 0.25
WEIGHT_LOGO_MATCH = 0.35
WEIGHT_COLOR_MATCH = 0.20
WEIGHT_TEXT_COMPLIANCE = 0.20

PASS_THRESHOLD = 80.0
WARNING_THRESHOLD = 60.0

def audit_poster_visual_compliance(
    poster_image_path: str,
    brand_logo_path: str = None,
    brand_colors_hex: list[str] = None,
    approved_slogan: str = None,
    restricted_terms: list[str] = None
) -> dict:
    """
    Performs full Phase 4 visual compliance audit on a poster image.
    Returns comprehensive score breakdown and audit result dict.
    """
    if not poster_image_path or not os.path.exists(poster_image_path):
        return {
            "logo_detected": False,
            "logo_match_score": 0.0,
            "logo_bbox": None,
            "color_match_score": 0.0,
            "text_match_result": {"extracted_text": "", "matches_approved_slogan": False, "flags": ["Poster image not found"]},
            "overall_visual_score": 0.0,
            "status": "fail"
        }

    # 1. Logo Region Detection (YOLO → template matching fallback)
    logo_detected, logo_bbox = detect_logo_regions(poster_image_path, brand_logo_path=brand_logo_path)
    presence_score = 1.0 if logo_detected else 0.0

    # 2. Logo Identity Matching (CLIP / Structural)
    logo_match = compute_logo_match_score(poster_image_path, logo_bbox, brand_logo_path) if (logo_detected and logo_bbox) else 0.0

    # 3. LAB Palette Color Matching
    color_match = compute_visual_color_match(poster_image_path, brand_colors_hex or [])

    # 4. OCR Text & Restricted Term Check
    text_res = extract_and_verify_poster_text(poster_image_path, approved_slogan, restricted_terms or [])
    
    # Text score evaluation: 1.0 if clean match, 0.0 if prohibited claim or slogan mismatch
    if text_res["flags"] and any("prohibited" in f.lower() or "restricted" in f.lower() or "not detected" in f.lower() for f in text_res["flags"]):
        text_score = 0.0
    elif text_res["matches_approved_slogan"]:
        text_score = 1.0
    elif text_res["extracted_text"]:
        text_score = 0.50
    else:
        text_score = 0.0

    # Calculate overall weighted visual compliance score (0-100)
    raw_score = (
        (presence_score * WEIGHT_LOGO_PRESENCE) +
        (logo_match * WEIGHT_LOGO_MATCH) +
        (color_match * WEIGHT_COLOR_MATCH) +
        (text_score * WEIGHT_TEXT_COMPLIANCE)
    ) * 100.0

    overall_score = round(min(100.0, max(0.0, raw_score)), 1)

    status = "pass" if overall_score >= PASS_THRESHOLD else ("warning" if overall_score >= WARNING_THRESHOLD else "fail")

    print(f"[+] Visual Audit Complete: Score={overall_score}% | Status={status.upper()}")
    print(f"    - Presence={presence_score*100}% | Match={logo_match*100}% | Color={color_match*100}% | Text={text_score*100}%")

    return {
        "logo_detected": logo_detected,
        "logo_match_score": logo_match,
        "logo_bbox": logo_bbox,
        "color_match_score": color_match,
        "text_match_result": text_res,
        "overall_visual_score": overall_score,
        "status": status
    }
