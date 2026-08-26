"""
Unit verification script for Phase 1 backend services.
Tests PyMuPDF text/image parsing, KMeans color extraction, and MiniLM vector embedding.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.embedding_service import embed, get_model_info
from app.services.color_extractor import extract_dominant_colors_from_image_bytes
from app.services.pdf_parser import classify_text_category
from PIL import Image
import io


def test_embedding():
    print("\n[1] Testing Embedding Service (MiniLM)...")
    info = get_model_info()
    print(f"Model Info: {info}")
    test_text = "We are dynamic, empathetic, and relentlessly innovative in all customer communications."
    vector = embed(test_text)
    print(f"Generated vector with dimension: {len(vector)}")
    assert len(vector) == 384, f"Expected 384 dimensions, got {len(vector)}"
    print("Embedding service verified successfully.")


def test_color_extraction():
    print("\n[2] Testing KMeans Color Extractor...")
    # Create a synthetic image with 3 distinct color regions (Blue, Coral, Gold)
    img = Image.new("RGB", (100, 100), color=(30, 60, 200))
    for x in range(50, 100):
        for y in range(0, 50):
            img.putpixel((x, y), (240, 100, 80))
    for x in range(0, 50):
        for y in range(50, 100):
            img.putpixel((x, y), (255, 215, 0))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    raw_bytes = img_byte_arr.getvalue()

    colors = extract_dominant_colors_from_image_bytes(raw_bytes, k=3)
    print(f"Extracted {len(colors)} dominant colors:")
    for c in colors:
        print(f"  Rank #{c['frequency_rank']}: {c['hex_code']} (pixel count: {c['pixel_count']})")
    assert len(colors) >= 2, "Expected at least 2 distinct clusters"
    print("Color extraction verified successfully.")


def test_keyword_heuristics():
    print("\n[3] Testing Deterministic Keyword Heuristics...")
    tests = [
        ("Primary color is #4F46E5 with RGB (79, 70, 229)", "color_usage"),
        ("Leave at least 15% clear space around the main logo lockup", "logo_usage"),
        ("Our tone of voice is bold, friendly, and empowering", "tone"),
        ("Do not claim 100% cure rate without regulatory disclaimer", "restricted_terms"),
        ("General company overview founded in 2024", "uncategorized"),
    ]
    for statement, expected in tests:
        actual = classify_text_category(statement)
        print(f"  '{statement[:35]}...' -> {actual} (expected: {expected})")
        assert actual == expected, f"Expected {expected}, got {actual}"
    print("Keyword heuristics verified successfully.")


if __name__ == "__main__":
    print("=== CampaignX Phase 1 Backend Service Verification ===")
    test_embedding()
    test_color_extraction()
    test_keyword_heuristics()
    print("\n=== ALL TESTS PASSED! ===")
