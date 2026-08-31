import logging
import re
from typing import List, Dict, Any, Optional, Tuple

from app.services.supabase_client import get_supabase_admin
from app.services.tone_scoring_service import score_tone_similarity, OFF_TONE_THRESHOLD
from app.services.claims_classifier_service import classify_sentence_claims

logger = logging.getLogger(__name__)

# Configurable Weights & Thresholds
PASS_THRESHOLD = 80.0
FAIL_THRESHOLD = 50.0
HIGH_SEVERITY_PENALTY = 25.0
MEDIUM_SEVERITY_PENALTY = 10.0

# CTA keywords — if none of these appear, flag as missing CTA
CTA_KEYWORDS = [
    "click", "get started", "try", "download", "sign up", "sign-up", "signup",
    "register", "learn more", "discover", "explore", "shop", "buy", "order",
    "book", "subscribe", "start", "join", "contact", "call", "visit", "access",
    "claim", "grab", "unlock", "activate", "apply", "request", "get",
    "tap", "swipe", "follow", "share", "link in bio", "link in comments",
    "→", "➔", "▶"
]


def check_cta_presence(text: str) -> bool:
    """Returns True if the text contains at least one call-to-action keyword."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in CTA_KEYWORDS)


def split_text_into_sentences(text: str) -> List[Tuple[str, int, int]]:
    """
    Splits text into sentences while tracking start_offset and end_offset for inline text highlighting.
    """
    sentences = []
    # Pattern to match sentence endings
    pattern = re.compile(r'[^.!?]+[.!?]+|\s*[^.!?]+$')
    for match in pattern.finditer(text):
        sentence_str = match.group().strip()
        if len(sentence_str) > 0:
            sentences.append((sentence_str, match.start(), match.end()))
    if not sentences and len(text.strip()) > 0:
        sentences.append((text.strip(), 0, len(text)))
    return sentences


def run_text_compliance_audit(
    brand_profile_id: str,
    text: str,
    user_id: str,
    variant_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Orchestrates full compliance audit pipeline:
    1. Tone similarity scoring against Phase 1 brand voice anchors.
    2. Deterministic keyword checking against Phase 1 restricted_terms rules.
    3. Zero-shot claims classification via DistilBART / BART MNLI.
    4. Weighted score computation (0-100) and status determination (pass/warning/fail).
    5. Saves audit and flag records to Supabase database.
    """
    client = get_supabase_admin()
    clean_text = text.strip()

    if not clean_text:
        raise ValueError("Input text for compliance audit cannot be empty.")

    flags: List[Dict[str, Any]] = []

    # 1. Tone Similarity Scoring
    tone_similarity, best_sample_id = score_tone_similarity(brand_profile_id, clean_text)
    if tone_similarity < OFF_TONE_THRESHOLD:
        flags.append({
            "flag_type": "off_tone",
            "severity": "medium",
            "flagged_text_snippet": clean_text[:100] + "..." if len(clean_text) > 100 else clean_text,
            "start_offset": 0,
            "end_offset": len(clean_text),
            "explanation": f"Tone similarity score ({tone_similarity:.2f}) is below brand threshold ({OFF_TONE_THRESHOLD}). Copy sounds off-brand compared to reference voice anchors.",
            "source_rule_id": None
        })

    # 2. Sentence Splitting for Granular Auditing & Highlighting
    sentence_spans = split_text_into_sentences(clean_text)
    sentence_texts = [s[0] for s in sentence_spans]

    # 3. Deterministic Restricted Terms Check
    restricted_rules = []
    if client:
        try:
            r_res = client.table("brand_guideline_rules").select("*").eq("brand_profile_id", brand_profile_id).eq("category", "restricted_terms").execute()
            restricted_rules = r_res.data or []
        except Exception as e:
            logger.error(f"Error fetching restricted rules for audit: {e}")

    flagged_sentences = set()
    for s_text, start_off, end_off in sentence_spans:
        s_lower = s_text.lower()

        for rule in restricted_rules:
            rule_text = rule["rule_text"].strip()
            # Extract key prohibited phrases inside quotes if present
            quoted_phrases = re.findall(r'"([^"]+)"', rule_text)
            phrases_to_check = quoted_phrases if quoted_phrases else [rule_text]

            for phrase in phrases_to_check:
                phrase_clean = phrase.lower().strip()
                if len(phrase_clean) > 3 and phrase_clean in s_lower:
                    flags.append({
                        "flag_type": "restricted_term_match",
                        "severity": "high",
                        "flagged_text_snippet": s_text,
                        "start_offset": start_off,
                        "end_offset": end_off,
                        "explanation": f"Contains restricted term or prohibited claim matching brand guideline rule (Page #{rule.get('page_number') or 1}): \"{phrase}\"",
                        "source_rule_id": rule["id"]
                    })
                    flagged_sentences.add(s_text)
                    break

    # 4. Zero-Shot Claims Classification (for sentences not already caught by restricted terms)
    unflagged_sentences = [s for s in sentence_texts if s not in flagged_sentences]
    if unflagged_sentences:
        zero_shot_flags = classify_sentence_claims(unflagged_sentences)
        for zf in zero_shot_flags:
            # Map offsets
            snippet = zf["flagged_text_snippet"]
            start_off = clean_text.find(snippet)
            end_off = start_off + len(snippet) if start_off != -1 else None

            flags.append({
                "flag_type": zf["flag_type"],
                "severity": zf["severity"],
                "flagged_text_snippet": snippet,
                "start_offset": start_off if start_off != -1 else None,
                "end_offset": end_off,
                "explanation": zf["explanation"],
                "source_rule_id": None
            })

    # 5. CTA Presence Check
    cta_present = check_cta_presence(clean_text)
    if not cta_present:
        flags.append({
            "flag_type": "missing_cta",
            "severity": "medium",
            "flagged_text_snippet": clean_text[:80] + "..." if len(clean_text) > 80 else clean_text,
            "start_offset": None,
            "end_offset": None,
            "explanation": "No call-to-action detected. Add a directive phrase such as 'Get started', 'Learn more', or 'Sign up' to drive user action.",
            "source_rule_id": None
        })

    # 5. Compute Weighted Overall Score (0-100)
    high_flags_count = sum(1 for f in flags if f["severity"] == "high")
    med_flags_count = sum(1 for f in flags if f["severity"] == "medium")

    tone_score_points = tone_similarity * 30.0  # Max 30 pts
    high_penalty_pts = min(50.0, high_flags_count * HIGH_SEVERITY_PENALTY)
    high_score_points = max(0.0, 50.0 - high_penalty_pts)  # Max 50 pts

    med_penalty_pts = min(20.0, med_flags_count * MEDIUM_SEVERITY_PENALTY)
    med_score_points = max(0.0, 20.0 - med_penalty_pts)   # Max 20 pts

    raw_overall = tone_score_points + high_score_points + med_score_points
    overall_score = round(max(0.0, min(100.0, raw_overall)), 2)

    # 6. Determine Audit Status
    if high_flags_count > 0 or overall_score < FAIL_THRESHOLD:
        audit_status = "fail"
    elif overall_score >= PASS_THRESHOLD:
        audit_status = "pass"
    else:
        audit_status = "warning"

    # 7. Store Audit & Flags in Supabase Database
    audit_id = None
    created_flags = []

    if client:
        try:
            audit_insert = {
                "variant_id": variant_id,
                "raw_text": clean_text if not variant_id else None,
                "brand_profile_id": brand_profile_id,
                "user_id": user_id,
                "overall_score": overall_score,
                "tone_similarity_score": tone_similarity,
                "status": audit_status
            }
            a_res = client.table("compliance_audits").insert(audit_insert).execute()
            if a_res.data:
                audit_record = a_res.data[0]
                audit_id = audit_record["id"]

                # Insert flags
                if flags:
                    flag_inserts = []
                    for f in flags:
                        flag_inserts.append({
                            "audit_id": audit_id,
                            "flag_type": f["flag_type"],
                            "severity": f["severity"],
                            "flagged_text_snippet": f["flagged_text_snippet"],
                            "start_offset": f.get("start_offset"),
                            "end_offset": f.get("end_offset"),
                            "explanation": f["explanation"],
                            "source_rule_id": f.get("source_rule_id")
                        })
                    f_res = client.table("compliance_flags").insert(flag_inserts).execute()
                    created_flags = f_res.data or []
        except Exception as e:
            logger.error(f"Error persisting compliance audit to database: {e}")

    logger.info(f"Compliance audit complete for brand {brand_profile_id}: Score {overall_score}, Status '{audit_status}', Flags: {len(flags)}, CTA Present: {cta_present}")

    return {
        "id": audit_id or "mock-audit-id",
        "variant_id": variant_id,
        "raw_text": clean_text,
        "brand_profile_id": brand_profile_id,
        "user_id": user_id,
        "overall_score": overall_score,
        "tone_similarity_score": tone_similarity,
        "status": audit_status,
        "cta_present": cta_present,
        "flags": created_flags if created_flags else flags
    }
