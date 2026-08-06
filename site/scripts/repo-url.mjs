/**
 * Shared public-repo + site URL + Pages base-path validation (build-time + launch gate).
 * Keep rules aligned with site/src/lib/constants.ts isPublicRepoConfigured().
 *
 * Checkpoint G.2.1: Astro `base` must match project Pages path (repo name / site pathname).
 * Checkpoint G.2.2: GitHub repo roots require exactly owner/repo; CI derives deploy URLs here.
 */
import { resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Hosts / patterns that must never pass a launch or deploy gate. */
const PLACEHOLDER_RE =
  /example\.invalid|example\.com|localhost|127\.0\.0\.1|\.local\b|0\.0\.0\.0/i;

/**
 * @param {string} raw
 * @returns {{ ok: true, url: string, issuesNewChoose: string } | { ok: false, reason: string }}
 */
export function validatePublicRepoUrl(raw) {
  const u = (raw || '').trim();
  if (!u) return { ok: false, reason: 'empty' };
  if (PLACEHOLDER_RE.test(u)) return { ok: false, reason: 'placeholder' };
  if (/\s/.test(u)) return { ok: false, reason: 'malformed' };
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'non-https' };
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  // Reject query/fragment surprises on contribution roots (must be bare repo root).
  if (parsed.search || parsed.hash) {
    return { ok: false, reason: 'malformed' };
  }
  // GitHub repos need exactly owner/repo; other hosts need a non-empty path for issue templates.
  const parts = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
    // Exactly two pathname segments: owner/repo.
    // Reject /tree, /issues, /wiki, arbitrary extra segments, username-only, etc.
    if (parts.length !== 2) return { ok: false, reason: 'malformed' };
    if (!parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  } else if (parts.length < 1) {
    return { ok: false, reason: 'malformed' };
  }
  const normalized = `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  const issuesNewChoose = `${normalized}/issues/new/choose`;
  return { ok: true, url: normalized, issuesNewChoose };
}

/**
 * @param {string} raw
 * @returns {{ ok: true, url: string } | { ok: false, reason: string }}
 */
export function validateSiteUrl(raw) {
  const u = (raw || '').trim();
  if (!u) return { ok: false, reason: 'empty' };
  if (PLACEHOLDER_RE.test(u)) return { ok: false, reason: 'placeholder' };
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (parsed.protocol !== 'https:') return { ok: false, reason: 'non-https' };
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  return { ok: true, url: `${parsed.origin}${parsed.pathname.replace(/\/+$/, '') || ''}` };
}

/** True when URL is a usable non-placeholder public repo root. */
export function isPublicRepoConfigured(url) {
  return validatePublicRepoUrl(url).ok === true;
}

/**
 * Normalize a project base path.
 * - Root / custom-domain: `/`
 * - Project Pages: `/repo-name` (no trailing slash)
 * Astro accepts either `/name` or `/name/`; we store without trailing slash except root.
 *
 * @param {string} raw
 * @returns {{ ok: true, base: string } | { ok: false, reason: string }}
 */
export function normalizeBasePath(raw) {
  let s = (raw || '').trim();
  if (!s || s === '/') return { ok: true, base: '/' };
  if (/\s/.test(s)) return { ok: false, reason: 'malformed' };
  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/\/+$/, '');
  if (!s) return { ok: true, base: '/' };
  // Reject traversal / absolute-looking garbage
  if (s.includes('//') || s.includes('..') || s.includes('\\')) {
    return { ok: false, reason: 'malformed' };
  }
  const parts = s.split('/').filter(Boolean);
  // GitHub project Pages use a single path segment; multi-segment custom bases are not used in v0.1.
  if (parts.length !== 1) {
    return { ok: false, reason: 'malformed' };
  }
  if (!/^[A-Za-z0-9._-]+$/.test(parts[0])) {
    return { ok: false, reason: 'malformed' };
  }
  return { ok: true, base: `/${parts[0]}` };
}

/**
 * Derive Astro base from a site URL pathname.
 * - https://owner.github.io/drift0r → /drift0r
 * - https://owner.github.io/ → /  (user Pages / root)
 * - https://docs.example.org → /  (custom domain root)
 *
 * @param {string} siteUrl
 * @returns {{ ok: true, base: string } | { ok: false, reason: string }}
 */
export function deriveBaseFromSiteUrl(siteUrl) {
  const v = validateSiteUrl(siteUrl);
  if (!v.ok) {
    // Allow placeholder only for local default derivation in resolveBuildBasePath
    const u = (siteUrl || '').trim();
    if (!u) return { ok: false, reason: 'empty' };
    try {
      const parsed = new URL(u);
      const path = parsed.pathname.replace(/\/+$/, '') || '';
      if (!path || path === '') return { ok: true, base: '/' };
      return normalizeBasePath(path);
    } catch {
      return { ok: false, reason: 'malformed' };
    }
  }
  try {
    const parsed = new URL(v.url.endsWith('/') ? v.url : v.url);
    // validateSiteUrl strips trailing slash from pathname by reconstructing origin+pathname
    const full = new URL(siteUrl.trim());
    const path = full.pathname.replace(/\/+$/, '') || '';
    if (!path || path === '') return { ok: true, base: '/' };
    return normalizeBasePath(path);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}

/**
 * GitHub repository name (second path segment), or null.
 * @param {string} repoUrl
 * @returns {string | null}
 */
export function deriveGithubRepoName(repoUrl) {
  const v = validatePublicRepoUrl(repoUrl);
  if (!v.ok) return null;
  try {
    const parts = new URL(v.url).pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return parts[1];
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Resolve build-time Astro base path.
 * Priority: DRIFT0R_BASE_PATH → pathname of DRIFT0R_SITE_URL → default /drift0r.
 * When both explicit base and site URL are set, they must agree.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {{ ok: true, base: string, source: string } | { ok: false, reason: string }}
 */
export function resolveBuildBasePath(env = process.env) {
  const explicitRaw = (env.DRIFT0R_BASE_PATH || '').trim();
  const siteUrl = (env.DRIFT0R_SITE_URL || env.PUBLIC_SITE_URL || '').trim();
  const defaultSite = 'https://example.invalid/drift0r';

  /** @type {string | null} */
  let fromExplicit = null;
  if (explicitRaw) {
    const n = normalizeBasePath(explicitRaw);
    if (!n.ok) return { ok: false, reason: `DRIFT0R_BASE_PATH is ${n.reason}` };
    fromExplicit = n.base;
  }

  const siteForDerive = siteUrl || defaultSite;
  const fromSite = deriveBaseFromSiteUrl(siteForDerive);
  if (!fromSite.ok && siteUrl) {
    return { ok: false, reason: `cannot derive base from DRIFT0R_SITE_URL: ${fromSite.reason}` };
  }
  const siteBase = fromSite.ok ? fromSite.base : '/drift0r';

  if (fromExplicit && fromSite.ok && fromExplicit !== siteBase) {
    return {
      ok: false,
      reason:
        `DRIFT0R_BASE_PATH (${fromExplicit}) does not match site URL pathname base (${siteBase})`,
    };
  }

  if (fromExplicit) return { ok: true, base: fromExplicit, source: 'DRIFT0R_BASE_PATH' };
  if (siteUrl) return { ok: true, base: siteBase, source: 'DRIFT0R_SITE_URL' };
  return { ok: true, base: siteBase, source: 'default' };
}

/**
 * Prefix used in rendered HTML (href/src), with trailing slash for non-root.
 * @param {string} base normalized base
 */
export function baseHrefPrefix(base) {
  const n = normalizeBasePath(base);
  if (!n.ok) return null;
  if (n.base === '/') return '/';
  return `${n.base}/`;
}

/**
 * Scan HTML for project-base prefixes in href/src attributes.
 * Returns set of first path segments that look like site-absolute project bases
 * (single-segment prefixes used as /segment/...).
 *
 * @param {string} html
 * @returns {Set<string>} normalized bases like `/drift0r` or `/` if root-style routes only
 */
export function scanRenderedProjectBases(html) {
  const found = new Set();
  // Match site-absolute href/src that are not protocol-relative or external schemes
  const re = /(?:href|src)=["'](\/[^"'#?]*)/gi;
  let m;
  while ((m = re.exec(html))) {
    const path = m[1];
    if (!path || path.startsWith('//')) continue;
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) {
      found.add('/');
      continue;
    }
    // First segment is the project base for project-Pages deploys, or a top-level route for root.
    found.add(`/${parts[0]}`);
  }
  return found;
}

/**
 * Validate that rendered HTML agrees with the expected Astro base.
 *
 * @param {string} html
 * @param {string} expectedBase normalized
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function assertRenderedBaseMatches(html, expectedBase) {
  const n = normalizeBasePath(expectedBase);
  if (!n.ok) return { ok: false, reason: `expected base is ${n.reason}` };
  const exp = n.base;
  const prefix = baseHrefPrefix(exp);

  if (exp === '/') {
    // Root / custom-domain: must not ship a leftover project base that isn't a real route name.
    // Reject classic hard-coded /drift0r/ when deploying at root.
    if (/(?:href|src)=["']\/drift0r\//i.test(html)) {
      return {
        ok: false,
        reason:
          'rendered HTML contains /drift0r/ but configured base is / (root/custom-domain). Rebuild with matching base.',
      };
    }
    return { ok: true };
  }

  // Non-root project base: require correct prefix present; reject wrong /drift0r/ if not expected
  if (exp !== '/drift0r' && /(?:href|src)=["']\/drift0r\//i.test(html)) {
    return {
      ok: false,
      reason: `rendered HTML contains /drift0r/ but expected base is ${exp}`,
    };
  }

  if (!prefix) return { ok: false, reason: 'invalid expected base' };

  const hasExpected = new RegExp(
    `(?:href|src)=["']${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  ).test(html);
  if (!hasExpected) {
    return {
      ok: false,
      reason: `rendered HTML lacks internal ${prefix} href/src prefixes (expected Astro base ${exp})`,
    };
  }

  // Reject other single-segment project-like prefixes that dominate wrong hardcodes.
  // Allow expected first segment only for paths that look like base-prefixed site paths.
  // Routes under base: /base/case/ → first segment is base name — OK.
  // Wrong: /other/case when base is /drift0r.
  const wrong = [];
  const re = /(?:href|src)=["']\/([A-Za-z0-9._-]+)\//gi;
  let m;
  const expSeg = exp.slice(1);
  while ((m = re.exec(html))) {
    const seg = m[1];
    // Only flag if this looks like a mistaken *project* base rather than a root route.
    // Under project-Pages base, ALL site-absolute links should start with expSeg.
    if (seg !== expSeg) {
      wrong.push(seg);
    }
  }
  // If we saw any wrong first segments, fail (assets and pages all use base prefix)
  const uniqueWrong = [...new Set(wrong)];
  if (uniqueWrong.length > 0) {
    return {
      ok: false,
      reason:
        `rendered HTML has site-absolute paths with first segment(s) [${uniqueWrong.slice(0, 5).join(', ')}] ` +
        `but expected base is ${exp}`,
    };
  }

  return { ok: true };
}

/**
 * Full launch consistency: repo name, site pathname, configured base, manifest base, rendered HTML.
 *
 * Project Pages (hostname *.github.io with non-root path): repo name MUST equal site path segment.
 * Root / custom-domain (base `/`): repo name need not match path; HTML must not use a project base.
 *
 * @param {{
 *   repoUrl?: string,
 *   siteUrl?: string,
 *   basePath?: string,
 *   manifestBase?: string,
 *   htmlSamples?: string[],
 * }} args
 * @returns {{ ok: true, base: string } | { ok: false, reason: string }}
 */
export function assertBasePathConsistency(args) {
  const {
    repoUrl = '',
    siteUrl = '',
    basePath = '',
    manifestBase = '',
    htmlSamples = [],
  } = args;

  /** @type {string[]} */
  const bases = [];

  if (basePath) {
    const n = normalizeBasePath(basePath);
    if (!n.ok) return { ok: false, reason: `configured base_path is ${n.reason}` };
    bases.push(n.base);
  }
  if (manifestBase) {
    const n = normalizeBasePath(manifestBase);
    if (!n.ok) return { ok: false, reason: `manifest base_path is ${n.reason}` };
    bases.push(n.base);
  }
  if (siteUrl) {
    const d = deriveBaseFromSiteUrl(siteUrl);
    if (!d.ok) return { ok: false, reason: `site URL base is ${d.reason}` };
    bases.push(d.base);
  }

  // Project Pages: github.io + path, or any non-root site path, must match repo name when repo is GitHub.
  if (repoUrl && siteUrl) {
    const repoName = deriveGithubRepoName(repoUrl);
    const siteBase = deriveBaseFromSiteUrl(siteUrl);
    if (!siteBase.ok) return { ok: false, reason: `site URL base is ${siteBase.reason}` };

    let isGithubIo = false;
    try {
      const host = new URL(siteUrl.trim()).hostname;
      isGithubIo = /\.github\.io$/i.test(host);
    } catch {
      /* ignore */
    }

    if (siteBase.base !== '/') {
      // Non-root deploy path must equal repo name for GitHub project Pages (and we require it generally).
      if (repoName && siteBase.base !== `/${repoName}`) {
        return {
          ok: false,
          reason:
            `repo/site path mismatch: repository name is ${JSON.stringify(repoName)} but ` +
            `site URL pathname base is ${siteBase.base}` +
            (isGithubIo ? ' (GitHub project Pages path must equal the repository name)' : ''),
        };
      }
      bases.push(siteBase.base);
      if (repoName) bases.push(`/${repoName}`);
    } else {
      // Root / custom domain / user Pages
      bases.push('/');
    }
  } else if (repoUrl && !siteUrl) {
    const repoName = deriveGithubRepoName(repoUrl);
    if (repoName) bases.push(`/${repoName}`);
  }

  if (bases.length === 0) {
    return { ok: false, reason: 'no base path inputs to reconcile' };
  }

  const unique = [...new Set(bases)];
  if (unique.length !== 1) {
    return {
      ok: false,
      reason: `base path disagreement among inputs: ${unique.join(' vs ')}`,
    };
  }

  const agreed = unique[0];

  for (const html of htmlSamples) {
    if (!html) continue;
    const r = assertRenderedBaseMatches(html, agreed);
    if (!r.ok) return r;
  }

  return { ok: true, base: agreed };
}

/**
 * CI / workflow helper: validate PUBLIC_REPO_URL + SITE_URL and derive the agreed
 * Astro/Pages base_path. Single source of truth for pages.yml (no fragile shell parsing).
 *
 * - https://research.example.org and https://research.example.org/ → base `/`
 * - https://owner.github.io/repo → base `/repo`
 * - Non-root path that disagrees with the GitHub repository name → fail
 *
 * @param {{ repoUrl: string, siteUrl: string }} args
 * @returns {{
 *   ok: true,
 *   public_repo_url: string,
 *   site_url: string,
 *   base_path: string,
 * } | { ok: false, reason: string }}
 */
export function deriveCiDeployUrls({ repoUrl, siteUrl }) {
  const repo = validatePublicRepoUrl(repoUrl);
  if (!repo.ok) {
    return { ok: false, reason: `PUBLIC_REPO_URL is ${repo.reason} (${JSON.stringify(repoUrl)})` };
  }
  const site = validateSiteUrl(siteUrl);
  if (!site.ok) {
    return { ok: false, reason: `SITE_URL is ${site.reason} (${JSON.stringify(siteUrl)})` };
  }
  const consistency = assertBasePathConsistency({
    repoUrl: repo.url,
    siteUrl: siteUrl.trim(),
  });
  if (!consistency.ok) {
    return { ok: false, reason: consistency.reason };
  }
  return {
    ok: true,
    public_repo_url: repo.url,
    site_url: site.url,
    base_path: consistency.base,
  };
}

/**
 * CLI entry for GitHub Actions (pages.yml).
 * Usage: node scripts/repo-url.mjs --ci-deploy-urls --repo-url URL --site-url URL
 * Prints GitHub Actions output lines: public_repo_url=… site_url=… base_path=…
 */
function parseCliArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ci-deploy-urls') {
      out.mode = 'ci-deploy-urls';
      continue;
    }
    if (a === '--repo-url' && argv[i + 1]) {
      out.repoUrl = argv[++i];
      continue;
    }
    if (a === '--site-url' && argv[i + 1]) {
      out.siteUrl = argv[++i];
      continue;
    }
  }
  return out;
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseCliArgs(argv);
  if (args.mode !== 'ci-deploy-urls') {
    console.error(
      'Usage: node scripts/repo-url.mjs --ci-deploy-urls --repo-url URL --site-url URL',
    );
    process.exit(2);
  }
  const result = deriveCiDeployUrls({
    repoUrl: args.repoUrl || '',
    siteUrl: args.siteUrl || '',
  });
  if (!result.ok) {
    console.error(`DEPLOY URL DERIVATION REJECTED: ${result.reason}`);
    process.exit(1);
  }
  // GitHub Actions set-output style (append to $GITHUB_OUTPUT)
  console.log(`public_repo_url=${result.public_repo_url}`);
  console.log(`site_url=${result.site_url}`);
  console.log(`base_path=${result.base_path}`);
  console.error(
    `Using PUBLIC_REPO_URL=${result.public_repo_url} SITE_URL=${result.site_url} base_path=${result.base_path}`,
  );
}

// Run CLI only when this module is the process entrypoint.
const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === pathResolve(process.argv[1]);
if (isMain) {
  runCli();
}
