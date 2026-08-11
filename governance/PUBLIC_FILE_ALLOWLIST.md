# Public file allowlist (human narrative)

> **Deny by default.**  
> **Authoritative machine-readable list:** [`public_allowlist.yaml`](public_allowlist.yaml) (version **1.11.0**).
> `scripts/validate_all.py` (private monorepo tooling) enforces the YAML file, not this markdown.  
> **Not medical advice.**

## Generation rule (launch-critical)

Medical page **bodies** for v1 must be generated only from paths listed under `medical_page_body_sources` in `public_allowlist.yaml`:

1. **Public** claim inventory + public language guide + unresolved questions  
2. Structured `differentials/hypotheses/` and `differentials/clinician_questions/`  
3. Round-1 synthesis / one-pager / ranking **only after** language-guide transform  

Do **not** copy README case snapshot, master narrative, test-ledger prose, or community ideas verbatim into medical pages.

## v1 site artifact (default ship set)

See `v1_site_artifact` in `public_allowlist.yaml`. Paths are **relative to `site/dist/`** (built outputs), e.g.:

- `index.html`, route directories (`methods/`, `case/`, …)  
- `_astro/` and other static assets  
- `.artifact_manifest.txt`  

**Not** in default v1 dist:

- Broad research trees, swarm transcripts as page bodies  
- Source specialty PDFs (require separate approval; not redistributed)  
- Symlinks, path traversal, `*.map` source maps, never-publish prefixes  

After build, the monorepo validator **enumerates `site/dist` independently**, requires exact equality with the manifest, then applies the allowlist.

## Source-record PDFs (separate approval)

Patient specialty summaries are inventoried under `source_record_pdfs.source_paths` in the **private** monorepo.  
**Every PDF in `site/dist` is denied by file type** unless explicit publication approval and exact `dist_paths` are set (currently **not** approved).

Externally, Drift0r may host materials at:

https://drive.google.com/drive/folders/1z_juK9yVdhbzaGJafzzZYZWe3U1cs37e

That folder is **not** part of this repository, may change, and is not redistributed by the public export.

## Deep archive (optional)

`deep_archive_optional` in the YAML may be enabled for a transparency build later. It is **not** the default v1 ship set and is **never** auto-included by the sanitized repository exporter.

## v1 public git repository (sanitized export)

`v1_public_repository` in the YAML is the **only** content set the sanitized exporter may copy. It is an **explicit, non-empty** reviewed set, first assembled for the v0.1 research-preview candidate (Checkpoint F / F.1) and maintained since: it is the **live publication boundary for the current release**, not a frozen v0.1 candidate artifact. Its paths are **source paths in the private monorepo**; `export_path_rewrites` may place a file at a different path in the published tree, so an entry can name a path that does not exist in the public repository as such. Exporter requirements:

- Exact exported-set equality with the expanded allowlist  
- Content scans (not merely filenames) for secrets, absolute workstation paths, and unapproved inventory rows (`public_approved: false`)  
- Reject every symlink; resolved paths must stay inside the source root  
- Safe `--force` only with script-owned sentinel; refuse root/home/repo/parents/git repos/symlink targets  
- **Do not** copy the private claim inventory, `evidence/sources/`, paper caches, or consent screenshots  
- **Python monorepo scripts are not exported** — the public tree is Node/Astro buildable without them  

## Never publish

See `never_publish` in YAML: `data/papers_local/`, `data/papers_oa/`, `community/raw/`, `private/` (including `private/source-snapshots/` and `private/ops/`), `evidence/sources/`, env/secrets, `.git/`, `node_modules/`, `PublishApproval.jpg`, private claim inventory.

## Export path rewrites

`export_path_rewrites` in the YAML maps allowlisted source paths to different destinations in the sanitized tree. `docs/public/ROADMAP.md` exports as root `ROADMAP.md` — that rewrite is how the root `ROADMAP.md` in the published public repository is covered, and it is why `docs/public/ROADMAP.md` has no counterpart there. The private monorepo operational `ROADMAP.md` is **not** on `v1_public_repository` and must not be copied.

## Post-build enforcement

After build, write `site/dist/.artifact_manifest.txt` (mode-aware v2: `site_mode=publication`, path list, optional digests).  
Monorepo `validate_all.py` checks that every path is on the allowlist, none match `never_publish`, mode is publication, and HTML has zero `site mode: preview` markers.

## Version history

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-08-05 | Initial narrative allowlist |
| 1.1.0 | 2026-08-05 | Generation rule; deep-archive labeling |
| 1.2.0 | 2026-08-05 | Machine-readable `public_allowlist.yaml`; narrow v1 set; source PDFs require separate approval; artifact-manifest gate |
| 1.3.0 | 2026-08-05 | Dist-relative generated paths (`index.html`, `_astro/`, routes); independent dist enumeration + exact manifest reconcile; symlink/traversal reject |
| 1.4.0 | 2026-08-05 | PDF file-type denial unless `publication_approved` + exact `dist_paths`; path norm preserves leading dots |
| 1.5.0 | 2026-08-05 | Epistemic routes in `v1_site_artifact`; `v1_public_repository` empty fail-closed export key; deep archive never auto-exported |
| 1.6.0 | 2026-08-05 | Checkpoint F v0.1 public research-preview allowlist; public claim inventory export path |
| 1.7.0 | 2026-08-05 | Checkpoint F.1: UQ inventory included; Python scripts excluded from public tree; medical body sources use public inventory; external source-folder policy |
| 1.7.1 | 2026-08-05 | Checkpoint F.1.1: CONTRIBUTING.md + GitHub issue templates; contribute route; persistent status language |
| 1.8.0 | 2026-08-05 | Checkpoint G.1: exporter harden (.gitignore, extension never_publish, PDF magic, image gate); mode-aware artifact manifest; Drive disposition notes; `.nojekyll` |
| 1.8.3 | 2026-08-05 | P2 public readiness: concise `docs/public/ROADMAP.md` rewritten to export `ROADMAP.md`; CODE_OF_CONDUCT/SECURITY/community docs allowlisted; private operational monorepo ROADMAP not exported |
| 1.9.0 | 2026-08-05 | Pre-commit public-repository assembly: reader-first README; CI/dependency/ownership metadata; repository and deployment docs; hardened local ignore boundary |
| 1.9.1 | 2026-08-05 | Fresh-repository cleanup: superseded `site/SITE_PLAN.md` retained only in the private archive; local consent/review/launch artifacts nested under ignored `private/` paths |
| 1.10.0 | 2026-08-07 | v0.3.0 paired-review fix: `evidence/ruled_out.yaml` added to `v1_public_repository` and `medical_page_body_sources` — `getRuledOut()` loads it unconditionally as a homepage build input, so deny-by-default omission broke the sanitized export's landing build |
| 1.11.0 | 2026-08-11 | Reconciliation against the published tree: added the Round-2 public synthesis (`differentials/swarm-runs/2026-08-10-fable-blinded/03_synthesis.md`, linked from `current_ranking.md`), `.gitignore`, and `.github/FUNDING.yml`; removed `.github/dependabot.yml` (file deleted 2026-08-06 and absent from the source tree); documented that entries are private-monorepo source paths subject to `export_path_rewrites`, and that the list is the live boundary rather than a v0.1 candidate set |
