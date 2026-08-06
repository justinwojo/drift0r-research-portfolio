/**
 * Build-time public site origin for canonical, Open Graph, and absolute asset URLs.
 *
 * Single configuration input: DRIFT0R_SITE_URL (Astro `site` / import.meta.env).
 * Must not hard-code production origin separately from the Astro base derivation.
 */

const PLACEHOLDER_RE =
  /example\.invalid|example\.com|localhost|127\.0\.0\.1|\.local\b|0\.0\.0\.0/i;

/**
 * Normalize a configured site URL to an origin (scheme + host, no path).
 * Pathname is intentionally stripped — Astro base handles project-path deploys;
 * custom-domain root deploys use base `/` and origin alone for absolute social URLs.
 */
export function siteOriginFromConfiguredUrl(raw: string | undefined | null): string {
  const u = (raw || '').trim();
  if (!u) return '';
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

/** True when the configured site URL is a real non-placeholder https origin. */
export function isRealSiteOrigin(origin: string): boolean {
  if (!origin) return false;
  if (PLACEHOLDER_RE.test(origin)) return false;
  try {
    const p = new URL(origin);
    return p.protocol === 'https:' && Boolean(p.hostname && p.hostname.includes('.'));
  } catch {
    return false;
  }
}

/**
 * Absolute URL for a site path under the configured origin.
 * @param origin e.g. https://drift0rresearch.org
 * @param path site-absolute path, with or without leading slash (e.g. /case/ or case/)
 */
export function absoluteSiteUrl(origin: string, path: string): string {
  const o = origin.replace(/\/+$/, '');
  if (!path || path === '/') return `${o}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${o}${p}`;
}

/**
 * Read configured site URL from Vite/Astro env (DRIFT0R_SITE_URL) or process.env.
 * Empty when unset (local defaults use placeholder in astro.config).
 */
export function readConfiguredSiteUrl(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const fromVite = (env?.DRIFT0R_SITE_URL || env?.PUBLIC_SITE_URL || '').trim();
    if (fromVite) return fromVite;
  } catch {
    /* non-vite */
  }
  if (typeof process !== 'undefined' && process.env?.DRIFT0R_SITE_URL) {
    return process.env.DRIFT0R_SITE_URL.trim();
  }
  if (typeof process !== 'undefined' && process.env?.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.trim();
  }
  return '';
}
