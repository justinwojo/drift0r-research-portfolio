# Literature corpus status

> Research bibliography status. **Not medical advice.**

## Snapshot

| Metric | Value |
|--------|------:|
| Entry cards | **334** |
| Unique works (DOI/PMID dedupe) | **324** |
| Alias cards | **10** |
| ID range | lit-0001 … lit-0336 (minor gaps possible) |
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

## Private monorepo tooling

The following scripts exist only in the private monorepo and are **not** part of the public
export support surface:

- `scripts/build_catalog.py`
- `scripts/build_topic_rollups.py`
- `scripts/download_oa_pdfs.py` (EuropePMC → `data/papers_local/`)
- `scripts/lit_identity.py` (DOI/PMID/PMCID identity checks)

Public contributors: open a Literature suggestion issue (see root `CONTRIBUTING.md`).

## Recommendation

Data-gathering for literature + evidence structure is **sufficient** for the v0.1 research
preview. Further papers will have diminishing returns unless new patient labs arrive. Cards are
open to correction; identifier identity attestation coverage is tracked separately from semantic
claim support (identity resolution does not prove a summary supports a medical claim).
