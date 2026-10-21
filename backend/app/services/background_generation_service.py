"""
CampaignX AI - Phase 4 AI Background Generation Service
Utilizes AI Image Generation Models (Pollinations FLUX.1 / Hugging Face Inference API)
conditioned on the user prompt, brand tone, major brand colors, and guidelines,
with a dynamic brand-palette Pillow generative fallback.
"""

import os
import io
import urllib.parse
import random
import re
import httpx
from PIL import Image, ImageDraw, ImageFilter
from typing import List, Optional

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN", "")


def _hex_to_rgb(hex_str: str, default: tuple = (79, 70, 229)) -> tuple:
    """Safely converts a hex color string (#RRGGBB or #RGB) to an (R, G, B) tuple."""
    if not hex_str or not isinstance(hex_str, str):
        return default
    clean = hex_str.strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join([c * 2 for c in clean])
    if len(clean) != 6:
        return default
    try:
        return (int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))
    except ValueError:
        return default


def build_enhanced_image_prompt(
    prompt: str,
    brand_colors: Optional[List[str]] = None,
    tone: Optional[str] = None,
    brand_name: Optional[str] = None
) -> str:
    """
    Constructs an AI image generation prompt combining user prompt with brand tone,
    major colors, and studio aesthetic tags.
    """
    color_desc = ""
    if brand_colors and len(brand_colors) > 0:
        valid_hexes = [c for c in brand_colors if c and c.startswith("#")][:3]
        if valid_hexes:
            color_desc = f"with brand color palette {', '.join(valid_hexes)}"

    tone_desc = f"{tone.strip()} aesthetic" if tone and tone.strip() else "modern premium aesthetic"
    base_prompt = prompt.strip() if prompt and prompt.strip() else f"High impact marketing background for {brand_name or 'innovative brand'}"

    # Enforce textless, clean composition suitable for poster typography
    enhanced = (
        f"{base_prompt}, {color_desc}, {tone_desc}, "
        "commercial graphic design background, 3d minimal architectural lighting, "
        "clean space for headline typography, professional studio quality, 8k resolution, "
        "textless, no words, no letters, no logos, clean backdrop"
    )
    # Clean up double commas or extra whitespace
    enhanced = re.sub(r",\s*,+", ",", enhanced).strip().strip(",")
    return enhanced


def generate_poster_background(
    prompt: str,
    brand_colors: Optional[List[str]] = None,
    tone: Optional[str] = None,
    brand_name: Optional[str] = None,
    width: int = 800,
    height: int = 1000
) -> Image.Image:
    """
    Generates a high-quality poster background image conditioned on the prompt,
    brand tone, major brand colors, and aesthetic guidelines.
    
    Order of execution:
    1. Pollinations AI (FLUX.1 model, open access, zero API key required)
    2. Hugging Face Inference API (if token configured)
    3. Brand-Tailored Pillow Generative Canvas (dynamic brand colors & vignette)
    """
    enhanced_prompt = build_enhanced_image_prompt(prompt, brand_colors, tone, brand_name)
    print(f"[+] Generating AI background with prompt: '{enhanced_prompt[:120]}...'")

    # 1. Attempt Pollinations AI (FLUX.1 image generation model)
    try:
        seed = random.randint(10000, 999999)
        encoded_prompt = urllib.parse.quote(enhanced_prompt[:350])
        pollinations_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={width}&height={height}&model=flux&seed={seed}&nologo=true"
        )
        print(f"[+] Querying Pollinations FLUX.1 image generator...")
        resp = httpx.get(pollinations_url, timeout=22.0, follow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 5000:
            img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            if img.size != (width, height):
                img = img.resize((width, height), Image.Resampling.LANCZOS)
            print("[+] Successfully generated AI background via Pollinations FLUX.1 model!")
            return img
        else:
            print(f"[!] Pollinations returned status {resp.status_code}. Trying next provider...")
    except Exception as e:
        print(f"[!] Pollinations call skipped/timed out: {e}. Trying next provider...")

    # 2. Attempt Hugging Face Inference API (if token configured)
    if HUGGINGFACE_API_TOKEN.strip():
        try:
            print(f"[+] Calling Hugging Face Inference API (FLUX.1-schnell)...")
            api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
            headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}
            payload = {"inputs": enhanced_prompt}
            resp = httpx.post(api_url, headers=headers, json=payload, timeout=25.0)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                print("[+] Successfully generated background via Hugging Face FLUX API!")
                return img.resize((width, height), Image.Resampling.LANCZOS)
        except Exception as e:
            print(f"[!] HF API call failed: {e}. Falling back to Pillow generative canvas.")

    # 3. Dynamic Brand-Tuned Generative Fallback using exact Brand Colors & Tone
    print(f"[+] Rendering dynamic brand-tailored background using colors: {brand_colors}...")
    
    # Extract RGB values from brand colors
    primary_rgb = _hex_to_rgb(brand_colors[0]) if (brand_colors and len(brand_colors) > 0) else (245, 158, 11)
    secondary_rgb = _hex_to_rgb(brand_colors[1]) if (brand_colors and len(brand_colors) > 1) else (99, 102, 241)
    accent_rgb = _hex_to_rgb(brand_colors[2]) if (brand_colors and len(brand_colors) > 2) else (6, 182, 212)

    # Base background (deep dark tone derived from brand or solid dark navy)
    base_bg = (11, 15, 28)
    img = Image.new("RGB", (width, height), base_bg)
    draw = ImageDraw.Draw(img)

    # Radiant atmospheric brand glows
    # Primary color glow (upper right)
    draw.ellipse([width * 0.25, height * 0.05, width * 1.05, height * 0.65], fill=primary_rgb)
    # Secondary color glow (lower left)
    draw.ellipse([width * -0.20, height * 0.40, width * 0.70, height * 0.98], fill=secondary_rgb)
    # Accent color glow (lower right ambient)
    draw.ellipse([width * 0.20, height * 0.65, width * 1.10, height * 1.15], fill=accent_rgb)

    # Organic soft blur to merge the brand colors into a luxury backdrop
    img = img.filter(ImageFilter.GaussianBlur(radius=38))

    # Add subtle dark vignette & center contrast layer to guarantee typography readability
    vignette = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for step in range(0, 16):
        alpha = int(step * 7)
        pad = step * 12
        vdraw.rectangle([pad, pad, width - pad, height - pad], outline=(11, 15, 28, alpha), width=12)

    # Bottom scrim for typography readability
    for y in range(int(height * 0.45), height):
        ratio = (y - (height * 0.45)) / (height * 0.55)
        scrim_alpha = int(min(220, ratio * 230))
        vdraw.line([(0, y), (width, y)], fill=(11, 15, 28, scrim_alpha))

    img = Image.alpha_composite(img.convert("RGBA"), vignette).convert("RGB")
    return img
