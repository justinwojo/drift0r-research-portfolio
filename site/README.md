# Research Evidence Portfolio (Astro site)

Public **v0.1 research-preview** static site for the Drift0r publication-readiness project.

> **Research only — not medical advice, diagnosis, or treatment.**  
> **Published with Drift0r’s permission. Permission is not endorsement.**  
> **Clinician review:** **not performed.**  
> All routes are `noindex, nofollow` until a separate owner launch decision.

## Stack

- Astro 7 static output
- Content from the **public** claim inventory, hypotheses, clinician questions, unresolved questions, and literature catalog
- Contour hybrid design implemented in the site components and global styles
- Production custom domain: `https://drift0rresearch.org` with Astro base `/`
- Public repository: `https://github.com/justinwojo/drift0r-research-portfolio`

## Commands

```bash
cd site
npm ci
npm run check
npm run build                              # preview mode (default)
DRIFT0R_SITE_MODE=publication npm run build
npm test
npm run preview                            # local only — not a deploy
```

For a launch-equivalent custom-domain build, also set:

```bash
DRIFT0R_SITE_MODE=publication \
DRIFT0R_SITE_URL=https://drift0rresearch.org \
DRIFT0R_PUBLIC_REPO_URL=https://github.com/justinwojo/drift0r-research-portfolio \
npm run build:publication
```

Publication mode loads only `public_approved===true` claims and explicitly release-scoped surfaces (`src/data/release_scope.yaml`).

## Claim inventory path

The site reads:

`audits/2026-08-publication-readiness/01_claim_inventory_public.yaml`

It does **not** require the private monorepo inventory. Override for tests/canaries:

`DRIFT0R_CLAIM_INVENTORY=/absolute/or/repo-relative/path.yaml`

## Routes

| Route | Notes |
|-------|-------|
| `/` | Landing, current working synthesis, Evidence Atlas + table, specialty two-channel |
| `/case/` | Four-register claim cards |
| `/working-model/` | H1–H5 with apparatus |
| `/working-model/evidence-table/` | Printable matrix |
| `/questions-for-clinicians/` | Discussion questions |
| `/questions-for-clinicians/packet/` | Printable packet |
| `/for-clinicians/` | Print-first handout (Letter/A4) |
| `/literature/`, `/literature/[id]/` | Launch bibliography + cards |
| `/methods/`, `/changelog/`, `/legal/` | Process, corrections, legal |
| `/about/snapshot/`, `/about/downloads/` | Print snapshot + print index |

## Source documents

Original PDFs are **not** in this tree or in `dist/`. Drift0r hosts materials externally:

https://drive.google.com/drive/folders/1z_juK9yVdhbzaGJafzzZYZWe3U1cs37e

That folder is controlled by Drift0r, may change, and is not redistributed by this repository.

## Artifact boundary

Build writes `dist/.artifact_manifest.txt`. Never publish patient source PDFs, local paper caches, or raw community dumps.

## Contributions

Safe, moderated contributions are described at `/about/contribute/` and in root `CONTRIBUTING.md` (GitHub issue templates only). Not a medical-advice discussion surface.

## Support surface

This public tree supports **Node/Astro** build, check, test, and preview. Monorepo Python validators and export scripts are private tooling and are not required to build the site from a sanitized export.
