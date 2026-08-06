# Drift0r Research Evidence Portfolio

An AI-assisted, versioned research portfolio organizing Drift0r's publicly shared case materials into documented findings, working hypotheses, counterevidence, literature, and questions for clinicians.

[Open the website](https://drift0rresearch.org/) · [Read the working model](https://drift0rresearch.org/working-model/) · [View the evidence](https://drift0rresearch.org/case/) · [Contribute through a structured issue](https://github.com/justinwojo/drift0r-research-portfolio/issues/new/choose)

> **Research preview — not medical advice, diagnosis, or treatment.** Drift0r directly granted permission to publish this repository and website. Permission is not endorsement. Clinician review has not been performed; licensed clinicians must verify the underlying records and interpret all findings.

## Why this project exists

Drift0r publicly asked for help investigating a long-running, complex medical case. This project turns that public material into a navigable research artifact that can be inspected, challenged, corrected, and extended.

The goal is not to crowdsource a diagnosis. It is to make the reasoning legible:

- what the available materials actually document;
- what has been interpreted rather than directly observed;
- which working hypotheses may explain parts of the record;
- what evidence argues against those hypotheses;
- which questions remain open; and
- which literature is being used, with its applicability limits.

The website presents the current best version of that work. Git preserves the change history, and the [analysis changelog](https://drift0rresearch.org/changelog/) records substantive updates and corrections.

## Start here

| Audience | Recommended entry point |
|---|---|
| General readers | [Current working synthesis](https://drift0rresearch.org/#current-working-synthesis) |
| Clinicians | [Clinician-oriented summary](https://drift0rresearch.org/for-clinicians/) |
| Evidence reviewers | [Case and evidence registers](https://drift0rresearch.org/case/) |
| Researchers | [Working model](https://drift0rresearch.org/working-model/) and [literature catalog](https://drift0rresearch.org/literature/) |
| Contributors | [Choose a structured GitHub issue](https://github.com/justinwojo/drift0r-research-portfolio/issues/new/choose) |
| Maintainers | [Repository structure](docs/REPOSITORY_STRUCTURE.md) and [deployment guide](docs/DEPLOYMENT.md) |

## What the project currently concludes

No single diagnosis has been established. The current synthesis presents several leading working hypotheses and allows for multiple overlapping processes rather than forcing every finding into one explanation. Each hypothesis shows what it may explain, what it does not explain, contradicting literature, and what evidence could change it.

The concise version lives in the homepage's **Current working synthesis**. The complete version—including the null model—is maintained under [`differentials/hypotheses/`](differentials/hypotheses/) and rendered on the [working-model route](https://drift0rresearch.org/working-model/).

## Evidence model

Stable identifiers make the analysis reviewable:

| Prefix | Meaning |
|---|---|
| `CLM-####` | A public claim, separated by evidence type and source class |
| `H1`–`H5`, `H-NULL` | Working hypotheses and the explicit null/multifactorial model |
| `CQ-###` | Discussion questions for clinicians—not medical orders |
| `UQ-####` | Unresolved record or research questions |
| `lit-####` | Literature records with identifiers, access notes, polarity, and applicability limits |
| `COR-####` | Corrections preserved in the public record |

The project distinguishes documented findings, patient-reported history, interpretations, hypotheses, counterevidence, and open questions. Counts of citations are never treated as evidence weights.

## Status (v0.1.3)

| Item | Current status |
|---|---|
| Analysis version | `v0.1.3` initial public research release |
| Evidence current through | 2026-08-05 |
| Drift0r publication permission | Obtained 2026-08-05 |
| Drift0r or clinician endorsement | None claimed |
| Clinician review | Not performed |
| Search indexing | Enabled; pages may appear in public search results |
| Original medical PDFs in this repository | Not included |
| Public contribution surface | Moderated GitHub issue templates; blank issues disabled |

The machine-readable release record is [`site/src/data/release.yaml`](site/src/data/release.yaml). The project remains incomplete and open to correction.

## Source basis and important limitations

The portfolio is based on publicly released patient materials, patient-compiled specialty summaries, an evidence pack, and a public video transcript. **This project has not reviewed original laboratory instrument output, DXA printouts, radiology source reports, or clinic notes.** Values and interpretations must therefore be verified by licensed clinicians against the primary records.

Drift0r controls the externally hosted source folder. This repository links to it but does not redistribute those PDFs:

**[Patient-hosted source documents on Google Drive](https://drive.google.com/drive/folders/1z_juK9yVdhbzaGJafzzZYZWe3U1cs37e)**

The literature catalog contains roughly 334 records. Forty-four launch-cited identities have external identifier attestations. Of the 34 works used directly on public hypothesis/claim surfaces, 32 have source text available to the AI-assisted citation-fidelity pass and two are explicitly bibliographic-only. Independent human semantic review remains pending. Identifier resolution proves bibliographic identity—not that every project summary or medical inference is correct.

See [`literature/CORPUS_STATUS.md`](literature/CORPUS_STATUS.md), [`governance/AI_METHODS.md`](governance/AI_METHODS.md), and the [public roadmap](ROADMAP.md) for the detailed limitations and backlog.

## Contributing

Contributions use structured GitHub issue forms:

- [Literature suggestion](https://github.com/justinwojo/drift0r-research-portfolio/issues/new?template=literature_suggestion.yml)
- [Factual or citation correction](https://github.com/justinwojo/drift0r-research-portfolio/issues/new?template=factual_citation_correction.yml)
- [Contradictory evidence](https://github.com/justinwojo/drift0r-research-portfolio/issues/new?template=contradictory_evidence.yml)
- [Alternative hypothesis or research idea](https://github.com/justinwojo/drift0r-research-portfolio/issues/new?template=alternative_hypothesis.yml)
- [Correction, privacy, or removal request](https://github.com/justinwojo/drift0r-research-portfolio/issues/new?template=privacy_correction_removal.yml)

Do not post private medical records, personal identifiers, treatment instructions, or unsupported diagnoses. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening an issue or pull request.

## Repository map

```text
.
├── .github/             issue forms, CI, and manual Pages deployment
├── audits/              approved public claim and correction registers
├── differentials/       hypotheses and clinician-facing research questions
├── docs/                public project and maintainer documentation
├── governance/          publication, review, correction, and AI-use policies
├── literature/          bibliography, cards, topics, and identity attestations
├── schemas/             machine-readable data contracts
├── site/                Astro application, tests, and static assets
└── templates/           contribution and research templates
```

The public repository is produced from an explicit allowlist. Private records, source PDFs, local paper caches, raw community imports, consent correspondence, and internal operational packets are excluded. See [`docs/REPOSITORY_STRUCTURE.md`](docs/REPOSITORY_STRUCTURE.md) and [`governance/PUBLIC_FILE_ALLOWLIST.md`](governance/PUBLIC_FILE_ALLOWLIST.md).

## Run the site locally

Requirements: Node.js 22.12 or newer. The repository includes an `.nvmrc` for compatible Node version managers.

```bash
cd site
npm ci
npm run check
npm test
npm run dev
```

The development server uses preview mode and placeholder URL configuration. To reproduce the custom-domain publication build locally:

```bash
cd site
DRIFT0R_SITE_MODE=publication \
DRIFT0R_SITE_URL=https://drift0rresearch.org \
DRIFT0R_PUBLIC_REPO_URL=https://github.com/justinwojo/drift0r-research-portfolio \
npm run build:publication

DRIFT0R_SITE_MODE=publication \
DRIFT0R_SITE_URL=https://drift0rresearch.org \
DRIFT0R_PUBLIC_REPO_URL=https://github.com/justinwojo/drift0r-research-portfolio \
DRIFT0R_REQUIRE_PUBLIC_REPO_URL=1 \
node scripts/require-publication-mode.mjs --require-public-repo
```

Build output is written to `site/dist/` and is intentionally untracked.

## Release safety

- Pull requests and pushes run non-deploying validation.
- Deployment is manual; pushes do not publish the website.
- The Pages workflow builds only in publication mode and validates the rendered repository/domain links and artifact digests before upload.
- The deploy artifact is generated from `site/dist/` only.
- The current repository must never be replaced by the private development repository's Git history.
- `noindex` is controlled by the release record and remains a separate launch decision.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`governance/PUBLICATION_POLICY.md`](governance/PUBLICATION_POLICY.md), and [`governance/RELEASE_VERSIONING.md`](governance/RELEASE_VERSIONING.md).

## Project ownership and license

Created and maintained by [Justin Wojciechowski](https://github.com/justinwojo), an independent community researcher who is not a clinician. The project is not operated by, affiliated with, or endorsed by Drift0r, and there is no financial relationship or compensation from Drift0r.

Original project code and content are licensed under the [MIT License](LICENSE). Third-party papers and source materials retain their original copyrights and are cited or linked rather than relicensed or redistributed.

For the complete medical, privacy, copyright, and AI limitations, read [`LEGAL.md`](LEGAL.md).
