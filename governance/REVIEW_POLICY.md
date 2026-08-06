# Review policy

> Who reviews what, and how review status is displayed.  
> **Not medical advice.**

## Review roles

| Role | May review | Display rule |
|------|------------|--------------|
| Repository owner | Scope, priorities, technical readiness | Not “clinician reviewed” |
| Patient | Lived history, quotations, publication scope, consent | Status/date/scope only — no signature artifacts |
| Licensed clinician | Terminology, safety, record interpretation **within expertise** | Always show **scope** (e.g., bone/endocrine only) |
| Codex / AI tools | Code, contradictions, provenance hygiene | “Technical/research review” — never clinician |
| Legal/privacy adviser | Publication risk, privacy, consent framing | Not medical validity |

## Status vocabulary

Use only declared enums (see `schemas/review-status.schema.json`):

- `not_reviewed`
- `source_audited`
- `patient_reviewed`
- `clinician_reviewed`
- `rejected`

Release-level status: `draft` → `internal_review` → `patient_review` → `clinician_review` → `release_candidate` → `published`.

## Partial review rule

**Never** label the whole project “clinician reviewed” when only one section was reviewed.  
Example correct label: “Bone/DXA terminology reviewed by a licensed clinician (scope: densitometry language only; date: YYYY-MM-DD).”

## Launch-critical content requiring review before public medical pages

1. Home / case anchors  
2. Working-model top hypotheses  
3. Clinician one-pager / questions page  
4. Infection specialty-vs-confirmed table  
5. BMD age <50 terminology  
6. Disclaimer and legal page  

## AI review

AI adversarial review is encouraged and **does not** replace patient or clinician review.

## Findings disposition

Reviewers should mark findings:

- Launch blocker  
- Should fix before launch  
- Can follow after launch  
- Editorial preference  

Owner records decisions in `audits/.../DECISIONS.md` or release notes.
