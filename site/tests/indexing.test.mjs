/**
 * Indexing policy unit tests — release.yaml:noindex is the sole source for
 * robots meta polarity, provenance labels, and visitor-facing body copy.
 * robots.txt always allows crawl.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  robotsMetaContent,
  indexingProvenanceLabel,
  indexingStatusCompact,
  indexingPreviewLegend,
  indexingLedeClause,
  indexingApprovalSentence,
  indexingPreviewBulletClause,
  robotsTxtBody,
  STUCK_NOINDEX_BODY_PATTERNS,
} from '../src/lib/indexing.ts';

describe('robotsMetaContent (release.noindex single source)', () => {
  it('noindex: true → noindex, nofollow', () => {
    assert.equal(robotsMetaContent(true), 'noindex, nofollow');
  });

  it('noindex: false → index, follow (must not stick on noindex)', () => {
    assert.equal(robotsMetaContent(false), 'index, follow');
    assert.doesNotMatch(robotsMetaContent(false), /noindex/i);
  });
});

describe('indexingProvenanceLabel agrees with robots meta polarity', () => {
  it('true → disabled wording mentioning noindex', () => {
    const label = indexingProvenanceLabel(true);
    assert.match(label, /disabled/i);
    assert.match(label, /noindex/i);
  });

  it('false → enabled (must not say noindex or disabled)', () => {
    const label = indexingProvenanceLabel(false);
    assert.match(label, /enabled/i);
    assert.doesNotMatch(label, /noindex/i);
    assert.doesNotMatch(label, /disabled/i);
  });
});

describe('visitor-facing body helpers flip with noindex', () => {
  it('compact status', () => {
    assert.match(indexingStatusCompact(true), /disabled|noindex/i);
    assert.equal(indexingStatusCompact(false), 'enabled');
    assert.doesNotMatch(indexingStatusCompact(false), /noindex|disabled/i);
  });

  it('preview legend', () => {
    assert.match(indexingPreviewLegend(true), /noindex/i);
    assert.doesNotMatch(indexingPreviewLegend(false), /noindex/i);
    assert.match(indexingPreviewLegend(false), /indexing enabled/i);
  });

  it('lede / approval / bullet clauses', () => {
    assert.match(indexingLedeClause(true), /noindex/i);
    assert.doesNotMatch(indexingLedeClause(false), /noindex/i);
    assert.match(indexingApprovalSentence(true), /disabled|noindex/i);
    assert.doesNotMatch(indexingApprovalSentence(false), /disabled|noindex/i);
    assert.match(indexingPreviewBulletClause(true), /noindex/i);
    assert.doesNotMatch(indexingPreviewBulletClause(false), /noindex research/i);
    assert.match(indexingPreviewBulletClause(false), /indexing enabled/i);
  });

  it('stuck-noindex patterns match disabled copy only', () => {
    const disabledSample =
      'Public research preview · noindex. Indexing remains disabled (noindex). indexing: disabled · remains a noindex research preview. marked noindex until launch.';
    const enabledSample =
      'Public research preview · indexing enabled. Indexing is enabled for this release. indexing: enabled · research preview (indexing enabled).';
    for (const re of STUCK_NOINDEX_BODY_PATTERNS) {
      assert.match(disabledSample, re, String(re));
      assert.doesNotMatch(enabledSample, re, String(re));
    }
  });
});

describe('robotsTxtBody permits crawl', () => {
  it('allows fetch and has no Disallow: /', () => {
    const body = robotsTxtBody();
    assert.match(body, /User-agent:\s*\*/i);
    assert.match(body, /Allow:\s*\//i);
    assert.doesNotMatch(body, /Disallow:\s*\/\s*$/m);
    assert.doesNotMatch(body, /Disallow:\s*\/\s*\n/);
  });
});
