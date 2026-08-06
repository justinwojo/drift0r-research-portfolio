#!/usr/bin/env node
/**
 * Deployment / release commands must require explicit publication mode AND a
 * publication-mode dist artifact (Checkpoint G P0-4 / G.1 §10 / G.2).
 *
 * Checks:
 * 1. DRIFT0R_SITE_MODE === "publication"
 * 2. dist/.artifact_manifest.txt header mode === publication
 * 3. Exact equality: disk files == manifest path lines == digest paths
 *    (digests omit .artifact_manifest.txt; paths include it)
 * 4. lstat traversal; reject all symlinks; reject abs/traversal/dupes
 * 5. Per-file sha256 digests match disk
 * 6. Zero "site mode: preview" in dist HTML
 * 7. dist/.nojekyll must exist (never create it here)
 * 8. Astro site URL must not be placeholder (example.invalid, etc.)
 * 9. Launch gate (--require-public-repo / DRIFT0R_REQUIRE_PUBLIC_REPO_URL=1):
 *    PUBLIC_REPO_URL must be real https; contribution HTML must contain a matching
 *    actionable issues/new/choose link. Env override alone cannot certify HTML
 *    built with a different/empty URL.
 * 10. G.2.1 base-path consistency: public repo name, site URL pathname, configured
 *    Astro base, manifest base_path, and rendered href/src prefixes must agree.
 *    Root `/` is explicit for user Pages / custom domains.
 *
 * Usage: node scripts/require-publication-mode.mjs && …
 *        node scripts/require-publication-mode.mjs --require-public-repo
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  lstatSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validatePublicRepoUrl,
  validateSiteUrl,
  assertBasePathConsistency,
  assertRenderedBaseMatches,
  normalizeBasePath,
  resolveBuildBasePath,
} from './repo-url.mjs';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const distOverride = (process.env.DRIFT0R_DIST_DIR || '').trim();
const distDir = distOverride
  ? isAbsolute(distOverride)
    ? distOverride
    : join(siteRoot, distOverride)
  : join(siteRoot, 'dist');

const requirePublicRepo =
  process.argv.includes('--require-public-repo') ||
  process.argv.includes('--launch') ||
  ['1', 'true', 'yes'].includes(
    (process.env.DRIFT0R_REQUIRE_PUBLIC_REPO_URL || '').trim().toLowerCase(),
  );

/**
 * @param {string} rel
 */
function assertSafeRel(rel, label) {
  if (!rel) {
    fail(`empty path in ${label}`);
  }
  if (isAbsolute(rel) || rel.startsWith('/') || /^[A-Za-z]:[\\/]/.test(rel)) {
    fail(`${label} absolute path rejected: ${rel}`);
  }
  const norm = normalize(rel).split('\\').join('/');
  if (norm.split('/').includes('..')) {
    fail(`${label} traversal rejected: ${rel}`);
  }
  return rel.split('\\').join('/');
}

/**
 * @param {string} msg
 * @returns {never}
 */
function fail(msg) {
  console.error(`DEPLOY/RELEASE REJECTED: ${msg}`);
  process.exit(1);
}

const mode = (process.env.DRIFT0R_SITE_MODE || '').trim().toLowerCase();
if (mode !== 'publication') {
  fail(
    `DRIFT0R_SITE_MODE must be exactly "publication". ` +
      `Got ${JSON.stringify(process.env.DRIFT0R_SITE_MODE || '')}. ` +
      'Preview builds must not be deployed as public releases.',
  );
}

if (!existsSync(distDir)) {
  fail(`dist missing at ${distDir}`);
}

const distLstat = lstatSync(distDir);
if (distLstat.isSymbolicLink()) {
  fail(`dist root must not be a symlink: ${distDir}`);
}

const manifestPath = join(distDir, '.artifact_manifest.txt');
if (!existsSync(manifestPath)) {
  fail('missing dist/.artifact_manifest.txt — run build first');
}
if (lstatSync(manifestPath).isSymbolicLink()) {
  fail('dist/.artifact_manifest.txt must not be a symlink');
}

const nojekyll = join(distDir, '.nojekyll');
if (!existsSync(nojekyll) || !lstatSync(nojekyll).isFile() || lstatSync(nojekyll).isSymbolicLink()) {
  fail(
    'missing dist/.nojekyll (required for GitHub Pages _astro/). ' +
      'Never create it after certification — rebuild so write-manifest includes it.',
  );
}

const manifestText = readFileSync(manifestPath, 'utf8');
const headers = {};
/** @type {string[]} */
const pathLines = [];
/** @type {Map<string, string>} */
const digests = new Map();

for (const raw of manifestText.split('\n')) {
  const ln = raw.trim();
  if (!ln) continue;
  if (ln.startsWith('#')) {
    const body = ln.slice(1).trim();
    const shaM = body.match(/^sha256\s+([a-f0-9]{64})\s+(.+)$/i);
    if (shaM) {
      const rel = assertSafeRel(shaM[2].trim(), 'digest');
      const hex = shaM[1].toLowerCase();
      if (digests.has(rel) && digests.get(rel) !== hex) {
        fail(`conflicting digests for ${rel}`);
      }
      digests.set(rel, hex);
      continue;
    }
    const pathSha = body.match(/^(.+?)\s+sha256=([a-f0-9]{64})$/i);
    if (pathSha && !pathSha[1].includes('=')) {
      const rel = assertSafeRel(pathSha[1].trim(), 'digest');
      const hex = pathSha[2].toLowerCase();
      if (digests.has(rel) && digests.get(rel) !== hex) {
        fail(`conflicting digests for ${rel}`);
      }
      digests.set(rel, hex);
      continue;
    }
    if (body.includes('=') && !body.toLowerCase().startsWith('sha256')) {
      const eq = body.indexOf('=');
      const key = body.slice(0, eq).trim().toLowerCase();
      const val = body.slice(eq + 1).trim();
      if (key && !key.includes(' ')) headers[key] = val;
    }
    continue;
  }
  // path line
  if (ln.toLowerCase().includes(' sha256=')) {
    fail(`malformed path line (digest mixed into paths): ${ln}`);
  }
  pathLines.push(assertSafeRel(ln, 'manifest path'));
}

// Duplicates in path lines
{
  const seen = new Set();
  for (const p of pathLines) {
    if (seen.has(p)) fail(`duplicate manifest path: ${p}`);
    seen.add(p);
  }
}

const manifestMode = (
  headers['site_mode'] ||
  headers['drift0r_site_mode'] ||
  ''
).trim();
if (manifestMode !== 'publication') {
  fail(
    `artifact manifest mode is not publication. ` +
      `Got ${JSON.stringify(manifestMode || '(missing header)')}. ` +
      'Rebuild with DRIFT0R_SITE_MODE=publication; a preview dist must not pass this gate.',
  );
}

// Enumerate disk with lstat (never follow symlinks)
/** @type {string[]} */
const diskFiles = [];
/** @type {string[]} */
const htmlFiles = [];

function walkDisk(dir) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    let st;
    try {
      st = lstatSync(abs);
    } catch (e) {
      fail(`cannot lstat ${abs}: ${e}`);
    }
    if (st.isSymbolicLink()) {
      fail(`symlink in dist (rejected): ${relative(distDir, abs).split('\\').join('/')}`);
    }
    if (st.isDirectory()) {
      walkDisk(abs);
    } else if (st.isFile()) {
      const rel = assertSafeRel(relative(distDir, abs).split('\\').join('/'), 'disk');
      diskFiles.push(rel);
      if (name.endsWith('.html')) htmlFiles.push(abs);
    } else {
      fail(`non-file non-directory in dist: ${relative(distDir, abs)}`);
    }
  }
}
walkDisk(distDir);

const diskSet = new Set(diskFiles);
const pathSet = new Set(pathLines);
const digestSet = new Set(digests.keys());

// Exact equality: disk ↔ manifest paths
for (const p of diskSet) {
  if (!pathSet.has(p)) fail(`dist file missing from artifact manifest: ${p}`);
}
for (const p of pathSet) {
  if (!diskSet.has(p)) fail(`artifact manifest lists missing file: ${p}`);
}

// Digests must cover every file except the manifest itself
const expectedDigestPaths = new Set(
  [...diskSet].filter((p) => p !== '.artifact_manifest.txt'),
);
for (const p of expectedDigestPaths) {
  if (!digestSet.has(p)) fail(`missing digest for disk file: ${p}`);
}
for (const p of digestSet) {
  if (p === '.artifact_manifest.txt') continue;
  if (!expectedDigestPaths.has(p)) fail(`digest for path not on disk/manifest: ${p}`);
}

if (digests.size === 0) {
  fail('artifact manifest has no sha256 digests — rebuild with current write-manifest.mjs');
}

// Verify digests
let digestMismatches = 0;
for (const [rel, expected] of digests) {
  if (rel === '.artifact_manifest.txt') continue;
  const abs = join(distDir, rel);
  if (!existsSync(abs) || !lstatSync(abs).isFile() || lstatSync(abs).isSymbolicLink()) {
    console.error(`DEPLOY/RELEASE REJECTED: digest path missing or not a regular file: ${rel}`);
    digestMismatches++;
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
  if (actual !== expected) {
    console.error(`DEPLOY/RELEASE REJECTED: digest mismatch for ${rel}`);
    digestMismatches++;
  }
}
if (digestMismatches > 0) {
  fail(`${digestMismatches} digest check(s) failed`);
}

// Preview markers
const previewMarker = 'site mode: preview';
const previewHits = [];
for (const abs of htmlFiles) {
  const html = readFileSync(abs, 'utf8');
  if (html.includes(previewMarker)) {
    previewHits.push(relative(distDir, abs).split('\\').join('/'));
  }
}
if (previewHits.length > 0) {
  fail(
    `found "${previewMarker}" in ${previewHits.length} HTML file(s). ` +
      `Examples: ${previewHits.slice(0, 5).join(', ')}. ` +
      'This is a preview artifact; publication gate fails closed.',
  );
}

// --- Site URL gate (launch/deploy: never ship example.invalid) ---
const siteUrlFromEnv = (
  process.env.DRIFT0R_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  ''
).trim();
const siteUrlFromManifest = (headers['site_url'] || '').trim();
// Local no-deploy publication candidates may still use the Astro placeholder origin.
// Launch/deploy always requires a real https site URL baked into the build.
if (requirePublicRepo) {
  let htmlSitePlaceholder = false;
  for (const abs of htmlFiles.slice(0, 30)) {
    const html = readFileSync(abs, 'utf8');
    if (/example\.invalid/i.test(html)) {
      htmlSitePlaceholder = true;
      break;
    }
  }
  if (htmlSitePlaceholder) {
    fail(
      'built HTML references example.invalid — set DRIFT0R_SITE_URL to a real https origin ' +
        'before the publication build (Astro `site` must not ship the placeholder).',
    );
  }
  const siteForLaunch = siteUrlFromEnv || siteUrlFromManifest;
  const v = validateSiteUrl(siteForLaunch);
  if (!v.ok) {
    fail(
      `launch gate requires a real DRIFT0R_SITE_URL (https, non-placeholder). ` +
        `Got ${JSON.stringify(siteForLaunch || '')} (${v.reason}). ` +
        'https://example.invalid/drift0r must never deploy.',
    );
  }
} else if (siteUrlFromEnv) {
  // If operator supplies a site URL without launch flag, still reject placeholders.
  const v = validateSiteUrl(siteUrlFromEnv);
  if (!v.ok) {
    fail(
      `DRIFT0R_SITE_URL is ${v.reason} (${JSON.stringify(siteUrlFromEnv)}). ` +
        'Clear it for local placeholder builds or set a real https origin.',
    );
  }
}

// --- Public repo URL: baked (manifest + HTML) is authority; env must agree if set ---
const envRepo = (process.env.DRIFT0R_PUBLIC_REPO_URL || '').trim();
const manifestRepo = (headers['public_repo_url'] || '').trim();

const contributeRel = 'about/contribute/index.html';
const contributeAbs = join(distDir, contributeRel);
if (!existsSync(contributeAbs)) {
  fail(`missing contribution page ${contributeRel}`);
}
const contributeHtml = readFileSync(contributeAbs, 'utf8');

/** Extract first issues/new/choose href from contribution HTML. */
function extractIssuesLink(html) {
  const m =
    html.match(/href=["'](https:\/\/[^"']+\/issues\/new\/choose)["']/i) ||
    html.match(/href=["'](https:\/\/[^"']+\/issues\/new)["']/i);
  return m ? m[1].replace(/\/issues\/new(?:\/choose)?\/?$/i, '') : '';
}

const htmlRepo = extractIssuesLink(contributeHtml);
const hasActionableIssueLink = Boolean(htmlRepo);
const noActionablePhrases =
  /no actionable issue link|public remote not configured|PUBLIC_REPO_URL<\/span> in site/i.test(
    contributeHtml,
  );

// Always reject placeholder if any source sets one
for (const [label, raw] of [
  ['env DRIFT0R_PUBLIC_REPO_URL', envRepo],
  ['manifest public_repo_url', manifestRepo],
  ['contribution HTML repo', htmlRepo],
]) {
  if (!raw) continue;
  const v = validatePublicRepoUrl(raw);
  if (!v.ok) {
    fail(`${label} is ${v.reason} (${JSON.stringify(raw)})`);
  }
}

// --- G.2.1 base-path consistency (repo name ↔ site path ↔ Astro base ↔ manifest ↔ HTML) ---
const manifestBaseRaw = (headers['base_path'] || '').trim();
const envBaseRaw = (process.env.DRIFT0R_BASE_PATH || '').trim();
const siteForBase = siteUrlFromEnv || siteUrlFromManifest;
const repoForBase = envRepo || manifestRepo || htmlRepo || '';

/** Sample HTML for rendered base checks (home + contribute + a couple more). */
const htmlSamples = [];
for (const rel of ['index.html', contributeRel, 'case/index.html', 'literature/index.html']) {
  const abs = join(distDir, rel);
  if (existsSync(abs) && lstatSync(abs).isFile()) {
    htmlSamples.push(readFileSync(abs, 'utf8'));
  }
}
// Always include contribute (already read)
if (!htmlSamples.includes(contributeHtml)) htmlSamples.push(contributeHtml);

/**
 * Run base consistency when we have enough launch/URL signal.
 * Launch always requires full agreement. Non-launch still rejects clear
 * manifest-vs-rendered mismatches when base_path is recorded.
 */
function checkBasePathConsistency(strict) {
  const resolved = resolveBuildBasePath({
    ...process.env,
    DRIFT0R_SITE_URL: siteForBase || process.env.DRIFT0R_SITE_URL,
    DRIFT0R_BASE_PATH: envBaseRaw || process.env.DRIFT0R_BASE_PATH,
  });

  if (strict) {
    if (!manifestBaseRaw) {
      fail(
        'launch gate requires artifact manifest header base_path= (rebuild with current write-manifest.mjs)',
      );
    }
    if (!siteForBase) {
      fail('launch gate requires DRIFT0R_SITE_URL (or manifest site_url) to certify Pages base path');
    }
    if (!repoForBase) {
      fail('launch gate requires a public repository URL to certify project Pages base path');
    }
    const c = assertBasePathConsistency({
      repoUrl: repoForBase,
      siteUrl: siteForBase,
      basePath: envBaseRaw || (resolved.ok ? resolved.base : '') || manifestBaseRaw,
      manifestBase: manifestBaseRaw,
      htmlSamples,
    });
    if (!c.ok) fail(`base-path consistency: ${c.reason}`);
    return c.base;
  }

  // Non-strict: if manifest records base_path, rendered HTML must match it.
  if (manifestBaseRaw) {
    const n = normalizeBasePath(manifestBaseRaw);
    if (!n.ok) fail(`manifest base_path is ${n.reason}`);
    for (const html of htmlSamples) {
      const r = assertRenderedBaseMatches(html, n.base);
      if (!r.ok) fail(`base-path consistency: ${r.reason}`);
    }
    // If env/site/repo also present, full agreement
    if (repoForBase && siteForBase) {
      const c = assertBasePathConsistency({
        repoUrl: repoForBase,
        siteUrl: siteForBase,
        basePath: envBaseRaw || n.base,
        manifestBase: n.base,
        htmlSamples,
      });
      if (!c.ok) fail(`base-path consistency: ${c.reason}`);
      return c.base;
    }
    return n.base;
  }
  return resolved.ok ? resolved.base : '';
}

if (requirePublicRepo) {
  // Launch requires actionable rendered link — env alone is insufficient
  if (!hasActionableIssueLink || noActionablePhrases) {
    fail(
      'launch gate requires the *rendered* contribution page to include an actionable ' +
        'GitHub issues/new/choose link. Built HTML still says the public remote is not configured ' +
        'or lacks the link. Set DRIFT0R_PUBLIC_REPO_URL during the Astro publication build ' +
        '(build-time config), then re-run write-manifest and this gate. ' +
        'An environment override at gate time cannot certify HTML built with an empty/different URL.',
    );
  }
  const baked = validatePublicRepoUrl(htmlRepo);
  if (!baked.ok) {
    fail(`rendered contribution issue link is ${baked.reason}`);
  }
  // Env, if set, must match baked HTML
  if (envRepo) {
    const e = validatePublicRepoUrl(envRepo);
    if (!e.ok) fail(`DRIFT0R_PUBLIC_REPO_URL is ${e.reason}`);
    if (e.url !== baked.url) {
      fail(
        `DRIFT0R_PUBLIC_REPO_URL env (${e.url}) does not match rendered contribution repo (${baked.url}). ` +
          'Gate certifies rendered behavior; rebuild with the same URL.',
      );
    }
  }
  // Manifest, if set, must match baked
  if (manifestRepo) {
    const m = validatePublicRepoUrl(manifestRepo);
    if (!m.ok) fail(`manifest public_repo_url is ${m.reason}`);
    if (m.url !== baked.url) {
      fail(
        `manifest public_repo_url (${m.url}) does not match rendered contribution repo (${baked.url})`,
      );
    }
  }
  // Require issues/new/choose specifically
  if (!/\/issues\/new\/choose/i.test(contributeHtml)) {
    fail(
      'contribution page must link to issues/new/choose (issue template chooser), not a bare issues URL only',
    );
  }
  // G.2.2: homepage, contribution page, and site footer must each carry the same
  // actionable issue-template link (ContributionCta + persistent footer).
  const expectedIssuesChoose = `${baked.url}/issues/new/choose`;
  const homeAbs = join(distDir, 'index.html');
  if (!existsSync(homeAbs)) fail('missing homepage index.html for contribution CTA check');
  const homeHtml = readFileSync(homeAbs, 'utf8');
  const surfaces = [
    { label: 'homepage', html: homeHtml },
    { label: 'contribution page', html: contributeHtml },
  ];
  for (const { label, html } of surfaces) {
    if (!html.includes(expectedIssuesChoose)) {
      fail(
        `${label} must contain actionable issue-template link ${JSON.stringify(expectedIssuesChoose)} ` +
          '(ContributionCta / PUBLIC_REPO_URL build-time config).',
      );
    }
    if (!/data-contribution-cta=["']configured["']/.test(html)) {
      fail(`${label} must render data-contribution-cta="configured" contribution CTA`);
    }
    if (!/Report an issue or contribute research/i.test(html)) {
      fail(`${label} must include visible “Report an issue or contribute research” link text`);
    }
  }
  // Footer is persistent chrome: certify on homepage (and every page that uses SiteFooter).
  if (!/data-site-footer/.test(homeHtml) && !/site-footer/.test(homeHtml)) {
    fail('homepage missing site footer for contribution CTA certification');
  }
  // Footer CTA: require the issue link appears in the footer region when present
  const footerMatch = homeHtml.match(
    /<(?:footer)[^>]*class="[^"]*site-footer[^"]*"[\s\S]*?<\/footer>/i,
  );
  const footerHtml = footerMatch ? footerMatch[0] : homeHtml;
  if (!footerHtml.includes(expectedIssuesChoose)) {
    fail(
      `site footer must contain issue-template link ${JSON.stringify(expectedIssuesChoose)} ` +
        '(persistent ContributionCta variant=footer).',
    );
  }
  if (!/data-contribution-cta=["']configured["']/.test(footerHtml)) {
    fail('site footer must render data-contribution-cta="configured"');
  }

  const agreedBase = checkBasePathConsistency(true);
  console.log(
    `publication mode confirmed for deploy/release (manifest mode=publication, ` +
      `${htmlFiles.length} HTML files, 0 preview markers, ${digests.size} digests verified, ` +
      `exact path equality ok, public_repo_url=${JSON.stringify(baked.url)}, ` +
      `base_path=${JSON.stringify(agreedBase)}, ` +
      `issues link certified on homepage + ${contributeRel} + footer)`,
  );
} else {
  // Non-launch: still fail if env set against empty HTML
  if (envRepo && !hasActionableIssueLink) {
    fail(
      'DRIFT0R_PUBLIC_REPO_URL is set but contribution HTML has no actionable issue link. ' +
        'Rebuild with the same URL at build time, or clear the env override. ' +
        'Env alone cannot certify empty-rendered contribution pages.',
    );
  }
  if (envRepo && hasActionableIssueLink) {
    const e = validatePublicRepoUrl(envRepo);
    const h = validatePublicRepoUrl(htmlRepo);
    if (e.ok && h.ok && e.url !== h.url) {
      fail(
        `DRIFT0R_PUBLIC_REPO_URL env (${e.url}) does not match rendered repo (${h.url})`,
      );
    }
  }
  const agreedBase = checkBasePathConsistency(false);
  console.log(
    `publication mode confirmed for deploy/release (manifest mode=publication, ` +
      `${htmlFiles.length} HTML files, 0 preview markers, ${digests.size} digests verified, ` +
      `exact path equality ok, base_path=${JSON.stringify(agreedBase || '(default)')}, ` +
      `public_repo_url_launch_gate=skipped)`,
  );
}
