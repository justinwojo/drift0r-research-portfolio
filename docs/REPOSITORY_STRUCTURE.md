# Repository structure and publication boundary

This repository is the sanitized, public working tree for the Drift0r Research Evidence Portfolio. It is intentionally narrower than the private research archive used to assemble and validate the project.

## Directory map

| Path | Purpose |
|---|---|
| `.github/` | Structured issue forms, validation CI, ownership metadata, and manual Pages deployment |
| `audits/2026-08-publication-readiness/` | Approved public claim inventory, unresolved questions, public-language rules, corrections, decisions, and review register |
| `differentials/hypotheses/` | Versioned working hypotheses, including `H-NULL` |
| `differentials/clinician_questions/` | Discussion questions intended for licensed clinicians—not orders |
| `docs/` | Public roadmap, operating documentation, launch FAQ, and community moderation guidance |
| `governance/` | Publication, review, correction, privacy, AI-use, and versioning policies |
| `literature/` | Bibliographic catalog, topic rollups, literature cards, search index, and identifier attestations |
| `schemas/` | Data contracts for claims, hypotheses, questions, releases, corrections, and reviews |
| `site/` | Astro source, release data, tests, build gates, and public static assets |
| `templates/` | Reusable research-entry templates |

## Source-of-truth hierarchy

1. Structured public claim, hypothesis, question, literature, correction, and release records are authoritative.
2. The Astro site renders those approved records and selected reviewed prose.
3. Generated `site/dist/` output is disposable and never committed.
4. The repository history records changes; `/changelog/` communicates substantive analysis changes to visitors.
5. The private archive remains authoritative for excluded source material and private operational evidence, but it must never be pushed into this repository.

## Never-publish material

The following do not belong in commits, Git LFS, Actions artifacts, releases, Pages output, issues, or pull requests:

- original medical PDFs and source-record folders;
- local full-text paper caches;
- private claim rows or source snapshots;
- raw community exports;
- consent correspondence or approval screenshots;
- private patient packets and internal operational audits;
- credentials, environment files, local paths, caches, and dependency directories.

The authoritative boundary is `governance/public_allowlist.yaml`. `.gitignore` is defense in depth, not publication authorization. A file being ignored—or publicly available somewhere else—does not make it approved for this repository.

## Evidence identifiers

- `CLM-####`: approved public claim
- `H1`–`H5`, `H-NULL`: working hypothesis
- `CQ-###`: clinician discussion question
- `UQ-####`: unresolved question
- `lit-####`: literature record
- `COR-####`: correction
- `DEC-####`: governance or publication decision

Identifiers are never reused. Superseded records remain reserved and point to their replacements.

## Change discipline

- Prefer a structured issue before a substantive pull request.
- Do not edit generated site output.
- Keep medical content in structured records where a schema exists.
- Update corrections and the changelog rather than silently rewriting material errors.
- Preserve uncertainty, polarity, applicability limits, and source class.
- Run `npm run check`, `npm test`, and a publication build from `site/` before merging.
- Deployment is a separate manual action; merging or pushing must not publish the website.

See `CONTRIBUTING.md`, `governance/PUBLICATION_POLICY.md`, and `docs/DEPLOYMENT.md`.
