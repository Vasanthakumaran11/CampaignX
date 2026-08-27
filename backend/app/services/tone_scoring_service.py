import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from app.services.supabase_client import get_supabase_admin
from app.services.embedding_service import embed
from app.services.retrieval_service import compute_cosine_similarity

logger = logging.getLogger(__name__)

OFF_TONE_THRESHOLD = 0.35  # Threshold below which text is flagged off_tone


def score_tone_similarity(brand_profile_id: str, text: str) -> Tuple[float, Optional[str]]:
    """
    Embeds text and computes max cosine similarity against Phase 1 brand voice samples.
    Returns (max_similarity_score, matched_sample_id).
    """
    client = get_supabase_admin()
    if not client or not text.strip():
        return 0.5, None

    try:
        text_emb = embed(text.strip())
    except Exception as e:
        logger.error(f"Error embedding text for tone scoring: {e}")
        return 0.5, None

    try:
        samples_res = client.table("brand_voice_samples").select("id", "sample_text", "embedding").eq("brand_profile_id", brand_profile_id).execute()
        raw_samples = samples_res.data or []

        if not raw_samples:
            logger.info(f"No voice samples found for brand {brand_profile_id}. Using default neutral tone score.")
            return 0.70, None

        max_sim = 0.0
        best_sample_id = None

        for s in raw_samples:
            emb = s.get("embedding")
            if isinstance(emb, str):
                try:
                    import json
                    emb = json.loads(emb)
                except Exception:
                    emb = None

            if emb and isinstance(emb, list) and len(emb) == len(text_emb):
                sim = compute_cosine_similarity(text_emb, emb)
                if sim > max_sim:
                    max_sim = sim
                    best_sample_id = s["id"]

        max_sim_rounded = round(float(max_sim), 4)
        logger.info(f"Tone similarity score for brand {brand_profile_id}: {max_sim_rounded}")
        return max_sim_rounded, best_sample_id
    except Exception as e:
        logger.error(f"Error fetching brand voice samples for tone scoring: {e}")
        return 0.5, None
