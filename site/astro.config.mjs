// @ts-check
import { defineConfig } from 'astro/config';
import { resolveBuildBasePath } from './scripts/repo-url.mjs';

/**
 * Build-time site origin, public repository URL, and Astro base path (G.2 / G.2.1).
 *
 * - DRIFT0R_SITE_URL: Astro `site` (canonical origin). Default local placeholder
 *   https://example.invalid/drift0r — publication launch gate rejects it.
 * - DRIFT0R_PUBLIC_REPO_URL: baked into contribution links via constants.ts.
 * - Astro `base`: derived from DRIFT0R_BASE_PATH or the pathname of DRIFT0R_SITE_URL
 *   (project Pages path). Must match the public repository name for *.github.io/<repo>
 *   deploys. Root `/` is used for user Pages / custom domains.
 *
 * Local default keeps base `/drift0r` so previews match the historical project path.
 */
const siteUrl = (process.env.DRIFT0R_SITE_URL || 'https://example.invalid/drift0r').trim();
const publicRepoUrl = (process.env.DRIFT0R_PUBLIC_REPO_URL || '').trim();

const baseResolved = resolveBuildBasePath(process.env);
if (!baseResolved.ok) {
  throw new Error(`astro.config: ${baseResolved.reason}`);
}
// Astro expects trailing slash for non-root bases in many setups; both work — use trailing form.
const basePath = baseResolved.base === '/' ? '/' : `${baseResolved.base}/`;

export default defineConfig({
  site: siteUrl,
  base: basePath,
  outDir: 'dist',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // No inline stylesheets that would break CSP-style reviews; keep assets in _astro/
    inlineStylesheets: 'never',
  },
  vite: {
    // Expose DRIFT0R_* to import.meta.env for build-time PUBLIC_REPO_URL / site metadata.
    envPrefix: ['PUBLIC_', 'DRIFT0R_'],
    define: {
      'import.meta.env.DRIFT0R_PUBLIC_REPO_URL': JSON.stringify(publicRepoUrl),
      'import.meta.env.DRIFT0R_SITE_URL': JSON.stringify(siteUrl),
      'import.meta.env.DRIFT0R_BASE_PATH': JSON.stringify(baseResolved.base),
    },
    server: {
      fs: {
        // Allow reading audited YAML from the monorepo root during build.
        allow: ['..'],
      },
    },
  },
});
