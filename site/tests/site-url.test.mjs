/**
 * Site origin / absolute URL helpers — custom-domain and project-path builds.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  siteOriginFromConfiguredUrl,
  isRealSiteOrigin,
  absoluteSiteUrl,
} from '../src/lib/siteUrl.ts';
import {
  deriveBaseFromSiteUrl,
  deriveCiDeployUrls,
  assertBasePathConsistency,
  assertRenderedBaseMatches,
} from '../scripts/repo-url.mjs';

describe('siteOriginFromConfiguredUrl', () => {
  it('strips path for custom domain', () => {
    assert.equal(
      siteOriginFromConfiguredUrl('https://drift0rresearch.org/'),
      'https://drift0rresearch.org',
    );
    assert.equal(
      siteOriginFromConfiguredUrl('https://drift0rresearch.org/case/'),
      'https://drift0rresearch.org',
    );
  });

  it('strips project path for github.io', () => {
    assert.equal(
      siteOriginFromConfiguredUrl('https://justinwojo.github.io/drift0r-research-portfolio'),
      'https://justinwojo.github.io',
    );
  });
});

describe('absoluteSiteUrl', () => {
  it('builds absolute canonicals under custom domain origin', () => {
    assert.equal(
      absoluteSiteUrl('https://drift0rresearch.org', '/case/'),
      'https://drift0rresearch.org/case/',
    );
    assert.equal(absoluteSiteUrl('https://drift0rresearch.org', '/'), 'https://drift0rresearch.org/');
  });
});

describe('isRealSiteOrigin', () => {
  it('accepts production custom domain', () => {
    assert.equal(isRealSiteOrigin('https://drift0rresearch.org'), true);
  });
  it('rejects placeholders', () => {
    assert.equal(isRealSiteOrigin('https://example.invalid'), false);
    assert.equal(isRealSiteOrigin(''), false);
  });
});

describe('custom-domain launch URL consistency (Checkpoint I P0)', () => {
  const SITE = 'https://drift0rresearch.org';
  const REPO = 'https://github.com/justinwojo/drift0r-research-portfolio';

  it('root-domain overrides derive Astro base /', () => {
    const ci = deriveCiDeployUrls({ repoUrl: REPO, siteUrl: SITE });
    assert.equal(ci.ok, true, JSON.stringify(ci));
    assert.equal(ci.ok && ci.base_path, '/');
    assert.equal(ci.ok && ci.site_url, SITE);
    assert.equal(ci.ok && ci.public_repo_url, REPO);
    assert.equal(deriveBaseFromSiteUrl(SITE).base, '/');
    assert.equal(deriveBaseFromSiteUrl(`${SITE}/`).base, '/');
  });

  it('rejects project-path base for the custom domain (rendered HTML with /drift0r/)', () => {
    const htmlWrong = '<a href="/drift0r/case/">Case</a><img src="/drift0r/_astro/x.css" />';
    const r = assertRenderedBaseMatches(htmlWrong, '/');
    assert.equal(r.ok, false, 'project-path prefixes must fail at custom-domain root');
    assert.match(r.ok ? '' : r.reason, /drift0r|root|custom/i);

    const consistency = assertBasePathConsistency({
      repoUrl: REPO,
      siteUrl: SITE,
      basePath: '/',
      manifestBase: '/',
      htmlSamples: [htmlWrong],
    });
    assert.equal(consistency.ok, false);
  });

  it('accepts root-relative HTML for custom domain', () => {
    const htmlOk = '<a href="/case/">Case</a><link href="/_astro/x.css" /><img src="/images/og-default.png" />';
    const r = assertRenderedBaseMatches(htmlOk, '/');
    assert.equal(r.ok, true, JSON.stringify(r));
    const consistency = assertBasePathConsistency({
      repoUrl: REPO,
      siteUrl: SITE,
      basePath: '/',
      manifestBase: '/',
      htmlSamples: [htmlOk],
    });
    assert.equal(consistency.ok, true, JSON.stringify(consistency));
    assert.equal(consistency.ok && consistency.base, '/');
  });

  it('rejects explicit project base path when site URL is custom-domain root', () => {
    // If operator mistakenly sets base /drift0r-research-portfolio with custom domain
    const c = assertBasePathConsistency({
      repoUrl: REPO,
      siteUrl: SITE,
      basePath: '/drift0r-research-portfolio',
    });
    assert.equal(c.ok, false, 'project base must not agree with custom-domain root');
  });
});
