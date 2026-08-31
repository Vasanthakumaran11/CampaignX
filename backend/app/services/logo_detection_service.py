"""
CampaignX AI - Phase 4 Pretrained Logo Detection Service

MODEL CHOICE & EVALUATION SUMMARY:
Primary Model: haydarkadioglu/brand-eye (filename: brandeye.pt)
License: Apache-2.0 (Open Source)
Architecture: YOLO (Ultralytics compatible)
Fallback: OpenCV multi-scale template matching (TM_CCOEFF_NORMED >= 0.35)

Strict Detection Rule: Returns True ONLY when a logo is genuinely detected by the
brand template matcher against the brand's stored logo OR pretrained YOLO model.
"""

import os
import logging
from functools import lru_cache
from huggingface_hub import hf_hub_download
from ultralytics import YOLO
import cv2
import numpy as np

logger = logging.getLogger(__name__)

CHOSEN_MODEL_REPO = "haydarkadioglu/brand-eye"
CHOSEN_MODEL_FILENAME = "brandeye.pt"

# Template matcher confidence threshold (0.0–1.0; TM_CCOEFF_NORMED)
TEMPLATE_MATCH_THRESHOLD = 0.35


@lru_cache(maxsize=1)
def get_logo_detector() -> YOLO:
    """
    Downloads and caches the pretrained YOLO logo detector from Hugging Face Hub.
    Uses singleton pattern via lru_cache for high performance.
    """
    logger.info(f"[+] Loading pretrained logo detector from Hugging Face: {CHOSEN_MODEL_REPO}/{CHOSEN_MODEL_FILENAME}...")
    model_path = hf_hub_download(repo_id=CHOSEN_MODEL_REPO, filename=CHOSEN_MODEL_FILENAME)
    return YOLO(model_path)


def _template_match_logo(poster_path: str, brand_logo_path: str) -> tuple[bool, dict | None]:
    """
    Multi-scale OpenCV template matching fallback.
    Tries 25 different scales of the brand logo against the poster.
    Returns (found: bool, bbox: dict | None) using TM_CCOEFF_NORMED.
    """
    if not os.path.exists(poster_path) or not os.path.exists(brand_logo_path):
        return False, None

    try:
        poster = cv2.imread(poster_path)
        if poster is None:
            return False, None

        # Handle PNG with alpha channel
        logo_raw = cv2.imread(brand_logo_path, cv2.IMREAD_UNCHANGED)
        if logo_raw is None:
            return False, None

        if logo_raw.ndim == 3 and logo_raw.shape[2] == 4:
            # Composite on white background
            alpha = logo_raw[:, :, 3:4] / 255.0
            logo = (logo_raw[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
        else:
            logo = logo_raw[:, :, :3] if logo_raw.ndim == 3 else cv2.cvtColor(logo_raw, cv2.COLOR_GRAY2BGR)

        ph, pw = poster.shape[:2]
        lh, lw = logo.shape[:2]

        best_val = -1.0
        best_box = None

        for scale in np.linspace(0.05, 0.75, 25):
            rw = int(pw * scale)
            rh = int(lh * (rw / max(1, lw)))
            if rw < 16 or rh < 16 or rw > pw or rh > ph:
                continue

            resized = cv2.resize(logo, (rw, rh))
            # Match on full color
            res = cv2.matchTemplate(poster, resized, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, max_loc = cv2.minMaxLoc(res)

            if max_val > best_val:
                best_val = max_val
                best_box = {
                    "x": int(max_loc[0]),
                    "y": int(max_loc[1]),
                    "w": int(rw),
                    "h": int(rh),
                    "confidence": float(max_val)
                }

        logger.info(f"[Template Match] Best score: {best_val:.3f} (threshold: {TEMPLATE_MATCH_THRESHOLD})")
        if best_val >= TEMPLATE_MATCH_THRESHOLD and best_box:
            logger.info(f"[Template Match] Logo found at {best_box}")
            return True, best_box

    except Exception as e:
        logger.warning(f"[Template Match] Error: {e}")

    return False, None


def detect_logo_regions(
    image_path: str,
    conf_threshold: float = 0.15,
    brand_logo_path: str | None = None
) -> tuple[bool, dict | None]:
    """
    Detects logo bounding boxes in an image.

    Strategy:
      1. If brand_logo_path is provided, run multi-scale template matching for the
         brand's actual registered logo. If high-confidence match found (>= 0.35),
         return it immediately (accurate for custom institutional/brand logos).
      2. If not matched, query pretrained YOLO logo detector (haydarkadioglu/brand-eye).
      3. Return (logo_detected: bool, bbox_dict: {"x","y","w","h","confidence"} | None).
    """
    if not os.path.exists(image_path):
        return False, None

    # 1. Prioritize registered brand logo matching
    if brand_logo_path and os.path.exists(brand_logo_path):
        tmpl_found, tmpl_box = _template_match_logo(image_path, brand_logo_path)
        if tmpl_found and tmpl_box:
            logger.info(f"[+] Logo detected via brand template matcher: {tmpl_box}")
            return True, tmpl_box

    # 2. Fallback to YOLO model
    try:
        detector = get_logo_detector()
        results = detector.predict(source=image_path, conf=conf_threshold, verbose=False)
        boxes = []
        for r in results:
            for b in r.boxes:
                xyxy = b.xyxy[0].tolist()
                conf = float(b.conf[0])
                x, y, x2, y2 = xyxy
                w = x2 - x
                h = y2 - y
                boxes.append({
                    "x": int(x),
                    "y": int(y),
                    "w": int(w),
                    "h": int(h),
                    "confidence": conf
                })

        if boxes:
            boxes.sort(key=lambda b: b["confidence"], reverse=True)
            logger.info(f"[+] Logo detected via YOLO: {boxes[0]}")
            return True, boxes[0]
    except Exception as e:
        logger.warning(f"[YOLO Logo Detector] Error: {e}")

    return False, None
