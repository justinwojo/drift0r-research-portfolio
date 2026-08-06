# Privacy and consent policy

> Rules for handling an identifiable person’s sensitive medical information.  
> **Not medical advice.**

## Context

Patient materials in this repository were **publicly released by Drift0r** in de-identified form for community diagnostic help. A purpose-built website is a **new, persistent, searchable publication** and requires explicit scope approval beyond the original video release.

## Current recorded status

Patient publication approval was **obtained on 2026-08-05**. In direct correspondence responding to the
owner's detailed publication request, Drift0r granted broad permission to post the project and whatever
material the owner sees fit. The tracked repository records only the status, scope, and date; the private
correspondence screenshot is intentionally ignored and must not be committed or published.

This permission covers patient consent for a public repository and hosted website, but it does **not**:

- establish medical accuracy or clinician review;
- clear copyright or redistribution rights for third-party records and papers;
- override `do_not_publish`, private-identifier, raw-community, or secret-file exclusions; or
- authorize search indexing or production deploy without a separate owner launch decision.

## Consent checklist (v0.1 research preview) — satisfied 2026-08-05

Documented approval obtained 2026-08-05 covers the following for this **noindex research preview**
(see `site/src/data/release.yaml` and DEC-0026 / DEC-0027 / DEC-0030):

1. Website scope and intended audience — **satisfied**  
2. Case summary / timeline accuracy — **satisfied within published scope** (open to correction)  
3. Quotations and attributed experiences — **satisfied**  
4. Public source inventory — **satisfied** (compiled summaries; originals not redistributed by this repo)  
5. Images/embeds (if any) — **satisfied** (no consent screenshots published)  
6. Consent to persistent searchable web publication — **satisfied for repository + site; indexing remains disabled**  
7. Correction/contact process — **satisfied** (GitHub issue template for correction/privacy/removal; no privacy@ email; Drift0r consent/withdrawal may continue via existing private correspondence)  
8. Launch-copy review of actual pages to be published — **owner editorial discretion under broad grant; clinician review not performed**  
9. Special-category mental-health content — **satisfied for v0.1 exact claims only** under DEC-0030: public inventory claims **CLM-0046**, **CLM-0047**, and **CLM-0048** (DSM-5 SSD assessment history, MMPI-2-RF results framing, and rejection of a primary psychiatric default) with their **exact published wording** and locators on `/case/` and related medical surfaces. Any additional mental-health claim, quotation, or specialty-summary expansion remains **excluded** until exact wording is separately approved (DEC-0022 residual).

### What may be stored in the public repository

| Allowed | Forbidden |
|---------|-----------|
| Approval **status** (`obtained` / `not_obtained` / `scoped_only` / `revoked`) | Signature images or scanned consent forms |
| Approval **scope** description | Private addresses, phone numbers, full DOB if not already intentionally public |
| Approval **date** | Undisclosed private identifiers discovered in raw materials |
| Notes without secrets | Re-identification of third parties |

## Privacy rules for contributors and agents

1. Do not re-identify or publish private identifiers if discovered.  
2. Do not commit non-deidentified records.  
3. Do not publish `data/papers_local/` or raw community harvests.  
4. Inspect built site artifacts for unintended metadata (PDF/image EXIF, source maps).  
5. Prefer least-privilege deploy credentials.  

## Private monorepo vs public sanitized export

The **private monorepo** (the full development tree when it contains non-allowlisted materials —
original specialty PDFs, private packets, raw community harvests, etc.) must not be made public
as-is and must not enable GitHub Pages on a private remote without a completed sanitized export
and owner + legal/privacy review.

Public publication is intended only via a **sanitized export** built from
`governance/public_allowlist.yaml` → `v1_public_repository`. Ignore rules alone are not a privacy
control for already-tracked files in the private history. The public tree is a new repository
created from the allowlist; it does not rehost original specialty PDFs. Once an export is published
under owner launch decision, that public repository is the publication surface — this section does
not instruct maintainers of an already-sanitized public tree to keep a private remote.

## Data minimization

Publish only what is needed to support research transparency and clinician navigation. Defer community credit walls, raw swarm archives, and full literature dumps until policies and consent cover them.

## External patient-hosted folder

A Google Drive folder linked from the README and Methods page is **publicly/anonymously accessible**
and is under Drift0r’s external control. The project records that Drift0r granted broad publish
permission for this research portfolio and that the folder is linked for provenance; the repo does
**not** claim independent documentary proof of the original intent to make the folder public beyond
its present accessibility and that permission. The folder **may include mental-health specialty
summaries and other sensitive medical documents** (filename examples appear only in private monorepo
source inventories — not rehosted here). This project may **link** to the folder; the site and public
repository **do not redistribute** those PDFs. Access, retention, and removal of Drive contents are
outside this repository’s control and may change without notice.

## Contact (correction, withdrawal, consent)

There is **no published privacy@ email address** for this project.

| Channel | Use |
|---------|-----|
| **GitHub Issues — Correction, privacy, or removal request** | Factual corrections about published case materials, privacy concerns, and requests to correct or remove published content. **Do not post private medical records.** A GitHub account is required. Issues are public and moderated. |
| **GitHub Issues** (other structured templates) | Public research contributions: literature suggestions, factual/citation corrections, contradictory evidence, alternative research hypotheses. Not for private medical records or treatment instructions. |
| **Existing private correspondence with the repository owner** | Sensitive **consent or withdrawal of publication consent** from Drift0r may continue through that private channel (not via a site-published email). |

## Withdrawal

If the patient revokes publication consent (via the existing private correspondence channel with the
repository owner, or via a public removal request that does not attach private records), the owner must,
as soon as practicable and with a target of **beginning takedown within 7 days** of confirmed revocation:

1. Set `patient_approval.status` to `revoked` in release metadata  
2. Remove or unpublish the hosted site and stop further deploys  
3. Remove or replace the sanitized public repository contents to the extent under owner control  
4. Log the change in the corrections register and changelog  
5. Note limits: forks, mirrors, search-engine caches, and third-party archives are **outside complete
   control**; the owner will request removal where practical but cannot guarantee global erasure  

## Related

- `PUBLICATION_POLICY.md`  
- `PUBLIC_FILE_ALLOWLIST.md`  
- `CORRECTIONS_POLICY.md`  
- `LEGAL.md`  
