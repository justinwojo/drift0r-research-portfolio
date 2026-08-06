/**
 * Checkpoint G.2.2 — public-repo root validation + CI deploy URL / base derivation.
 * Exercises site/scripts/repo-url.mjs (shared with constants.ts rules).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validatePublicRepoUrl,
  validateSiteUrl,
  deriveBaseFromSiteUrl,
  deriveCiDeployUrls,
  assertBasePathConsistency,
  isPublicRepoConfigured,
} from '../scripts/repo-url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');

describe('validatePublicRepoUrl — GitHub repository root (G.2.2)', () => {
  it('accepts exact owner/repo https roots (positive)', () => {
    for (const raw of [
      'https://github.com/owner/repo',
      'https://github.com/owner/repo/',
      'https://www.github.com/Acme-Org/drift0r',
      'https://github.com/testowner/other-name',
    ]) {
      const r = validatePublicRepoUrl(raw);
      assert.equal(r.ok, true, `should accept ${raw}: ${JSON.stringify(r)}`);
      assert.ok(r.ok && r.url.startsWith('https://'));
      assert.ok(r.ok && r.issuesNewChoose.endsWith('/issues/new/choose'));
      assert.equal(isPublicRepoConfigured(raw), true);
    }
  });

  it('rejects non-root GitHub URLs and surprises (negative)', () => {
    const negatives = [
      '',
      'https://example.invalid/owner/repo',
      'https://example.com/owner/repo',
      'http://github.com/owner/repo',
      'https://github.com/only-owner',
      'https://github.com/',
      'https://github.com/owner/repo/tree/main',
      'https://github.com/owner/repo/blob/main/README.md',
      'https://github.com/owner/repo/issues',
      'https://github.com/owner/repo/issues/new/choose',
      'https://github.com/owner/repo/wiki',
      'https://github.com/owner/repo/pulls',
      'https://github.com/owner/repo/actions',
      'https://github.com/owner/repo/settings',
      'https://github.com/owner/repo/extra/segment',
      'https://github.com/owner/repo?tab=readme-ov-file',
      'https://github.com/owner/repo#readme',
      'https://github.com/owner/repo/tree/main?foo=1',
      'not-a-url',
      'https://github.com/owner/repo with spaces',
    ];
    for (const raw of negatives) {
      const r = validatePublicRepoUrl(raw);
      assert.equal(r.ok, false, `should reject ${JSON.stringify(raw)}: ${JSON.stringify(r)}`);
      assert.equal(isPublicRepoConfigured(raw), false);
    }
  });

  it('accepts non-GitHub https hosts with a non-empty path', () => {
    const r = validatePublicRepoUrl('https://codeberg.org/org/repo');
    assert.equal(r.ok, true, JSON.stringify(r));
  });
});

describe('deriveBaseFromSiteUrl / deriveCiDeployUrls (G.2.1 / G.2.2)', () => {
  it('custom domain with or without trailing slash resolves to base /', () => {
    for (const site of [
      'https://research.example.org',
      'https://research.example.org/',
    ]) {
      const b = deriveBaseFromSiteUrl(site);
      assert.equal(b.ok, true, JSON.stringify(b));
      assert.equal(b.ok && b.base, '/');
      const ci = deriveCiDeployUrls({
        repoUrl: 'https://github.com/owner/repo',
        siteUrl: site,
      });
      assert.equal(ci.ok, true, JSON.stringify(ci));
      assert.equal(ci.ok && ci.base_path, '/');
      assert.equal(ci.ok && ci.public_repo_url, 'https://github.com/owner/repo');
    }
  });

  it('project Pages path resolves to /repo matching repository name', () => {
    const ci = deriveCiDeployUrls({
      repoUrl: 'https://github.com/owner/repo',
      siteUrl: 'https://owner.github.io/repo',
    });
    assert.equal(ci.ok, true, JSON.stringify(ci));
    assert.equal(ci.ok && ci.base_path, '/repo');
    assert.equal(deriveBaseFromSiteUrl('https://owner.github.io/repo').base, '/repo');
  });

  it('non-root path that disagrees with repository name fails', () => {
    const ci = deriveCiDeployUrls({
      repoUrl: 'https://github.com/owner/repo',
      siteUrl: 'https://owner.github.io/other-name',
    });
    assert.equal(ci.ok, false, 'path/repo mismatch must fail');
    assert.match(ci.ok ? '' : ci.reason, /mismatch|repository name|path/i);

    const c = assertBasePathConsistency({
      repoUrl: 'https://github.com/owner/repo',
      siteUrl: 'https://owner.github.io/other-name',
    });
    assert.equal(c.ok, false);
  });

  it('placeholder site or repo URLs fail closed', () => {
    assert.equal(
      deriveCiDeployUrls({
        repoUrl: 'https://example.invalid/owner/repo',
        siteUrl: 'https://owner.github.io/repo',
      }).ok,
      false,
    );
    assert.equal(
      deriveCiDeployUrls({
        repoUrl: 'https://github.com/owner/repo',
        siteUrl: 'https://example.com',
      }).ok,
      false,
    );
    assert.equal(validateSiteUrl('https://research.example.org').ok, true);
    assert.equal(validateSiteUrl('https://example.invalid/x').ok, false);
  });
});

describe('repo-url.mjs CLI for pages.yml', () => {
  it('prints public_repo_url, site_url, base_path for project Pages', () => {
    const r = spawnSync(
      'node',
      [
        'scripts/repo-url.mjs',
        '--ci-deploy-urls',
        '--repo-url',
        'https://github.com/acme/drift0r',
        '--site-url',
        'https://acme.github.io/drift0r',
      ],
      { cwd: siteRoot, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /public_repo_url=https:\/\/github\.com\/acme\/drift0r/);
    assert.match(r.stdout, /site_url=https:\/\/acme\.github\.io\/drift0r/);
    assert.match(r.stdout, /base_path=\/drift0r/);
  });

  it('prints base_path=/ for custom domain', () => {
    const r = spawnSync(
      'node',
      [
        'scripts/repo-url.mjs',
        '--ci-deploy-urls',
        '--repo-url',
        'https://github.com/acme/drift0r',
        '--site-url',
        'https://research.example.org/',
      ],
      { cwd: siteRoot, encoding: 'utf8' },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /base_path=\//);
  });

  it('exits non-zero on path/repo mismatch', () => {
    const r = spawnSync(
      'node',
      [
        'scripts/repo-url.mjs',
        '--ci-deploy-urls',
        '--repo-url',
        'https://github.com/acme/drift0r',
        '--site-url',
        'https://acme.github.io/other-name',
      ],
      { cwd: siteRoot, encoding: 'utf8' },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /mismatch|REJECTED|repository name/i);
  });

  it('exits non-zero on non-root GitHub repo URL', () => {
    const r = spawnSync(
      'node',
      [
        'scripts/repo-url.mjs',
        '--ci-deploy-urls',
        '--repo-url',
        'https://github.com/acme/drift0r/issues',
        '--site-url',
        'https://acme.github.io/drift0r',
      ],
      { cwd: siteRoot, encoding: 'utf8' },
    );
    assert.notEqual(r.status, 0);
  });
});
