# Drift0r public roadmap (post-v0.4.0)

> **Research only — not medical advice, diagnosis, or treatment.**  
> **Patient publication permission:** obtained (2026-08-05). Permission is **not** endorsement.  
> **Clinician review:** **not performed.** This project does not claim clinician endorsement.  
> **Indexing:** enabled (`index, follow`) by owner decision DEC-0037; pages may appear in public search results.

This is the **public** roadmap for the Drift0r Research Evidence Portfolio. It is intentionally short
and forward-looking. Day-to-day execution material lives only in the ignored local research archive
and is **not** part of the public repository history.

---

## What this project is

An independent, AI-assisted research evidence portfolio that organizes publicly shared case materials from YouTuber [Drift0r](https://www.youtube.com/watch?v=krP9EGyLCRE), open literature, working hypotheses, and discussion questions for clinicians.

- Created by **Justin Wojciechowski** ([@justinwojo](https://github.com/justinwojo)); **not a clinician**
- **Independent** — not affiliated with, operated by, or endorsed by Drift0r
- **AI-assisted** (Grok, Claude, Codex; models disclosed per release in [`site/src/data/release.yaml`](site/src/data/release.yaml)) — multi-model agreement is **not** clinical validation
- Static site + sanitized public repository; original source PDFs are **not** redistributed here

---

## Where the project stands

| Item | Status |
|------|--------|
| Analysis version | `v0.4.0` (evidence current through 2026-08-10) |
| Website | Live and publicly indexed |
| Clinician review | **Not performed** (REV-0006 pending; still the highest priority) |
| Legal / privacy review | **Not engaged** (REV-0007 pending) |
| Primary instrument records (labs, DXA printouts, radiology, clinic notes) | **Not reviewed by this project** |
| Source PDFs in this repository | **Not included** |
| Public contributions | Structured **GitHub issues only** (blank issues disabled) |

The machine-readable record is [`site/src/data/release.yaml`](site/src/data/release.yaml); substantive
changes are recorded in the [analysis changelog](https://drift0rresearch.org/changelog/).

**Limitations readers must keep in mind:**

1. Numbers and interpretations rest on patient-compiled specialty summaries, an evidence pack, and a public video transcript unless a closer primary is later obtained.
2. Specialty laboratory-developed tests (LDTs) and contested infection signals remain contested research topics — not established diagnoses.
3. No unifying diagnosis is established. Hypotheses are research framings, not clinical conclusions.
4. This is incomplete and open to correction.

---

## Work plan

Roughly in priority order. Items are marked by **who can actually close them** — several cannot be
closed by more analysis at all.

### 1. Reviews that require people this project has not yet engaged

| Item | Who closes it |
|------|---------------|
| **Clinician review (REV-0006)** — scoped licensed review, metabolic bone / endocrinology first, recorded honestly whatever it finds | A licensed clinician. Not engaged yet |
| **Legal / privacy review (REV-0007)** — public repository, artifact, metadata, rollback posture | A legal/privacy reviewer. Not engaged yet |
| **Citation semantic verification** — independent **human** review of the launch-cited card summaries against the papers | A human reviewer. `semantic_verified_count` stays **0** until then (DEC-0033); AI work never increments it |

Until a licensed clinician actually reviews scoped materials, public pages must continue to state
that review has **not** been performed. Model cross-checking is not human clinical review.

### 2. Record acquisition (analysis cannot close these)

All **20 unresolved record questions (UQ) are open**, and every one of them is closable only by
patient, laboratory, clinician, or DXA-facility records — not by further reasoning over what is
already published. Highest-value targets:

1. **Anastrozole-era estradiol records (UQ-0020)** — one sensitive-assay value exists for a roughly two-year exposure window; the other values use a non-comparable immunoassay and the original laboratory reports are unretrieved.
2. **Bone formation markers (P1NP / bone-specific alkaline phosphatase)** — records for the item ranked first in the research ranking's clinician-facing test list (`differentials/current_ranking.md` §3).
3. **Original HPG-era laboratory reports (UQ-0003)** — instrument-level documents behind the compiled endocrine summary.

Others include facility least-significant-change documentation, copper / ceruloplasmin, vaccine-history
detail, and KIT method/limit-of-detection specifics.

**Surfacing (gap closed, §7):** the full 20-entry UQ register now renders on
[`/questions/`](https://drift0rresearch.org/questions/), alongside the ten clinician questions, with
a stable anchor on every entry (`/questions/#UQ-0001`). It was previously public only as
machine-readable YAML — [`02_unresolved_record_questions.yaml`](audits/2026-08-publication-readiness/02_unresolved_record_questions.yaml) —
with a three-item, unanchored launch-critical excerpt on
[`/for-clinicians/`](https://drift0rresearch.org/for-clinicians/).
[`/questions-for-clinicians/`](https://drift0rresearch.org/questions-for-clinicians/) still renders
the **CQ** register only, in its full clinician framing.

### 3. Owner adjudications owed from the Round-2 review (2026-08-10)

These are open decisions for the repository owner. Each **may trigger a version bump when decided**,
because deciding them can change what a reader understands the evidence to say.

- **HαT satellite wording** — the Round-2 challenge that "rejected as driver" is one notch too absolute (defensible driver bucket: speculative). Recorded in `differentials/current_ranking.md` §6a without a bucket change.
- **Triage of proposed don't-miss and test candidates** — *T. whipplei*; porphyrins if new photosensitivity is confirmed; quantitative sulfur amino acids; naming idiopathic osteoporosis of the young male as the residual bucket; characterizing the polyuria / volume-contraction picture; and the childhood-IIH diuretic and vitamin-A question.
- **The H1 versus H-NULL discrimination gap** — either name an observation that would discriminate between them, or merge them.
- **Unwired UQs** — 13 of the 20 open record questions are cited by no hypothesis. Either wire them into the relevant hypotheses' `open_question_ids` or document why they stand alone.
- **Community-issue-#3 residuals** — promote into the CQ / UQ registers after triage: the missing dexamethasone-suppression / late-night salivary cortisol screen; a MuSK / LRP4 and fatigability discriminator; HFE genotyping; and the unexplained 2025 ferritin rise.

### 4. Follow-ups from the PR #4 external review (2026-08-11)

An external methods review (Leo Guinan / Build in Public University,
[PR #4](https://github.com/justinwojo/drift0r-research-portfolio/pull/4)) raised five bounded
questions; four were already tracked under existing UQ/CQ identifiers. Committed follow-ups:

- **Fold review enrichments into existing entries** — the conjugate-versus-polysaccharide
  vaccine-product distinction into **UQ-0007**, and B6 context alongside **CQ-007**'s
  copper/ceruloplasmin/zinc panel.
- **IgG4-related-disease wording provenance** — the one genuinely new question from the review.
  The reviewer has been invited to file it via the new *Research question* issue template; if it
  is not filed within a reasonable window, author it as a maintainer UQ so it is not lost.
  When created, add its id to `release_scope.yaml` so it surfaces in publication mode.
- **Review-register entry** — record the external methods review in
  `audits/2026-08-publication-readiness/review_register.yaml` (acknowledgment, not endorsement).
- **Changelog credit** — attribute the resulting changes in the changelog entry of the release
  that carries them.

### 5. H-NULL review pass

`H-NULL` is the only published hypothesis still carrying `review_status: not_reviewed`; the other five
are `source_audited`. Closable by this project.

### 6. Literature and metadata hygiene

| Metric | Current value |
|--------|--------------:|
| Literature entry cards | **339** (329 unique works + 10 alias cards) |
| Launch-cited cards | **42** |
| Cards with identity attestation (DOI/PMID registry match) | **52** |
| Semantic verification of summaries vs full papers | **0** — pending independent human review |
| Cards recording license as `unknown` or `all-rights-reserved` | **254 of 339 (~75%)** |

- **License metadata normalization** — beyond the unknown/all-rights-reserved bulk, the remaining license strings are free-text and non-normalized (e.g. "see PMC", "verify OA terms on publisher"). Normalizing them is disclosure hygiene, not a clearance to reuse anything.
- **Broader identity attestations** — extend registry checks beyond the launch-cited set as capacity allows.
- **OA manifest regeneration** — `literature/oa_manifest.md` regenerated against the current catalog.

Identity attestation means the DOI/PMID resolves to the expected title and year. It does **not** mean a
human verified that a card summary is an accurate reading of the paper, and it never will.

### 7. Controlled product features

Only while safety, correction, and moderation processes stay healthy — features never take priority
over the review and record work above.

- **Unified questions surface** — **landed** at [`/questions/`](https://drift0rresearch.org/questions/).
  The registers used to be fragmented and easy to confuse: CQ entries rendered on
  `/questions-for-clinicians/` with per-entry anchors, the 20-entry UQ register was public only as
  repository YAML (three launch-critical items excerpted on `/for-clinicians/`, unanchored), and
  hypotheses referenced UQs indirectly via `open_question_ids` with nowhere to link. `/questions/`
  lists both registers whole — ten clinician questions and all twenty unresolved record questions —
  with a stable `#CQ-00X` / `#UQ-000X` anchor on every entry so external reviewers can cite a
  question directly (external reviewers citing open questions — e.g. PR #4 — are the audience this
  serves), and with cross-links to the related claims, corrections and hypotheses. The register
  chips **navigate**; they never hide or reorder entries, so a citation to any anchor always
  resolves. `/questions-for-clinicians/` keeps its route, its ten anchors, and its full clinician
  framing. Supersedes the previously planned standalone UQ (record-gap) register page.
  Still open: further question types beyond CQ/UQ as they are introduced.
- Browsable **ruled-out register** page
- Literature browsing / filtering and detail routes beyond the 42 launch-cited cards
- Site search
- Case timeline visualization
- Per-hypothesis routes
- Social share cards
- Dark theme (DEC-0017)
- COR-0013 machine-readable compound-probability vocabulary
- `/case/` domain-notice placement option

**Not planned** for the public surface: live AI diagnostic chat, treatment calculators, diagnosis
voting, or unmoderated medical-advice forums.

---

## How to contribute

Use **structured GitHub issue templates only** (blank issues are disabled):

- Literature suggestion  
- Factual / citation correction  
- Contradictory evidence  
- Alternative hypothesis / research idea  
- Research question / record-provenance question  
- Correction, privacy, or removal request  

**Do not** post private medical records, personal identifiers, treatment instructions, or unsupported diagnoses.  
See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).

---

## Corrections, privacy, and withdrawal

- Material errors → structured issue + changelog (no silent rewrite of history).  
- Privacy / removal → dedicated issue template; **never paste private medical records into public issues**.  
- Drift0r consent withdrawal → existing private correspondence with the repository owner (no published privacy@ email).  
- Complete erasure of forks, clones, and caches **cannot be guaranteed** now that the repository and site are public and indexed.

---

## Related documents

- [README.md](README.md) — project overview  
- [LEGAL.md](LEGAL.md) — disclaimer  
- [docs/public/LAUNCH_FAQ.md](docs/public/LAUNCH_FAQ.md) — prepared public responses  
- [docs/public/COMMUNITY_MODERATION.md](docs/public/COMMUNITY_MODERATION.md) — moderation / deletion posture  
- Governance policies under `governance/`  

*Last updated: 2026-08-11 · Public roadmap only; not the private operational plan.*
