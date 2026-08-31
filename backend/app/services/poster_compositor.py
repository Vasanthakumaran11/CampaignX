"""
CampaignX AI - Phase 4 Poster Compositor
Composites exact brand logo files and slogan text onto background images.
"""

import os
import textwrap
from PIL import Image, ImageDraw, ImageFont


def _load_font(size: int) -> ImageFont.ImageFont:
    """Pick a readable default font across environments."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def composite_poster(
    background_image: Image.Image,
    logo_image_path: str = None,
    slogan_text: str = None,
    brand_name: str = "CampaignX AI",
    primary_color_hex: str = "#F59E0B"
) -> tuple[Image.Image, dict]:
    """
    Programmatically places real logo and real slogan text onto background.
    Returns (final_poster_image, logo_placement_dict).
    """
    poster = background_image.copy()
    w, h = poster.size
    draw = ImageDraw.Draw(poster)

    logo_bbox = {"x": 40, "y": 40, "width": 120, "height": 120}

    # 1. Overlay Brand Logo (if logo path is provided and exists)
    if logo_image_path and os.path.exists(logo_image_path):
        try:
            logo_img = Image.open(logo_image_path).convert("RGBA")
            logo_img.thumbnail((150, 150), Image.Resampling.LANCZOS)
            lw, lh = logo_img.size

            # Create a crisp white backing so the logo stands out on high-energy gradients.
            logo_bg = Image.new("RGBA", (lw + 28, lh + 28), (255, 255, 255, 235))
            poster.paste(logo_bg, (36, 36), logo_bg)
            poster.paste(logo_img, (50, 50), logo_img)

            logo_bbox = {"x": 36, "y": 36, "width": lw + 28, "height": lh + 28}
        except Exception as e:
            print(f"[!] Logo compositing failed: {e}")
    else:
        # Fallback Logo Badge with strong contrast on dark navy background.
        badge_x1, badge_y1, badge_x2, badge_y2 = 36, 36, 256, 110
        draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=12, fill=(255, 255, 255, 230), outline=(245, 158, 11), width=3)
        draw.text((52, 58), (brand_name[:16] or 'CampaignX').upper(), fill=(15, 23, 42), font=_load_font(22), stroke_width=1, stroke_fill=(255,255,255))
        logo_bbox = {"x": badge_x1, "y": badge_y1, "width": badge_x2 - badge_x1, "height": badge_y2 - badge_y1}

    # 2. Overlay Slogan / Headline Text Banner
    if slogan_text and slogan_text.strip():
        clean_text = slogan_text.strip()
        banner_y = h - 230
        banner_h = 180
        draw.rounded_rectangle([32, banner_y, w - 32, h - 34], radius=16, fill=(11, 18, 35, 230), outline=(245, 158, 11), width=4)

        # Keep phrasing concise and readable for OCR.
        wrapped = textwrap.fill(clean_text, width=26)
        if len(clean_text) > 90:
            wrapped = textwrap.fill(clean_text, width=24)

        big_font = _load_font(34)
        small_font = _load_font(18)
        lines = wrapped.splitlines()[:3]

        text_x = 56
        text_y = banner_y + 28
        for idx, line in enumerate(lines):
            color = (255, 255, 255)
            if idx == 0:
                font = big_font
            else:
                font = small_font
            draw.text((text_x, text_y), line.upper(), fill=color, font=font, stroke_width=1, stroke_fill=(15, 23, 42))
            text_y += 36 if idx == 0 else 28

    return poster, logo_bbox
