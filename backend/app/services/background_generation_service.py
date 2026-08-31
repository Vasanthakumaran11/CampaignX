"""
CampaignX AI - Phase 4 Background Generation Service
Calls Hugging Face Inference API (FLUX.1-schnell / SDXL) or provides a deterministic fallback.
"""

import os
import io
import httpx
from PIL import Image, ImageDraw, ImageFilter

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")

def generate_poster_background(prompt: str, width: int = 800, height: int = 1000) -> Image.Image:
    """
    Generates a high-quality poster background image.
    Uses Hugging Face Inference API if token is provided, or a rich gradient fallback.
    """
    if HUGGINGFACE_API_TOKEN.strip():
        try:
            print(f"[+] Calling Hugging Face Inference API for prompt: '{prompt}'...")
            api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
            headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
            payload = {
                "inputs": f"{prompt}, professional abstract marketing poster background, high resolution, 8k, textless, clean design, no text, no logo",
            }
            resp = httpx.post(api_url, headers=headers, json=payload, timeout=30.0)
            if resp.status_code == 200:
                image = Image.open(io.BytesIO(resp.content)).convert("RGB")
                return image.resize((width, height))
            else:
                print(f"[!] HF API returned status {resp.status_code}: {resp.text[:100]}. Falling back to Pillow renderer.")
        except Exception as e:
            print(f"[!] HF API call failed: {e}. Falling back to Pillow renderer.")

    # High-quality aesthetic gradient fallback tuned for strong text contrast and OCR readability.
    print("[+] Rendering high-contrast poster background via Pillow...")
    img = Image.new("RGB", (width, height), (8, 16, 30))
    draw = ImageDraw.Draw(img)

    # Large, saturated glowing shapes that stay readable on dark navy background.
    draw.ellipse([width * 0.10, height * 0.08, width * 0.92, height * 0.62], fill=(245, 158, 11))
    draw.ellipse([width * -0.10, height * 0.42, width * 0.72, height * 0.98], fill=(99, 102, 241))
    draw.ellipse([width * 0.18, height * 0.62, width * 1.08, height * 1.18], fill=(251, 191, 36))

    # Soft blur only at a moderate level so the layout remains legible for OCR and text overlay.
    img = img.filter(ImageFilter.GaussianBlur(radius=28))

    # Add a subtle dark vignette to keep foreground text readable and professional.
    vignette = Image.new("RGBA", img.size, (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for alpha in range(120, 0, -8):
        vdraw.ellipse([alpha, alpha, width - alpha, height - alpha], outline=(0, 0, 0, 70))
    img = Image.alpha_composite(img.convert("RGBA"), vignette).convert("RGB")
    return img
