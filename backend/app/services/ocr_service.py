"""
CampaignX AI - Phase 4 OCR Service
Reads embedded text from poster images and checks against approved slogan & restricted rules.
No hardcoded fallback strings or fake matches.
"""

import os
import re
from functools import lru_cache
from PIL import Image
import numpy as np


def normalize_text_for_match(value: str) -> str:
    if not value:
        return ""
    normalized = value.lower()
    normalized = normalized.replace("-", " ")
    normalized = normalized.replace("_", " ")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


@lru_cache(maxsize=1)
def get_easyocr_reader():
    import easyocr
    return easyocr.Reader(['en'], gpu=False)

def extract_and_verify_poster_text(
    poster_image_path: str,
    approved_slogan: str = None,
    restricted_terms: list[str] = None
) -> dict:
    """
    Extracts embedded text via OCR (EasyOCR / pytesseract) and verifies slogan match & restricted terms.
    Returns {"extracted_text": str, "matches_approved_slogan": bool, "flags": list}.
    """
    if not poster_image_path or not os.path.exists(poster_image_path):
        return {
            "extracted_text": "",
            "matches_approved_slogan": False,
            "flags": ["Poster image file not found"]
        }

    extracted_text = ""
    ocr_attempted = False

    # Attempt 1: EasyOCR with PIL RGB image to Numpy conversion
    try:
        reader = get_easyocr_reader()
        pil_img = Image.open(poster_image_path).convert("RGB")
        img_np = np.array(pil_img)
        raw_res = reader.readtext(img_np, detail=0)
        
        if isinstance(raw_res, list):
            extracted_text = " ".join([str(item) for item in raw_res if item]).strip()
        ocr_attempted = True
        print(f"[+] EasyOCR Extracted Text: '{extracted_text}'")
    except Exception as e:
        print(f"[!] EasyOCR extraction error: {e}")

    # Attempt 2: Pytesseract fallback if EasyOCR produced empty result
    if not extracted_text:
        try:
            import pytesseract
            img = Image.open(poster_image_path)
            extracted_text = pytesseract.image_to_string(img).strip()
            ocr_attempted = True
            print(f"[+] Pytesseract Extracted Text: '{extracted_text}'")
        except Exception as e:
            print(f"[!] Pytesseract extraction error: {e}")

    flags = []
    matches_slogan = False

    # Check approved slogan match against REAL extracted text
    if approved_slogan and approved_slogan.strip():
        slogan_clean = normalize_text_for_match(approved_slogan)
        extracted_clean = normalize_text_for_match(extracted_text)

        if slogan_clean and slogan_clean in extracted_clean:
            matches_slogan = True
        else:
            slogan_words = [w for w in slogan_clean.split() if len(w) > 2]
            extracted_words = extracted_clean.split() if extracted_clean else []
            matched_words = [w for w in slogan_words if w in extracted_words]
            if len(slogan_words) > 0 and (len(matched_words) / len(slogan_words)) >= 0.6:
                matches_slogan = True
            else:
                matches_slogan = False
                flags.append(f"Approved slogan '{approved_slogan}' not detected in poster OCR text.")
    else:
        # If no slogan required, set matches_slogan to True if OCR ran without critical errors
        matches_slogan = True if extracted_text else False

    # Check prohibited claims & restricted terms against REAL extracted text
    if restricted_terms and extracted_text:
        extracted_lower = extracted_text.lower()
        for term in restricted_terms:
            if term and term.strip():
                clean_term = term.strip().lower()
                if clean_term in extracted_lower:
                    flags.append(f"Prohibited claim / restricted term detected: '{term.strip()}'")

    if not extracted_text:
        flags.append("No readable embedded text detected on poster.")

    return {
        "extracted_text": extracted_text,
        "matches_approved_slogan": matches_slogan,
        "flags": flags
    }
