"""
CampaignX AI - Phase 4 Visual Color Service
Extracts dominant colors from poster and measures match against brand palette in LAB color space.
Strict perceptual distance measurement with zero artificial score boosting.
"""

import os
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

def hex_to_rgb(hex_str: str) -> tuple:
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_lab(rgb: tuple) -> tuple:
    """Converts RGB (0-255) to CIELAB space for perceptual distance measurement."""
    r, g, b = [x / 255.0 for x in rgb]
    r = ((r + 0.055) / 1.055) ** 2.4 if r > 0.04045 else r / 12.92
    g = ((g + 0.055) / 1.055) ** 2.4 if g > 0.04045 else g / 12.92
    b = ((b + 0.055) / 1.055) ** 2.4 if b > 0.04045 else b / 12.92

    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505

    x, y, z = x / 0.95047, y / 1.00000, z / 1.08883
    x = x ** (1/3) if x > 0.008856 else (7.787 * x) + (16 / 116)
    y = y ** (1/3) if y > 0.008856 else (7.787 * y) + (16 / 116)
    z = z ** (1/3) if z > 0.008856 else (7.787 * z) + (16 / 116)

    l_val = (116 * y) - 16
    a_val = 500 * (x - y)
    b_val = 200 * (y - z)
    return (l_val, a_val, b_val)

def compute_visual_color_match(poster_image_path: str, brand_colors_hex: list[str]) -> float:
    """
    Computes color palette match score (0.0 to 1.0) using CIELAB distance matching.
    """
    if not poster_image_path or not os.path.exists(poster_image_path):
        return 0.0

    if not brand_colors_hex:
        print("[-] Color Matcher: No brand colors provided. Match score = 0.0")
        return 0.0

    try:
        img = Image.open(poster_image_path).convert("RGB")
        img.thumbnail((200, 200))
        pixels = np.array(img).reshape(-1, 3)

        kmeans = KMeans(n_clusters=4, random_state=42, n_init=3)
        kmeans.fit(pixels)
        poster_rgbs = [tuple(c.astype(int)) for c in kmeans.cluster_centers_]

        brand_rgbs = [hex_to_rgb(h) for h in brand_colors_hex if h and isinstance(h, str) and h.strip()]
        if not brand_rgbs:
            return 0.0

        # Compute minimum LAB distance between poster dominant colors and brand palette colors
        min_distances = []
        for p_rgb in poster_rgbs:
            p_lab = rgb_to_lab(p_rgb)
            dists = []
            for b_rgb in brand_rgbs:
                b_lab = rgb_to_lab(b_rgb)
                dist = np.sqrt((p_lab[0]-b_lab[0])**2 + (p_lab[1]-b_lab[1])**2 + (p_lab[2]-b_lab[2])**2)
                dists.append(dist)
            min_distances.append(min(dists))

        avg_dist = float(np.mean(min_distances))
        # CIELAB distance scaling: 0 dist -> 1.0, 70+ dist -> 0.0
        match_score = max(0.0, 1.0 - (avg_dist / 70.0))
        final_score = round(max(0.0, min(1.0, match_score)), 2)
        print(f"[+] CIELAB Color Match: avg_dist={avg_dist:.2f} -> Score={final_score}")
        return final_score

    except Exception as e:
        print(f"[!] Color match computation error: {e}")
        return 0.0
