# CampaignX AI — Final Implementation Plan

## Project goal

Build the complete application as a no-training, pretrained-model marketing intelligence platform that can:

- register a brand from a PDF or manual entry
- generate grounded marketing copy
- audit text compliance
- generate posters for campaigns
- audit posters visually and flag brand-rule violations
- return production-quality marketing outputs with trust and compliance evidence

This is the final implementation direction for the project. No feature is being removed. We are redefining the execution plan to keep the full scope while removing all dependence on custom model training and Gemini API usage.

---

## 1 Final product outcome

After implementation, the app will produce two categories of output per campaign:

### A. Compliant marketing copy
The user can generate campaign text such as headlines, body copy, CTAs, email subject lines, and social content. Each output is grounded in the stored brand profile and checked for:

- tone alignment
- restricted-rule violations
- risky or unsupported claims
- channel-specific compliance constraints

### B. Compliant poster asset
The user can generate a poster using the campaign brief, brand logo, approved colors, and campaign text. The final poster is then auto-audited for:

- logo presence and logo matching
- color compliance against the brand palette
- text rule compliance
- banned claim detection
- overall visual compliance score

The system is designed around a generate → audit → review → regenerate loop.

---

## 2 Final system architecture

### Frontend

The frontend remains a React + TypeScript + Vite application built to support:

- brand onboarding
- brand profile review/editing
- campaign brief creation
- copy generation and variant selection
- compliance audit review
- poster generation and poster audit results

Core frontend files:

- [frontend/src/App.tsx](frontend/src/App.tsx)
- [frontend/src/pages](frontend/src/pages)

### Backend

The backend remains a FastAPI application that orchestrates:

- brand registration and onboarding
- document parsing for PDF inputs
- embeddings and retrieval
- prompt construction and generation
- text compliance audits
- poster generation and visual compliance

Core backend files:

- [backend/app/main.py](backend/app/main.py)
- [backend/app/config.py](backend/app/config.py)
- [backend/app/api](backend/app/api)
- [backend/app/services](backend/app/services)

### Data layer

Supabase remains the system of record for:

- brand profiles
- campaign briefs
- generated variants
- audit results
- file storage for PDFs, logos, and posters

Migration files:

- [supabase/migrations](supabase/migrations)
- [backend/migrations](backend/migrations)

---

## 3 Pretrained-only model strategy

The project will not train any new models. We will use pretrained models only.

### Embeddings

Use:

- sentence-transformers/all-MiniLM-L6-v2

This powers:

- brand voice retrieval
- tone similarity scoring
- semantic matching for grounded generation
- compliance similarity checks

Current implementation reference:

- [backend/app/services/embedding_service.py](backend/app/services/embedding_service.py)

### Generation

Use a local pretrained LLM via Ollama or a Hugging Face transformer runtime.

Recommended stack:

- Ollama with a local model such as llama3.2 or mistral

This replaces Gemini and keeps generation fully local and compatible with a no-training architecture.

Reference:

- [backend/app/services/generation_service.py](backend/app/services/generation_service.py)

### Visual similarity

Use CLIP-based image matching first, with a fallback histogram/structure comparison when needed.

Reference:

- [backend/app/services/logo_matching_service.py](backend/app/services/logo_matching_service.py)

### OCR and parsing

Use pretrained libraries and rule-based extraction where required.

Reference:

- [backend/app/services/pdf_parser.py](backend/app/services/pdf_parser.py)

---

## 4 Brand onboarding workflow

The onboarding flow is required to support both sources of brand data:

### Option A — User provides brand guideline PDF
The system extracts:

- brand name
- colors
- tone and voice samples
- sample texts
- restricted rules
- logo references if present

The extracted profile is shown to the user for review and editing before saving.

### Option B — User does not have a guideline PDF
The system must support manual onboarding.

Manual onboarding must include these required fields:

- brand name
- logo upload (mandatory before save)
- brand colors
  - primary color
  - secondary color
  - accent color
- tone and voice selection
  - dropdown values such as bold, premium, friendly, professional, playful, minimal, trustworthy, innovative
  - custom tone description allowed
- voice examples
  - at least 2 samples
  - ideally 3–5 samples
- restricted rules
  - quick-select options and custom manual rules

The final saved brand profile must be structurally identical to a PDF-generated brand profile so downstream logic does not need special cases.

### Required rule

A brand profile is not valid until:

- the logo is uploaded
- at least one primary color exists
- at least one tone profile is selected
- at least 2 voice examples exist
- at least 1 restricted rule exists

This ensures the app remains functional for Phase 2, Phase 3, and Phase 4.

---

## 5 Required user actions after brand registration

### A. Create campaign brief and generate copy
The user provides:

- campaign goal
- target audience
- channel
- product or feature
- additional context

The app generates:

- headline
- body copy
- CTA
- alternate variants per channel

This is Phase 2.

### B. Generate poster
The user creates a poster from the selected campaign brief.

The app composes:

- brand logo
- approved colors
- campaign messaging
- generated background layout
- poster asset export

This is the generation half of Phase 4.

### C. Audit the poster automatically
Every generated poster is automatically audited after generation.

The audit checks:

- logo is present and correctly matched
- colors are within approved palette
- wording follows approved slogan/claims boundary
- banned/disallowed claims are absent
- overall compliance score is calculated

### D. Audit text independently
The user can also paste any marketing copy and run a text compliance audit without creating a poster.

This is Phase 3 and is independent from poster generation.

### E. Regenerate after violations
If the audit fails or warns, the user can regenerate with corrected input or improved brand-safe copy.

This is the core product loop:

generate → audit → review → regenerate → approve

---

## 6 Final project roadmap (5-hour implementation plan)

### Hour 1 — Lock architecture and freeze scope

Tasks:

- confirm no-training strategy is final
- remove Gemini dependency from the plan
- lock the pretrained model stack
- define exact files to be edited
- confirm all phases remain in scope

Deliverable:

- final implementation checklist and file list

### Hour 2 — Replace Gemini generation with local pretrained generation

Tasks:

- update environment settings in [backend/app/config.py](backend/app/config.py)
- replace Gemini logic in [backend/app/services/generation_service.py](backend/app/services/generation_service.py)
- preserve prompt structure and JSON output schema
- ensure generation works without API keys

Deliverable:

- copy generation works using local pretrained inference

### Hour 3 — Validate retrieval, tone scoring, and compliance

Tasks:

- validate the embedding pipeline in [backend/app/services/embedding_service.py](backend/app/services/embedding_service.py)
- confirm retrieval works with brand voice samples and restricted rules
- validate tone score logic in [backend/app/services/tone_scoring_service.py](backend/app/services/tone_scoring_service.py)
- validate text compliance results in [backend/app/services/compliance_service.py](backend/app/services/compliance_service.py)
- run verification scripts

Deliverable:

- Phase 2 and Phase 3 working with pretrained-only architecture

### Hour 4 — Validate poster generation and visual compliance

Tasks:

- validate logo matching logic in [backend/app/services/logo_matching_service.py](backend/app/services/logo_matching_service.py)
- validate detection pipeline in [backend/app/services/logo_detection_service.py](backend/app/services/logo_detection_service.py)
- validate poster compliance orchestration in [backend/app/services/visual_compliance_service.py](backend/app/services/visual_compliance_service.py)
- confirm poster generation still aligns with campaign data

Deliverable:

- Phase 4 generation + audit is working end-to-end

### Hour 5 — Full smoke test and bug fix pass

Tasks:

- test manual brand onboarding without PDF
- test onboarding with PDF
- validate campaign generation flow
- validate text compliance flow
- validate poster generation + poster audit flow
- check frontend routes and API consistency
- fix blocking issues only

Deliverable:

- project is demo-ready and feature-complete within the current scope

---

## 7 Execution rules for this implementation plan

These are non-negotiable:

- no custom model training
- no Gemini API dependency
- no feature reduction
- no change to final user workflow expectations
- no saving a brand profile without a logo in manual mode
- no break in the existing frontend/backend contract
- all user-facing outputs must include a compliance verdict or score

---

## 8 Final expected result

By the end of the implementation phase, the project should deliver:

- a complete brand registration system with PDF and manual-entry paths
- grounded campaign copy generation using pretrained text embeddings and local LLM inference
- text compliance audits with tone and restricted-rule checks
- poster generation and visual audit capability
- final marketing outputs that are reviewable, correctable, and approval-ready

This is the final implementation direction. It keeps the full product scope, removes custom training, and finishes the project in a practical, no-training architecture.
