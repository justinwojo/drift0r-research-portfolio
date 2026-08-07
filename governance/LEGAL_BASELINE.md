# Legal baseline `legal-baseline-2026-08`

> Research only — not medical advice.  
> Traceability target for `site/src/data/release.yaml` field `disclaimer_id: legal-baseline-2026-08`.

## What this ID means

The **legal-baseline-2026-08** label identifies the August 2026 research-preview disclaimer set used by the site and repository:

1. Research only — not medical advice, diagnosis, or treatment.  
2. Patient publication permission obtained; **permission is not endorsement**.  
3. Clinician review has **not** been performed.  
4. No primary instrument records reviewed by this project.  
5. Multi-model AI agreement is not clinical validation.  
6. Third-party literature is cited/linked, not redistributed as full text.  
7. Search indexing **enabled** (`index, follow`) by owner decision DEC-0037. Single-sourced from `release.yaml:noindex`.  
8. Correction / privacy / removal: dedicated GitHub issue template (no private medical records in issues). Sensitive Drift0r consent or withdrawal may continue through existing private correspondence with the repository owner. No published privacy@ email.  
9. Public research contributions: structured GitHub Issues only.

## Canonical surfaces

- `LEGAL.md`  
- Site routes `/legal/`, Methods, and the persistent status notice on every HTML route  
- `governance/CORRECTIONS_POLICY.md` and `governance/PRIVACY_AND_CONSENT.md`

Changing any of the above commitments for a new release requires a new `disclaimer_id` (or an explicit erratum) rather than silently reusing this label.
