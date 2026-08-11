# Deployment and release guide

The public repository uses a custom GitHub Actions workflow to build and deploy the Astro site. A push or merge validates the repository but does **not** deploy it.

The site is live and the repository is public. This guide is the runbook for every subsequent deploy; the one-time setup steps that produced the current configuration are kept at the end as a historical record.

## Production coordinates

| Setting | Value |
|---|---|
| Repository | `https://github.com/justinwojo/drift0r-research-portfolio` (public) |
| Site | `https://drift0rresearch.org` (live, HTTPS) |
| Astro base | `/` |
| Pages source | GitHub Actions |
| Deploy trigger | Manual `workflow_dispatch` only |

## Current configuration

| Item | State |
|---|---|
| Repository visibility | Public |
| Pages publishing source | GitHub Actions (custom workflow, `.github/workflows/pages.yml`) |
| Deploy workflow | **Deploy publication site (manual)** — `workflow_dispatch` only, gated on a `publication` confirmation input |
| Push behaviour | `ci.yml` ("Validate public research portfolio") validates; it never tags, releases, or deploys |
| Custom domain | `drift0rresearch.org`, verified on the owner account, HTTPS enabled |
| Search indexing | **Enabled** — `site/src/data/release.yaml:noindex: false` → `index, follow` (DEC-0037, 2026-08-07) |

Nothing reaches visitors until the manual deploy workflow runs and both of its jobs pass. Because the site is live and indexed, anything that does reach visitors is immediately public and search-discoverable.

For a custom Actions workflow, GitHub ignores and does not require a repository `CNAME` file. The custom domain is configured in Pages settings or through the Pages API. See [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Repository variables

Configure these under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
|---|---|
| `SITE_URL_OVERRIDE` | `https://drift0rresearch.org` |
| `PUBLIC_REPO_URL_OVERRIDE` | `https://github.com/justinwojo/drift0r-research-portfolio` |

The workflow can derive the repository URL automatically, but keeping both reviewed values explicit makes the intended production coordinates obvious.

## Commit safety (every commit, not just the first)

The local checkout may contain ignored medical source files, paper caches, consent evidence, and
private operational material. `.gitignore` is defense in depth; it does not make force-adding safe.
The repository is public, so an accidental commit is an immediate disclosure.

Before every commit:

1. Use `git add .` from the repository root. Never use `git add -f` or `git add --force`.
2. Review `git diff --cached --name-only` and `git diff --cached --stat` before committing.
3. Confirm the staged set contains no `private/`, `data/papers_`, `evidence/sources/`,
   `community/raw/`, `site/dist/`, PDF, environment, credential, or key files.
4. Run `git diff --cached --check` and the site validation sequence below.

## Local release reproduction

```bash
cd site
npm ci
npm run check
npm test

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

The gate verifies publication mode, the real domain and repository URL, rendered issue-template links, manifest equality, digests, `.nojekyll`, and other artifact invariants.

## Deploying a build

1. Confirm the default branch and working tree contain only the reviewed sanitized public tree.
2. Confirm `site/src/data/release.yaml` still has the intended indexing state and the intended `content_version`.
3. Run the **Deploy publication site (manual)** workflow.
4. Enter `publication` in the confirmation input.
5. Wait for both build and deploy jobs to pass.
6. Visit the domain and check the deployed output.
7. Verify HTTPS, canonical URLs, issue links, navigation, mobile layouts, print routes, and social-card metadata.

Every run of this workflow is a real publication event. The site is live at a custom domain and its pages are indexed, so deployed content is visible to visitors immediately and becomes search-discoverable without any further action.

## Indexing and announcement

Indexing is controlled by the versioned release record, not by the deploy workflow. It is currently **enabled**: `site/src/data/release.yaml` carries `noindex: false`, pages render `index, follow`, and `robots.txt` is `Allow: /`. That state was set by owner decision **DEC-0037** (2026-08-07), which supersedes the deferred postures in DEC-0023 and DEC-0027.

Turning indexing back off is the same kind of change in reverse: a reviewed change to the release record, a new build, a new manual deploy, and a **separate owner decision** logged in `audits/2026-08-publication-readiness/DECISIONS.md`. It is not a deploy-workflow flag and not a code change. Drift0r may ask for indexing to be turned off through the correction/privacy/removal issue template or existing private correspondence; see `governance/PRIVACY_AND_CONSENT.md`.

Announcing the project remains separate from deploying it.

## Rollback

- Redeploy the last known-good commit through the same manual workflow.
- For a serious privacy or scope problem, disable/unpublish Pages first, then follow the correction and withdrawal policies.
- Never attempt rollback by pushing private archive history into this repository.

See `governance/RELEASE_VERSIONING.md`, `governance/CORRECTIONS_POLICY.md`, and `governance/PRIVACY_AND_CONSENT.md`.

## Historical: initial publication setup

Kept as a record of how the current configuration came to exist. These are one-time steps; do not
re-run them against the live site.

The public tree was first pushed on 2026-08-06 (commit `f061834`) and first deployed in that launch
window. Pages setup at that time was:

1. Open **Settings → Pages**.
2. Select **GitHub Actions** as the publishing source.
3. Configure `drift0rresearch.org` as the custom domain.
4. Confirm the domain is verified on the owner account and the expected DNS records resolve.
5. Enable HTTPS when GitHub makes the option available.

This guide previously instructed the operator to keep the repository private through the initial push
and CI review, and described the first deploy as a "quiet" one — reachable but unannounced and not
indexed. Both applied to that pre-launch window only. The repository is public, the site serves at
its custom domain, and indexing was enabled by DEC-0037 on 2026-08-07.
