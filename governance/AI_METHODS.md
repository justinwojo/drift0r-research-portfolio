# AI methods disclosure

> How AI systems are used in this research portfolio.  
> **AI output is not clinical validation.** Not medical advice.

## Systems used

| Role | System | Notes |
|------|--------|-------|
| Research / implementation | Grok (xAI) | Primary execution agent for publication-readiness roadmap |
| Independent analysis (Round 1) | Claude, Codex, Grok | 2026-08-05 swarm |
| Adversarial critique (Round 1) | Claude, Codex, Grok | Same date |
| Adversarial multi-model audit (overnight) | Claude, Grok, Codex | 2026-08-06 private research run; cross-model attack, citation fidelity, and remediation planning |
| Remediation implementation | Grok (xAI) | Applied COR-0022…COR-0032 from verified primary-source defects (working tree; not a clinical review) |

Exact model build numbers for Round 1 and the 2026-08-06 run were not always recorded beyond agent family names and dates.
A detailed private run log may exist at `audits/2026-08-publication-readiness/00_RUN.md` and under
`private/research-runs/2026-08-06-overnight/` in the **private monorepo** only; those files are **not**
part of the sanitized public export. Public disclosure is limited to agent families, dates, and the
methods statements on this page and `/methods/`.

## What AI may do

- Organize public records and literature metadata  
- Propose hypotheses and test questions for clinicians  
- Draft documentation, schemas, validation code  
- Flag contradictions and overstatement  

## What AI must not do

- Diagnose or prescribe  
- Approve publication as a “medical reviewer”  
- Invent patient values, citations, or page locations  
- Upgrade evidence status based on multi-model agreement alone  
- Be listed as investigator, clinician, or treating provider  

## Uncertainty handling

1. Label `observed_fact` vs `reported_history` vs `interpretation` vs `hypothesis` vs `research_question`.  
2. Record verification status.  
3. Preserve minority reports and counterevidence.  
4. Seek disconfirming literature as actively as supporting literature.  

## Human responsibility

Licensed clinicians interpret records and decide care. The patient decides publication scope and lived-history accuracy. The repository owner decides technical publication. Legal/privacy advisers may be consulted for liability and privacy — they do not establish medical validity.
