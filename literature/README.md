# Literature corpus

**Not medical advice.** Research bibliography for the Drift0r public case.

## Policy

- Cards store **metadata + our summaries + links** (see root `LEGAL.md`).
- Paywalled full PDFs → `data/papers_local/` only (gitignored; never published).
- Open-access redistribution only with documented license in frontmatter.

## Stats (current corpus)

- **339** literature entry cards (`entries/`)
- **329 unique works** after DOI/PMID dedupe (**10** alias cards)
- IDs: mostly `lit-0001` … `lit-0341` (minor gaps; some intentional DOI cross-refs)
- Local full-text PDF cache (private monorepo only; not in public export)
- Index: `catalog.yaml` + `search/index.json`
- Status audit: `CORPUS_STATUS.md` · OA accounting: `oa_manifest.md`
- Identity attestations: `attestations/` (bibliographic identity only — not semantic claim support)

## Private monorepo tooling

Catalog rebuild, topic rollups, OA download, and `scripts/new_entry.py` are **private monorepo
tooling**. They are **not** part of the sanitized public repository support surface. In the public
export, improve the corpus via structured GitHub issues (see root `CONTRIBUTING.md` and the
Literature suggestion template) rather than running local Python rebuild scripts.

If you have a full monorepo checkout:

```bash
python3 scripts/new_entry.py 2024-my-slug --title "..." --year 2024 --doi "10...."
python3 scripts/build_catalog.py
python3 scripts/build_topic_rollups.py
```

## Clusters

See [`topics/`](topics/) for rollup tables mapping cards → patient anchors:

| Cluster | Why it matters |
|---------|----------------|
| Secondary osteoporosis (young male) | Hardest objective finding |
| Thiamine / dry beriberi | Confirmed + Rx response |
| Bartonella MSK | Best clinical abx signal candidate |
| Babesia diagnostics | FISH vs PCR discordance |
| HαT / mast cell | Confirmed genetics + bone |
| IgG4 without RD | Persistent lab pattern |
| Noninflammatory polyarthralgia | Core symptom |
| Hypogonadism / endo | Historical T 34 + bone |
| Periosteal / nodules | Specific oddity |
| Hypercalciuria / stones / bone | Forteo tradeoff |
| Spondylolisthesis / SCS / fusion | Structural + surgical path |
| Multi-system rare DDx | Don’t-miss / partial fits |
| Immunology–infection–bone | Cytokines, SAD, ferritin |
| Guidelines / anchors | Swarm citation backbone |

## Add a card (public contributors)

Open a **Literature suggestion** issue with DOI/PMID when available. Maintainers may add cards
after identity checks. Do not post paywalled full texts or private records.
