import os
import logging
from typing import List, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

_embedding_model = None
_model_source: str = "unloaded"


def get_embedding_model():
    """
    Singleton loader for SentenceTransformer tone encoder model.
    Checks for fine-tuned weights in models/tone-encoder/ first;
    falls back to base pretrained 'sentence-transformers/all-MiniLM-L6-v2'.
    Runs CPU-first in FastAPI.
    """
    global _embedding_model, _model_source
    if _embedding_model is not None:
        return _embedding_model

    settings = get_settings()
    fine_tuned_path = settings.FINE_TUNED_MODEL_DIR
    device = settings.EMBEDDING_DEVICE

    # Lazy import so app boots fast even before torch/sentence_transformers is loaded
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        logger.error("sentence-transformers is not installed. Please run `pip install -r requirements.txt`")
        raise RuntimeError("sentence-transformers is missing.")

    # Check if fine-tuned weights exist
    if os.path.exists(fine_tuned_path) and os.path.isdir(fine_tuned_path):
        config_path = os.path.join(fine_tuned_path, "config.json")
        if os.path.exists(config_path):
            try:
                logger.info(f"Detected fine-tuned weights at {fine_tuned_path}. Loading on {device}...")
                _embedding_model = SentenceTransformer(fine_tuned_path, device=device)
                _model_source = f"fine-tuned ({fine_tuned_path})"
                logger.info(f"Successfully loaded fine-tuned tone encoder on {device}.")
                return _embedding_model
            except Exception as e:
                logger.warning(f"Failed to load fine-tuned weights from {fine_tuned_path}: {e}. Falling back to base model.")

    # Fallback to base pretrained MiniLM
    try:
        logger.info(f"Loading base pretrained model '{settings.BASE_EMBEDDING_MODEL}' on {device}...")
        _embedding_model = SentenceTransformer(settings.BASE_EMBEDDING_MODEL, device=device)
        _model_source = f"base-pretrained ({settings.BASE_EMBEDDING_MODEL})"
        logger.info(f"Successfully loaded base embedding model on {device}.")
        return _embedding_model
    except Exception as e:
        logger.error(f"Error loading embedding model: {e}")
        raise e


def embed(text: str) -> List[float]:
    """
    Generates a 384-dimensional vector embedding for the input text.
    """
    if not text or not text.strip():
        return [0.0] * 384
    model = get_embedding_model()
    vector = model.encode(text.strip(), normalize_embeddings=True)
    return vector.tolist()


def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Batch embedding generation for efficiency.
    """
    clean_texts = [t.strip() for t in texts if t and t.strip()]
    if not clean_texts:
        return []
    model = get_embedding_model()
    vectors = model.encode(clean_texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def get_model_info() -> dict:
    """
    Returns metadata about the active embedding model.
    """
    return {
        "source": _model_source,
        "dimension": 384,
        "is_loaded": _embedding_model is not None,
    }
