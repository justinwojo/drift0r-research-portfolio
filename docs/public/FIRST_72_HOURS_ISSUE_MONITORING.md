# First 72 hours — public issue monitoring checklist

> Operator checklist after a **quiet** public deploy of the research preview.  
> Docs only — does not authorize deploy, announce, or index.

Use this when the sanitized repository and/or site first become reachable by strangers (even without an announcement).

## Before T0 (quiet deploy)

- [ ] Confirm blank issues remain **disabled** and templates render  
- [ ] Confirm [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md), [SECURITY.md](../../SECURITY.md), [CONTRIBUTING.md](../../CONTRIBUTING.md) are present on the public tree  
- [ ] Confirm correction/privacy template warns **not** to post private medical records  
- [ ] Bookmark [LAUNCH_FAQ.md](LAUNCH_FAQ.md) and [COMMUNITY_MODERATION.md](COMMUNITY_MODERATION.md) for paste-ready replies  
- [ ] Ensure at least one maintainer has notification on for Issues (and Security advisories if enabled)  
- [ ] Know how to lock an issue and restrict a user on GitHub  

## Hours 0–6

- [ ] Watch for issues containing **attachments** or pasted lab/imaging content → remove content, close, cite policy  
- [ ] Watch for doxxing / third-party identifiers  
- [ ] Watch for “diagnose me” / treatment-request threads → close with scope reply  
- [ ] Confirm site still shows **noindex** and clinician review **not performed**  
- [ ] Skim first external shares (if any) for misquoted “diagnosis” framing  

## Hours 6–24

- [ ] Triage literature / correction issues; request DOI/PMID when missing  
- [ ] Link FAQ items for repeated critiques (AI diagnosis, LDT controversy, privacy, creator identity, clinician review)  
- [ ] Log material factual errors for changelog rather than silent rewrite  
- [ ] If consent withdrawal signal arrives from Drift0r via private channel, escalate to unpublish runbook (private ops) — do not improvise in public issues  

## Hours 24–72

- [ ] Re-check open issues for pile-ons; lock if harassment  
- [ ] Verify no secrets or never-publish paths appeared via PR if PRs are open  
- [ ] Note patterns for moderation doc updates (still prefer issues over expanding free-form discussion)  
- [ ] Decide whether announcement drafts need adjustment based on real questions (still owner-gated)  

## Escalation triggers (act immediately)

| Trigger | Action |
|---------|--------|
| Private medical records in a public issue | Delete content if possible; close; policy reminder |
| Credible consent withdrawal from Drift0r | Private unpublish runbook; do not argue in public |
| Credential / secret leak | Rotate secrets; follow SECURITY.md; purge from git if in public tree |
| Threats / illegal content | Platform report + restrict user |
| Mass misrepresentation as clinical diagnosis | Pin clarification + FAQ link; correct site wording if we overclaimed |

## What not to do

- Do not enable blank issues to “make it easier”  
- Do not publish a privacy@ email under pressure  
- Do not promise complete global deletion of forks/caches  
- Do not claim clinician review that has not happened  
- Do not engage every LDT argument from scratch — link FAQ and require sources  

## Related

- [COMMUNITY_MODERATION.md](COMMUNITY_MODERATION.md)  
- [LAUNCH_FAQ.md](LAUNCH_FAQ.md)  
- Private operator unpublish runbook (monorepo only; never-publish)  
