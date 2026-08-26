import io
import logging
from typing import List, Dict, Any
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Converts RGB integers (0-255) to uppercase #RRGGBB format."""
    return f"#{r:02X}{g:02X}{b:02X}"


def extract_dominant_colors_from_image_bytes(image_bytes: bytes, k: int = 6, source: str = "guideline_pdf") -> List[Dict[str, Any]]:
    """
    Extracts dominant color palette from raw image bytes using deterministic KMeans clustering.
    Filters transparent background pixels and sorts by cluster frequency (rank 1 = most dominant).
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # If image has alpha channel, filter transparent pixels
        if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
            image = image.convert("RGBA")
            np_img = np.array(image)
            # Filter out pixels with alpha < 128
            alpha = np_img[:, :, 3]
            opaque_mask = alpha > 128
            rgb_pixels = np_img[:, :, :3][opaque_mask]
        else:
            image = image.convert("RGB")
            # Downsample for faster clustering if image is large
            image.thumbnail((300, 300))
            np_img = np.array(image)
            rgb_pixels = np_img.reshape(-1, 3)

        if len(rgb_pixels) == 0:
            return []

        # If total unique colors are fewer than k, adjust clusters
        unique_colors = len(np.unique(rgb_pixels, axis=0))
        n_clusters = min(k, max(1, unique_colors))

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
        labels = kmeans.fit_predict(rgb_pixels)
        centroids = kmeans.cluster_centers_.astype(int)

        # Count frequencies of each cluster
        counts = np.bincount(labels)
        sorted_indices = np.argsort(-counts)

        results = []
        for rank, idx in enumerate(sorted_indices, start=1):
            r, g, b = np.clip(centroids[idx], 0, 255)
            hex_code = rgb_to_hex(int(r), int(g), int(b))
            results.append({
                "hex_code": hex_code,
                "usage_label": None,
                "source": source,
                "frequency_rank": rank,
                "pixel_count": int(counts[idx]),
            })

        return results
    except Exception as e:
        logger.error(f"Error extracting colors from image bytes: {e}")
        return []


def deduplicate_palette(colors: List[Dict[str, Any]], max_colors: int = 8) -> List[Dict[str, Any]]:
    """
    Deduplicates a combined list of color dictionaries by hex_code, preserving the best rank.
    """
    seen_hex = {}
    for c in colors:
        hex_code = c["hex_code"].upper()
        if hex_code not in seen_hex:
            seen_hex[hex_code] = c
        else:
            # Keep the one with lower (better) frequency rank
            if c.get("frequency_rank", 999) < seen_hex[hex_code].get("frequency_rank", 999):
                seen_hex[hex_code] = c

    # Sort by frequency rank
    unique_list = sorted(seen_hex.values(), key=lambda x: x.get("frequency_rank", 999))
    
    # Re-rank 1..N
    for i, item in enumerate(unique_list[:max_colors], start=1):
        item["frequency_rank"] = i

    return unique_list[:max_colors]
