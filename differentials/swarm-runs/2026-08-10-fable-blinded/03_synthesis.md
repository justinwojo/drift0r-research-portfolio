# Round-2 synthesis — Fable solo blinded round (2026-08-10)

**Status:** Fourth-model review. One model family (Claude Fable 5, Anthropic), run solo after
Anthropic relaxed the gates that had previously kept this model out of the repository.
**Not medical advice.** Educational research only — see [`LEGAL.md`](../../../LEGAL.md).
Clinician review has not been performed. Nothing here recommends that any reader take, start,
stop or adjust anything.

| Field | Value |
|-------|-------|
| **Design** | Blinded independent re-derivation → adversarial cross-examination → chair synthesis with source-document re-verification |
| **Stage 1 (blinded)** | Fresh agent; inputs were the nine compiled-summary PDFs + the public video transcript **only** — no repository access, no web, no tests ledger, no literature corpus, no prior conclusions |
| **Stage 2 (adversarial)** | A different fresh agent attacked the blinded output **and** the published ranking with equal aggression, refutation-first, default verdict "not adequately supported" |
| **Stage 3 (chair)** | Every load-bearing finding re-verified against the source documents before entering this file |
| **Private artifacts** | `private/research-runs/2026-08-10-fable-blinded/` (not part of the public export, per the same policy as Round 1's per-model files) |

**Why blinded, and what that buys.** Round 1 got independence from three model families. With
one family, independence was engineered instead: the deriving agent never saw the portfolio's
hypotheses, ranking, claim inventory, or literature cards, and worked purely from the evidence
pack plus its own medical knowledge. Where its independent derivation lands on the published
position, that is a genuine re-derivation, not an echo. Where it diverges, the adversarial
stage adjudicated from the compiled source documents (not primary records — see the standing
primary-record limit).

**Hard limit.** A single-model round cannot detect blind spots shared across the Claude family,
and blinding does not change the shared-inputs caveat: this round read the same compiled
summaries — an interpretive layer — as every prior round. Single-model agreement is worth less
than cross-family agreement, and neither is clinical validation.

---

## 1. Where the blinded derivation independently landed on the published position

These are published positions that a blinded re-derivation reproduced without sight of them —
the strongest kind of support a solo round can provide, with the caveat above.

| Published position | Blinded round outcome |
|---|---|
| Multi-process architecture over any single unifier (H1/H-NULL) | Independently derived a ~three-process architecture (endocrine-metabolic bone disease; immune-trait cluster; pain/sensory syndrome); every candidate single unifier fails a decisive test |
| Tick-borne infection **low**; specialty-LDT vs confirmed channels must not be conflated | Independently graded **low** on the same grounds (confirmatory-tier negatives, IgM-only fading serology), and added a new negative argument — see §3.4 |
| Indolent systemic mastocytosis as a don't-miss; high-sensitivity blood KIT D816V before any marrow decision | Independently ranked the same test for the same reason (highest-consequence unexcluded bone diagnosis) |
| Small-fiber/autonomic layer real but untested; IENFD/QST/QSART needed | Independently ranked skin-biopsy IENFD as the single most information-valuable next test |
| Calcium-flux module: urinary calcium findings real, mechanism unclassified, sodium-confounded, controlled phenotyping needed (H3) | The blinded stage initially over-called a resorptive mechanism; the adversarial stage **refuted that from the primary numbers** and restored exactly the published H3 position — an independent stress-test that H3's refusal to classify is correct |
| Primary psychiatric explanation not supported | Independently **rejected** as primary: five evaluations, a valid MMPI-2-RF without somatic over-reporting, and objective findings no psychiatric mechanism produces |
| Copper/ceruloplasmin missing from the record; vaccine-challenge titers needed before any specific-antibody-deficiency label | Independently flagged both, for the same reasons |
| Cross-scanner DXA numbers must not be trended (site policy since Checkpoint G) | Independently identified the "rapidly improving bone / +1 inch height" narrative as unsupported: the same-scanner spine pair is flat (+1.1%, within LSC) and the same-scanner total hip shows a significant 12-month loss |

## 2. Where the two documents disagreed, and how the adversarial stage adjudicated

Adjudications are from the compiled source documents; "neither" means neither position is adequately
supported as graded. Confidence vocabulary: high | medium | low | speculative | rejected.

1. **Bone etiology.** Blinded round: composite acquired disease — lifelong partial central
   hypogonadism (pubertal stigmata: absent beard until the 30s, teenage gynecomastia) plus
   hypercalciuria — graded **high**. Published: monogenic/constitutional early-onset
   osteoporosis as best single-primary, **medium** (H2). Adjudication: **neither grade is
   adequately supported.** The blinded grade falls to medium because the documented 2025→2026
   same-scanner hip loss occurred while on-therapy draws showed a treated, biochemically
   normal axis, and because its hypercalciuria mechanism fell (below). H2's medium is generous
   against a modest related-cohort panel yield (lit-0340; the card carries no numeric figure
   onto public surfaces), a decades-long high-impact trauma history without
   peripheral fracture (a counterpoint absent from H2's own contradicting list), and two
   acquired insults — the documented hypogonadal era and the newly wired, patient-reported
   aromatase-inhibitor exposure (§3.1). The *direction* "acquired, multi-hit, endocrine-metabolic" fits the
   documented history at least as well as a monogenic primary; the panel (ranking test #4)
   remains the discriminator.
2. **Hypercalciuria mechanism.** Blinded: resorptive (bone-derived). Published H3: mechanism
   unclassified pending fasting/load study. **Published position wins decisively:** low-normal
   PTH does not discriminate resorptive from absorptive; urine sodium rose in lockstep with
   calcium across collections; the middle collection is within its own lab's reference; CTX is
   within its reference interval.
3. **Pain-syndrome framing.** Blinded: nociplastic/central-sensitization as principal driver
   (medium), SFN substrate untested. Published H-SFN: medium *as contributor*, no causal
   label. **Published framing stands** — with IENFD/QST/QSART absent, "principal" claims are
   premature in either direction; both formulations order the same test. The blinded round's
   explicit separation of sensitization from the rejected psychiatric attribution is retained
   as useful register: they are different claims, and the record supports rejecting the
   latter while leaving the former open.
4. **HaT as symptom driver.** Blinded: low–medium. Published satellite: **rejected as
   driver**. Adjudication: **neither** — the genotype itself is narrative-only in the public
   pack (CLM-0031/UQ-0014), and the trait-association literature is contested in both
   directions. The defensible bucket for "driver" is **speculative**; "rejected" asserts an
   exclusion the record cannot demonstrate, and low–medium asserts support it does not have.
   Recorded here as a wording challenge to the satellite table, pending owner adjudication.
5. **Pars defect.** Blinded: insufficiency fracture through osteoporotic pars (consequence of
   bone disease). Published: open question whether it meets a fragility-fracture definition.
   **Published position stands** — the corpus's own natural-history literature places most
   bilateral L5 defects in adolescence, and the youth loading-sport history fits; the
   atraumatic-at-30 dating is self-report.
6. **H1 vs H-NULL.** The adversarial stage pressed a structural point: two adjacent
   medium-confidence meta-claims that no listed test discriminates ("interacting layers" vs
   "independent coexistence") make the top of the ranking hard to falsify. The blinded
   round's three-process formulation is more specific and therefore more attackable — but has
   the same underlying problem. Recorded as an open methods question for the next full round:
   name an observation that would separate H1 from H-NULL, or merge them.

## 3. New findings entering the record from this round

1. **Two years of aromatase-inhibitor exposure, with a documented estradiol floor — previously
   unwired into any bone hypothesis (CLM-0112, UQ-0020).** The video states anastrozole was
   taken for about two years to lower a clomiphene-induced estradiol rise (the auto-transcript
   renders the drug name as "an astrol", which is likely why text searches never surfaced it);
   the endocrine summary documents the regimen (clomiphene 25 mg daily + anastrozole 1 mg
   weekly, 2021 titration period) and a sensitive LC/MS/MS estradiol of 9.3 pg/mL
   (ref 8.0–35.0) on 2021-03-15 while on it. Estradiol is the dominant sex-steroid determinant
   of bone mass in men; the corpus has carried the directly relevant cards since Round 1
   (lit-0308 Leder 2005; lit-0134 Burnett-Bowie 2009 — both topic-tagged
   `historical-aromatase-inhibitor-use`) without any hypothesis citing them. The 2021
   "endocrine crash" was also a combined SERM+AI cold-turkey cessation, not a pure clomiphene
   event. Consequences: strengthens the acquired/secondary-cause counters filed against H2;
   qualifies every "years of corrected axis" framing (the corrected record is a testosterone
   record; the estradiol record includes an on-AI floor value and is method-split across
   assays); and gives the Round-1 acquisition ask ("primary estradiol values, assay method,
   timing vs clomiphene/anastrozole") a concrete reason to be prioritized.
2. **COR-0043 — the public ranking's §5 "Confirmed/objective" row carried two items that are
   not.** "Historical T~34" is a clinical-note value, not a discrete lab report (the endocrine
   summary's own methodology note says so; ledger T115 already tracked retrieval as
   incomplete), and "thiamine 7 nmol/L with response" packaged a single borderline value with
   an unblinded self-reported response. Corrected in place; register entry in
   `audits/2026-08-publication-readiness/CORRECTIONS.md`.
3. **COR-0044 — the tests ledger miscoded the one retest it says the infection question
   needs.** T113/S008 record "post-antibiotic Babesia FISH: not documented / never clearly
   retested", but T047's second FISH positive (2024-02) postdates the mid-2023 antibiotic
   course. That positive forks either way against the infection hypothesis: credit it and the
   celebrated first treatment response coexisted with persistent parasitemia on the definitive
   regimen; discount it and the organism evidence reduces to a single non-confirmed LDT
   result. Neither Round 1 nor the blinded stage stated this fork; the adversarial stage did.
4. **A new negative argument for the Babesia satellite:** three-plus years of normal CBCs and
   platelets, with LDH never documented high (low 2025, then normal 2026; T099), is the
   absence of the hematologic footprint chronic untreated babesiosis would be expected to
   leave. Round 1's rejects table noted the absent footprint; this round formulates it as the
   strongest single negative datum and it now appears in the ranking's satellite note.
5. **Don't-miss candidates proposed for clinician-question triage** (not added to the official
   don't-miss list this round; recorded for adjudication): Tropheryma whipplei testing
   (chronic migratory seronegative arthralgia with transient antibiotic response is the
   classic pre-GI phase; uniquely treatable); plasma/erythrocyte porphyrins for the new-onset
   1–2-minute photosensitivity; quantitative sulfur amino acids (borderline homocysteine
   twice, urine methionine/homocystine at upper reference limits, tall thin habitus with
   severe spinal osteoporosis); naming idiopathic osteoporosis of the young male — the residual
   clinical label under which treatment cohorts such as Kurland 2000 (lit-0008) were
   enrolled — as the bucket this phenotype enters when secondary workup stays negative,
   which is also what makes the missing P1NP/BSAP measurement (ranking test #1)
   the highest-value next datum; characterizing the unexplained 2–3 L urine volumes against a
   blood picture the labs themselves flagged as possibly volume-contracted; and identifying
   the childhood pseudotumor-cerebri "diuretic" (if acetazolamide: a carbonic-anhydrase
   inhibitor during peak bone-accrual years) plus the vitamin-A-axis question childhood IIH
   invites.

## 4. What this round did not change

Hypothesis buckets and the ranked order are **unchanged** this round. The challenges recorded
above (H2's medium, the HaT satellite's "rejected as driver" wording, the H1/H-NULL
discrimination gap) are preserved the way Round 1's minority reports were preserved — as
standing objections with named evidence, pending either new data or the next full multi-model
round. The corrections (COR-0043, COR-0044) fix provenance labeling and ledger bookkeeping,
not analysis content.

## 5. Scorecard of the round itself

The blinded stage proved a stronger auditor than diagnostician: its two decisive wins are
provenance findings (the T~34 register error; the cross-scanner improvement narrative), and
its two decisive losses are mechanism over-calls the adversarial stage reversed from the
primary numbers (resorptive hypercalciuria; the high-confidence composite). The published
portfolio's epistemic scaffolding — mechanism refusals, organism splits, challenge-before-
label discipline — survived attack better than any specific hypothesis did. The most
consequential product of the round is a datum neither side produced and both sides missed
until forced: the aromatase-inhibitor years (§3.1).
