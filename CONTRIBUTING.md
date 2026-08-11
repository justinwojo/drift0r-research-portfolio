# Contributing to the Drift0r Research Evidence Portfolio

> **Research only — not medical advice, diagnosis, or treatment.**  
> **Published with Drift0r’s permission. Permission is not endorsement.**  
> **Clinician review has not been performed.**

Thank you for helping improve this **research preview**. The project is incomplete and open to correction. Contributions are **tightly gated** so public surfaces stay evidence-oriented and safe.

## Contact channels

There is **no published privacy@ email address** for this project.

| Channel | Use |
|---------|-----|
| **GitHub issue — Correction, privacy, or removal request** | Factual corrections about the patient/case materials, privacy concerns, and requests to correct or remove published content. A GitHub account is required. **Do not post private medical records.** |
| **GitHub Issues** (other templates) | Public research contributions (literature, citation fixes, counterevidence, alternative hypotheses). |
| **Existing private correspondence with the repository owner** | Sensitive **consent or withdrawal of publication consent** from Drift0r may continue through that private channel (not a public email on the site). |

Also see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md), and `docs/public/COMMUNITY_MODERATION.md` for community and security expectations.

## What we accept

Open a **GitHub issue** using one of the templates:

| Template | Use for |
|----------|---------|
| **Correction, privacy, or removal request** | Factual error about published case materials; privacy concern; request to correct, limit, or remove published content. **Do not attach private records.** |
| Literature suggestion | Peer-reviewed papers, guidelines, or high-quality reviews with DOI/PMID when available |
| Factual / citation correction | Wrong numbers, mis-cited identifiers, broken trails, typographical errors in claims/cards |
| Contradictory evidence | Published evidence that challenges a listed interpretation or hypothesis |
| Alternative hypothesis / research idea | A research framing (not a clinical order or self-experiment protocol) |

Maintainers may re-label, request citations, or decline items outside scope.

## What we do **not** accept in public issues

**Do not post:**

- Private medical records, lab PDFs, imaging files, or clinic notes  
- Personal identifiers of third parties (addresses, phone numbers, full names of non-public figures, etc.)  
- Treatment instructions (“start/stop this drug”, dosing, self-experiment protocols)  
- Unsupported diagnoses presented as clinical fact  
- Requests for personal medical advice  

Violations will be closed and may be deleted. This is **not** an unmoderated medical-advice discussion surface.

## Evidence and citation expectations

1. Prefer **stable identifiers**: DOI, PMID, PMCID, or official guideline URLs.  
2. Quote sparingly; respect third-party copyright (no full paywalled texts).  
3. State **what** is claimed, **where** it is published, and **how** it applies (or does not apply) to this research portfolio.  
4. Note **limitations and counterevidence** when known.  
5. AI-generated suggestions must still carry human-verifiable citations; multi-model agreement is not clinical validation.

## Correction process

Material errors are logged and shown on affected records and the changelog rather than fixed silently. See:

- `governance/CORRECTIONS_POLICY.md`  
- `audits/2026-08-publication-readiness/CORRECTIONS.md`
- Site route `/changelog/` after build  

If you are correcting a specific claim or literature card, include its ID (e.g. `CLM-0003`, `lit-0015`).

For privacy or removal requests, use the **Correction, privacy, or removal request** template. Quote public site text only. Sensitive consent or withdrawal from Drift0r may continue through the existing private correspondence channel with the repository owner.

## Pull requests

**Prefer issues** over unsolicited large PRs. Small, well-scoped PRs that fix typos, citations, or documentation may be considered after discussion in an issue. Do not open PRs that add private source PDFs, secrets, or medical advice content.

## Local site build (public tree)

```bash
cd site
npm ci
npm run check
npm test
npm run build
```

This produces a local preview build. Maintainers preparing a real publication artifact must use
the complete URL-aware build and launch gate in `docs/DEPLOYMENT.md`. Requires Node.js ≥ 22.12.
See `site/README.md`.

## Private monorepo tooling (maintainers only)

Sanitized export and validators live in the private monorepo and are **not** the public support surface. See `scripts/requirements.txt` and `scripts/README.md` there.

## License

Original project content is intended for MIT licensing. You retain rights to your contributions under the same license when accepted. Third-party works keep their own licenses.
