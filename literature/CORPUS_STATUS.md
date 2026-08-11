# Literature corpus status

> Research bibliography status. **Not medical advice.**

## Snapshot

| Metric | Value |
|--------|------:|
| Entry cards | **339** |
| Unique works (DOI/PMID dedupe) | **329** |
| Alias cards | **10** |
| ID range | lit-0001 … lit-0341 (minor gaps possible) |
| Catalog | `literature/catalog.yaml` |
| Search index | `literature/search/index.json` |
| Topic rollups | `literature/topics/` |
| OA license accounting | `literature/oa_manifest.md` |
| Identity attestations | `literature/attestations/` (identity only; not semantic) |

Local full-text PDF counts (if any) apply to the **private monorepo** cache under
`data/papers_local/` and are **not** redistributed by the public repository.

## Coverage posture

**Well covered:** secondary osteoporosis (men), thiamine/beriberi, Bartonella MSK, Babesia diagnostics, HαT/mast cell, IgG4 without RD, hypogonadism/Klinefelter, hypercalciuria/stones, spine/SCS/fusion, multi-system rare DDx, guidelines anchors, copper, SFN/autonomic core, electrolytes–Mg–thiamine.

**Adequate for swarm:** mold/CIRS (balanced skeptical+advocacy; patient mold labs already negative), UDN/process, geo ID (cocci/histo), Chiari/IIH.

**Most recent additions:** `lit-0337`…`lit-0341` — counter-literature filed against H2 and H3 for
v0.4.0, so neither hypothesis carries an empty contradicting-literature list.

## Private monorepo tooling

The following scripts exist only in the private monorepo and are **not** part of the public
export support surface:

- `scripts/build_catalog.py`
- `scripts/build_topic_rollups.py`
- `scripts/download_oa_pdfs.py` (EuropePMC → `data/papers_local/`)
- `scripts/lit_identity.py` (DOI/PMID/PMCID identity checks)

Public contributors: open a Literature suggestion issue (see root `CONTRIBUTING.md`).

## Recommendation

Data-gathering for literature + evidence structure was judged **sufficient** for the initial
research preview, and that assessment has not been revisited since. Further papers will have
diminishing returns unless new patient labs arrive. Cards are open to correction; identifier
identity attestation coverage is tracked separately from semantic claim support (identity
resolution does not prove a summary supports a medical claim).

The **live** verification status — how many cards are launch-cited, how many have had their
identifiers resolved, and the standing `semantic_verified_count: 0` — is recorded in
[`attestations/coverage.yaml`](attestations/coverage.yaml), not in this file. Read that file for
current numbers; this page is a periodic snapshot of corpus shape and coverage posture.
