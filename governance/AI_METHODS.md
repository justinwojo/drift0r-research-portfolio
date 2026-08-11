# AI methods disclosure

> How AI systems are used in this research portfolio.  
> **AI output is not clinical validation.** Not medical advice.

## Systems used

| Role | System | Notes |
|------|--------|-------|
| Research / implementation | Grok 4.5 (xAI) | Primary execution agent for publication-readiness roadmap |
| Independent analysis (Round 1) | Claude Opus 5, Codex GPT-5.6 Sol, Grok 4.5 | 2026-08-05 swarm |
| Adversarial critique (Round 1) | Claude Opus 5, Codex GPT-5.6 Sol, Grok 4.5 | Same date |
| Adversarial multi-model audit (overnight) | Claude Opus 5, Grok 4.5, Codex GPT-5.6 Sol | 2026-08-06 private research run; cross-model attack, citation fidelity, and remediation planning |
| Remediation implementation | Grok 4.5 (xAI) | Applied COR-0022…COR-0032 from verified primary-source defects (working tree; not a clinical review) |
| Community-issue adjudication | Claude Fable 5 (Anthropic) | 2026-08-10 adjudication of community issue #3 against the public and private record; v0.4.0 evidence additions |
| Solo blinded round (Round 2) | Claude Fable 5 (Anthropic) | 2026-08-10 blinded independent re-derivation from the evidence pack, adversarial cross-exam of both the blinded output and the published ranking, chair synthesis re-verified against the compiled source documents (not primary records); COR-0043/COR-0044 |

Claude Fable 5 was not part of the Round-1 three-family review (2026-08-05) because at that time
the build declined every task involving this case material, under the deliberately broad biology
safeguards it launched with. Anthropic subsequently narrowed those safeguards
([Improving Fable 5's biology safeguards](https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards)),
after which the build could work on this material; its first contributions are the two 2026-08-10
rows above. The absence reflects the vendor's safety configuration at the time, not a judgment
about the material — which is also why the fourth build ran as a solo blinded round rather than
as part of the original cross-family review.

Model **families** are recorded for every AI contribution: Claude, Codex, and Grok, in the builds named
above (the Claude family contributed two builds: Opus 5 and Fable 5). Exact build identity is **not** recoverable for all of it — the earliest rounds recorded the CLI or
app version rather than the served model build, and providers update builds behind a stable name. Read the
table as "which model families did what, and when", not as a byte-exact build manifest.
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
