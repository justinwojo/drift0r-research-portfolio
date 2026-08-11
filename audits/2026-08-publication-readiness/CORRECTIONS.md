# Corrections register — 2026-08 publication readiness

> Material corrections to claims, provenance, or public wording.  
> Do **not** silently rewrite historical swarm outputs; reference them and record the correction here.  
> **Not medical advice.**

| Field | Value |
|-------|-------|
| Run | `2026-08-publication-readiness` |
| Base commit | `6c6a49d2d258524c1a8d9c80d4b159dfa914ea2c` |

---

## Status key

| Status | Meaning |
|--------|---------|
| `identified` | Problem found; not yet reflected in public-facing claim inventory |
| `logged_in_inventory` | Claim inventory carries corrected statement / status |
| `applied_to_public_draft` | Future site content uses corrected form |
| `rejected` | Reported issue was incorrect on recheck |
| `deferred` | Needs primary record or clinician input |

---

## Correction template

```text
### COR-NNNN — short title
- Date identified:
- Status:
- Severity: launch_blocker | should_fix_before_launch | post_launch | editorial
- Affected claims / paths:
- Incorrect or unsafe form:
- Corrected form:
- Evidence:
- Residual uncertainty:
```

---

### COR-0001 — Hip BMD change vs LSC: source-attributed, not free-floating “significant”

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** README case snapshot; evidence pack hip line; synthesis; clinician one-pager; tests_ledger T004
- **Incorrect or unsafe form:** Stating hip loss is “significant” without citing the summary’s LSC and absolute BMD change, or implying independent statistical analysis beyond the transcription.
- **Corrected form:** “Patient-compiled bone summary: total hip BMD 0.836 → 0.802 g/cm² (−4.2%) over ~12 months on same Site 1 Hologic scanner; summary states LSC = 0.027 g/cm² and calls the change significant at 95% confidence.”
- **Evidence:** `evidence/sources/Drift0r_BoneDensity_Summary.pdf` (hip table footnote).
- **Residual uncertainty:** Original facility precision study / software version not in repo.

### COR-0002 — “Osteoporosis” is WHO-by-T-score language in compiled summary, not a verified clinician diagnosis string

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** launch_blocker (public wording)
- **Affected claims / paths:** README “catastrophic early osteoporosis”; evidence pack; synthesis; ledger T001/T006
- **Incorrect or unsafe form:** Presenting “osteoporosis” as an unqualified observed clinical diagnosis for a male under 50 without Z-score framing or source attribution.
- **Corrected form:** Report scanner T-scores and Z-scores where available; state that the patient-compiled bone summary applies WHO classification by lowest T-score (“Osteoporosis”) and that ISCD-style interpretation for men <50 emphasizes Z-scores / BMD below expected range for age. Do not invent a chart diagnosis beyond available documents.
- **Evidence:** Bone summary at-a-glance diagnosis line; forearm and lumbar Z-scores in same PDF; ROADMAP known risk.
- **Residual uncertainty:** Treating clinician’s formal diagnostic phrasing unknown.

### COR-0003 — “Catastrophic osteoporosis” internal research language

- **Date identified:** 2026-08-05
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** README case snapshot; some swarm prose; M4 site case/working-model copy
- **Incorrect or unsafe form:** “catastrophic early osteoporosis”
- **Corrected form:** “markedly low BMD (e.g., L3 T-score −4.3 with Z-score −4.3 on compiled report); clinician-recorded terminology if/when available”
- **Evidence:** Language guide M1; medical-safety rules; site language transform + correction badge title avoids re-using the unsafe phrase as body copy.
- **Residual uncertainty:** None for wording; magnitude remains as reported.

### COR-0004 — Historical T ~34 ng/dL provenance is incomplete

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** evidence pack hard numbers; synthesis; endocrine summary clinical context
- **Incorrect or unsafe form:** Treating ~34 ng/dL ×2 as a fully instrument-verified lab series with method and dates.
- **Corrected form:** “Reported historical total testosterone as low as ~34 ng/dL (narrative / clinical-context statements in endocrine and thiamine summaries; discrete earliest tabulated totals in endocrine summary begin 2021 and are higher / on or off therapy). Mark `reported_history` / `partially_verified` until original labs surface.”
- **Evidence:** Endocrine summary clinical context vs tabulated HPG panel starting 02/22/2021 (210 ng/dL note); methodology note (1) for note-only values.
- **Residual uncertainty:** Original ~2017–2019 lab reports missing.

### COR-0005 — KIT “negative” lacks method and LOD

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** evidence pack genetics line; synthesis H-SM; ledger T036
- **Incorrect or unsafe form:** “KIT neg” implying complete exclusion of clonal systemic mastocytosis.
- **Corrected form:** “KIT mutations reported negative in patient materials; assay specimen, method, and limit of detection not documented in public pack. Negative result does not fully exclude low-burden disease depending on method.”
- **Evidence:** Thiamine/master narrative statements; Round-1 open questions; no method sheet in repo.
- **Residual uncertainty:** High until method recovered.

### COR-0006 — CTX 616 lacks fasting / time-of-day documentation

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch (interpretation)
- **Affected claims / paths:** evidence pack; bone summary; synthesis turnover language
- **Incorrect or unsafe form:** Interpreting CTX 616 as definitive high-turnover disease without collection standardization.
- **Corrected form:** “Serum CTX 616 pg/mL on 2026-06-26 (ref 70–780) per bone summary; fasting/time-of-day/method not stated. Upper-end of reference interval only; formation markers not paired.”
- **Evidence:** Bone summary turnover table; Round-1 open Q2.
- **Residual uncertainty:** Collection conditions unknown.

### COR-0007 — Specialty Babesia/Bartonella must not read as confirmed infection

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** launch_blocker
- **Affected claims / paths:** README; infectious summary treatment framing; some community language
- **Incorrect or unsafe form:** “IGeneX-positive Babesia & Bartonella” without contested LDT framing and commercial negatives.
- **Corrected form:** Dual-status: specialty FISH/IgM contested LDT; PCR/IB commercial pathways negative as documented.
- **Evidence:** Infectious-disease summary tables §1a–1b.
- **Residual uncertainty:** Clinical meaning of discordant LDTs remains open for clinicians.

### COR-0008 — SSD reversal scope is documented in mental-health summary

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch (get wording precise)
- **Affected claims / paths:** README; synthesis hard rejects; clinician one-pager
- **Incorrect or unsafe form:** Over-broad “psych fully cleared” or implying all mental-health concerns are absent.
- **Corrected form:** “2021 somatic symptom disorder assessment re-evaluated 2025 by same clinician framework: no longer met DSM-5 SSD criteria; anxiety judged proportionate to medical illness on multiple evaluations. MMPI-2-RF (2025): no somatic over-report. Residual note: risk of health hyperfocus acknowledged.”
- **Evidence:** `Drift0r_MentalHealth_Summary.pdf`.
- **Residual uncertainty:** Full original psych report text not in repo beyond compilation.

### COR-0009 — Gene-panel yield honesty (~9%) must not become “high yield”

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** synthesis test matrix; any public genetics language
- **Incorrect or unsafe form:** Marketing-style “high-yield gene panel”
- **Corrected form:** “Related early-onset idiopathic osteoporosis panels report modest pathogenic rare-gene hit rates (~single-digit to low-teens % in cited cohorts); high VUS rate; negative panel does not exclude unknown genes or non-genetic secondary OP.”
- **Evidence:** Round-1 synthesis; chair rule against R1 overclaim.
- **Residual uncertainty:** Exact cohort applicability to this patient remains limited.

### COR-0010 — Catalog duplicate works inflate public counts

- **Date identified:** 2026-08-05
- **Status:** `identified` → addressed in M2 corrections YAML
- **Severity:** should_fix_before_launch (counts / bibliography)
- **Affected claims / paths:** README “~334 cards”; CORPUS_STATUS; public lit counts
- **Incorrect or unsafe form:** Presenting 334 as unique works without disclosing duplicates.
- **Corrected form:** Report unique works after DOI/PMID dedupe; retain 334 card files with aliases.
- **Evidence:** Catalog analysis 2026-08-05 (9 DOI pairs; 11 title-level pairs).
- **Residual uncertainty:** Additional near-duplicates without shared DOI may remain.

### COR-0011 — Cross-scanner DXA absolute BMD not comparable

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** Any language treating Site 2 L1–L4 T −2.9 as improvement vs Site 1 T −3.7
- **Incorrect or unsafe form:** Implying true BMD recovery from −3.7 to −2.9 across sites.
- **Corrected form:** “Site 1 vs Site 2 use different scanners; absolute BMD not comparable. Only same-scanner comparisons used for % change.”
- **Evidence:** Bone summary interpretation caveat and L1–L4 table notes.
- **Residual uncertainty:** Software/positioning consistency within Site 1 series not fully documented beyond “same scanner” claim.

### COR-0012 — Dry beriberi label is interpretive around documented deficiency + phenotype

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** README “confirmed dry beriberi”; evidence pack core syndrome #2
- **Incorrect or unsafe form:** “Confirmed dry beriberi” as if a single chart ICD diagnosis is in the public pack.
- **Corrected form:** “Documented serum thiamine deficiency (7 nmol/L, 2022-09-29, ref 8–30) with patient-reported burning neuropathy and rapid improvement after repletion; dry-beriberi phrasing appears in patient-compiled materials and research summaries as an interpretive clinical label, not a separately verified specialty-clinic diagnosis string in-repo.”
- **Evidence:** Thiamine deficiency summary; evidence pack; absence of formal neurology diagnosis PDF.
- **Residual uncertainty:** Clinician diagnostic wording may exist outside public pack.

### COR-0013 — Machine-readable compound probability vocabulary

- **Date identified:** 2026-08-05
- **Status:** deferred to M3 schema enforcement
- **Severity:** post_launch for historical YAML appendix; launch for new public schemas
- **Affected claims / paths:** synthesis machine-readable appendix; future hypothesis files
- **Incorrect or unsafe form:** Single fields carrying multiple meanings.
- **Corrected form:** Declared enums only; split architecture vs module confidence.
- **Evidence:** ROADMAP known risk + M3 requirements.
- **Residual uncertainty:** None for new schemas.

---

## How to add a correction

1. Assign next `COR-NNNN`.
2. Link affected claim IDs once inventory exists.
3. Prefer additive public changelog language over silent file rewrites.
4. If historical swarm text is wrong, leave it and point here.

### COR-0014 — Public medical page generation must not ship raw overstatement surfaces

- **Date identified:** 2026-08-05 (adversarial M0–M3 review)
- **Status:** `logged_in_inventory` / policy updated
- **Severity:** launch_blocker (if untransformed allowlist prose is used as page body)
- **Affected claims / paths:** README historical tone; master narrative; tests_ledger prose; community/ideas patient infection shorthand; allowlist v1.0
- **Incorrect or unsafe form:** Generating site medical pages by copying allowlisted research prose verbatim
- **Corrected form:** Generate from claim inventory + public language guide + structured hypotheses/CQ; allowlist v1.1 generation rule; README case snapshot soft-edited 2026-08-05
- **Evidence:** Adversarial review H1/H4; `governance/PUBLIC_FILE_ALLOWLIST.md` v1.1.0
- **Residual uncertainty:** Historical packs still contain strong language for research freeze — OK if not UI bodies

### COR-0015 — ISCD Official Positions near-duplicate cards

- **Date identified:** 2026-08-05
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch (bibliography counts)
- **Affected claims / paths:** lit-0015, lit-0224; CLM-0009
- **Incorrect or unsafe form:** Counting two cards as two works for the same ISCD positions URL
- **Corrected form:** lit-0224 aliased to lit-0015; unique work count 324
- **Evidence:** Identical URL `https://iscd.org/official-positions-2023/`
- **Residual uncertainty:** Other URL-only near-dups may remain

### COR-0016 — Structured hypothesis and clinician-question instances required

- **Date identified:** 2026-08-05
- **Status:** `applied_to_public_draft` (structured files created; M4 site consumes them)
- **Severity:** should_fix_before_launch (M3 acceptance)
- **Affected claims / paths:** M3 schemas vs empty instance dirs; M4 Astro data layer
- **Incorrect or unsafe form:** Schemas without populated H*/CQ* instances; ranking only in prose
- **Corrected form:** `differentials/hypotheses/H1–H5.yaml` and `differentials/clinician_questions/CQ-001–010.yaml` validated by `validate_all.py` and rendered by the M4 site
- **Evidence:** Adversarial review H2; ROADMAP M3 acceptance; M4 site build
- **Residual uncertainty:** Full Draft-2020-12 jsonschema engine still optional

### COR-0017 — Nine literature cards had wrong or dead DOI/PMID identifiers

- **Date identified:** 2026-08-04 (Claude pre-publication review); independently re-verified 2026-08-05 (M4R, Crossref + NCBI)
- **Status:** `applied_to_public_draft` (entry frontmatter + catalog corrected; offline attestations required)
- **Severity:** launch_blocker (bibliography integrity)
- **Affected claims / paths:** lit-0104, lit-0115, lit-0146, lit-0149, lit-0150, lit-0160, lit-0164, lit-0166, lit-0191; swarm adversarial text citing lit-0104 (historical, not rewritten)
- **Incorrect or unsafe form:** Well-formed DOI/PMID values pointing at unrelated papers or 404s
- **Corrected form (independently confirmed):**
  - lit-0104 DOI → `10.1111/j.1523-1755.2005.00200.x` (PMID 15780075 already correct)
  - lit-0115 DOI → `10.1016/s0049-0172(95)80038-7` (PMID 7740308 correct)
  - lit-0146 PMID → `36821510` (DOI already correct)
  - lit-0149 PMID → `19864525` (DOI already correct)
  - lit-0150 DOI → `10.1038/s41584-019-0308-5`, PMID → `31595059`
  - lit-0160 PMID → `25031016` (DOI already correct)
  - lit-0164 DOI → `10.1016/j.jbspin.2003.09.009`, PMID → `14769521`
  - lit-0166 DOI → `10.1097/01.BRS.0000061992.98108.A0` (PMID correct)
  - lit-0191 DOI → `10.1152/ajpendo.00099.2009` (PMID correct)
- **Evidence:** Crossref works API + NCBI esummary 2026-08-05; scratch `lit-id-research.json`
- **Residual uncertainty:** Identifier identity ≠ card-summary accuracy or medical support. lit-0104 remains a uremia/dialysis cytokine review — not re-used as general non-CKD single-timepoint proof without separate sourcing.
- **PMCID follow-up (Checkpoint G.1, 2026-08-05):** NCBI PMC ID Converter used as authoritative. lit-0002 → `PMC4472130`; lit-0098 → `PMC6395313`; lit-0177 → `PMC7462270`. Blanked (no valid PMC record or wrong-target cleared): lit-0057, lit-0191, lit-0219, lit-0220, lit-0222. Catalog + entry frontmatter updated; DOI/PMID for these rows already correct.

### COR-0018 — lit-0294 inclusion/exclusion and gene-panel yield figures

- **Date identified:** 2026-08-05 (pre-publication review + M4R primary abstract/methods check)
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** lit-0294; COR-0009; genetics hypothesis language; clinician one-pager yield shorthand
- **Incorrect or unsafe form:** Treating fracture as required inclusion; implying hypogonadism-compatible idiopathic cohort; collapsing distinct yield numerators into ≈10–15% marketing language
- **Corrected form:** Collet et al. 2018 (N=123): Z-score < −2.0, diagnosis before 55, **fracture optional**; **hypogonadism excluded**. Yields: 11/123 (≈8.9%) rare/novel COL1A2/PLS3/WNT1/DKK1; 22/123 (17.8%) LRP5 p.Val667Met; 16/123 (≈13%) novel/very rare LRP5. Public text must keep numerator/denominator/variant class.
- **Evidence:** PubMed 30283887 abstract + PMC6124172 methods exclusion list
- **Residual uncertainty:** Case has historical hypogonadism/secondaries — yield priors do not transfer cleanly.

### COR-0019 — Source class is independent of verification_status; no primary instrument records in repo

- **Date identified:** 2026-08-05
- **Status:** `applied_to_public_draft`
- **Severity:** launch_blocker (epistemic honesty)
- **Affected claims / paths:** all launch claims' patient_sources; /methods; /case; /for-clinicians
- **Incorrect or unsafe form:** Implying specialty summary PDFs are original lab/DXA/radiology/clinic notes
- **Corrected form:** `source_class` enum populated; compiled summaries labeled `patient_compiled_summary`; blunt no-primary-record sentence on key routes
- **Evidence:** ROADMAP §6A.4; PRE_PUBLICATION_REVIEW; claim inventory injection
- **Residual uncertainty:** Primary records remain patient-held; private intake not yet supplied


### COR-0020 — Defect-card # Links sections still carried old identifiers after frontmatter fix

- **Date identified:** 2026-08-05 (Checkpoint E2 skeptic)
- **Status:** `applied_to_public_draft`
- **Severity:** launch_blocker (bibliography integrity)
- **Affected paths:** lit-0104/0115/0146/0149/0150/0160/0164/0166/0191 entry # Links; validate_entry_body_identifiers
- **Incorrect form:** Frontmatter/catalog corrected; body # Links still pointed at wrong DOI/PMID
- **Corrected form:** Body Links synced; validator requires primary Links DOI/PMID match catalog
- **Evidence:** skeptic gap fix; scripts/validate_all.py validate_entry_body_identifiers; unit tests
- **Residual uncertainty:** Free prose may still mention related PMIDs outside # Links (allowed)

### COR-0021 — lit-0104 applicability: uremia review must not support non-CKD patient cytokine inference

- **Date identified:** 2026-08-05 (Checkpoint E2 Codex; PRE_PUBLICATION_REVIEW residual)
- **Status:** `applied_to_public_draft`
- **Severity:** launch_blocker (literature support honesty)
- **Affected claims / paths:** lit-0104 entry + catalog; historical swarm/adversarial citations of lit-0104 as general single-timepoint proof; any public wording implying the paper predicts this patient’s mild TNF-α/IL-10 pattern
- **Incorrect or unsafe form:** After DOI identity fix, card still claimed the patient’s mild single-draw TNF/IL-10 pattern “fits a nonspecific low-level activation pattern this literature predicts.” The paper is a **uremia/CKD** cytokine-network review — not a non-CKD multi-system applicability source.
- **Corrected form:**
  - Card `supports` / `contradicts` / `patient_overlap` cleared of patient-specific inference
  - Similarity score downgraded; observation framed as **unresolved/nonspecific** without lit-0104 support
  - quality_notes state bibliographic identity only; COR-0021 supersedes prior applicability prose
  - Mild cytokine draw + normal CRP/ESR remains a nonspecific observation pending applicable sources and primary records — **not** re-derived from lit-0104
- **Evidence:** PMID 15780075 / DOI `10.1111/j.1523-1755.2005.00200.x` title and abstract scope (uremia); PRE_PUBLICATION_REVIEW lit-0104 section; Checkpoint E2.1 remediation
- **Residual uncertainty:** A future applicable non-CKD source could re-support the nonspecific interpretation; identity PASS still ≠ claim support

### COR-0022 — Nodule biopsy agency reversed (patient was refused, did not refuse)

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** launch_blocker (public factual agency about the patient)
- **Affected claims / paths:** CLM-0041; case surfaces rendering that claim
- **Incorrect or unsafe form:** “nodule biopsy refused” (implies the patient declined biopsy)
- **Corrected form:** “patient was refused an exploratory biopsy (clinicians declined; imaging-negative / blind-biopsy concern per patient video statement)”
- **Evidence:** Patient video transcript `transcript-youtube-krP9EGyLCRE.txt`: “I was refused an exploratory biopsy because again, it's imaging negative and the doctor told me he'd just be going in blind…”; imaging/thiamine summaries for non-visualization of forearm nodules
- **Residual uncertainty:** No signed clinic note in-repo; agency is patient-reported video statement, not an instrument record

### COR-0023 — CRP/ESR “repeatedly normal” lacked denominator and as-of date

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0044
- **Incorrect or unsafe form:** “CRP and ESR repeatedly normal” without count, dates, or bound
- **Corrected form:** “CRP normal on 3 documented draws (as-of latest 2025-08-05) and ESR normal on 3 documented draws (as-of latest 2025-08-05) in available specialty summaries; no CRP/ESR values after 2025-08-05 in those summaries”
- **Evidence:** Rheumatology lab summary CRP/ESR table (2021-03-01, 2025-08-05); endocrine summary CRP 0.43 (03/15/2021); urology/nephrology summary ESR 2 mm/h (09/2022)
- **Residual uncertainty:** Pack/ledger files absent from this tree; original instrument printouts not in-repo; additional draws may exist off-record

### COR-0024 — CLM-0037 missing specialty LDT contested / not-FDA-cleared label

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0037 notes (pattern from CLM-0036 / COR-0007)
- **Incorrect or unsafe form:** Empty notes on a specialty immunoblot / LDT-positive Bartonella claim
- **Corrected form:** Notes carry “Specialty LDTs not FDA-cleared per summary. COR-0007. COR-0024.” paired with negative-channel hedge (COR-0025)
- **Evidence:** Infectious-disease summary LDT framing; public language guide §4.4; sibling CLM-0036 notes
- **Residual uncertainty:** Clinical meaning of discordant LDTs remains open for clinicians

### COR-0025 — CLM-0037 / CLM-0038 missing negative ≠ impossible hedge

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0037 notes; CLM-0038 notes
- **Incorrect or unsafe form:** Empty notes allowing bare “negative” to read as full exclusion
- **Corrected form:** CLM-0037: “Negative blood PCR/FISH does not exclude all tissue-limited disease; also does not confirm specialty IgM.” CLM-0038: “Negative multi-method Lyme/Borrelia testing does not exclude all disease.”
- **Evidence:** Public language guide §4.3; existing site two-channel hedge at `site/src/lib/data.ts` specialty channel notes
- **Residual uncertainty:** Tissue-limited or later disease cannot be excluded from blood-only pathways alone

### COR-0026 — CLM-0039 collapsed treatment-response domains

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0039; CLM-0043 (same durability descriptor, reader-facing on the case page)
- **Incorrect or unsafe form:** “best systemic symptomatic improvement” without named domains; and the durability qualifier “non-durable after courses ended” (CLM-0039) / “non-durable antimicrobial response” (CLM-0043), which no available source supports
- **Corrected form:** “Patient-reported joint pain, night sweats, nightmares, and REM sleep (~15 → ~90 min/night) improved during two courses of atovaquone + clindamycin (± azithromycin); the specialty summaries describe each course as producing sustained (≥6 month) improvement, with joint-pain relapse after the first course and the second (6-week, + azithromycin) course described as larger and more durable. Durability beyond the second course is not documented in the available summaries. This does not by itself prove Babesia, Bartonella, or other infection.”
- **Evidence:** Infectious-disease summary — “Two courses of anti-parasitic/antibacterial therapy each produced **sustained (≥6 month) improvement** in joint pain, night sweats, nightmares and REM sleep”, and timeline “Early 2024 Joint pain relapsed. Re-treated 6 weeks … → **large, more durable improvement**”; thiamine summary “REM sleep 15 → 90 min” and “larger, more durable improvement”; medical-psychological history narrative (“REM sleep increased from 15min to 1hr 30min per night”)
- **Residual uncertainty:** Patient-reported; anti-inflammatory effects possible; not microbiologic confirmation (DEC-0014). No source documents symptom status after the second course, so persistence beyond it is unknown
- **Amendment note:** The domain fix and the durability fix were applied in the same unreleased working-tree pass; this entry was completed before v0.2.0 was committed or published, so no published register text was rewritten (append-only applies to shipped entries)

### COR-0027 — CLM-0031 typed as observed_fact without genotype instrument

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0031; `differentials/current_ranking.md` Confirmed/objective examples line
- **Incorrect or unsafe form:** `kind: observed_fact` and ranking language “HαT genotype” under confirmed/objective examples
- **Corrected form:** `kind: reported_history`; notes that narrative HαT-positive report only — TPSAB1 appears zero times in patient source files; UQ-0014 tracks missing genotype; ranking moves HαT to reported / not genotype-confirmed
- **Evidence:** Thiamine/pack narrative HαT-positive strings; repo-wide TPSAB1 search = 0 hits in patient sources
- **Residual uncertainty:** A held-but-unpublished TPSAB1 CNV report may exist; public pack has none

### COR-0028 — Same-scanner L3–L4 DXA series missing from claim inventory

- **Date identified:** 2026-08-06
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** new CLM-0077; UQ-0009 `related_claims`
- **Incorrect or unsafe form:** L3–L4 serial BMD/T/LSC values present in bone summary but absent from public claim inventory
- **Corrected form:** CLM-0077: “Same-scanner lumbar L3–L4 BMD 0.633 g/cm² (T−4.5) on 2025-06-16 to 0.640 g/cm² (T−4.4) on 2026-06-19 at Site 1; compiled summary states LSC=0.022 g/cm² and the +0.007 change is within noise (not significant) — no detectable change over this interval within LSC.” UQ-0009 links `[CLM-0006, CLM-0077]`
- **Evidence:** `evidence/sources/Drift0r_BoneDensity_Summary.pdf` / extracted bone density summary L3–L4 table + LSC footnote
- **Residual uncertainty:** Facility precision study not in-repo (UQ-0009); do not restate as demonstrated biological stability or improvement

### COR-0029 — Bare “is rejected” passed public-language gate

- **Date identified:** 2026-08-06
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `site/src/lib/language.ts`; public rendering of CLM-0033, CLM-0051
- **Incorrect or unsafe form:** Transform matched only `hard reject(ed)`; plain “is rejected” reached public text
- **Corrected form:** Added `/\bis rejected\b/gi` → “is not supported by the presently available record”; does **not** rewrite lone confidence token `rejected`
- **Evidence:** Public language guide preferred replacement for hard reject; inventory statements using “is rejected”
- **Residual uncertainty:** Internal ranking cells that use confidence vocabulary (`rejected as driver`) intentionally unchanged

### COR-0030 — Unsourced “high VUS rate” / “VUS common” frequency claims removed

- **Date identified:** 2026-08-06
- **Status:** `applied_to_public_draft`
- **Severity:** launch_blocker (evidence basis honesty)
- **Affected claims / paths:** lit-0294 Collet card; H2.yaml; CQ-004.yaml; `03_public_language_guide.md` gene-panel row; supersedes **COR-0009’s VUS-frequency clause only** (yield language retained)
- **Incorrect or unsafe form:** “high VUS rate” / “VUS common; needs expert molecular bone interpretation” / guide prescription of high VUS rate, with COR-0009 evidence cited as Round-1 synthesis
- **Corrected form:** Delete unsourced frequency. Collet card states single-patient VUS only (no rate/denominator). H2/CQ-004 keep counter-consideration that VUS may complicate interpretation without claiming high rates. Guide no longer prescribes “high VUS rate.” Modest pathogenic yield numerators/denominators retained (COR-0010 / COR-0018 lineage).
- **Evidence:** Collet et al. full text (`lit-0294`): VUS mentioned twice, both about one patient (COL1A2 p.(Pro471Leu)); no cohort VUS rate. COR-0009 Evidence was “Round-1 synthesis” — AI swarm output. `governance/AI_METHODS.md` prohibits inventing citations and upgrading evidence status from multi-model agreement alone. No acceptable substitute VUS-rate source found.
- **Residual uncertainty:** A future sourced cohort VUS rate could be cited with N/D; none is published here. **Supersession:** this entry supersedes COR-0009’s VUS-frequency clause only; COR-0009 itself is not rewritten (append-only register).

### COR-0031 — Printed clinician packet rendered bare literature IDs

- **Date identified:** 2026-08-06
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `site/src/pages/questions-for-clinicians/packet.astro`
- **Incorrect or unsafe form:** `lit: lit-0012, lit-0297` style bare ID join with no title or applicability
- **Corrected form:** Per-ref lines via `getLitById`: `id: title (year)` plus `quality_notes` when literature applicability is approved for site mode
- **Evidence:** Packet print surface inspection; catalog title/year fields
- **Residual uncertainty:** Unknown lit IDs still fall back to bare id; applicability notes gated by release scope in publication mode

### COR-0032 — lit-0206 miscategorized as support on H5

- **Date identified:** 2026-08-06
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** H5.yaml `supporting_literature_ids` / `contradicting_literature_ids`; `literature/entries/2022-lawrence-sad-pearls-pitfalls.md` and `literature/catalog.yaml` polarity fields for lit-0206
- **Incorrect or unsafe form:** lit-0206 (Lawrence & Borish 2022) listed as supporting H5 (possible SAD)
- **Corrected form:** lit-0206 moved to `contradicting_literature_ids`; summary notes diagnostic-pitfalls reclassification; support remains lit-0205 / lit-0089 / lit-0096
- **Evidence:** PubMed abstract PMID 35671934 — cautions include: document actual pyogenic infections before immune-deficiency diagnosis; wide variability of pneumococcal vaccine response in healthy individuals; laboratory variability in reporting; do not hinge diagnosis solely on strict cutoffs for “normal” polysaccharide response without global clinical assessment. Local full text / overnight `paper-text/lit-0206.txt` absent (abstract-only)
- **Residual uncertainty:** Full-text nuances beyond abstract not verified in-repo (`access: abstract-only`, no local PDF). Card and catalog polarity for lit-0206 are now `supports: []` / `contradicts: [H-SAD]`, consistent with H5; note that “contradicts” here means the paper cautions against over-calling SAD, not that it disputes the entity’s existence

### COR-0033 — Mast-cell ruled-out entry published as a clean negative

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** must_fix_before_launch
- **Affected claims / paths:** `evidence/ruled_out.yaml` mast-cell entry (rendered on `/`); CLM-0030, CLM-0031, CLM-0032, CLM-0065
- **Incorrect or unsafe form:** "KIT negative; urine mediators normal; no classic activation pattern." with `still_open` limited to the deferred marrow biopsy
- **Corrected form:** Entry states the result is mixed and not a clean negative — tryptase above the reference range on both documented draws, attributed by the record to patient-reported hereditary alpha-tryptasemia, with KIT negative and urine mediators normal; `still_open` names the undocumented KIT specimen/method/limit of detection and that incomplete systemic-mastocytosis exclusion is on the project's own don't-miss list
- **Evidence:** CLM-0030 (tryptase elevated on 2025-10-01 and the 2026-06 panel, ref <11); CLM-0031 (HαT reported positive, `kind: reported_history`); CLM-0032 (KIT negative, assay specimen/method/LOD not documented); CLM-0065 (`Don't-miss research priority: incomplete SM exclusion given unknown KIT method`, P0)
- **Residual uncertainty:** Whether the elevated tryptase is fully explained by HαT is itself an open clinical question the record cannot settle; the entry does not assert it is.

### COR-0034 — Autoimmune ruled-out entry dropped its documented denominator and as-of boundary

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `evidence/ruled_out.yaml` autoimmune entry; CLM-0044
- **Incorrect or unsafe form:** "Completely negative. Inflammatory markers have been normal on every draw." dated `2021 – 2026`
- **Corrected form:** "Unrevealing on every panel run. Inflammatory markers were normal on the three documented CRP draws and the three documented ESR draws," with `still_open` recording that no CRP or ESR value after 2025-08-05 appears in the summaries
- **Evidence:** CLM-0044 — three documented CRP draws, three documented ESR draws, none after 2025-08-05; "broad seronegative CTD workup … unrevealing on available panels"
- **Residual uncertainty:** The inflammatory picture is not current; a later draw could change it.

### COR-0035 — Mold/CIRS patient-reported result presented as objective

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `evidence/ruled_out.yaml` mold entry; CLM-0052
- **Incorrect or unsafe form:** "Negative."
- **Corrected form:** "Reported by the patient as negative, with no clear symptom change after the mold was removed from the home. The underlying lab reports are not in the public record."
- **Evidence:** CLM-0052 `kind: hypothesis` — "patient reports mold toxicity/allergy labs negative and household mold removal without clear symptom change"
- **Residual uncertainty:** No lab report is in the record to check the reported result against.

### COR-0036 — Psychiatric ruled-out entry asserted the question closed

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** must_fix_before_launch
- **Affected claims / paths:** `evidence/ruled_out.yaml` psychiatric entry; CLM-0046, CLM-0047, CLM-0048
- **Incorrect or unsafe form:** "Multiple psychiatric and psychological evaluations" listed under `tested` with `still_open: null`, which by the file's own rule asserts the question is closed on the present record
- **Corrected form:** `still_open` records that the evaluation history other than the MMPI-2-RF is patient-reported, that what the record supports is reversal of that specific label rather than a finding that no psychiatric factor plays any part, and that treating the medical findings as primary is this project's research position rather than a clinical adjudication
- **Evidence:** CLM-0046 `kind: reported_history`, scoped to "SSD reversal + secondary anxiety framing — not 'all psych absent'"; CLM-0048 "this is a research-team hypothesis, not a clinical adjudication"
- **Residual uncertainty:** None beyond what the entry now states.

### COR-0037 — Reported history rendered as documented fact on the landing page

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `site/src/pages/index.astro` CASE_IN_BRIEF and its section note; `evidence/ruled_out.yaml` COVID entry; CLM-0045, CLM-0051
- **Incorrect or unsafe form:** "joint pain that moves around and comes without swelling or heat, and **documented** lower-spine defects"; "Symptoms trace back to roughly 2017"; register: "**Documented onset** is around 2017"; section note: "Every point below traces to a documented record."
- **Corrected form:** "he reports joint pain … and **imaging documents** lower-spine defects"; "He reports symptoms going back to roughly 2017"; register: "Onset is **reported** as around 2017", with `still_open` naming the patient-compiled timeline; section note now says where something is the patient's own account it says so
- **Evidence:** CLM-0045 `kind: reported_history`; CLM-0051 `kind: hypothesis`, sourced to `timeline.yaml` "onset ~2017" as a patient-compiled summary; contrast CLM-0013 `kind: observed_fact`
- **Residual uncertainty:** None — the onset year itself is unchanged, only its epistemic status.

### COR-0038 — Hypothesis plain titles overstated their claim rows

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** `differentials/hypotheses/H2.yaml`, `H3.yaml`, `H4.yaml` `plain_title` / `plain_summary` (rendered first on the landing theory cards); CLM-0011, CLM-0050, CLM-0043
- **Incorrect or unsafe form:** H3 "Calcium handling never properly measured, and **bone tests never run**"; H2 "An inherited bone condition present from birth"; H4 "A lingering bacterial infection"
- **Corrected form:** H3 "…and the bone-building markers are missing", summary restated to "do not appear anywhere in the test record, though that is not proof they were never drawn"; H2 and H4 made interrogative
- **Evidence:** CLM-0011 covers bone *formation* markers only and its own note reads "Absence of documentation is not proof never drawn outside public pack" — DXA (CLM-0003), CTX (CLM-0010) and serial 24h urine calcium (CLM-0015) are documented bone workup; CLM-0050 `not_verified`, "best single-primary research alternative"; CLM-0043 `contested`, "low–medium residual contributor hypothesis … without commercial confirmation"
- **Residual uncertainty:** None.

### COR-0039 — Ruled-out register bypassed the publication gate and the site's source-trail promise

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** must_fix_before_launch
- **Affected claims / paths:** `evidence/ruled_out.yaml`; `site/src/lib/data.ts` `RuledOutEntry` / `getRuledOut`; `site/src/pages/index.astro`; `governance/public_allowlist.yaml`; `site/src/pages/methods.astro`
- **Incorrect or unsafe form:** Register entries carried no claim ids, approval field, or verification status; `getRuledOut()` returned every row regardless of site mode, so approving `/` as a hardcoded route implicitly published whatever the file contained. `/methods/` simultaneously told visitors "Every statement on this site is a typed record with a source trail and a verification status" and "Nothing is written as free prose". The file was absent from the public allowlist, so a sanitized export would omit a required homepage build input.
- **Corrected form:** `claim_ids` required on every entry and rendered as a visible source trail; publication mode drops any entry whose claims are not all approved; four new claim rows (CLM-0078…CLM-0081) added for entries previously sourced only from the private tests ledger; `evidence/ruled_out.yaml` added to `v1_public_repository` and `medical_page_body_sources` (allowlist 1.10.0); methods copy narrowed to material statements and now states that plain-language summaries are hand-written but name the claim rows they rest on; `site/tests/ruled-out-register.test.mjs` locks the contract
- **Evidence:** Codex findings 1, 7 and 9; Grok finding 5 (paired pre-publication review, 2026-08-07); DEC-0038
- **Residual uncertainty:** The four new claim rows are sourced from a gitignored private ledger, so a public reader cannot independently check them — the same limitation that already applies to the source PDFs.

### COR-0040 — Public documents asserted indexing was disabled while the site shipped indexable

- **Date identified:** 2026-08-07
- **Status:** `applied_to_public_draft`
- **Severity:** must_fix_before_launch
- **Affected claims / paths:** `governance/PRIVACY_AND_CONSENT.md` item 6 and checklist framing; `governance/LEGAL_BASELINE.md`; `governance/PUBLICATION_POLICY.md`; `docs/public/FIRST_72_HOURS_ISSUE_MONITORING.md`; `docs/public/LAUNCH_FAQ.md`; `README.md`; `audits/2026-08-publication-readiness/DECISIONS.md`
- **Incorrect or unsafe form:** "noindex research preview", "indexing remains disabled", "Indexing disabled (`noindex`) until a separate owner decision", and a launch checklist item instructing the operator to confirm the site still shows noindex — all while `release.yaml:noindex` was `false` and the robots meta rendered `index, follow`. No decision authorized the flip: DEC-0023 deferred it and DEC-0027 recorded enabling indexing at launch as rejected.
- **Corrected form:** DEC-0037 records the owner's decision to ship indexable, with DEC-0023 and DEC-0027 marked superseded; the six public documents restated to say indexing is enabled; the monitoring checklist now asks the operator to confirm the robots meta matches `release.yaml:noindex`
- **Evidence:** Codex finding 8 and Grok finding 1 (paired pre-publication review, 2026-08-07); `site/src/lib/indexing.ts` `STUCK_NOINDEX_BODY_PATTERNS` already classifies "indexing remains disabled" as a false-polarity defect
- **Residual uncertainty:** DEC-0023 framed removal of `noindex` as requiring Drift0r's decision on search indexing separately from the general publication grant. DEC-0037 records the owner's reading that the broad grant covers it as **owner editorial judgment, not a documented patient statement about indexing**. This remains open until Drift0r is asked about indexing specifically.

### COR-0041 — Two hormone results were grouped as if one reference-interval artefact explained both

- **Date identified:** 2026-08-10
- **Status:** `logged_in_inventory`
- **Severity:** should_fix_before_launch
- **Affected claims / paths:** CLM-0095; internal endocrine extract feeding it
- **Incorrect or unsafe form:** The luteinising hormone value of 9.8 mIU/mL and the prolactin value of 15.9 ng/mL from 2021-03-15 were described together as high only against one platform's reference interval, which implied that reading either on the other interval would return it to normal
- **Corrected form:** CLM-0095 separates them. Prolactin is genuinely platform-relative — 15.9 is above the 4.0–15.2 interval on one platform and inside the other. Luteinising hormone is not: 9.8 exceeds **both** printed intervals (1.7–8.6 and 1.5–9.3), so its raised status does not depend on which ruler is applied
- **Evidence:** Arithmetic on the two intervals printed in the same compiled document — 9.8 > 9.3. Found by re-deriving the values rather than reading the summary of them (2026-08-09 overnight audit, F-025)
- **Residual uncertainty:** Which laboratory issued the 1.5–9.3 interval is not established in this repository, so CLM-0095 describes it as the interval used on the other draws rather than naming it. This is a reference-interval question, not a clinical one; whether either value is clinically meaningful is unaddressed here.

### COR-0042 — Published pages described the case as having no stone history when the record documents one stone

- **Date identified:** 2026-08-10
- **Status:** `applied_to_public_draft`
- **Severity:** must_fix_before_launch
- **Affected claims / paths:** `differentials/hypotheses/H3.yaml` `summary` (rendered on `/working-model/` and `/working-model/evidence-table/`); `literature/entries/2006-urine-calcium-predicts-bone-loss-ih.md` and `2008-pathogenesis-idiopathic-hypercalciuria.md` and `2014-aua-kidney-stone-metabolic.md`; the mirrored `applicability` and `quality_notes` fields in `literature/catalog.yaml` (lit-0152, lit-0153, lit-0226); `differentials/clinician_questions/CQ-003.yaml` rationale (rendered on `/questions-for-clinicians/` and its packet)
- **Incorrect or unsafe form:** "no stones on CT urogram 2026-02-27" stated as the case's stone status; "this record is not primarily a stone-former narrative"; "extrapolation to a **non-stone-former** with low BMD". Together these told visitors the case had no stone history and used that to discount stone-former literature
- **Corrected form:** Every location now states that the record documents **one lifetime stone**, passed spontaneously, alongside the negative 2026-02-27 CT urogram, and reads the two together as a stone-forming history at its mildest end rather than an absence of one. The applicability conclusion changes from "does not apply" to "applies weakly"
- **Evidence:** The urology/nephrology summary states the stone history in three separate places — the overview ("The clinical stone burden is minimal (one lifetime stone)"), the cystinuria note ("has formed only one stone in his lifetime: a single small stone in his late twenties … It passed spontaneously. No stones before or since"), and the trends summary ("One lifetime stone, under extreme dehydration/diet conditions"). The CT urogram of 2026-02-27 reports "No calculi" bilaterally with an impression of "No urolithiasis" — that is the absence of a **current** stone, which is a different fact
- **Residual uncertainty:** The stone was never analysed, so its composition is unknown and no inference about stone type is available. Whether a single provoked stone should shift how the stone-former literature is weighted is a judgement for a clinician; the pages now present both facts and the weak-applicability reading rather than asserting a conclusion. See the acquisition asks for stone composition.
