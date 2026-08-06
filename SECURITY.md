# Security policy

> **Research only — not medical advice.** Medical content on this project is a research evidence portfolio. It is not a clinical product, device, or care pathway.

## Supported surfaces

This project publishes:

- A sanitized public Git repository (research materials + Astro site source)  
- A static website artifact (GitHub Pages or equivalent)

There is no authenticated multi-tenant application, no patient portal, and no server-side database of medical records in the public surface.

## Reporting a vulnerability

**Do not invent or rely on a published security@ email for this project.** Prefer:

1. **GitHub private vulnerability reporting** on the public repository (if enabled for the repo), or  
2. A **GitHub issue** using the **Correction, privacy, or removal request** template for privacy/content security issues that do not require secrecy, or  
3. GitHub Support / platform abuse channels for account or platform-level abuse  

If a report must stay private (e.g. a deploy misconfiguration that could expose unpublished material), use private vulnerability reporting when available rather than a public issue.

Please include:

- Affected URL, path, or repository file  
- Steps to reproduce  
- Impact assessment (data exposure, integrity, availability)  
- Whether the issue involves **medical or personal data**

## What is in scope

- Accidental publication of secrets, tokens, or credentials  
- Paths or artifacts that should be on the never-publish list (source PDFs, raw dumps, private packets)  
- Cross-site or hosting misconfiguration on the official project domain  
- Dependency issues in the **public** site toolchain that create a realistic exploit path for visitors or maintainers

## What is out of scope (examples)

- Disagreement with medical hypotheses, specialty-lab controversy, or research conclusions (use research issue templates)  
- “This AI cannot diagnose” critiques (see `docs/public/LAUNCH_FAQ.md`)  
- Social-engineering the patient or third parties  
- Scanning third-party sites (YouTube, Google Drive patient-hosted folder, Crossref, NCBI) that this project only links to  
- Demanding complete erasure of all forks and caches after public release (not technically guaranteed)

## Medical-content note

Published case materials concern a real person who granted publication permission. That does **not** make the content clinical advice. Security reports about **privacy** (e.g. accidental disclosure beyond consented public scope) are treated seriously and may result in content redaction, repository changes, or unpublish procedures — without claiming that every copy on the internet can be deleted.

## Safe harbor

Good-faith security research that does not destroy data, spam services, or access accounts beyond proof of concept is welcome. Do not exfiltrate private medical material if you encounter it; report and stop.
