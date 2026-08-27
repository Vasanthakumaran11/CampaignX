import os
import logging
from typing import List, Dict, Any, Optional
import torch
from transformers import pipeline

logger = logging.getLogger(__name__)

# Configurable constants
DEFAULT_MODEL_NAME = "valhalla/distilbart-mnli-12-3"
LOCAL_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "claims-classifier")
CONFIDENCE_THRESHOLD = 0.55

CANDIDATE_LABELS = [
    "unsubstantiated guarantee",
    "missing required disclaimer",
    "direct competitor comparison",
    "medical or health claim",
    "financial or earnings claim",
    "neutral marketing statement"
]

_classifier_pipeline = None


def get_claims_classifier():
    """
    Returns singleton zero-shot classification pipeline.
    Auto-detects GPU (cuda) and local model weights in backend/models/claims-classifier/.
    """
    global _classifier_pipeline
    if _classifier_pipeline is not None:
        return _classifier_pipeline

    # Determine model path
    if os.path.exists(LOCAL_MODEL_DIR) and os.path.exists(os.path.join(LOCAL_MODEL_DIR, "config.json")):
        model_path = LOCAL_MODEL_DIR
        logger.info(f"Using local custom fine-tuned claims classifier model from '{LOCAL_MODEL_DIR}'")
    else:
        model_path = DEFAULT_MODEL_NAME
        logger.info(f"Using base Hugging Face zero-shot model '{DEFAULT_MODEL_NAME}'")

    # Determine device (GPU cuda:0 if available, else CPU -1)
    device = 0 if torch.cuda.is_available() else -1
    logger.info(f"Claims classifier device: {'GPU (cuda:0)' if device == 0 else 'CPU'}")

    try:
        _classifier_pipeline = pipeline(
            "zero-shot-classification",
            model=model_path,
            device=device
        )
        logger.info("Claims classifier pipeline initialized successfully.")
        return _classifier_pipeline
    except Exception as e:
        logger.error(f"Failed to initialize claims classifier pipeline: {e}")
        return None


def classify_sentence_claims(sentences: List[str]) -> List[Dict[str, Any]]:
    """
    Runs zero-shot classification across a list of sentences.
    Returns list of detected compliance flags for non-neutral marketing statements.
    """
    if not sentences:
        return []

    classifier = get_claims_classifier()
    if not classifier:
        logger.warning("Classifier pipeline unavailable. Skipping zero-shot claims check.")
        return []

    flags: List[Dict[str, Any]] = []

    # Clean sentences
    valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    if not valid_sentences:
        return []

    try:
        # Run batched classification
        results = classifier(valid_sentences, CANDIDATE_LABELS, hypothesis_template="This sentence is a {}")
        if isinstance(results, dict):
            results = [results]

        for res in results:
            sentence_text = res["sequence"]
            top_label = res["labels"][0]
            top_score = float(res["scores"][0])

            if top_label != "neutral marketing statement" and top_score >= CONFIDENCE_THRESHOLD:
                flag_type = "unsubstantiated_claim"
                severity = "medium"
                explanation = f"Detected potential '{top_label}' (Confidence: {top_score * 100:.1f}%)."

                if top_label == "missing required disclaimer":
                    flag_type = "missing_disclaimer"
                    severity = "medium"
                    explanation = f"Statement may require a formal legal disclaimer ({top_score * 100:.1f}% confidence)."
                elif top_label == "direct competitor comparison":
                    flag_type = "competitor_comparison"
                    severity = "medium"
                    explanation = f"Direct competitor reference or claim detected ({top_score * 100:.1f}% confidence)."
                elif top_label in ["medical or health claim", "financial or earnings claim"]:
                    flag_type = "regulatory_risk"
                    severity = "high"
                    explanation = f"High regulatory risk: detected '{top_label}' requiring strict legal verification ({top_score * 100:.1f}% confidence)."

                flags.append({
                    "flag_type": flag_type,
                    "severity": severity,
                    "flagged_text_snippet": sentence_text,
                    "explanation": explanation,
                    "source_rule_id": None
                })
    except Exception as e:
        logger.error(f"Error during claims classification pass: {e}")

    return flags
