#!/usr/bin/env node
/**
 * Write site/dist/.artifact_manifest.txt after Astro build.
 *
 * Format (Checkpoint G / G.2):
 * - Comment header with site_mode, public_repo_url, site_url, generation metadata
 * - Comment lines with per-file sha256 digests: `# sha256 <hex> <relpath>`
 * - One dist-relative path per non-comment line (sorted) for exact reconcile
 *
 * Integrity rules (G.2):
 * - lstat-based traversal; reject all symlinks (do not follow)
 * - reject absolute paths, `..` traversal, duplicate path lines
 * - digests cover every regular file except the manifest itself
 *
 * Dist root can be overridden via DRIFT0R_DIST_DIR (absolute or site-relative).
 */
import {
  readdirSync,
  lstatSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validatePublicRepoUrl,
  validateSiteUrl,
  resolveBuildBasePath,
  assertBasePathConsistency,
} from './repo-url.mjs';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const distOverride = (process.env.DRIFT0R_DIST_DIR || '').trim();
const distDir = distOverride
  ? isAbsolute(distOverride)
    ? distOverride
    : join(siteRoot, distOverride)
  : join(siteRoot, 'dist');

const rawMode = (process.env.DRIFT0R_SITE_MODE || 'preview').trim().toLowerCase();
const mode =
  rawMode === 'publication'
    ? 'publication'
    : rawMode === '' || rawMode === 'preview'
      ? 'preview'
      : rawMode;

/** Build-time public repo URL (same env the Astro build used). Empty is allowed for local preview. */
const publicRepoRaw = (process.env.DRIFT0R_PUBLIC_REPO_URL || '').trim();
const siteUrlRaw = (
  process.env.DRIFT0R_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  ''
).trim();

const baseResolved = resolveBuildBasePath(process.env);
if (!baseResolved.ok) {
  console.error(`write-manifest REJECTED: ${baseResolved.reason}`);
  process.exit(1);
}
const basePathHeader = baseResolved.base;

// If a non-empty URL is supplied at write time, it must be valid (fail closed).
if (publicRepoRaw) {
  const v = validatePublicRepoUrl(publicRepoRaw);
  if (!v.ok) {
    console.error(
      `write-manifest REJECTED: DRIFT0R_PUBLIC_REPO_URL is ${v.reason} (${JSON.stringify(publicRepoRaw)})`,
    );
    process.exit(1);
  }
}
if (siteUrlRaw) {
  const v = validateSiteUrl(siteUrlRaw);
  if (!v.ok) {
    console.error(
      `write-manifest REJECTED: DRIFT0R_SITE_URL is ${v.reason} (${JSON.stringify(siteUrlRaw)})`,
    );
    process.exit(1);
  }
}
// When both repo and site are set, require name/path/base agreement at manifest write time.
if (publicRepoRaw && siteUrlRaw) {
  const c = assertBasePathConsistency({
    repoUrl: publicRepoRaw,
    siteUrl: siteUrlRaw,
    basePath: basePathHeader,
  });
  if (!c.ok) {
    console.error(`write-manifest REJECTED: ${c.reason}`);
    process.exit(1);
  }
}

if (!existsSync(distDir)) {
  console.error(`dist missing at ${distDir} — run astro build first`);
  process.exit(1);
}

/** @type {string[]} */
const files = [];

/**
 * @param {string} rel
 */
function assertSafeRelPath(rel) {
  if (!rel || rel === '.' || rel === '..') {
    console.error(`write-manifest REJECTED: empty/invalid path ${JSON.stringify(rel)}`);
    process.exit(1);
  }
  if (isAbsolute(rel) || rel.startsWith('/') || /^[A-Za-z]:[\\/]/.test(rel)) {
    console.error(`write-manifest REJECTED: absolute path ${rel}`);
    process.exit(1);
  }
  const norm = normalize(rel).split('\\').join('/');
  if (norm.startsWith('../') || norm === '..' || norm.split('/').includes('..')) {
    console.error(`write-manifest REJECTED: traversal path ${rel}`);
    process.exit(1);
  }
  if (norm !== rel && norm.replace(/^\.\//, '') !== rel) {
    // allow only already-normalized relative posix paths
  }
  return rel.split('\\').join('/');
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: false });
  } catch (e) {
    console.error(`write-manifest REJECTED: cannot read dir ${dir}: ${e}`);
    process.exit(1);
  }
  for (const name of entries) {
    const abs = join(dir, name);
    let st;
    try {
      st = lstatSync(abs);
    } catch (e) {
      console.error(`write-manifest REJECTED: cannot lstat ${abs}: ${e}`);
      process.exit(1);
    }
    if (st.isSymbolicLink()) {
      console.error(
        `write-manifest REJECTED: symlink in dist: ${relative(distDir, abs).split('\\').join('/')}`,
      );
      process.exit(1);
    }
    if (st.isDirectory()) {
      walk(abs);
    } else if (st.isFile()) {
      const rel = assertSafeRelPath(relative(distDir, abs).split('\\').join('/'));
      if (rel === '.artifact_manifest.txt') continue;
      files.push(rel);
    } else {
      console.error(
        `write-manifest REJECTED: non-file non-directory entry in dist: ${relative(distDir, abs)}`,
      );
      process.exit(1);
    }
  }
}

walk(distDir);
files.sort((a, b) => a.localeCompare(b));

// Duplicates (should not happen with walk, but fail closed)
const seen = new Set();
for (const rel of files) {
  if (seen.has(rel)) {
    console.error(`write-manifest REJECTED: duplicate path ${rel}`);
    process.exit(1);
  }
  seen.add(rel);
}

/** @type {Array<{ path: string, sha256: string }>} */
const digests = [];
for (const rel of files) {
  const abs = join(distDir, rel);
  const st = lstatSync(abs);
  if (st.isSymbolicLink() || !st.isFile()) {
    console.error(`write-manifest REJECTED: not a regular file for digest: ${rel}`);
    process.exit(1);
  }
  const buf = readFileSync(abs);
  const sha256 = createHash('sha256').update(buf).digest('hex');
  digests.push({ path: rel, sha256 });
}

// Path list includes the manifest itself (written next) so exact reconcile can list it
const pathLines = [...files, '.artifact_manifest.txt'].sort((a, b) => a.localeCompare(b));

const publicRepoHeader = publicRepoRaw
  ? validatePublicRepoUrl(publicRepoRaw).ok
    ? validatePublicRepoUrl(publicRepoRaw).url
    : publicRepoRaw
  : '';
const siteUrlHeader = siteUrlRaw
  ? validateSiteUrl(siteUrlRaw).ok
    ? validateSiteUrl(siteUrlRaw).url
    : siteUrlRaw
  : '';

// Headers: site_mode= is the canonical validate_all key; DRIFT0R_SITE_MODE kept for require-publication-mode.
// base_path= is the Astro project base (G.2.1) — must match rendered href/src prefixes.
// Digests: dual form so both Node gate (# sha256 <hex> <path>) and Python (# path sha256=<hex>) parse.
const header = [
  `# site_mode=${mode}`,
  `# DRIFT0R_SITE_MODE=${mode}`,
  `# public_repo_url=${publicRepoHeader}`,
  `# site_url=${siteUrlHeader}`,
  `# base_path=${basePathHeader}`,
  `# generated_at=${new Date().toISOString()}`,
  `# file_count=${pathLines.length}`,
  `# format=paths + sha256 digests (comment lines); path lines for allowlist reconcile`,
  `# digests:`,
  ...digests.map((d) => `# ${d.path} sha256=${d.sha256}`),
  ...digests.map((d) => `# sha256 ${d.sha256} ${d.path}`),
  `# --- paths ---`,
];

const out = join(distDir, '.artifact_manifest.txt');
writeFileSync(out, header.join('\n') + '\n' + pathLines.join('\n') + '\n', 'utf8');
console.log(
  `Wrote ${pathLines.length} paths + ${digests.length} digests to .artifact_manifest.txt ` +
    `(mode=${mode}, base_path=${basePathHeader}, public_repo_url=${JSON.stringify(publicRepoHeader || '')}, ` +
    `site_url=${JSON.stringify(siteUrlHeader || '')})`,
);
