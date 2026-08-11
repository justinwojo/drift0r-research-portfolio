# Decision log — 2026-08 publication readiness

> Running log. Each entry is durable; later entries may reverse earlier ones with an explicit supersession note.  
> **Not medical advice.**

| Field | Value |
|-------|-------|
| Run | `2026-08-publication-readiness` |
| Base commit | `6c6a49d2d258524c1a8d9c80d4b159dfa914ea2c` |

---

## Decision template

```text
### DEC-NNNN — short title
- Date:
- Milestone:
- Decision:
- Evidence:
- Alternatives considered:
- Consequences:
- Revisit if:
```

---

### DEC-0001 — Freeze Round-1 swarm outputs as historical

- **Date:** 2026-08-05
- **Milestone:** M0
- **Decision:** Do not rewrite `differentials/swarm-runs/2026-08-05-round1/*` for style, public tone, or terminology cleanup. Corrections and public wording live in audit / governance / future site content layers.
- **Evidence:** ROADMAP §3.4, §7 freeze rule; Round-1 already completed 2026-08-05.
- **Alternatives considered:** Soft-edit synthesis for safer public language (rejected — would destroy audit trail).
- **Consequences:** Public site must transform language via claim inventory + language guide, not by mutating history.
- **Revisit if:** Factual error so severe that an annotated erratum file is needed beside the original (still without silent rewrite).

### DEC-0002 — Evidence Pack v1 hard numbers remain numeric source of truth

- **Date:** 2026-08-05
- **Milestone:** M0
- **Decision:** Prefer `evidence/evidence_pack.md` hard-number table for numeric claims; specialty PDFs are used for page-level reconciliation and richer provenance; contradictions are logged, not silently averaged.
- **Evidence:** evidence_pack_v2 explicitly defers to v1 hard numbers; specialty PDFs are patient-compiled transcriptions.
- **Alternatives considered:** Promote master narrative as SoT (rejected — denser, harder to pin).
- **Consequences:** Claim inventory cites both pack IDs and PDF page/line anchors where available.
- **Revisit if:** Original lab PDFs with stronger provenance enter the repo under an approved path.

### DEC-0003 — Specialty summaries are transcriptions, not original instrument reports

- **Date:** 2026-08-05
- **Milestone:** M0/M1
- **Decision:** Label verification as `partially_verified` when a claim matches a specialty summary but original facility/instrument printouts are absent; never upgrade to fully `verified` solely on AI consensus or multi-model agreement.
- **Evidence:** ROADMAP evidence rules §3.1; PDF footers state transcription from source reports.
- **Alternatives considered:** Treat summaries as equivalent to primary labs (rejected).
- **Consequences:** Many launch claims will show `partially_verified` with exact summary anchors.
- **Revisit if:** Original reports are added with page-level access.

### DEC-0004 — Internet research cutoff for this audit series

- **Date:** 2026-08-05
- **Milestone:** M0
- **Decision:** Literature searches and guideline currency checks for M2 use cutoff **2026-08-05**. Later findings require a new research-run folder.
- **Evidence:** ROADMAP `00_RUN.md` requirement; reproducibility.
- **Alternatives considered:** Open-ended rolling search (rejected for baseline integrity).
- **Consequences:** M2 evidence tables record search dates ≤ cutoff or explicitly as same-day.
- **Revisit if:** A cited guideline is formally superseded after cutoff before launch — handle via M7 update process.

### DEC-0005 — Dual probability buckets preserved

- **Date:** 2026-08-05
- **Milestone:** M0 (carried from Round-1)
- **Decision:** Keep architecture vs module-identity probability separate; never encode compound confidence strings like `medium_abnormality_high_label_low` in one field.
- **Evidence:** Round-1 chair rules; ROADMAP M3 hypothesis schema requirements.
- **Alternatives considered:** Single blended confidence (rejected — confuses readers).
- **Consequences:** Hypothesis schema splits fields; public UI must show two chips where dual buckets apply.
- **Revisit if:** Clinician reviewers demand a different public presentation (still keep structured dual fields underneath).

### DEC-0006 — Hip BMD −4.2% treated as exceeding documented LSC in summary

- **Date:** 2026-08-05
- **Milestone:** M1
- **Decision:** Public/research language may state that the patient-compiled bone summary reports total-hip BMD change of −4.2% over 12 months on the same Site 1 scanner, with LSC = 0.027 g/cm², and absolute BMD change −0.034 g/cm² (0.836 → 0.802), which exceeds that LSC. Do **not** invent a facility precision study beyond the summary’s LSC figure.
- **Evidence:** `Drift0r_BoneDensity_Summary.pdf` hip table and footnote.
- **Alternatives considered:** Drop “real loss” language entirely pending original precision report (kept as summary-attributed claim with partial verification).
- **Consequences:** Claim inventory entries CLM for hip change cite this PDF; unresolved if original DXA LSC table differs.
- **Revisit if:** Facility precision report obtained.

### DEC-0007 — BMD terminology for male age <50

- **Date:** 2026-08-05
- **Milestone:** M1
- **Decision:** Public pages must emphasize Z-scores and “BMD below expected range for age” language for a male younger than 50; T-scores may be quoted as scanner-reported values with WHO-style thresholds only when clearly labeled as such and sourced. Do not present “osteoporosis” as an independently clinician-certified diagnosis unless a clinician note is available — currently it appears as WHO-by-lowest-T-score language in the patient-compiled bone summary.
- **Evidence:** ISCD adult positions (catalog anchors lit-0015/lit-0224 and related); bone summary age 37–38; ROADMAP known risks.
- **Alternatives considered:** Strip all T-scores (rejected — they are central documented values); use “osteoporosis” unqualified (rejected for public safety).
- **Consequences:** Language guide mandatory replacements; claim triage may mark unqualified OP diagnosis language as restricted.
- **Revisit if:** Treating clinician supplies explicit diagnosis wording and age-appropriate interpretation.

### DEC-0008 — Infection claims keep specialty LDT vs commercial split badges

- **Date:** 2026-08-05
- **Milestone:** M1
- **Decision:** Never present Babesia FISH or Bartonella IgM specialty results as independently confirmed infection. Always pair with commercial/PCR negatives where documented.
- **Evidence:** Infectious-disease summary; Round-1 consensus; ROADMAP publication/medical-safety rules.
- **Alternatives considered:** Omit specialty results entirely from public site (deferred — transparency preferred with strong framing).
- **Consequences:** Schema and UI require dual status fields for contested LDTs.
- **Revisit if:** Independent microbiologic confirmation appears.

### DEC-0009 — No ranking change without documented evidence delta

- **Date:** 2026-08-05
- **Milestone:** M2
- **Decision:** Do not replace `differentials/current_ranking.md` unless M2 delta synthesis documents a specific evidence change. Interpretive soft-language for public use does not require ranking rewrite.
- **Evidence:** ROADMAP §9.4.
- **Alternatives considered:** Immediate public re-rank after literature audit (rejected without delta).
- **Consequences:** Delta synthesis may recommend ranking holds.
- **Revisit if:** Material new patient data or Tier-A literature overturns a module.

### DEC-0010 — Checkpoint A/B/C treated as internal quality checks for this execution

- **Date:** 2026-08-05
- **Milestone:** M0–M3 continuous execution per owner instruction
- **Decision:** Per repository owner directive for this session: do not stop at Checkpoints A, B, or C; continue through M3 and produce a consolidated Checkpoint D review packet. Still record internal quality checks and unresolved items. Do not begin M4.
- **Evidence:** User execution instruction 2026-08-05.
- **Alternatives considered:** Strict stop-at-each-checkpoint (superseded by explicit owner instruction for this run).
- **Consequences:** Single consolidated Codex review request after M0–M3.
- **Revisit if:** Owner re-imposes sequential stop gates.

### DEC-0011 — Literature duplicates aliased, not deleted

- **Date:** 2026-08-05
- **Milestone:** M2
- **Decision:** Duplicate DOI/PMID cards are merged via alias/canonical fields without deleting historical IDs, so prior swarm citations remain resolvable.
- **Evidence:** ROADMAP §9.2; Round-1 open question on lit-0057=lit-0220 and lit-0015=lit-0224.
- **Alternatives considered:** Hard delete duplicate files (rejected — breaks historical refs).
- **Consequences:** Validator enforces single public count of unique works; aliases retained.
- **Revisit if:** Catalog schema redesign requires different ID strategy.

### DEC-0012 — Public allowlist is deny-by-default

- **Date:** 2026-08-05
- **Milestone:** M3
- **Decision:** Site generation and validation use an explicit allowlist. Anything not listed is excluded, including `data/papers_local/`, `community/raw/`, unapproved source PDFs, and consent artifacts.
- **Evidence:** ROADMAP §3.3, §10.3.
- **Alternatives considered:** Publish all tracked markdown (rejected — privacy/copyright risk).
- **Consequences:** `governance/PUBLIC_FILE_ALLOWLIST.md` is authoritative for build inputs.
- **Revisit if:** Patient expands publication scope in writing (status/date only recorded in-repo).

### DEC-0013 — Validation entry point is `scripts/validate_all.py`

- **Date:** 2026-08-05
- **Milestone:** M3
- **Decision:** Single documented validation command `python3 scripts/validate_all.py` fails closed on schema, duplicate ID, broken refs, missing Tier-A provenance, and allowlist violations.
- **Evidence:** ROADMAP §10.4.
- **Alternatives considered:** Scattered ad-hoc scripts only (rejected).
- **Consequences:** Deployment (when built) must depend on this gate.
- **Revisit if:** Additional language runtimes are introduced for the site build.

### DEC-0014 — Treatment responses are not etiology proof

- **Date:** 2026-08-05
- **Milestone:** M1
- **Decision:** Benfotiamine response, antimicrobial response, and hormone-therapy response are labeled patient-reported or observational treatment signals, never as causal proof of a single disease.
- **Evidence:** ROADMAP medical-safety and evidence rules; Round-1 chair rules.
- **Alternatives considered:** Use abx response as confirmation of Bartonella (rejected).
- **Consequences:** Claim inventory marks response claims as `reported_history` or `interpretation` with low causal weight.
- **Revisit if:** Controlled n-of-1 measurements around future clinician-directed therapy (still not public treatment advice).

### DEC-0015 — Approve Contour hybrid design system for M4

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** Approve the Contour hybrid for the M4 release candidate: Contour base + Marginalia evidence apparatus + Instrument two-channel specialty-LDT treatment. The implemented public site components and styles are authoritative; the original design specification and superseded site plan remain in the private archive.
- **Evidence:** Owner decisions for M4 implementation; `RECOMMENDED_DIRECTION.md`; Claude concept mockups under `site/mockups/claude-concepts/`.
- **Alternatives considered:** Pure Marginalia; pure Instrument; deferring design system choice.
- **Consequences:** Implementation uses Contour tokens/layout, always-visible margin apparatus on long-form routes, and two-channel LDT readouts. Boss-fight and game metaphors remain retired.
- **Revisit if:** Accessibility or clinician review requires a different centrepiece.

### DEC-0016 — Evidence Atlas ships in M4/P1 with full table equivalent

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** Include the Evidence Atlas in M4/P1, including its complete visible table equivalent and mobile stacked representation. Do not ship the diagram without the table; do not hide the table behind a toggle.
- **Evidence:** Owner M4 decisions; `M4_DESIGN_SPEC.md` §4.9.
- **Alternatives considered:** Table-only in P1 with Atlas in P2 (recommended severable fallback; not chosen).
- **Consequences:** Landing page implements SVG Atlas + table + stacked mobile bands.
- **Revisit if:** Claim set grows beyond Atlas design assumptions.

### DEC-0017 — Dark theme deferred to P2

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** Do not implement the dark theme in M4. Light Contour tokens only. Dark remains a future token swap per the design package.
- **Evidence:** Owner M4 decisions; `RECOMMENDED_DIRECTION.md` §8.3.
- **Alternatives considered:** Ship dark theme with M4.
- **Consequences:** No `prefers-color-scheme` dark palette; no dark toggle.
- **Revisit if:** P2 prioritizes dark mode.

### DEC-0018 — Private preview uses audited claim set; public_approved stays false

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** The local/private release candidate may render the audited launch-candidate claim set for review. Do **not** change any claim’s `public_approved` value from `false`. Patient permission is pending and must be displayed accurately as not yet obtained. Do not use patient identity, Drift0r handle, photographs, or quotations. Use neutral masthead name **“Research Evidence Portfolio”** until approval.
- **Evidence:** Owner M4 decisions; `PRIVACY_AND_CONSENT.md`; claim inventory all `public_approved: false`.
- **Alternatives considered:** Withhold all claims until approval; set public_approved true for Tier A (rejected).
- **Consequences:** Site shows review/approval negatives honestly; content is for private RC only (`noindex`); M5 still required before any public launch.
- **Revisit if:** Patient grants scoped approval after M5 review.

### DEC-0019 — Corrections visible in place and in changelog

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** Material corrections remain visible on affected records and are listed on `/changelog/`. No silent rewrite of historical swarm outputs.
- **Evidence:** Owner M4 decisions; `CORRECTIONS_POLICY.md`; language guide §9.
- **Alternatives considered:** Changelog-only corrections.
- **Consequences:** Record cards and hypothesis pages surface related COR-IDs; changelog links back to records.
- **Revisit if:** Clinician review prefers different correction UX.

### DEC-0020 — Browser-print routes only; no PDF artifacts; no social cards; no deploy

- **Date:** 2026-08-04
- **Milestone:** M4
- **Decision:** Implement the four browser-print routes from the design (`/for-clinicians/`, `/working-model/evidence-table/`, `/questions-for-clinicians/packet/`, `/about/snapshot/`). Do not generate downloadable PDF artifacts. Do not create social cards. Keep every route `noindex,nofollow`. Do not deploy, enable GitHub Pages, or push the implementation to a public remote. M4 is a local/private release candidate only.
- **Evidence:** Owner M4 decisions; `M4_DESIGN_SPEC.md` §8 and §11; publication policy preview rules.
- **Alternatives considered:** Headless PDF generation; OG cards while noindex; public push for preview hosting.
- **Consequences:** Print CSS only; robots noindex; implementation stays local until M5/M6 gates.
- **Revisit if:** Owner authorizes a private unindexed hosting environment without public push of secrets or excluded files.

### DEC-0021 — M4R external-integrity remediation is the active milestone

- **Date:** 2026-08-05
- **Milestone:** M4R
- **Decision:** Execute ROADMAP v2.0 §6A fully locally; stop before M5 external approval or any publication action. Checkpoint E2 packet required.
- **Evidence:** ROADMAP.md v2.0; Checkpoint E changes_requested; PRE_PUBLICATION_REVIEW.md
- **Alternatives considered:** Proceeding to M5 without identity/source-class gates (rejected).
- **Consequences:** Publication mode remains fail-closed; patient/clinician statuses stay not_obtained/not_reviewed.
- **Revisit if:** Owner accepts residual blockers explicitly.

### DEC-0022 — Mental-health content excluded from v1 public surfaces by default

- **Date:** 2026-08-05
- **Milestone:** M4R / M5 prep
- **Decision:** Mental-health specialty summary content and related claims remain **excluded from v1 public site surfaces** unless the patient separately approves exact claims, wording, discoverability, and permanence. Inventory rows may remain for internal audit with `public_approved: false`.
- **Evidence:** ROADMAP §6A.7; PRIVACY_AND_CONSENT; sensitive-content matrix
- **Alternatives considered:** Include de-identified mental-health findings in clinician handout (deferred).
- **Consequences:** No mental-health route; filters must not promote those claims in publication mode.
- **Revisit if:** Patient signs scoped approval for specific mental-health statements.
- **Superseded in part by DEC-0030** (2026-08-05): for the v0.1 noindex research preview only, CLM-0046 / CLM-0047 / CLM-0048 with their exact published wording are treated as in-scope under the DEC-0026 broad grant. The default exclusion remains for any *additional* mental-health material.
- **Superseded in part by DEC-0039** (2026-08-10): the default-exclusion rule stated above — including the "additional mental-health material" carve-out in the DEC-0030 line — no longer describes the policy. What decides publication is provenance, not subject matter: mental-health material traceable to the documents Drift0r himself provided or published may be relayed as attributed historical record, and material not traceable to them stays excluded. Existing do-not-publish exclusions are untouched, as is the absolute bar on prescriptive content.

### DEC-0023 — Removal of noindex is a scoped patient decision, not an engineering checkbox

- **Date:** 2026-08-05
- **Milestone:** M4R / M6 gate
- **Decision:** Keep `noindex: true` until the patient explicitly decides on search indexing separately from private preview, public repository, public website, and social-preview consent.
- **Evidence:** ROADMAP §6A.7; release.yaml; DEC-0020; Checkpoint I indexing single-source
- **Alternatives considered:** Auto-clear noindex at launch (rejected). robots.txt `Disallow: /` while noindex is true (rejected — would prevent crawlers from reading page-level noindex meta).
- **Consequences:** While indexing remains disabled, **`robots.txt` is `Allow: /`** so crawlers can fetch HTML and honor **page-level `noindex, nofollow` meta** (single-sourced from `release.yaml:noindex` via `site/src/lib/indexing.ts`). Search engines must not be blocked from reading the meta. Enabling indexing is a separate patient + owner decision, not an engineering checkbox.
- **Revisit if:** Patient approval matrix records indexing choice; then flip `release.yaml:noindex` only after that decision.
- **Superseded by DEC-0037** (2026-08-07): the owner made the indexing decision for the v0.3.0 publication. `release.yaml:noindex` is `false` and the site ships indexable. The corrected `robots.txt` consequence above (`Allow: /`) still stands.

### DEC-0024 — Identifier attestation is offline-fail-closed for launch-cited cards

- **Date:** 2026-08-05
- **Milestone:** M4R
- **Decision:** Networked refresh writes deterministic attestations; ordinary `validate_all` runs offline identity checks. Network outages must never be recorded as identifier mismatches. Identity success never implies claim-summary medical support.
- **Evidence:** ROADMAP §6A.2; `scripts/lit_identity.py`; `literature/attestations/`
- **Alternatives considered:** Live network calls in every CI validate (rejected — flaky, rate-limited).
- **Consequences:** Stale or missing attestations fail the gate; full-corpus refresh is resumable.
- **Revisit if:** Registry APIs change or attestation schema versions.

### DEC-0025 — “Compiled-summary reconciliation” names the actual M1 artifact scope

- **Date:** 2026-08-05
- **Milestone:** M4R
- **Decision:** Treat historical “primary-record reconciliation” headings as **compiled-summary reconciliation** scope. Preserve file paths for history; correct public language.
- **Evidence:** ROADMAP §6A.4; 02_record_reconciliation.md
- **Alternatives considered:** Rename files (deferred — link breakage).
- **Consequences:** Site and new docs use accurate scope language.
- **Revisit if:** Primary records are obtained under private intake.

### DEC-0026 — Broad patient publication permission obtained

- **Date:** 2026-08-05
- **Milestone:** M5 patient review / M6 preparation
- **Decision:** Record patient publication approval as **obtained**. Drift0r responded to the repository owner's detailed publication request with broad permission to post the project and whatever material the owner sees fit. This supersedes the patient-permission-pending portions of DEC-0018, DEC-0022, and DEC-0023. It does not automatically change claim-level `public_approved` flags, release-scope lists, `noindex`, or the technical launch state while Checkpoint E2.2 remains unresolved.
- **Evidence:** Direct-message correspondence retained locally as `private/consent/PublishApproval.jpg`; the image is private evidence and intentionally ignored rather than committed. Tracked status/scope/date live in `site/src/data/release.yaml` and `review_register.yaml` REV-0005.
- **Alternatives considered:** Treat the reply as limited only to the original public data; request a second formal consent form (not required by the owner given the reply's broad wording and reference to the detailed email).
- **Consequences:** Site and governance surfaces may accurately say patient publication approval was obtained. Clinician review, medical validity, third-party copyright, sanitized-repository, print, and technical launch gates remain separate. Existing `do_not_publish` and private-identifier exclusions remain in force.
- **Revisit if:** The patient narrows or revokes permission, or the owner proposes a materially different use outside the research portfolio described in the request.


### DEC-0027 — v0.1 openly shared noindex research preview before clinician review

- **Date:** 2026-08-05
- **Milestone:** Checkpoint F / M5–M6 candidate
- **Decision:** Authorize a **v0.1 public research-preview** posture: openly shareable sanitized repository + static site artifact, with **`noindex` remaining true**, clinician review status remaining **`not_reviewed` / not performed**, and that status displayed prominently on every launch-critical route. The owner accepts launching this scoped preview **before** qualified clinician review solely because the lack of clinician review is unambiguous and cannot be mistaken for clinical validation. Qualified clinician review remains the **highest-priority post-launch** task and is not waived.
- **Evidence:** REV-0005 / DEC-0026 patient publication permission; REV-0006 clinician review still pending; ROADMAP M5/M6 gates retained as open work.
- **Alternatives considered:** Block all public sharing until clinician review (rejected by owner for this scoped noindex preview); enable indexing at launch (rejected).
- **Consequences:** Claim `public_approved` and `release_scope` may be populated for the preview; original source PDFs stay out of the public tree; private repository history stays private; no deploy/push until Codex Checkpoint F and owner launch decision.
- **Revisit if:** Patient revokes permission; clinician review completes; owner enables indexing; or material safety issue is identified.
- **Superseded in part by DEC-0037** (2026-08-07): the owner enabled indexing, which is the revisit condition this entry named. The rest of the v0.1 posture (clinician review not performed and displayed prominently; source PDFs not redistributed) is unchanged.

### DEC-0028 — Checkpoint F.1: public inventory ship path and noindex research-preview language

- **Date:** 2026-08-05
- **Milestone:** Checkpoint F.1 / M5 remediation
- **Decision:** The site and sanitized public repository load only `01_claim_inventory_public.yaml` (74 approved A/B/C claims). The private inventory remains monorepo-only. Python monorepo scripts are **not** part of the public support surface. Public-facing language must consistently state patient permission **obtained**, clinician review **not performed**, research-only disclaimer, no clinician endorsement, and **noindex** until a separate launch decision. Source PDFs are not redistributed; an external patient-hosted folder link is documented. Version **v0.1.3-rc.1**, allowlist **1.7.0**.
- **Evidence:** Codex Checkpoint F CHANGES REQUESTED; `site/src/lib/data.ts` inventory resolution; `governance/public_allowlist.yaml` v1.7.0.
- **Alternatives considered:** Keep dual inventory hard dependency (rejected — sanitized tree unbuildable); export full Python tooling (rejected — private paths and monorepo assumptions).
- **Consequences:** Fresh sanitized export must pass `npm ci` / `check` / publication `build` / `test` independently. Clinician review remains highest-priority post-launch task (DEC-0027 preserved).
- **Revisit if:** Clinician review completes; indexing decision changes; patient revokes permission.

### DEC-0029 — Checkpoint F.1.1: opening caveat, non-endorsement, gated contributions

- **Date:** 2026-08-05
- **Milestone:** Checkpoint F.1.1
- **Decision:** Every HTML/print route carries a compact persistent status notice stating research preview, not medical advice, published with Drift0r’s permission, permission is not endorsement, and not clinician-reviewed. The landing page opens with “Initial research preview — incomplete and open to correction” and explicit AI-portfolio / non-endorsement / clinician non-review language. v0.1 public contributions are limited to structured GitHub issue templates (literature, correction, counterevidence, research idea) with hard prohibitions on private records and treatment advice. Private monorepo Python deps for export are pinned in `scripts/requirements.txt` (PyYAML). Version **v0.1.3-rc.2**, allowlist **1.7.1**.
- **Evidence:** Codex F.1 follow-on request; CONTRIBUTING.md; StatusNotice component.
- **Alternatives considered:** Unmoderated discussion surface (rejected); omit non-endorsement language (rejected).
- **Consequences:** Automated rendered-output tests enforce notice and landing language. No deploy until owner decision.
- **Revisit if:** Clinician review completes; contribution policy changes; patient revokes permission.

### DEC-0030 — Mental-health claims CLM-0046/0047/0048 approved for v0.1 under broad grant

- **Date:** 2026-08-05
- **Milestone:** Checkpoint H.1 / v0.1 research preview
- **Decision:** Interpret Drift0r’s broad response to the owner’s detailed permission request (DEC-0026: “You’re welcome to post. Whatever you see fit.”) as covering the **exact published wording** of mental-health-related public claims **CLM-0046**, **CLM-0047**, and **CLM-0048** for this **noindex** v0.1 research preview, including discoverability on `/case/` and related medical surfaces, and persistent repository publication of those claim statements. This is an owner editorial judgment about the scope of an existing broad grant — not a new signed instrument — and it is recorded here so the project’s written rules match what ships.
- **Evidence:** DEC-0026 / REV-0005 correspondence; `site/src/data/release.yaml` patient_approval; published claim IDs and statements in `01_claim_inventory_public.yaml`; Checkpoint H audit finding P1-1.
- **Alternatives considered:** (1) Keep DEC-0022 absolute and set `public_approved: false` on CLM-0046/0047/0048 until a second claim-by-claim instrument exists (rejected for this preview given the breadth of the recorded reply and the owner’s detailed request that raised sensitive subject areas). (2) Weaken DEC-0022 / ROADMAP mental-health exclusion generally (rejected — additional mental-health material remains excluded by default).
- **Consequences:** Those three claims may remain `public_approved: true` with their exact inventory wording. Any *new* mental-health claim, quotation, or specialty-summary expansion still requires explicit separate approval of exact wording. — **Superseded in part by DEC-0039** (2026-08-10): the per-claim exact-wording approval requirement in this sentence is replaced by a class-level provenance rule. New mental-health material traceable to the documents Drift0r provided may be published as attributed historical record without separate per-claim sign-off; material not so traceable remains excluded. The "additional mental-health material remains excluded by default" position recorded under *Alternatives considered* above is likewise retired. AI multi-model “consensus” language must not be presented as clinical validation of a psychiatric framing (see CLM-0048 notes). Correction/privacy/removal uses a dedicated GitHub issue template (no private medical records in issues). Sensitive Drift0r consent or withdrawal may continue through existing private correspondence with the repository owner.
- **Revisit if:** Patient narrows or revokes permission; additional mental-health material is proposed; indexing is enabled; or clinician review requires wording change.

### DEC-0031 — Checkpoint H.1 remediation: language layer scope, contact channel, print footers

- **Date:** 2026-08-05
- **Milestone:** Checkpoint H.1
- **Decision:** Remediate Checkpoint H P0/P1 findings before any publication action: (1) dose redaction must not destroy laboratory measurement values; (2) allowlisted literature narrative must pass a language gate; (3) Round-1 swarm bodies stay historically intact with conspicuous superseded banners; (4) publish a dedicated GitHub issue template for correction/privacy/removal (no privacy@ email; warn against private medical posts; Drift0r consent/withdrawal may continue via existing private correspondence); (5) running print footer on all routes; (6) Evidence Atlas kind→band rules apply to `does_not_explain` edges; (7) safe canonical + Open Graph/X metadata for `https://drift0rresearch.org/` without medical detail in unfurls. Version **v0.1.3-rc.6**, allowlist **1.8.1**.
- **Evidence:** `CHECKPOINT_H_CLAUDE_FINAL_AUDIT.md`; this remediation packet.
- **Alternatives considered:** Defer export language gate (rejected — export candidate must not ship forbidden labels); silently rewrite swarm bodies (rejected — CORRECTIONS_POLICY no silent rewrite).
- **Consequences:** Fresh sanitized export + launch gate required before any owner launch decision. No push/deploy/noindex removal in this pass.
- **Revisit if:** Owner launch decision; patient revocation; further audit findings.

### DEC-0032 — Checkpoint I: custom-domain, indexing single-source, social meta, creator disclosure

- **Date:** 2026-08-05
- **Milestone:** Checkpoint I / v0.1.3-rc.7
- **Decision:** Ship pre-launch mechanics for a quiet noindex research preview: custom-domain URL single-source (`base_path=/` when `SITE_URL_OVERRIDE` is the apex domain); all visitor-facing indexing copy and HTML `noindex` meta single-sourced from `release.yaml:noindex`; `robots.txt` remains crawlable (`Allow: /`) so page-level noindex is readable; production OG image and `summary_large_image`; creator/independence attribution on every page; public roadmap split (ops roadmap not exported).
- **Evidence:** `CHECKPOINT_I_REMEDIATION_PACKET.md`; `site/src/lib/indexing.ts`
- **Alternatives considered:** robots.txt Disallow while noindex (rejected — see DEC-0023 corrected consequences).
- **Consequences:** Indexing enablement remains a separate patient/owner decision. No push/deploy in this pass.
- **Revisit if:** Custom domain launch; indexing decision.

### DEC-0033 — Checkpoint I.1: visitor indexing polarity, source-grounded citation audit, mobile/print evidence

- **Date:** 2026-08-05
- **Milestone:** Checkpoint I.1 / v0.1.3-rc.8
- **Decision:** Visitor-facing indexing strings must derive from `release.noindex` helpers and survive a false-polarity publication build scan. Citation fidelity for public-used works must be AI-evaluated against publication sources (not catalog-only templates), with `semantic_verified_count` never incremented by AI work and independent human review still pending. Mobile landing chrome compacted; mobile QA extended; print QA `content_version` must match `release.yaml`.
- **Evidence:** `CHECKPOINT_I1_REMEDIATION_PACKET.md`; `LAUNCH_CITATION_FIDELITY_AUDIT.yaml`
- **Alternatives considered:** Keep catalog-summary citation "pass" rows (rejected — honesty).
- **Consequences:** Public surfaces may report AI source-grounding only; human review remains pending. No push/deploy.
- **Revisit if:** Human citation review completes; further fidelity findings.

### DEC-0034 — Checkpoint I.1.1: bibliographic honesty for no-abstract works; launch-safety isolation

- **Date:** 2026-08-05
- **Milestone:** Checkpoint I.1.1 / v0.1.3-rc.9
- **Decision:** (1) Ground public-used citations against Europe PMC abstracts or open locators; classify works with **no source text** as `bibliographic_only` (not `source_grounded_ai`) — specifically **lit-0058** and **lit-0089** — so the public-used source-grounded count is **32 of 34**. (2) Indexing polarity tests must never mutate live `release.yaml` (`DRIFT0R_RELEASE_YAML` fixture only). (3) Contribution CTA primary links ≥44px mobile targets. (4) Print validation fails closed on missing/empty `content_version`.
- **Evidence:** `CHECKPOINT_I1_1_REMEDIATION_PACKET.md`; audit v1.2.1; Europe PMC no-abstract confirmation for PMIDs 22716978 / 22316447
- **Alternatives considered:** Count bibliographic-only as source-grounded (rejected — false grounding); invent abstracts (rejected).
- **Consequences:** Changelog and public claims must not say "all 34" are source-grounded. `semantic_verified_count` remains 0.
- **Revisit if:** Full text for lit-0058/0089 is obtained under license; human review.

### DEC-0035 — Checkpoint J.1: Pages CI env isolation, version-surface honesty, lit-0015 canonical title

- **Date:** 2026-08-05
- **Milestone:** Checkpoint J.1 / v0.1.3-rc.9
- **Decision:** Remediate Claude Checkpoint J CONDITIONAL GO blockers and the four cheap pre-launch hardening items in §3 items 1–5 before any deploy: (J-B1) artifact-integrity `runNode` strips ambient `DRIFT0R_*` so Pages post-build `npm test` cannot poison negative gates; (J-B2) changelog rc.9 states 32 source-grounded + 2 bibliographic-only; (J-B3) public README Status heading matches `release.yaml` content_version and validate_all enforces it; regenerate mobile QA with stamped `content_version`; `build:publication` passes publication mode to `write-manifest`; public DECISIONS/review register through I–J; DEC-0023 robots consequences corrected; lit-0015 title is the DOI/Crossref canonical title with project framing as `scope_note`.
- **Evidence:** `CHECKPOINT_J_CLAUDE_FINAL_GO_NO_GO.md`; this remediation packet
- **Alternatives considered:** Deploy with known CI-fail (rejected — fail-closed but non-launchable); leave project label as identity-verified title (rejected).
- **Consequences:** Quiet deploy may proceed only after full suite green under Pages CI env and a fresh sanitized export. No push/deploy/noindex removal in this pass.
- **Revisit if:** Further audit findings; owner launch decision.

### DEC-0036 — Ruled-out register published, including its psychiatric-evaluation entry

- **Date:** 2026-08-06
- **Milestone:** v0.3.0 publication preparation
- **Decision:** Publish `evidence/ruled_out.yaml` as a public surface on the landing page, including the entry `It is psychological / somatic symptom disorder` (multiple psychiatric and psychological evaluations through 2025; a previously applied somatic symptom disorder label was formally reversed in 2025). This extends the same owner editorial judgment recorded in DEC-0030 — Drift0r's broad grant under DEC-0026 ("You're welcome to post. Whatever you see fit.") plus the owner's direct confirmation that anything the owner judges valid may be posted — to mental-health material beyond CLM-0046/0047/0048. It is an owner judgment about the scope of an existing broad grant, not a new signed instrument, and is recorded here so the project's written rules match what ships.
- **Evidence:** DEC-0026 / REV-0005 correspondence; DEC-0030 precedent; `site/src/data/release.yaml` patient_approval; `evidence/ruled_out.yaml`; rendered on `/` via `getRuledOut()`.
- **Alternatives considered:** (1) Withhold the psychiatric entry and publish the remaining eleven (rejected — removing it would misrepresent the record by omitting the single entry a reader is most likely to raise, and the reversal is exculpatory context the patient benefits from having stated). (2) Keep DEC-0022 residual absolute and defer the whole register (rejected — the register is the page's most-requested content and the grant plainly covers it). (3) Publish without amending the governance docs (rejected — it would leave a false public commitment in `PRIVACY_AND_CONSENT.md`).
- **Consequences:** `PRIVACY_AND_CONSENT.md` item 9 and `release.yaml` `patient_approval.scope` are amended to record that mental-health material is now included at owner editorial discretion rather than excluded by default. The register carries test name, date, and plain result only — **no numeric lab values**, which remain in the private tests ledger and are not cleared for publication. The standing caveat ("a negative test is not the same as an impossibility… not clinical exclusions, and no licensed clinician has reviewed them") ships with it. Correction/privacy/removal remains available via the dedicated issue template, and Drift0r may narrow or withdraw through existing private correspondence.
- **Revisit if:** Drift0r narrows or revokes permission; a clinician review requires wording change; or numeric values are ever proposed for this surface.
- **Superseded in part by DEC-0039** (2026-08-10): the *"plain result only / no numeric lab values"* limit recorded above is replaced by a provenance test. The numeric-value revisit trigger named here has now fired and been answered.

### DEC-0037 — Search indexing enabled for the v0.3.0 publication

- **Date:** 2026-08-07
- **Milestone:** v0.3.0 publication preparation
- **Decision:** The public site ships **indexable** (`release.yaml:noindex: false` → `index, follow`). This is the owner's launch decision and it **supersedes the noindex postures recorded in DEC-0023 and DEC-0027**, both of which deliberately deferred the question rather than settling it. The decision is recorded here because it had already been made in `release.yaml` and `release_scope.yaml` without a corresponding entry — a paired Codex/Grok review caught the gap, and a publication posture this consequential must not exist only as a config value.
- **Evidence:** `site/src/data/release.yaml:2,49` (`noindex: false`, "Search indexing is enabled"); `site/src/data/release_scope.yaml:8` ("openly shared and indexed research preview"); `site/src/lib/indexing.ts:15–16`; DEC-0023 (deferral); DEC-0027 (indexing at launch rejected *for v0.1*); DEC-0026 / REV-0005 broad publication grant.
- **Alternatives considered:** (1) Treat `noindex: false` as an untracked flip and restore `noindex: true` (rejected by the owner — indexing is intended). (2) Ship indexed and leave the governance documents stating the opposite (rejected — `PRIVACY_AND_CONSENT.md` item 6 would be a false public commitment, and `site/src/lib/indexing.ts` already classifies the string "indexing remains disabled" as a false-polarity defect). (3) Ship indexed and silently drop DEC-0023/0027 (rejected — the decision log is append-only; superseded entries are marked, never edited away).
- **Consequences:** `PRIVACY_AND_CONSENT.md` item 6 and its checklist framing are rewritten from "noindex research preview / indexing remains disabled" to record indexing as enabled. DEC-0023 and DEC-0027 carry superseded-by notes. `robots.txt` remains `Allow: /` (unchanged — DEC-0023's corrected consequence), and page-level robots meta stays single-sourced from `release.yaml:noindex`. Practical effect: material about a named living person becomes search-discoverable at first publication, which raises the cost of any later correction or withdrawal.
- **Open item carried forward:** DEC-0023 framed removal of `noindex` as requiring the patient's decision on search indexing **separately** from the general publication grant. The owner's position is that DEC-0026's broad grant ("You're welcome to post. Whatever you see fit.") covers it. That reading is the owner's editorial judgment, not a documented patient statement about indexing specifically, and it is recorded as such here rather than presented as explicit consent.
- **Revisit if:** Drift0r asks that the site not be indexed; clinician review finds material requiring removal; or a takedown/correction request arrives that indexing has made harder to satisfy.

### DEC-0038 — Ruled-out register gains claim rows and passes the publication gate

- **Date:** 2026-08-07
- **Milestone:** v0.3.0 publication preparation
- **Decision:** Every entry in `evidence/ruled_out.yaml` carries `claim_ids` naming the rows in `01_claim_inventory_public.yaml` that support it, those ids render to visitors, and `getRuledOut()` drops any entry in publication mode whose claims are not all approved. Four entries had no public claim row and were sourced only from the gitignored private tests ledger; rather than drop them, four rows were added to the public inventory: **CLM-0078** (celiac panel), **CLM-0079** (thyroid panel), **CLM-0080** (heavy metals), **CLM-0081** (Ehlers-Danlos, patient-reported clearance).
- **Evidence:** Codex finding 7 (register bypassed the fail-closed scope mechanism) and finding 9 (`/methods/` promises every statement is a typed record with a source trail — false for this table); Grok finding 5 (allowlist packaging gap). Private ledger `evidence/facts/tests_ledger.yaml` T015 / T026 / T042 / T067.
- **Alternatives considered:** (1) Drop the four ungrounded entries (rejected by the owner — celiac in particular is among the most-suggested explanations and the data exists). (2) Ship all twelve with a header note disclosing the gap (rejected — an honest label on an ungoverned public medical surface is still an ungoverned public medical surface). (3) Add the rows but not the gate (rejected — approving `/` as a hardcoded route would keep implicitly publishing whatever the file happened to contain).
- **Consequences:** Public claim inventory goes from 75 to 79 approved rows; `meta.claim_count`, tier and kind counts, and `language.test.mjs` updated to match. `evidence/ruled_out.yaml` is added to `public_allowlist.yaml` under both `v1_public_repository` and `medical_page_body_sources` (allowlist **1.10.0**) — without it a sanitized export omits a required homepage build input and the landing build fails.
- **Revisit if:** New entries are proposed without claim rows; or the private ledger is ever cleared for publication, which would change where these four claims are sourced.

### DEC-0039 — Publication limit scoped by provenance, not content type; prescriptive bar made absolute

- **Date:** 2026-08-10
- **Milestone:** v0.4.0 publication preparation
- **Decision:** Replace the DEC-0036 content-type limit (*"plain results only, no numeric values or verbatim clinical wording"*) with a **provenance test**. Material that Drift0r himself provided or published — the compiled clinical summaries and history documents underlying this project — may be relayed as **attributed historical record, including numeric lab values, medication and dosing history, and mental-health content**. Material not traceable to those documents remains outside the grant. This **also retires the DEC-0030 residual** requiring *"explicit separate approval of exact wording"* for each new mental-health claim: the owner has now set a class-level rule in its place, so provenance plus the standing framing requirements govern, not per-claim wording sign-off. Separately and independently, the bar on **prescriptive** content is restated as absolute: no public surface may recommend, suggest or imply that a reader take, start, stop or adjust anything. The operative distinction is direction, not subject matter — *what the patient took and what followed* is record; *what a reader should take* is barred in every form.
- **Evidence:** DEC-0026 / REV-0005 broad grant ("You're welcome to post. Whatever you see fit."); DEC-0030 and DEC-0036 precedent for owner editorial judgment over the grant's scope; the owner's record that Drift0r published these documents himself and has since reshared this site to his own audience of several hundred thousand, which is inconsistent with treating the same figures as newly disclosed when relayed here. Source documents: `private/research-runs/2026-08-06-overnight/source-text/` (ten compiled summaries, gitignored; originals not redistributed).
- **Alternatives considered:** (1) Keep the numeric bar and publish mental-health findings as plain wording only (rejected by the owner — it suppresses figures the subject published himself, and a paraphrase of a number he already stated is less accurate, not more private). (2) Relax the limit for mental-health content specifically (rejected — the same question arises for dosing and for lab values, so a subject-matter carve-out would need re-litigating per topic; provenance answers all of them once). (3) Relax the prescriptive bar alongside it (rejected outright — the two are unrelated, and the risk the prescriptive bar addresses is a reader acting on this material, which no permission from the subject can license).
- **Consequences:** `PRIVACY_AND_CONSENT.md` item 9 and `release.yaml` `patient_approval.scope` are amended to state the provenance test and to carry the prescriptive bar by reference. `03_public_language_guide.md` §4.5 gains the historical-vs-prescriptive rule with a worked permitted/barred pair. DEC-0036 is marked superseded in part. Practical effect for v0.4.0: findings previously blocked solely by the numeric limit become publishable as historical record — including the mental-health item and documented dosing history — while nothing gains permission to advise. Reviewers should note the new failure mode this creates: a historical figure published **without** its attribution and past-tense framing reads as guidance, so locator-cited attribution is now load-bearing for safety, not just for provenance.
- **Revisit if:** Drift0r narrows or withdraws permission, or objects to any specific figure; a clinician review requires wording change; material is proposed for publication that cannot be traced to a document he provided; or any surface is found presenting historical dosing without its past-tense attribution.
