# AI methods disclosure

> How AI systems are used in this research portfolio.  
> **AI output is not clinical validation.** Not medical advice.

## Systems used

| Role | System | Notes |
|------|--------|-------|
| Research / implementation | Grok 4.5 (xAI) | Primary execution agent for the **pre-launch** publication-readiness roadmap (through the 2026-08-06 first public release) |
| Independent analysis (Round 1) | Claude Opus 5, Codex GPT-5.6 Sol, Grok 4.5 | 2026-08-05 swarm |
| Adversarial critique (Round 1) | Claude Opus 5, Codex GPT-5.6 Sol, Grok 4.5 | Same date |
| Adversarial multi-model audit (overnight) | Claude Opus 5, Grok 4.5, Codex GPT-5.6 Sol | 2026-08-06 private research run; cross-model attack, citation fidelity, and remediation planning |
| Remediation implementation | Grok 4.5 (xAI) | Applied COR-0022…COR-0032 from verified primary-source defects (working tree; not a clinical review) |
| Community-issue adjudication | Claude Fable 5 (Anthropic) | 2026-08-10 adjudication of community issue #3 against the public and private record; v0.4.0 evidence additions |
| Solo blinded round (Round 2) | Claude Fable 5 (Anthropic) | 2026-08-10 blinded independent re-derivation from the evidence pack, adversarial cross-exam of both the blinded output and the published ranking, chair synthesis re-verified against the compiled source documents (not primary records); COR-0043/COR-0044 |
| Paired pre-publication review | Codex GPT-5.6 Sol, Grok 4.5 | Two independent builds review a release before it is packaged: 2026-08-07 (v0.3.0), and 2026-08-10 for the v0.4.0 content and language gates, the issue-#3 evidence additions, and the Round-2 layering |
| Post-publication research run | Grok 4.5 (xAI) | 2026-08-09 overnight run over the compiled source documents; produced a findings register and an unknowns list for adjudication — not a clinical review |
| Audit, adjudication, release promotion | Claude Opus 5 (Anthropic) | 2026-08-07 plain-language landing rewrite, ruled-out register, review triage; 2026-08-10 audit of the 2026-08-09 run, source re-verification, DEC-0039 scope decision, v0.4.0 promotion |

The roster above spans two phases. Everything through the 2026-08-06 first public release was
pre-launch implementation. Since publication, the work has been review, adjudication and research
over an already-public record — the paired review rounds, the 2026-08-09 research run, the
community-issue adjudication, and the Round-2 blinded round — together with the ongoing
implementation that carries their results: site presentation and interface work, and the edits that
apply corrections and evidence additions to the published record. Implementation did not stop at
launch; what changed is that it now serves review findings rather than a pre-launch roadmap.
`site/src/data/release.yaml` (`ai_models_disclosed`) carries the same roster per release and is the
field updated each cycle.

Claude Fable 5 was not part of the Round-1 three-family review (2026-08-05) because at that time
the build declined every task involving this case material, under the deliberately broad biology
safeguards it launched with. Anthropic subsequently narrowed those safeguards
([Improving Fable 5's biology safeguards](https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards)),
after which the build could work on this material; its first contributions are the community-issue
adjudication and solo blinded round rows above, both 2026-08-10. The absence reflects the vendor's
safety configuration at the time, not a judgment about the material — which is also why the fourth
build ran as a solo blinded round rather than as part of the original cross-family review.

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
