import logging
import json
import re
from typing import List, Dict, Any, Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


def build_channel_instructions(channel: str) -> str:
    """
    Returns channel-specific format and variant expectations.
    """
    ch = channel.lower()
    if ch in ["instagram", "twitter_x"]:
        return (
            "Generate 3 variants specifically tailored for social media captions:\n"
            "- 1 'headline' (an attention-grabbing hook line)\n"
            "- 1 'full_post' (an engaging caption with 2-3 relevant hashtag suggestions)\n"
            "- 1 'cta' (a punchy call to action)\n"
        )
    elif ch == "linkedin":
        return (
            "Generate 3 variants tailored for a professional LinkedIn audience:\n"
            "- 1 'headline' (a bold insight or question hook)\n"
            "- 1 'body' (a structured 2-3 paragraph professional post narrative with line breaks)\n"
            "- 1 'cta' (a strategic call to action encouraging comments or visits)\n"
        )
    elif ch == "email":
        return (
            "Generate 3 variants tailored for email marketing:\n"
            "- 1 'subject_line' (a high-open-rate email subject line)\n"
            "- 1 'body' (a persuasive email body narrative with greeting and value prop)\n"
            "- 1 'cta' (a clear button/link CTA text)\n"
        )
    elif ch == "banner_ad":
        return (
            "Generate 3 variants tailored for digital banner ads:\n"
            "- 1 'headline' (a ultra-concise 3-7 word value proposition headline)\n"
            "- 1 'body' (a single line supportive subheadline)\n"
            "- 1 'cta' (a 2-4 word high-converting button CTA)\n"
        )
    else:
        return (
            "Generate 3 variants:\n"
            "- 1 'headline'\n"
            "- 1 'body'\n"
            "- 1 'cta'\n"
        )


def clean_json_response(raw_text: str) -> str:
    """
    Cleans markdown code fences (```json ... ```) from LLM output.
    """
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def generate_fallback_mock_variants(
    brief: Dict[str, Any],
    grounding_anchors: List[Dict[str, Any]],
    restricted_rules: List[Dict[str, Any]],
    generation_index: int = 1
) -> List[Dict[str, Any]]:
    """
    Generates channel-tailored mock variants grounded in retrieved voice anchors
    when GEMINI_API_KEY is not configured or fails.
    """
    goal = brief.get("campaign_goal", "Drive engagement")
    audience = brief.get("target_audience", "Target customers")
    product = brief.get("product_or_feature", "Our platform")
    channel = brief.get("channel", "general").lower()

    # Extract grounding IDs
    grounding_ids = [a["id"] for a in grounding_anchors[:3]]

    # Sample tone flavor from top grounding anchor
    tone_sample = grounding_anchors[0]["sample_text"] if grounding_anchors else "Empowering and authentic"
    tone_snippet = tone_sample[:60] + "..." if len(tone_sample) > 60 else tone_sample

    suffix = f" (Variant Batch #{generation_index})" if generation_index > 1 else ""

    if channel in ["instagram", "twitter_x"]:
        return [
            {
                "variant_type": "headline",
                "variant_text": f"Transform how you experience {product}. {goal}!{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "full_post",
                "variant_text": f"Designed for {audience}: {product} makes it effortless to {goal.lower()}. Built with the principles: '{tone_snippet}'. #Marketing #Innovation #Growth{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "cta",
                "variant_text": f"Tap the link in bio to try {product} today!{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            }
        ]
    elif channel == "linkedin":
        return [
            {
                "variant_type": "headline",
                "variant_text": f"Why modern {audience} are rethinking their strategy for {product}:{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "body",
                "variant_text": f"Achieving {goal.lower()} shouldn't require compromising on quality.\n\nWith {product}, teams can streamline their workflow while staying true to brand principles: '{tone_snippet}'.\n\nHere is how leading organizations are taking action today.{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "cta",
                "variant_text": f"Explore how {product} fits into your roadmap — link in comments.{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            }
        ]
    elif channel == "email":
        return [
            {
                "variant_type": "subject_line",
                "variant_text": f"Introducing {product}: Built for {audience} to {goal.lower()}{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "body",
                "variant_text": f"Hi there,\n\nWe are excited to unveil {product}, designed specifically for {audience}.\n\nOur mission is simple: {goal.lower()}. Grounded in our commitment: '{tone_snippet}'.\n\nReady to get started?{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "cta",
                "variant_text": f"Claim your early access to {product} →{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            }
        ]
    else:
        return [
            {
                "variant_type": "headline",
                "variant_text": f"Empowering {audience} with {product}{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "body",
                "variant_text": f"Discover how {product} helps you {goal.lower()}. Grounded in brand voice: '{tone_snippet}'.{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            },
            {
                "variant_type": "cta",
                "variant_text": f"Get started with {product} today{suffix}",
                "grounding_voice_sample_ids": grounding_ids
            }
        ]


def generate_copy_variants(
    brief: Dict[str, Any],
    retrieved_context: Dict[str, Any],
    generation_index: int = 1
) -> List[Dict[str, Any]]:
    """
    Core LLM generation pipeline using Gemini Flash API (or fallback mock).
    Grounded in top-5 retrieved voice anchors & restricted terms constraints.
    """
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY

    voice_anchors = retrieved_context.get("voice_anchors", [])
    restricted_rules = retrieved_context.get("restricted_rules", [])
    grounding_ids = [a["id"] for a in voice_anchors]

    # If GEMINI_API_KEY is missing, use dev fallback
    if not api_key or "your_" in api_key.lower():
        logger.info("GEMINI_API_KEY missing or default. Using dev fallback grounded copy generator.")
        return generate_fallback_mock_variants(brief, voice_anchors, restricted_rules, generation_index)

    # 1. Build prompt context
    channel = brief.get("channel", "other")
    channel_instructions = build_channel_instructions(channel)

    voice_context_str = ""
    if voice_anchors:
        voice_context_str = "MANDATORY BRAND VOICE SAMPLES (Match this style, vocabulary, and tone):\n"
        for i, a in enumerate(voice_anchors, 1):
            voice_context_str += f"- Anchor #{i} (ID: {a['id']}): \"{a['sample_text']}\"\n"
    else:
        voice_context_str = "No specific voice anchors provided; maintain a professional, customer-centric brand tone.\n"

    restricted_str = ""
    if restricted_rules:
        restricted_str = "HARD NEGATIVE CONSTRAINTS (NEVER use these words or make these claims):\n"
        for r in restricted_rules:
            restricted_str += f"- Prohibited Claim/Term: \"{r['rule_text']}\"\n"

    prompt = f"""You are an expert brand copywriter and campaign strategist.

CAMPAIGN BRIEF:
- Product/Feature: {brief.get('product_or_feature')}
- Campaign Goal: {brief.get('campaign_goal')}
- Target Audience: {brief.get('target_audience')}
- Marketing Channel: {channel}
- Additional Context: {brief.get('additional_context') or 'None'}

{voice_context_str}
{restricted_str}

OUTPUT FORMAT REQUIREMENT:
{channel_instructions}
Return ONLY a valid JSON array containing exactly 3 objects. Do NOT include markdown code blocks or explanatory text.
Each object must have the fields:
- "variant_type": string (must be one of: "headline", "body", "cta", "full_post", "subject_line")
- "variant_text": string (the copy statement)

JSON Output:"""

    # 2. Call Gemini Flash API via HTTP (trying gemini-2.0-flash, fallback to gemini-1.5-flash)
    models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}

        try:
            response = httpx.post(url, headers=headers, json=payload, timeout=25.0)

            if response.status_code == 200:
                data = response.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = clean_json_response(raw_text)
                parsed = json.loads(cleaned)

                if isinstance(parsed, list) and len(parsed) > 0:
                    variants = []
                    for p in parsed:
                        v_type = p.get("variant_type", "body").lower()
                        if v_type not in ["headline", "body", "cta", "full_post", "subject_line"]:
                            v_type = "body"

                        variants.append({
                            "variant_type": v_type,
                            "variant_text": p.get("variant_text", "").strip(),
                            "grounding_voice_sample_ids": grounding_ids
                        })

                    logger.info(f"Successfully generated {len(variants)} copy variants via {model_name}.")
                    return variants
            else:
                logger.info(f"Gemini {model_name} status {response.status_code}: {response.text[:120]}")
        except Exception as e:
            logger.warning(f"Exception trying {model_name}: {e}")

    # Fallback to dev generator if API call fails
    return generate_fallback_mock_variants(brief, voice_anchors, restricted_rules, generation_index)
