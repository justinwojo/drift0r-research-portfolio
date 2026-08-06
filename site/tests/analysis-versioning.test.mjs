/**
 * Analysis versioning + changelog consistency (H.1.3 addendum).
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

function loadSiteYaml(rel) {
  return loadYaml(readFileSync(join(siteRoot, rel), 'utf8'));
}

describe('analysis versioning', () => {
  it('live release has evidence_current_through and matching changelog tip', () => {
    const release = loadSiteYaml('src/data/release.yaml');
    const changelog = loadSiteYaml('src/data/changelog.yaml');
    assert.ok(release.content_version, 'content_version required');
    assert.ok(release.evidence_current_through, 'evidence_current_through required');
    assert.match(release.evidence_current_through, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(release.noindex, false, 'published release must enable indexing');
    assert.ok(Array.isArray(changelog.entries) && changelog.entries.length > 0);
    const newest = changelog.entries[0];
    assert.equal(
      newest.version,
      release.content_version,
      'newest changelog version must equal live content_version',
    );
    assert.equal(
      newest.evidence_current_through,
      release.evidence_current_through,
      'evidence_current_through must match newest changelog entry',
    );
    for (const section of [
      'added_evidence',
      'changed_interpretations',
      'strengthened_or_weakened_hypotheses',
      'retired_or_superseded',
      'corrections',
    ]) {
      assert.ok(section in newest, `changelog tip missing ${section}`);
      assert.ok(Array.isArray(newest[section]), `${section} must be array`);
    }
    assert.ok(['patch', 'minor', 'major'].includes(newest.kind));
  });

  it('changelog versions are unique and COR ids are well-formed', () => {
    const changelog = loadSiteYaml('src/data/changelog.yaml');
    const seen = new Set();
    for (const e of changelog.entries) {
      assert.ok(!seen.has(e.version), `duplicate version ${e.version}`);
      seen.add(e.version);
      for (const c of e.corrections || []) {
        assert.match(c, /^COR-\d{4}$/);
      }
      for (const r of e.retired_or_superseded || []) {
        assert.ok(r.id);
        assert.ok(r.status === 'retired' || r.status === 'superseded');
        if (r.status === 'superseded') {
          assert.ok(r.replaced_by, `superseded ${r.id} needs replaced_by`);
        }
      }
    }
  });

  it('release packaging claims are honest (created vs merely planned)', () => {
    const changelog = loadSiteYaml('src/data/changelog.yaml');
    for (const e of changelog.entries) {
      if (e.github_release_published) {
        assert.ok(
          e.git_tag,
          `${e.version}: github_release_published requires git_tag (a Release needs a real tag)`,
        );
      }
      if (e.git_tag) {
        assert.equal(
          e.git_tag,
          e.version,
          `${e.version}: git_tag must match the entry version`,
        );
      }
    }
    // The published tip must state its packaging explicitly rather than silently omitting it.
    const release = loadSiteYaml('src/data/release.yaml');
    const newest = changelog.entries[0];
    if (newest.status === 'published' && release.review_status === 'published') {
      assert.ok(
        newest.git_tag || newest.git_tag_planned,
        `${newest.version}: a published tip must record git_tag (created) or git_tag_planned (pending)`,
      );
    }
  });

  it('allowlist includes RELEASE_VERSIONING.md and matches release allowlist_version', () => {
    const release = loadSiteYaml('src/data/release.yaml');
    const allow = loadYaml(
      readFileSync(join(repoRoot, 'governance/public_allowlist.yaml'), 'utf8'),
    );
    assert.equal(String(allow.version), String(release.allowlist_version));
    assert.ok(
      (allow.v1_public_repository || []).includes('governance/RELEASE_VERSIONING.md'),
    );
    assert.ok(existsSync(join(repoRoot, 'governance/RELEASE_VERSIONING.md')));
  });

  it('built dist surfaces analysis version and evidence currency when present', () => {
    const release = loadSiteYaml('src/data/release.yaml');
    const home = join(siteRoot, 'dist/index.html');
    const changelog = join(siteRoot, 'dist/changelog/index.html');
    if (!existsSync(home) || !existsSync(changelog)) {
      // dist optional for unit-only runs
      return;
    }
    const homeHtml = readFileSync(home, 'utf8');
    const clHtml = readFileSync(changelog, 'utf8');
    assert.match(homeHtml, /Analysis version/i);
    assert.ok(homeHtml.includes(release.content_version));
    assert.ok(homeHtml.includes(release.evidence_current_through));
    assert.match(clHtml, /Added evidence/i);
    assert.match(clHtml, /Changed interpretations/i);
    assert.match(clHtml, /Strengthened or weakened hypotheses/i);
    assert.match(clHtml, /Retired \/ superseded findings/i);
    assert.match(clHtml, /Corrections/i);
    assert.ok(clHtml.includes(release.content_version));
    assert.ok(!clHtml.includes('/releases/v0.1/'));
  });
});
