import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolve monorepo root robustly across:
 * - source (site/src/lib)
 * - Astro prerender bundles (site/dist/.prerender/chunks)
 * - tests run from site/
 */
function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), '..'),
    resolve(dirname(fileURLToPath(import.meta.url)), '../../..'),
    resolve(dirname(fileURLToPath(import.meta.url)), '../../../..'),
    resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..'),
  ];
  for (const c of candidates) {
    if (
      existsSync(resolve(c, 'ROADMAP.md')) &&
      existsSync(resolve(c, 'governance/public_allowlist.yaml'))
    ) {
      return c;
    }
  }
  // Fallback: parent of site when cwd is site/
  const fallback = resolve(process.cwd(), '..');
  if (existsSync(resolve(fallback, 'ROADMAP.md'))) return fallback;
  throw new Error(
    `Cannot locate monorepo root from cwd=${process.cwd()} meta=${import.meta.url}`,
  );
}

/** Absolute path to the monorepo root (parent of site/). */
export const REPO_ROOT = findRepoRoot();

/** Absolute path to the Astro site root (site/). */
export const SITE_ROOT = resolve(REPO_ROOT, 'site');

/**
 * Join the configured Astro base path with a site-absolute path.
 * Always returns a path starting with the base (e.g. /drift0r/case/).
 */
/**
 * Prefix an absolute site path with Astro base.
 * Safe when `import.meta.env` is absent (Node unit tests / strip-types).
 */
export function withBase(
  path: string,
  base: string = (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.BASE_URL === 'string' &&
    import.meta.env.BASE_URL) ||
    '/',
): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  if (!path || path === '/') return `${b}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}
