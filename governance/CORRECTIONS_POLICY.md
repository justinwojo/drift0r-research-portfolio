# Corrections policy

> How material errors are fixed without destroying research history.  
> **Not medical advice.**

## Principles

1. **No silent rewrite** of historical swarm outputs for style or to hide errors.  
2. **Log material corrections** in `audits/.../CORRECTIONS.md` and the structured public `/changelog/` (`site/src/data/changelog.yaml`).  
3. **Prefer additive errata**: corrected claim inventory + public prose, with pointer to prior text and in-place COR notices on records.  
4. **Preserve unresolved contradictions** visibly when primary records disagree or are missing.  
5. **Never reuse COR-* or claim IDs**; retire or supersede with labelled status (see [`RELEASE_VERSIONING.md`](RELEASE_VERSIONING.md)).  

## What counts as material

- Patient numeric values, dates, diagnoses wording  
- Infection specialty vs confirmed status  
- BMD terminology that could mislead (age <50)  
- Treatment-response causal overstatement  
- Broken provenance (missing or wrong source)  
- Privacy boundary breach  

Non-material: typos that do not change meaning, formatting, navigation labels.

## Process

1. Identify issue → open COR-NNNN entry (next free ID; never reassign).  
2. Update claim inventory verification/statement; set lifecycle/supersession fields if retiring a record.  
3. If public site exists, bump analysis version as required, update `site/src/data/changelog.yaml` sections, and surface COR links on affected records.  
4. If literature card wrong, correct card and note in literature corrections YAML.  
5. Do not delete audit trail or silently remove published IDs.  

## Severity

| Severity | Action |
|----------|--------|
| Launch blocker | Must fix or visibly disclose before publish |
| Should fix before launch | Fix or schedule with owner |
| Post-launch | Changelog entry; optional research delta |
| Editorial | Style only |

## Contact

There is **no published privacy@ email address**.

| Channel | Use |
|---------|-----|
| **GitHub Issues — Correction, privacy, or removal request** | Factual corrections about the patient/case materials, privacy concerns, and requests to correct or remove published content. **Do not post private medical records** or personal identifiers. |
| **GitHub Issues** (other structured templates) | Public research contributions: literature suggestions, citation/factual corrections, contradictory evidence, alternative hypotheses. |
| **Existing private correspondence with the repository owner** | Sensitive **consent or withdrawal of publication consent** from Drift0r may continue through that channel. |

The site publishes these channels on `/legal/`, `/about/contribute/`, and in `CONTRIBUTING.md`.
Historical swarm outputs are **not** silently rewritten for style (see Principles); material errors
are logged and corrected in live claim/site surfaces with pointers to prior text.
