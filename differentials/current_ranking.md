# Current differential ranking

**Status:** Live after Round-1 multi-agent swarm (2026-08-05); content corrections Checkpoint G.1 (2026-08-05).  
**Not medical advice.** Educational research only — see [`LEGAL.md`](../LEGAL.md).

| Field | Value |
|-------|-------|
| **Run** | [`swarm-runs/2026-08-05-round1/`](swarm-runs/2026-08-05-round1/) |
| **Artifacts** | Independent ×3 · Adversarial ×3 · [`03_synthesis.md`](swarm-runs/2026-08-05-round1/03_synthesis.md) · [`04_clinician_onepager.md`](swarm-runs/2026-08-05-round1/04_clinician_onepager.md) |
| **Evidence** | v1 + v2 packs · `evidence/facts/tests_ledger.*` |
| **Literature** | ~334 cards |

---

## 1. Ranked frameworks

**Confidence** vocabulary (five words only; never numeric): **high | medium | low | speculative | rejected**. Stacks report **architecture** and **module identity** separately. Counts of supporting/contradicting literature are **not weights**.

| Rank | ID | Name | Bucket | Type |
|-----:|----|------|--------|------|
| 0 | H-NULL | Multi-independent axes (null model / no single unifier) | **medium** (qualitative baseline; not a disease label) | Null model |
| 1 | H1 | Layered skeletal–metabolic–neurologic–immune stack (**infection detachable**) | Architecture **medium** · modules **medium** | Multi-disease research architecture |
| 2 | H2 | Monogenic / constitutional early-onset osteoporosis (WNT1/LRP5/PLS3/mild OI; HPP **low** branch) | **medium** | Best single-primary |
| 3 | H3 | Calcium-flux / incomplete formation-side bone phenotyping | **medium** | Module |
| 4 | H4 | Bartonella-spectrum contributor (specialty LDT contested; commercial unconfirmed) | **low** | Residual / modifier |
| 5 | H5 | IgG1-low / IgG4-high humoral abnormality; possible SAD after vaccine challenge | Humoral pattern documented · named SAD **low** until challenge | Module |

### Satellites

| ID | Name | Bucket |
|----|------|--------|
| H-SFN | Small-fiber / autonomic layer (not “post-thiamine” causal label) | medium *as contributor* |
| H-SM | Bone-predominant indolent SM | **low** don’t-miss |
| H-BABESIA | Active babesiosis | **low** (near-closed pending smear+PCR in symptoms) |
| H-KS | Klinefelter / mosaic XXY | **low** |
| H-Cu | Copper deficiency / handling | **low** don’t-miss |
| H-HαT | HαT as multi-system driver | **rejected as driver** (tryptase modifier only) |
| H-SCS-2026 | Post-SCS 2026 episode | **speculative** capture protocol |

### Not supported by the presently available record

Primary psychiatric/SSD · COVID-vaccine etiology · classic fibrotic IgG4-RD · Lyme driver · mold/CIRS as primary ongoing driver · cytokine-driven markedly low BMD from a single mild TNF/IL-10 draw · classic MCAS as unifier.

---

## 2. Single-disease vs multi-disease

| Option | Role |
|--------|------|
| **Preferred research architecture** | Multi-disease stack (H1) — organizing frame, not single-mechanism proof |
| **Best single-primary** | Monogenic / constitutional early-onset OP (H2) |
| **Best residual-primary** (if bone axis explained) | Bartonella-spectrum contributor (H4) for joints / periosteum / nodules — specialty LDT contested |
| **Null baseline** | H-NULL — several semi-independent processes may coexist without one rare unifier |

---

## 3. Top 10 tests for clinicians

1. Bone formation markers (P1NP, BSAP ± osteocalcin) + ALP age/sex audit  
2. DXA Z-scores + VFA + TBS + hip change vs LSC  
3. Controlled 24h urine Ca/Na + fasting UCa/Cr + paired Ca/PTH (note AUA Statement 7 counter on routine fast-and-load)  
4. Early-onset osteoporosis gene panel (honest ~9% related-cohort yield)  
5. High-sensitivity peripheral-blood KIT D816V (method documented)  
6. Same-lab pre/post pneumococcal (± Hib) vaccine challenge → SAD  
7. Copper + ceruloplasmin + zinc  
8. SFN/autonomic battery (IENFD / QST / QSART ± tilt)  
9. Infection split: Babesia smear+PCR in symptoms; Bartonella culture/PCR/IFA/tissue if safe — **not** IgM churn / post-abx FISH as adjudicator  
10. Original HPG reconstruction + karyotype/CMA  

Full rationale: synthesis §5 · one-pager: [`04_clinician_onepager.md`](swarm-runs/2026-08-05-round1/04_clinician_onepager.md).

---

## 4. Don’t-miss

- Silent vertebral fracture / progressive structural spine risk  
- Monogenic bone disease before long-term bone-agent class choice  
- Incomplete SM exclusion (hs KIT → marrow only if justified)  
- Copper-deficiency myeloneuropathy  
- Clinically important antibody deficiency  
- Confirmed invasive infection **if** microbiologically proven  
- Perioperative thiamine plan given prior deficiency  
- Local neurosurgical red flags (not delayed by systemic DDx)

---

## 5. Specialty LDT vs confirmed (do not conflate)

| Contested specialty LDT | Independent / commercial pathway |
|-------------------------|----------------------------------|
| Babesia FISH ×2 (T047) | Babesia PCR/IB **negative** (T048) |
| Bartonella IgM +→indet (T049) | Bartonella PCR/FISH **negative** (T050) |
| — | Lyme multi-method **negative** |

Confirmed/objective examples: extreme DXA phenotype, serial 24h urine calcium values (see CLM-0015 thresholds), historical T~34, thiamine 7 nmol/L with response, HαT genotype, IgG subclass/titer pattern, structural spine disease.

---

## 6. Minority reports preserved

- **Claude (R1):** Raised Bartonella toward **medium** via an inference that low IgG1 might reduce serology NPV, citing lit-0049. **Checkpoint G.1:** that NPV inference is **unsupported** — lit-0049 shows IgG1-dominant anti-*Bartonella* responses in confirmed CSD sera; it does not study IgG1-deficient hosts, does not measure serology NPV, and is catalogued as **contradicting** over-confident serology-only Bartonella claims. Do **not** use lit-0049 as warrant for a higher Bartonella bucket. Minority “medium” remains a historical swarm note only.  
- **Codex:** Bartonella **low**, fully detachable; BAPGM = method paper not validation.  
- **Grok (R1 audit trail):** infection limb not zero (periosteal/nodules/abx signal) even after R2 demotion from stack center.

---

## 7. How to re-run

Swarm orchestration notes live in the private monorepo as `differentials/SWARM_ORCHESTRATION.md` (deep archive; not part of the public export). Schema: `templates/swarm-output.yaml`.

**Next research (optional):** second swarm after any major new labs; durable `hypotheses/H0x-*.md` pages; public Astro site for digestible presentation.
