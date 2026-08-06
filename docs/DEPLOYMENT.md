# Deployment and release guide

The public repository uses a custom GitHub Actions workflow to build and deploy the Astro site. A push or merge validates the repository but does **not** deploy it.

## Production coordinates

| Setting | Value |
|---|---|
| Repository | `https://github.com/justinwojo/drift0r-research-portfolio` |
| Site | `https://drift0rresearch.org` |
| Astro base | `/` |
| Pages source | GitHub Actions |
| Deploy trigger | Manual `workflow_dispatch` only |

## Repository variables

Configure these under **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
|---|---|
| `SITE_URL_OVERRIDE` | `https://drift0rresearch.org` |
| `PUBLIC_REPO_URL_OVERRIDE` | `https://github.com/justinwojo/drift0r-research-portfolio` |

The workflow can derive the repository URL automatically, but keeping both reviewed values explicit makes the intended production coordinates obvious.

## Initial commit safety

The local checkout may contain ignored medical source files, paper caches, consent evidence, and
private operational material. `.gitignore` is defense in depth; it does not make force-adding safe.

For the initial commit:

1. Use `git add .` from the repository root. Never use `git add -f` or `git add --force`.
2. Review `git diff --cached --name-only` and `git diff --cached --stat` before committing.
3. Confirm the staged set contains no `private/`, `data/papers_`, `evidence/sources/`,
   `community/raw/`, `site/dist/`, PDF, environment, credential, or key files.
4. Run `git diff --cached --check` and the site validation sequence below.
5. Keep the repository private through the initial push and CI review.

## Initial Pages configuration

After the reviewed initial commit exists:

1. Open **Settings → Pages**.
2. Select **GitHub Actions** as the publishing source.
3. Configure `drift0rresearch.org` as the custom domain.
4. Confirm the domain is verified on the owner account and the expected DNS records resolve.
5. Enable HTTPS when GitHub makes the option available.

For a custom Actions workflow, GitHub ignores and does not require a repository `CNAME` file. The custom domain is configured in Pages settings or through the Pages API. See [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

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

## Quiet deployment

1. Confirm the default branch and working tree contain only the reviewed sanitized public tree.
2. Confirm `site/src/data/release.yaml` still has the intended indexing state.
3. Run the **Deploy publication site (manual)** workflow.
4. Enter `publication` in the confirmation input.
5. Wait for both build and deploy jobs to pass.
6. Visit the domain without announcing it.
7. Verify HTTPS, canonical URLs, issue links, navigation, mobile layouts, print routes, and social-card metadata.

GitHub Pages sites are publicly accessible even when their backing repository is private. A quiet deployment is therefore still a real publication event.

## Indexing and announcement

Indexing is controlled by the versioned release record, not by the deploy workflow. Changing from `noindex` to indexed output requires a reviewed content change, a new build, and a separate owner decision. Announcing the project is also separate from deploying it.

## Rollback

- Redeploy the last known-good commit through the same manual workflow.
- For a serious privacy or scope problem, disable/unpublish Pages first, then follow the correction and withdrawal policies.
- Never attempt rollback by pushing private archive history into this repository.

See `governance/RELEASE_VERSIONING.md`, `governance/CORRECTIONS_POLICY.md`, and `governance/PRIVACY_AND_CONSENT.md`.
