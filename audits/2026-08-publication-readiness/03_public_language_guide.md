# Public language guide — M1

> **Research only; not medical advice.**  
> Transforms internal research language into safer public wording without inventing facts.  
> Applies to home, case, working-model, clinician, and literature launch pages (when built).

| Field | Value |
|-------|-------|
| Run | `2026-08-publication-readiness` |
| Date | 2026-08-05 |
| Base commit | `6c6a49d2d258524c1a8d9c80d4b159dfa914ea2c` |

---

## 1. Mandatory disclaimer (every medical page)

Use wording equivalent to:

> AI-assisted research summary for educational purposes only. This site does not provide medical advice, diagnosis, or treatment. Records and interpretations may be incomplete or incorrect. A licensed clinician must verify the underlying records, interpret all findings, and decide whether any testing or treatment is appropriate. Do not start, stop, or change treatment based on this site.

Print/PDF and social previews must retain a research-only label.

---

## 2. Preferred replacements (ROADMAP table + extensions)

| Internal research language | Public language direction | Notes |
|----------------------------|---------------------------|-------|
| almost certainly | current working model favors / research consensus leans | Never imply clinical certainty |
| hard reject / dies | not supported by the presently available record | Keep door open if evidence changes |
| catastrophic osteoporosis | markedly low BMD; quote T/Z with sources; use clinician-recorded terminology if available | COR-0002, COR-0003 |
| dangerous if missed | clinician review priority / don’t-miss research priority | Not alarmist diagnosis |
| top diagnostic tests | questions to discuss with licensed clinicians | Never consumer orders |
| confirmed infection | use **only** when independently established by an appropriate method | Specialty LDT ≠ confirmation |
| IGeneX-positive Babesia/Bartonella | specialty-lab contested signals (name method) with commercial/PCR status | Dual badge required |
| KIT neg rules out SM | KIT reported negative; method/LOD unknown — incomplete exclusion | COR-0005 |
| osteoporosis (unqualified, male <50) | markedly low BMD for age; report Z-scores; WHO T-score thresholds only if labeled scanner/summary language | ISCD-aligned caution |
| fragility fracture (pars) | imaging-documented pars defects/fractures; formal fragility-fracture criterion **not adjudicated in public pack** | UQ-0006 |
| dry beriberi confirmed | documented thiamine deficiency with neuropathy phenotype; dry-beriberi used as interpretive label unless clinician diagnosis recovered | COR-0012 |
| gene panel high yield | modest pathogenic yield in related cohorts (~single-digit to low-teens %); high VUS rate | COR-0009 |
| multi-model agreement proves X | multi-model research agreement is **not** clinical validation | Evidence rule §3.1.5 |
| treatment response proves cause | patient-reported or observed improvement; does **not** establish etiology | DEC-0014 |
| always / never (medical) | on the available record / not supported in the available record | Prefer bounded claims |
| UTSW finds no category | omit until primary note sourced; else “patient-reported institutional evaluation without a unifying label (unverified in-repo)” | UQ-0015 |

---

## 3. Evidence-type vocabulary (use consistently)

| Label | Public badge text | Use when |
|-------|-------------------|----------|
| `observed_fact` | Documented finding | Value/date appears in pack or specialty summary |
| `reported_history` | Patient-reported / history | Narrative without instrument report |
| `interpretation` | Interpretation | Summary- or research-applied meaning |
| `hypothesis` | Working hypothesis | Causal or ranking claims |
| `research_question` | Question for clinicians | Tests, next steps, don’t-miss items |

### Verification badges

| Status | Public text |
|--------|-------------|
| `verified` | Verified against primary instrument record *(rarely available in-repo)* |
| `partially_verified` | Matches public specialty summary / pack transcription |
| `contested` | Discordant sources or specialty vs commercial conflict |
| `not_verified` | Not checked against a closer primary |
| `unsupported` | No adequate source |

---

## 4. Domain-specific rules

### 4.1 Bone / DXA

1. Lead with **Z-scores** for age <50 when available; T-scores secondary with “scanner-reported” framing.
2. Always specify **scanner site** for serial comparisons.
3. For hip −4.2%: include absolute BMD, LSC from summary, and attribution.
4. Never imply Site 2 absolute BMD improved Site 1 density.
5. Do not say “osteoporosis diagnosed” without source attribution to summary WHO language or clinician note.

### 4.2 Causality

1. Prefer “associated with,” “consistent with,” “may contribute,” “not explained by X alone.”
2. Stack architecture language: multiple coexisting axes, not one villain.
3. Infection limb is **detachable / optional** pending adjudication.

### 4.3 Negative tests

1. State method, timing, specimen when known.
2. “Negative” ≠ “impossible.”
3. Example: “Bartonella PCR/FISH negative on whole blood; does not exclude all tissue-limited disease.”

### 4.4 Specialty LDTs

Required paired presentation:

```text
Specialty LDT: [result] · contested / not FDA-cleared (as stated in summary)
Independent/commercial: [result]
```

Never collapse to a single “positive for X.”

### 4.5 Treatment responses

Template:

> Patient-reported [symptom domains] improved during [intervention]; effect was [durable/non-durable]. This does not by itself prove [disease].

No dosing, protocols, or “start this drug” language.

### 4.6 AI consensus

Footer on working-model pages:

> Rankings reflect multi-model research synthesis (Round 1, 2026-08-05), not a clinical diagnosis. Models can be wrong and can agree on errors.

---

## 5. Probability language

Allowed public buckets only: **high | medium | low | speculative | not supported**.

For stacks, show **two** chips:

- Architecture: high  
- Module identity: medium  

Never invent numeric percentages (“73%”).

---

## 6. Clinician page tone

| Do | Don’t |
|----|-------|
| “Questions to discuss” | “Order these tests” |
| “Don’t-miss review priorities” | “Dangerous if you miss” as accusation |
| Specialty vs confirmed table | Merged infection positives |
| Source trail links | Orphan claims |
| Print-safe disclaimer | Disclaimer-only safety |

---

## 7. Words to avoid on medical pages

- cure, proven cause, definitely, undeniable  
- boss fight, achievement unlocked (defer gaming metaphors off medical pages for v1)  
- you should start / stop / switch medication  
- confirmed Bartonella/Babesia (unless independent confirmation exists)  
- catastrophic, dying of, doomed (sensational)

---

## 8. Quotation and community credit

1. Credit community IDs without endorsing unsafe experiments.  
2. Demoted ideas stay visible as demoted, not deleted.  
3. Do not publish raw comment dumps on the site.

---

## 9. Corrections visibility

If a public claim changes materially, log in `CORRECTIONS.md` and future `/changelog`. Do not silently rewrite historical swarm files.

---

## Document control

| Item | Value |
|------|-------|
| Path | `audits/2026-08-publication-readiness/03_public_language_guide.md` |
| Status | Complete for M1 |
| Review | Pending Codex Checkpoint D consolidated review |
