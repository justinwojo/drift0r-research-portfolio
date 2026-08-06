# Analysis release versioning

> Lightweight, durable versioning for the Drift0r research portfolio.  
> **Not medical advice.** See [`LEGAL.md`](../LEGAL.md) and [`PUBLICATION_POLICY.md`](PUBLICATION_POLICY.md).

## Principle

The **website is the current best understanding**. This project does **not** maintain rendered historical archives such as `/releases/v0.1/` for v0.1. Prior understanding is recorded via:

1. Structured changelog entries (`site/src/data/changelog.yaml` → public `/changelog/`)
2. In-place correction and supersession notices on live records
3. Stable IDs that are never reused
4. Annotated Git tags and GitHub Releases at public release time

## Public labels

| Label | Source field | Meaning |
|-------|--------------|---------|
| **Analysis version** | `content_version` in `site/src/data/release.yaml` | Version of the current analytical package on the site |
| **Evidence current through** | `evidence_current_through` | Date through which patient records and literature were considered for this analysis snapshot |
| **As of / last reviewed** | `as_of`, `last_reviewed` | Package snapshot and last editorial review dates |

Display analysis version and evidence-current-through **prominently** on the homepage, About surfaces, working model, clinician pages, and print outputs.

## Semver-style release kinds

| Kind | Bump | Use when |
|------|------|----------|
| **Patch** | `x.y.Z` (or prerelease patch) | Wording, links, metadata, citation-presentation fixes, non-material UI; no material change to evidence or interpretations |
| **Minor** | `x.Y.0` | New evidence, new/retired claims or questions, material analytical changes, ranking or hypothesis strength changes |
| **Major** | `X.0.0` | Major methodology or data-model change, or a **clinician-reviewed** public release that changes the review posture |

Prerelease suffixes (e.g. `v0.1.3-rc.6`) are allowed for release candidates. Treat `rc` bumps as internal candidate iterations; the **kind** field on the matching changelog entry still records patch/minor/major intent.

## Changelog requirements

Every public analysis version that ships on the site **must** have a matching entry in `site/src/data/changelog.yaml` with sections:

- Added evidence  
- Changed interpretations  
- Strengthened or weakened hypotheses  
- Retired/superseded findings  
- Corrections  

The live `content_version` **must** equal the newest changelog entry’s `version`. The live `evidence_current_through` **must** match that entry.

## Stable IDs (never reuse)

| Family | Pattern |
|--------|---------|
| Claims | `CLM-NNNN` |
| Hypotheses | `H…` / `H-NULL` |
| Clinician questions | `CQ-NNN` |
| Unresolved questions | `UQ-NNNN` |
| Literature | `lit-NNNN` |
| Corrections | `COR-NNNN` |

Rules:

1. **Never reassign** an ID to a different logical record.
2. **Retire or supersede** in place: keep the record (or a stub) labelled `retired` or `superseded`, with links to the replacement ID when applicable and to the changelog entry.
3. **Do not silently delete** public IDs from inventories once published.
4. IDs listed under `retired_or_reserved_ids` in the changelog file, or under any entry’s `retired_or_superseded`, remain reserved forever.
5. Hypothesis `supersedes` / claim lifecycle fields must point at real IDs and must not form cycles.

## In-place notices

Affected public records (case cards, hypotheses, literature where mapped) must surface:

- Related **COR-** badges with links to `/changelog/#COR-NNNN` (or the release section that lists them)
- **Retired / superseded** labels when lifecycle status is not active
- Link to the relevant `/changelog/#vX.Y.Z` entry when a record is tied to a material change

## Git tag and GitHub Release (public releases)

Each **public** release (when the owner decides to publish beyond private monorepo work) **should**:

1. Receive an **annotated Git tag** matching `content_version` (e.g. `v0.1.3`)
2. Receive a **GitHub Release** whose body summarizes the changelog entry sections above

Private remediation commits and noindex candidates may defer tag/Release creation; the changelog still records `git_tag_planned` / `github_release_planned`.

## Explicit non-goals (v0.1)

- No rendered multi-version site archive (`/releases/v0.1/`, frozen HTML snapshots per version)
- No silent rewrite of historical swarm artifacts (use SUPERSEDED banners + corrections)
- No claim of clinician review unless `clinician_review_scope` changes and a major release documents it

## Related

- [`PUBLICATION_POLICY.md`](PUBLICATION_POLICY.md)  
- [`CORRECTIONS_POLICY.md`](CORRECTIONS_POLICY.md)  
- [`REVIEW_POLICY.md`](REVIEW_POLICY.md)  
- Live data: `site/src/data/release.yaml`, `site/src/data/changelog.yaml`  
- Public page: `/changelog/`  
