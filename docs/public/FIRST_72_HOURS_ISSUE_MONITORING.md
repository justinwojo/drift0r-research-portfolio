# Public issue monitoring — steady state and launch-window record

> Operator guidance for monitoring public issues on a live, indexed research portfolio.
>
> Docs only — this document authorizes nothing by itself. The repository is public, the site is
> deployed, and search indexing is enabled under owner decision **DEC-0037**; deploying a new build
> still requires the manual workflow in [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md), and turning
> indexing off again requires a reviewed release-record change and a separate owner decision.

The launch window this file was written for is closed — the public tree was first pushed on
2026-08-06 (commit `f061834`) and the site was first deployed in that window. The checklist below is
retained as the checklist prepared for that window — a record of what was planned, not evidence of
what was executed. The standing practice is in **Steady-state monitoring**.

## Steady-state monitoring

Ongoing, not time-boxed:

- Keep at least one maintainer subscribed to Issue notifications (and Security advisories if enabled).
- Keep blank issues **disabled**; structured templates only. Confirm the correction/privacy template
  still warns **not** to post private medical records.
- Keep [LAUNCH_FAQ.md](LAUNCH_FAQ.md) and [COMMUNITY_MODERATION.md](COMMUNITY_MODERATION.md) to hand
  for paste-ready replies; link a prepared answer rather than re-arguing a recurring critique.
- Triage literature and correction issues; request DOI/PMID when missing.
- Remove attachments or pasted lab/imaging content on sight, close the issue, and cite policy.
- Close "diagnose me" and treatment-request threads with the scope reply.
- Log material factual errors into the corrections register and changelog rather than silently
  rewriting published text.
- Route any privacy, removal, or consent-withdrawal signal from Drift0r to the private unpublish
  runbook and the withdrawal procedure in `governance/PRIVACY_AND_CONSENT.md` — never improvise in a
  public issue.
- After each deploy, confirm clinician review still shows **not performed** and that the rendered
  robots meta matches `site/src/data/release.yaml:noindex` (currently indexing **enabled**, DEC-0037).
- Know how to lock an issue and restrict a user on GitHub before you need to.

Because the site is indexed, published text is search-discoverable and archived by third parties;
treat correction latency as a real cost, not a formality.

## Launch-window checklist (2026-08-06) — historical record

The checklist prepared for the launch window, retained with its later supersessions rather than as
original launch-time text: the Hours 0–6 indexing bullet was restated after DEC-0037 enabled search
indexing (COR-0040), so it no longer reads as it did at launch. Boxes are unticked; this file does
not record which items were carried out. It is **not** a live checklist — do not re-run it against
the deployed site.

### Before T0 (quiet deploy)

- [ ] Confirm blank issues remain **disabled** and templates render  
- [ ] Confirm [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md), [SECURITY.md](../../SECURITY.md), [CONTRIBUTING.md](../../CONTRIBUTING.md) are present on the public tree  
- [ ] Confirm correction/privacy template warns **not** to post private medical records  
- [ ] Bookmark [LAUNCH_FAQ.md](LAUNCH_FAQ.md) and [COMMUNITY_MODERATION.md](COMMUNITY_MODERATION.md) for paste-ready replies  
- [ ] Ensure at least one maintainer has notification on for Issues (and Security advisories if enabled)  
- [ ] Know how to lock an issue and restrict a user on GitHub  

### Hours 0–6

- [ ] Watch for issues containing **attachments** or pasted lab/imaging content → remove content, close, cite policy  
- [ ] Watch for doxxing / third-party identifiers  
- [ ] Watch for “diagnose me” / treatment-request threads → close with scope reply  
- [ ] Confirm clinician review still shows **not performed**, and that the robots meta matches `release.yaml:noindex` (currently indexing **enabled**, DEC-0037)  
- [ ] Skim first external shares (if any) for misquoted “diagnosis” framing  

### Hours 6–24

- [ ] Triage literature / correction issues; request DOI/PMID when missing  
- [ ] Link FAQ items for repeated critiques (AI diagnosis, LDT controversy, privacy, creator identity, clinician review)  
- [ ] Log material factual errors for changelog rather than silent rewrite  
- [ ] If consent withdrawal signal arrives from Drift0r via private channel, escalate to unpublish runbook (private ops) — do not improvise in public issues  

### Hours 24–72

- [ ] Re-check open issues for pile-ons; lock if harassment  
- [ ] Verify no secrets or never-publish paths appeared via PR if PRs are open  
- [ ] Note patterns for moderation doc updates (still prefer issues over expanding free-form discussion)  
- [ ] Decide whether announcement drafts need adjustment based on real questions (still owner-gated)  

## Escalation triggers (standing — act immediately)

| Trigger | Action |
|---------|--------|
| Private medical records in a public issue | Delete content if possible; close; policy reminder |
| Credible consent withdrawal from Drift0r | Private unpublish runbook; do not argue in public |
| Credential / secret leak | Rotate secrets; follow SECURITY.md; purge from git if in public tree |
| Threats / illegal content | Platform report + restrict user |
| Mass misrepresentation as clinical diagnosis | Pin clarification + FAQ link; correct site wording if we overclaimed |

## What not to do (standing)

- Do not enable blank issues to “make it easier”  
- Do not publish a privacy@ email under pressure  
- Do not promise complete global deletion of forks/caches  
- Do not claim clinician review that has not happened  
- Do not engage every LDT argument from scratch — link FAQ and require sources  

## Related

- [COMMUNITY_MODERATION.md](COMMUNITY_MODERATION.md)  
- [LAUNCH_FAQ.md](LAUNCH_FAQ.md)  
- [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md) — manual deploy runbook and current indexing state
- `governance/PRIVACY_AND_CONSENT.md` — correction, removal, and withdrawal procedure
- Private operator unpublish runbook (monorepo only; never-publish)  
