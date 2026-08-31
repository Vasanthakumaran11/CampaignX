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


def _build_prompt(brief: Dict[str, Any], retrieved_context: Dict[str, Any]) -> str:
    """Build a grounded prompt for local or remote model generation."""
    voice_anchors = retrieved_context.get("voice_anchors", [])
    restricted_rules = retrieved_context.get("restricted_rules", [])

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

    return f"""You are an expert brand copywriter and campaign strategist.

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


def _parse_json_variants(raw_text: str, grounding_ids: List[str]) -> List[Dict[str, Any]]:
    """Parse a model response into the app's stable variant schema."""
    cleaned = clean_json_response(raw_text)
    parsed = json.loads(cleaned)

    if not isinstance(parsed, list) or len(parsed) == 0:
        raise ValueError("Model response did not contain a JSON array of variants.")

    variants = []
    for p in parsed:
        v_type = str(p.get("variant_type", "body")).lower()
        if v_type not in ["headline", "body", "cta", "full_post", "subject_line"]:
            v_type = "body"

        variants.append({
            "variant_type": v_type,
            "variant_text": str(p.get("variant_text", "")).strip(),
            "grounding_voice_sample_ids": grounding_ids
        })

    return variants


def _generate_with_ollama(prompt: str, model_name: str, base_url: str) -> str:
    """Call a local Ollama model and return the raw model output."""
    url = f"{base_url.rstrip('/')}/api/generate"
    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.7}
    }

    response = httpx.post(url, json=payload, timeout=45.0)
    if response.status_code != 200:
        raise RuntimeError(f"Ollama request failed: {response.status_code} - {response.text[:200]}")

    data = response.json()
    return data.get("response", "")


def generate_copy_variants(
    brief: Dict[str, Any],
    retrieved_context: Dict[str, Any],
    generation_index: int = 1
) -> List[Dict[str, Any]]:
    """
    Core generation pipeline using local pretrained generation if available,
    falling back to the mock generator only when local generation is unavailable.
    """
    settings = get_settings()
    voice_anchors = retrieved_context.get("voice_anchors", [])
    restricted_rules = retrieved_context.get("restricted_rules", [])
    grounding_ids = [a["id"] for a in voice_anchors]

    provider = (getattr(settings, "GENERATION_PROVIDER", "ollama") or "ollama").lower()
    if provider == "gemini":
        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key or "your_" in str(api_key).lower():
            logger.info("Gemini key missing; using dev fallback grounded copy generator.")
            return generate_fallback_mock_variants(brief, voice_anchors, restricted_rules, generation_index)

    if provider in ["ollama", "local", "local_llm"]:
        try:
            prompt = _build_prompt(brief, retrieved_context)
            model_name = getattr(settings, "OLLAMA_MODEL", "llama3.2")
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
            raw_text = _generate_with_ollama(prompt, model_name, base_url)
            variants = _parse_json_variants(raw_text, grounding_ids)
            logger.info(f"Successfully generated {len(variants)} copy variants via local Ollama model '{model_name}'.")
            return variants
        except Exception as e:
            logger.warning(f"Local generation failed: {e}. Falling back to mock generator.")

    if getattr(settings, "GEMINI_API_KEY", None):
        api_key = settings.GEMINI_API_KEY
        logger.info("Falling back to Gemini as a legacy option only when configured.")
        try:
            prompt = _build_prompt(brief, retrieved_context)
            channel = brief.get("channel", "other")
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
                response = httpx.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=25.0)
                if response.status_code == 200:
                    data = response.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    variants = _parse_json_variants(raw_text, grounding_ids)
                    logger.info(f"Successfully generated {len(variants)} copy variants via Gemini fallback '{model_name}'.")
                    return variants
                logger.info(f"Gemini {model_name} status {response.status_code}: {response.text[:120]}")
        except Exception as gemini_err:
            logger.warning(f"Gemini fallback failed: {gemini_err}")

    logger.info("Using dev fallback grounded copy generator.")
    return generate_fallback_mock_variants(brief, voice_anchors, restricted_rules, generation_index)


def revise_variant(
    original_text: str,
    revision_instruction: str,
    brief: Dict[str, Any],
    retrieved_context: Dict[str, Any],
) -> str:
    """
    Takes an existing copy variant, a user revision instruction, and the brand context,
    then produces a single revised variant text string.
    Falls back to a deterministic rule-based revision if LLM is unavailable.
    """
    settings = get_settings()
    voice_anchors = retrieved_context.get("voice_anchors", [])
    restricted_rules = retrieved_context.get("restricted_rules", [])

    voice_context_str = ""
    if voice_anchors:
        voice_context_str = "BRAND VOICE SAMPLES (match this style):\n"
        for i, a in enumerate(voice_anchors[:3], 1):
            voice_context_str += f"- #{i}: \"{a['sample_text']}\"\n"

    restricted_str = ""
    if restricted_rules:
        restricted_str = "NEVER include these terms or claims:\n"
        for r in restricted_rules:
            restricted_str += f"- \"{r['rule_text']}\"\n"

    prompt = f"""You are an expert brand copywriter. Revise the marketing copy below according to the user's instruction.

ORIGINAL COPY:
\"{original_text}\"

USER REVISION INSTRUCTION:
\"{revision_instruction}\"

CAMPAIGN CONTEXT:
- Product: {brief.get('product_or_feature', '')}
- Goal: {brief.get('campaign_goal', '')}
- Audience: {brief.get('target_audience', '')}
- Channel: {brief.get('channel', '')}

{voice_context_str}
{restricted_str}
Return ONLY the revised copy text as a single plain string. No JSON, no markdown, no explanation.

Revised Copy:"""

    # Try Ollama first
    provider = (getattr(settings, "GENERATION_PROVIDER", "ollama") or "ollama").lower()
    if provider in ["ollama", "local", "local_llm"]:
        try:
            model_name = getattr(settings, "OLLAMA_MODEL", "llama3.2")
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
            raw = _generate_with_ollama(prompt, model_name, base_url)
            revised = raw.strip().strip('"').strip()
            if revised:
                logger.info(f"Revision generated via Ollama '{model_name}'.")
                return revised
        except Exception as e:
            logger.warning(f"Ollama revision failed: {e}")

    # Try Gemini fallback
    if getattr(settings, "GEMINI_API_KEY", None):
        try:
            api_key = settings.GEMINI_API_KEY
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.6}}
            response = httpx.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=25.0)
            if response.status_code == 200:
                data = response.json()
                raw = data["candidates"][0]["content"]["parts"][0]["text"]
                revised = raw.strip().strip('"').strip()
                if revised:
                    return revised
        except Exception as e:
            logger.warning(f"Gemini revision failed: {e}")

    # Deterministic fallback: prepend instruction acknowledgement to original
    logger.info("Using deterministic fallback for revision.")
    instruction_lower = revision_instruction.lower()
    revised = original_text
    if "shorter" in instruction_lower or "concise" in instruction_lower:
        sentences = [s.strip() for s in original_text.split('.') if s.strip()]
        revised = sentences[0] + '.' if sentences else original_text
    elif "formal" in instruction_lower or "professional" in instruction_lower:
        revised = original_text.replace("!", ".").replace("you", "you").strip()
    elif "remove" in instruction_lower or "without" in instruction_lower:
        # Strip last sentence (commonly where restricted claim lands)
        parts = original_text.rsplit('.', 1)
        revised = parts[0].strip() + '.' if len(parts) > 1 else original_text
    return revised
