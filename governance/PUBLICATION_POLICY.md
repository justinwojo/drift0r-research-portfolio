# Publication policy

> Research portfolio publication rules for the Drift0r project.  
> **Not medical advice.** See [`LEGAL.md`](../LEGAL.md).

## Purpose

Define what may be published, who approves it, and how public content relates to private or restricted materials.

## Source of truth

| Layer | Location | Public? |
|-------|----------|---------|
| Patient facts / ledger | `evidence/` | Selected summaries only via allowlist |
| Literature cards | `literature/entries/` | Metadata + project summaries; not paywalled PDFs |
| Research rankings / swarms | `differentials/` | Curated pages only; raw agent dumps optional later |
| Audits | `audits/` | Internal by default; may publish summary findings |
| Local PDFs / raw dumps | `data/papers_local/`, `community/raw/` | **Never** |
| Site | Astro static site under `site/` (publication mode) | Only allowlisted inputs; built artifact is `site/dist/` |

## Approval rights

| Decision | Approver | Cannot establish |
|----------|----------|------------------|
| Scope of website | Repository owner + patient | Medical validity |
| Launch of medical pages | Owner after patient review + scoped clinician review **by default**. **v0.1 noindex research-preview exception:** [DEC-0027](../audits/2026-08-publication-readiness/DECISIONS.md) authorizes openly shareable sanitized repository + static site with `noindex` remaining true and clinician review status **`not_reviewed` / not performed**, provided that status is displayed prominently on every launch-critical route. Qualified clinician review remains the highest-priority post-launch task and is not waived. | Absolute clinical truth |
| Claim public_approved=true | Owner following REVIEW_POLICY | Diagnosis |
| Adding paths to allowlist | Owner | Copyright clearance for third-party full text without license check |
| Emergency takedown | Owner or patient request | — |

No AI model may approve publication or act as clinician reviewer.

## Content rules

1. Build from **explicit allowlist** only (`PUBLIC_FILE_ALLOWLIST.md`).
2. Every medical page: disclaimer, **analysis version** (`content_version`), **evidence current through** date, last-reviewed date, evidence-type badges.
3. Material claim changes → corrections log + structured `/changelog/` entry (no silent rewrite of historical swarm outputs).
4. Do not publish consent signatures or private identifiers.
5. Do not publish treatment protocols, dosing, or “start/stop medication” language.
6. Specialty LDT vs independent/commercial status must not be collapsed.
7. Stable IDs (CLM / H / CQ / UQ / lit / COR) are **never reused**; retire or supersede in place with labelled notices.

## Analysis versioning (summary)

The website is the **current best understanding**. Do not build rendered historical archives such as `/releases/v0.1/` for v0.1.

| Kind | When |
|------|------|
| **Patch** | Wording, links, metadata, citation-presentation fixes |
| **Minor** | New evidence or material analytical changes |
| **Major** | Major methodology/data-model change, or a clinician-reviewed public release |

Each **public** release should receive an **annotated Git tag** and a **GitHub Release** containing the changelog summary. Full policy: [`RELEASE_VERSIONING.md`](RELEASE_VERSIONING.md).

## Preview vs production

- Preview: `noindex` until approval gates pass.
- Production: remove `noindex` only after M5–M6 checklist.

## Related

- `PRIVACY_AND_CONSENT.md`
- `REVIEW_POLICY.md`
- `CORRECTIONS_POLICY.md`
- `AI_METHODS.md`
