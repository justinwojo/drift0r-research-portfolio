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
