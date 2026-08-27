import logging
from typing import List, Dict, Any, Optional
import numpy as np

from app.services.supabase_client import get_supabase_admin
from app.services.embedding_service import embed

logger = logging.getLogger(__name__)


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Computes cosine similarity between two 1D float vectors using numpy.
    """
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def retrieve_grounding_context(
    brand_profile_id: str,
    query_text: str,
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Retrieves grounding context for copy generation:
    1. Top-k most relevant brand voice sample anchors via pgvector / Python cosine similarity.
    2. All restricted terms/claims rules for the brand profile as hard negative constraints.
    """
    client = get_supabase_admin()
    voice_anchors: List[Dict[str, Any]] = []
    restricted_rules: List[Dict[str, Any]] = []

    if not client:
        logger.warning("Supabase admin client not configured for retrieval.")
        return {"voice_anchors": [], "restricted_rules": []}

    # 1. Embed query text with 384-dimensional MiniLM model
    try:
        query_embedding = embed(query_text)
    except Exception as e:
        logger.error(f"Error embedding query text for retrieval: {e}")
        query_embedding = None

    # 2. Retrieve brand voice samples and rank by cosine similarity
    try:
        if query_embedding:
            # Try pgvector RPC call first
            try:
                rpc_res = client.rpc(
                    "match_brand_voice_samples",
                    {
                        "query_embedding": query_embedding,
                        "match_threshold": 0.0,
                        "match_count": top_k,
                        "p_brand_profile_id": brand_profile_id
                    }
                ).execute()

                if rpc_res.data:
                    for row in rpc_res.data:
                        voice_anchors.append({
                            "id": row["id"],
                            "sample_text": row["sample_text"],
                            "source": row.get("source", "guideline_pdf"),
                            "similarity": round(float(row.get("similarity", 0.85)), 4)
                        })
            except Exception as rpc_err:
                logger.info(f"RPC match_brand_voice_samples unavailable ({rpc_err}). Using Python vector cosine similarity fallback.")

            # Fallback: Query all samples for profile and compute cosine similarity in memory
            if not voice_anchors:
                samples_res = client.table("brand_voice_samples").select("*").eq("brand_profile_id", brand_profile_id).execute()
                raw_samples = samples_res.data or []

                scored_samples = []
                for s in raw_samples:
                    emb = s.get("embedding")
                    if isinstance(emb, str):
                        # Clean vector string if returned as '[0.1, 0.2,...]'
                        try:
                            import json
                            emb = json.loads(emb)
                        except Exception:
                            emb = None

                    if emb and isinstance(emb, list) and len(emb) == len(query_embedding):
                        sim = compute_cosine_similarity(query_embedding, emb)
                    else:
                        sim = 0.5  # Neutral fallback score if vector embedding unavailable

                    scored_samples.append({
                        "id": s["id"],
                        "sample_text": s["sample_text"],
                        "source": s.get("source", "guideline_pdf"),
                        "similarity": round(sim, 4)
                    })

                # Sort by similarity score descending
                scored_samples.sort(key=lambda x: x["similarity"], reverse=True)
                voice_anchors = scored_samples[:top_k]

    except Exception as e:
        logger.error(f"Error retrieving brand voice samples for {brand_profile_id}: {e}")

    # 3. Retrieve restricted claims & negative terms rules
    try:
        rules_res = client.table("brand_guideline_rules").select("*").eq("brand_profile_id", brand_profile_id).eq("category", "restricted_terms").execute()
        raw_rules = rules_res.data or []
        for r in raw_rules:
            restricted_rules.append({
                "id": r["id"],
                "rule_text": r["rule_text"],
                "page_number": r.get("page_number")
            })
    except Exception as e:
        logger.error(f"Error retrieving restricted terms rules for {brand_profile_id}: {e}")

    logger.info(f"Retrieval complete for brand {brand_profile_id}: {len(voice_anchors)} voice anchors, {len(restricted_rules)} restricted rules.")
    return {
        "voice_anchors": voice_anchors,
        "restricted_rules": restricted_rules
    }
