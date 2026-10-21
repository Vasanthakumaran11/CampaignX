"""
CampaignX AI - Phase 4 Poster Compositor
Composites brand logo, audited headlines, hooks, body content, and CTA buttons
onto AI generated backgrounds using brand colors and guidelines.
"""

import os
import textwrap
from PIL import Image, ImageDraw, ImageFont
from typing import List, Optional, Tuple, Dict


def _hex_to_rgb(hex_str: str, default: tuple = (245, 158, 11)) -> tuple:
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


def _load_font(size: int, bold: bool = True) -> ImageFont.ImageFont:
    """Loads a high-quality TrueType font across Windows/Linux/macOS platforms."""
    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/Library/Fonts/Arial Bold.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/Library/Fonts/Arial.ttf",
        ]

    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size)
            except Exception:
                continue
    return ImageFont.load_default()


def composite_poster(
    background_image: Image.Image,
    logo_image_path: Optional[str] = None,
    slogan_text: Optional[str] = None,
    headline_text: Optional[str] = None,
    hook_text: Optional[str] = None,
    cta_text: Optional[str] = None,
    brand_name: str = "CampaignX AI",
    brand_colors: Optional[List[str]] = None,
    tone: Optional[str] = None,
    compliance_score: Optional[float] = None
) -> Tuple[Image.Image, Dict[str, int]]:
    """
    Composites real brand assets (logo, audited headlines, body hooks, CTAs, colors)
    onto the generated background image.
    Returns (final_poster_image, logo_placement_dict).
    """
    poster = background_image.copy().convert("RGBA")
    w, h = poster.size

    # Color definitions from brand
    primary_hex = (brand_colors[0] if (brand_colors and len(brand_colors) > 0) else "#F59E0B")
    secondary_hex = (brand_colors[1] if (brand_colors and len(brand_colors) > 1) else "#6366F1")
    accent_hex = (brand_colors[2] if (brand_colors and len(brand_colors) > 2) else "#06B6D4")

    primary_rgb = _hex_to_rgb(primary_hex, (245, 158, 11))
    accent_rgb = _hex_to_rgb(accent_hex, (6, 182, 212))

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Top Decorative Brand Accent Strip
    draw.rectangle([0, 0, w, 6], fill=(*primary_rgb, 255))
    draw.rectangle([0, 6, int(w * 0.4), 10], fill=(*accent_rgb, 220))

    # 2. Brand Logo Placement
    logo_bbox = {"x": 40, "y": 40, "width": 140, "height": 70}
    logo_placed = False

    if logo_image_path and os.path.exists(logo_image_path):
        try:
            logo_img = Image.open(logo_image_path).convert("RGBA")
            # Preserve aspect ratio within max dimensions 180x75
            logo_img.thumbnail((180, 75), Image.Resampling.LANCZOS)
            lw, lh = logo_img.size

            # Crisp frosted badge for logo legibility over vivid AI backgrounds
            pad_x, pad_y = 16, 10
            badge_w = lw + (pad_x * 2)
            badge_h = lh + (pad_y * 2)
            bx, by = 40, 36

            # Semi-transparent frosted backdrop
            draw.rounded_rectangle(
                [bx, by, bx + badge_w, by + badge_h],
                radius=14,
                fill=(15, 23, 42, 220),
                outline=(*primary_rgb, 200),
                width=2
            )
            # Paste logo
            poster.paste(logo_img, (bx + pad_x, by + pad_y), logo_img)
            logo_bbox = {"x": bx, "y": by, "width": badge_w, "height": badge_h}
            logo_placed = True
        except Exception as e:
            print(f"[!] Logo compositing warning: {e}")

    if not logo_placed:
        # Fallback stylish text logo badge
        bx, by = 40, 36
        badge_w, badge_h = 220, 64
        draw.rounded_rectangle(
            [bx, by, bx + badge_w, by + badge_h],
            radius=12,
            fill=(15, 23, 42, 230),
            outline=(*primary_rgb, 220),
            width=2
        )
        logo_font = _load_font(20, bold=True)
        draw.text((bx + 18, by + 18), (brand_name[:18] or "CAMPAIGNX").upper(), fill=(255, 255, 255, 255), font=logo_font)
        logo_bbox = {"x": bx, "y": by, "width": badge_w, "height": badge_h}

    # 3. Compliance & Tone Tag Badge (Top Right)
    score_val = compliance_score if compliance_score is not None else 85.0
    status_label = f"AUDITED BRAND SAFE · {round(score_val)}%"
    tag_w = 260
    tag_h = 36
    tx = w - tag_w - 40
    ty = 48
    draw.rounded_rectangle([tx, ty, tx + tag_w, ty + tag_h], radius=18, fill=(15, 23, 42, 220), outline=(34, 197, 94, 220), width=2)
    # Green pulse dot
    draw.ellipse([tx + 14, ty + 12, tx + 24, ty + 22], fill=(34, 197, 94, 255))
    tag_font = _load_font(12, bold=True)
    draw.text((tx + 34, ty + 10), status_label, fill=(241, 245, 249, 255), font=tag_font)

    # 4. Main Copy Block Card (Headline, Hook/Body, CTA)
    # Determine the headline and hook
    final_headline = (headline_text or slogan_text or "ELEVATE YOUR BRAND EXPERIENCE").strip()
    final_hook = (hook_text or "").strip()
    final_cta = (cta_text or "LEARN MORE").strip()

    # Glassmorphism container for text in the lower half of the poster
    card_margin = 36
    card_x1 = card_margin
    card_x2 = w - card_margin
    card_y1 = int(h * 0.52)
    card_y2 = h - 44

    draw.rounded_rectangle(
        [card_x1, card_y1, card_x2, card_y2],
        radius=24,
        fill=(11, 15, 28, 235),
        outline=(*primary_rgb, 140),
        width=2
    )

    # Accent decorative bar inside card
    draw.line([(card_x1 + 32, card_y1 + 24), (card_x1 + 100, card_y1 + 24)], fill=(*primary_rgb, 255), width=4)

    curr_y = card_y1 + 40
    avail_w = card_x2 - card_x1 - 64

    # 4a. Render Headline
    headline_font = _load_font(32, bold=True)
    wrapped_headline = textwrap.fill(final_headline.upper(), width=24)
    h_lines = wrapped_headline.splitlines()[:2]
    for line in h_lines:
        draw.text((card_x1 + 32, curr_y), line, fill=(255, 255, 255, 255), font=headline_font)
        curr_y += 42

    curr_y += 8

    # 4b. Render Hook / Body Content (if available)
    if final_hook:
        body_font = _load_font(16, bold=False)
        wrapped_hook = textwrap.fill(final_hook, width=38)
        b_lines = wrapped_hook.splitlines()[:2]
        for line in b_lines:
            draw.text((card_x1 + 32, curr_y), line, fill=(203, 213, 225, 240), font=body_font)
            curr_y += 24
        curr_y += 12

    # 4c. Render Call-to-Action (CTA) Button
    btn_font = _load_font(15, bold=True)
    btn_text = final_cta.upper()
    btn_w = min(avail_w, max(180, len(btn_text) * 12 + 48))
    btn_h = 48
    btn_x = card_x1 + 32
    btn_y = card_y2 - btn_h - 24

    # Rounded primary CTA button
    draw.rounded_rectangle(
        [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
        radius=24,
        fill=(*primary_rgb, 255)
    )
    # Center text in CTA button
    # Determine text contrast (dark text on bright yellow/gold/cyan, white on dark)
    r, g, b = primary_rgb
    luminance = (0.299 * r + 0.587 * g + 0.114 * b)
    text_color = (15, 23, 42, 255) if luminance > 140 else (255, 255, 255, 255)

    draw.text((btn_x + 24, btn_y + 14), btn_text, fill=text_color, font=btn_font)

    # Tone indicator tag in the card bottom right
    if tone:
        tone_tag = f"TONE: {tone.upper()}"
        tone_font = _load_font(11, bold=True)
        draw.text((card_x2 - 160, btn_y + 16), tone_tag[:18], fill=(148, 163, 184, 180), font=tone_font)

    # Merge overlay with poster image
    final_poster = Image.alpha_composite(poster, overlay).convert("RGB")
    return final_poster, logo_bbox
