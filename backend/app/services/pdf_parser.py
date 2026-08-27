import io
import re
import logging
import uuid
from typing import List, Dict, Any, Tuple
import pymupdf as fitz  # PyMuPDF
from app.services.color_extractor import extract_dominant_colors_from_image_bytes, deduplicate_palette
from app.services.embedding_service import embed
from app.services.supabase_client import get_supabase_admin, upload_file_to_storage
from app.config import get_settings

logger = logging.getLogger(__name__)

# Heuristic keyword matchers
RE_HEX_CODE = re.compile(r"#[0-9a-fA-F]{6}\b")
COLOR_KEYWORDS = ["hex", "rgb", "cmyk", "pantone", "primary color", "secondary color", "accent color", "color palette", "brand color", "background color"]
LOGO_KEYWORDS = ["logo", "clear space", "clearance", "exclusion zone", "wordmark", "icon", "lockup", "minimum size", "don't stretch", "do not alter", "logo placement"]
TONE_KEYWORDS = ["tone of voice", "brand voice", "our personality", "how we speak", "we are bold", "we are friendly", "writing style", "voice & tone", "tone:", "voice:", "we speak", "our tone"]
RESTRICTED_KEYWORDS = ["do not claim", "forbidden", "restricted", "never say", "avoid saying", "compliance", "disclaimer", "prohibited", "unapproved", "do not use words"]


def classify_text_category(text: str) -> str:
    """
    Deterministic keyword heuristic classifier for brand guideline text chunks.
    Categorizes into 'tone', 'logo_usage', 'color_usage', 'restricted_terms', or 'uncategorized'.
    """
    lower = text.lower()

    # Color match
    if RE_HEX_CODE.search(text) or any(kw in lower for kw in COLOR_KEYWORDS):
        return "color_usage"

    # Logo match
    if any(kw in lower for kw in LOGO_KEYWORDS):
        return "logo_usage"

    # Tone match
    if any(kw in lower for kw in TONE_KEYWORDS):
        return "tone"

    # Restricted terms match
    if any(kw in lower for kw in RESTRICTED_KEYWORDS):
        return "restricted_terms"

    return "uncategorized"


def parse_pdf_content(pdf_bytes: bytes) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Extracts text paragraphs and embedded images from PDF bytes.
    Returns:
      (rules_list, images_list)
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    rules: List[Dict[str, Any]] = []
    images: List[Dict[str, Any]] = []
    seen_image_xrefs = set()

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_number = page_idx + 1

        # 1. Text extraction
        page_text = page.get_text("text")
        raw_paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]

        for p in raw_paragraphs:
            # Clean up single line breaks within a paragraph
            clean_text = " ".join(p.split())
            if len(clean_text) < 15:  # Ignore trivial labels/headers/page nums
                continue

            category = classify_text_category(clean_text)
            rules.append({
                "rule_text": clean_text,
                "category": category,
                "page_number": page_number
            })

        # 2. Embedded image extraction
        image_info_list = page.get_images(full=True)
        for img_info in image_info_list:
            xref = img_info[0]
            if xref in seen_image_xrefs:
                continue
            seen_image_xrefs.add(xref)

            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image.get("ext", "png")
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Filter out tiny icon artifacts (e.g. bullets or spacers < 40px)
                if width >= 40 and height >= 40:
                    images.append({
                        "bytes": image_bytes,
                        "ext": image_ext,
                        "width": width,
                        "height": height,
                        "page_number": page_number,
                    })
            except Exception as e:
                logger.warning(f"Failed to extract image xref {xref} on page {page_number}: {e}")

    doc.close()
    return rules, images


async def process_brand_guideline_pdf(profile_id: str, pdf_bytes: bytes, filename: str) -> None:
    """
    Background Task pipeline that runs PDF ingestion, image color extraction,
    tone embedding generation, and records insertion into Supabase.
    Ensures brand_profile status is always updated to 'ready' or 'failed'.
    """
    client = get_supabase_admin()
    if not client:
        logger.error(f"Cannot process profile {profile_id}: Supabase client not initialized.")
        return

    settings = get_settings()
    logger.info(f"Starting async ingestion for Brand Profile {profile_id} ({filename})...")

    try:
        # 1. Upload raw PDF to Supabase Storage
        raw_storage_path = f"{profile_id}/guideline_{filename}"
        upload_file_to_storage(
            bucket=settings.BUCKET_GUIDELINES,
            path=raw_storage_path,
            file_bytes=pdf_bytes,
            content_type="application/pdf"
        )
        # Update raw file path on profile
        client.table("brand_profiles").update({"raw_guideline_file_path": raw_storage_path}).eq("id", profile_id).execute()

        # 2. Parse PDF for rules and images
        rules, images = parse_pdf_content(pdf_bytes)
        logger.info(f"Extracted {len(rules)} text rules and {len(images)} images from PDF.")

        # 3. Process extracted images and colors
        all_extracted_colors: List[Dict[str, Any]] = []

        for idx, img in enumerate(images):
            img_bytes = img["bytes"]
            ext = img["ext"]
            logo_storage_path = f"{profile_id}/logo_{idx + 1}.{ext}"

            # Upload image to brand-logos bucket
            content_type = f"image/{ext}" if ext in ["png", "jpeg", "webp"] else "image/png"
            upload_file_to_storage(
                bucket=settings.BUCKET_LOGOS,
                path=logo_storage_path,
                file_bytes=img_bytes,
                content_type=content_type
            )

            # Insert logo candidate
            client.table("brand_logos").insert({
                "brand_profile_id": profile_id,
                "file_path": logo_storage_path,
                "variant_label": None,
                "min_clear_space_note": f"Extracted from page {img.get('page_number', 1)}"
            }).execute()

            # Extract colors from image
            img_colors = extract_dominant_colors_from_image_bytes(img_bytes, k=6, source="guideline_pdf")
            all_extracted_colors.extend(img_colors)

        # Deduplicate and save dominant colors
        final_palette = deduplicate_palette(all_extracted_colors, max_colors=8)
        for col in final_palette:
            client.table("brand_colors").insert({
                "brand_profile_id": profile_id,
                "hex_code": col["hex_code"],
                "usage_label": None,
                "source": "guideline_pdf",
                "frequency_rank": col["frequency_rank"]
            }).execute()

        # 4. Process and store rules & voice samples
        for rule in rules:
            rule_text = rule["rule_text"]
            category = rule["category"]
            page_num = rule["page_number"]

            # Insert rule
            client.table("brand_guideline_rules").insert({
                "brand_profile_id": profile_id,
                "rule_text": rule_text,
                "category": category,
                "page_number": page_num
            }).execute()

            # If category is tone, generate embedding and save as brand_voice_samples
            if category == "tone":
                emb = embed(rule_text)
                client.table("brand_voice_samples").insert({
                    "brand_profile_id": profile_id,
                    "sample_text": rule_text,
                    "embedding": emb,
                    "source": "guideline_pdf"
                }).execute()

        # 5. Mark status as ready
        client.table("brand_profiles").update({"status": "ready"}).eq("id", profile_id).execute()
        logger.info(f"Successfully finished ingestion for Brand Profile {profile_id}. Status set to 'ready'.")

    except Exception as e:
        logger.error(f"Error during ingestion pipeline for profile {profile_id}: {e}", exc_info=True)
        # Update status to failed so frontend is not stuck polling
        try:
            client.table("brand_profiles").update({"status": "failed"}).eq("id", profile_id).execute()
        except Exception as update_err:
            logger.error(f"Failed to update profile status to 'failed': {update_err}")
