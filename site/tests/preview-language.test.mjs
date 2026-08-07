/**
 * F.1.1 language contracts (source + constants).
 * Rendered HTML assertions live in build-safety.test.mjs when dist/ exists.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

describe('F.1.1 preview language contracts', () => {
  it('constants export stable persistent notice and landing caveat', () => {
    const src = readFileSync(join(siteRoot, 'src/lib/constants.ts'), 'utf8');
    assert.match(src, /PERSISTENT_STATUS_NOTICE/);
    assert.match(
      src,
      /Research preview · Not medical advice · Published with Drift0r/,
    );
    assert.match(src, /Permission is not endorsement/);
    assert.match(src, /Not clinician-reviewed/);
    assert.match(src, /LANDING_OPENING_CAVEAT/);
    assert.match(src, /Initial research preview — incomplete and open to correction/);
  });

  it('landing page source contains required permission and non-endorsement language', () => {
    const src = readFileSync(join(siteRoot, 'src/pages/index.astro'), 'utf8');
    assert.match(src, /LANDING_OPENING_CAVEAT/);
    assert.match(src, /AI-assisted research portfolio/);
    assert.match(src, /Drift0r directly granted permission/);
    assert.match(src, /does\s*<strong>not<\/strong>\s*imply|does not imply/);
    assert.match(src, /Clinician review has\s*\n?\s*<strong>not<\/strong>\s*been\s*performed|Clinician review has not been performed/i);
    assert.match(src, /Licensed clinicians must verify all records/i);
    // J.2: no duplicate patient-permission callout; no marketing noindex lede token
    assert.doesNotMatch(src, /legend-label">Approval status|Approval status<\/strong>/);
    assert.doesNotMatch(src, /ledeIndexing|indexingLedeClause|indexingApprovalSentence/);
    assert.doesNotMatch(src, /landing-lede[\s\S]{0,200}noindex/i);
    // Contribution surface must come from the shared component, never hand-rolled hrefs.
    assert.match(src, /ContributionCta/);
    assert.match(src, /variant="home"/);
    assert.doesNotMatch(src, /landing-lede[\s\S]{0,300}incomplete and open to correction/i);
    /*
     * Working hypotheses are surfaced on the landing page with, for each record, what it
     * accounts for AND what it does not, plus a link into the full working model. The
     * section was renamed from "Current working synthesis" (.landing-synthesis) to
     * "What we think is going on" (.theories) in the plain-language rewrite; assert the
     * substance, which did not change, rather than the old class names.
     */
    assert.match(src, /theories|landing-synthesis|Current working synthesis/);
    assert.match(src, /Doesn't account for|May help explain|Important gap/);
    assert.match(src, /withBase\('\/working-model\/'\)|Full working model/);
    // The hypothesis section must not introduce a second disclaimer/status strip.
    assert.doesNotMatch(src, /theories-title[\s\S]{0,400}LANDING_OPENING_CAVEAT/);
    assert.doesNotMatch(src, /theories-title[\s\S]{0,400}StatusNotice|ProvenanceBar/);
  });

  it('BaseLayout injects StatusNotice on every route', () => {
    const src = readFileSync(join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf8');
    assert.match(src, /StatusNotice/);
    assert.match(src, /status-notice-bar/);
  });

  it('ContributionCta uses PUBLIC_REPO_URL helpers and never invents hrefs', () => {
    const cta = readFileSync(join(siteRoot, 'src/components/ContributionCta.astro'), 'utf8');
    assert.match(cta, /getPublicRepoContributionLinks/);
    assert.match(cta, /issuesNewChooseUrl|issues\/new\/choose/);
    assert.match(cta, /View project on GitHub|View on GitHub/);
    assert.match(cta, /Report an issue or contribute research/);
    assert.match(cta, /Browse existing issues|Browse issues/);
    assert.match(cta, /data-contribution-cta/);
    // J.2.1 home variant: primary action + policy behind contribute link
    assert.match(cta, /variant\?.*home|'home'/);
    assert.match(cta, /contribution-cta--home|data-contribution-variant/);
    assert.match(cta, /How to contribute safely|Full contribution safety policy/);
    const constants = readFileSync(join(siteRoot, 'src/lib/constants.ts'), 'utf8');
    assert.match(constants, /getPublicRepoContributionLinks/);
    assert.match(constants, /CONTRIBUTION_CTA_LEAD/);
    assert.match(constants, /CONTRIBUTION_CTA_ACCOUNT_NOTE/);
    // Placements
    for (const rel of [
      'src/pages/index.astro',
      'src/pages/literature/index.astro',
      'src/pages/about/contribute.astro',
      'src/pages/how-this-could-be-wrong.astro',
      'src/components/SiteFooter.astro',
    ]) {
      const src = readFileSync(join(siteRoot, rel), 'utf8');
      assert.match(src, /ContributionCta/, rel);
    }
  });

  it('homepage compact provenance summary is version + review-status only (source)', () => {
    const src = readFileSync(join(siteRoot, 'src/components/ProvenanceBar.astro'), 'utf8');
    assert.match(src, /prov-compact-summary|prov-compact-version/);
    assert.match(src, /reviewStatusLabel/);
    // Collapsed summary must not dump indexing/allowlist/patient approval
    const summaryBlock = src.match(/compact \? \([\s\S]*?<summary[\s\S]*?<\/summary>/);
    assert.ok(summaryBlock, 'compact summary block');
    assert.doesNotMatch(summaryBlock[0], /indexingLabel|allowlist|patient_approval|evidence_current_through/);
  });


  it('CONTRIBUTING and issue templates prohibit unsafe posts', () => {
    const contribPath = join(repoRoot, 'CONTRIBUTING.md');
    assert.ok(existsSync(contribPath), 'CONTRIBUTING.md required in public tree');
    const contrib = readFileSync(contribPath, 'utf8');
    assert.match(contrib, /private medical records/i);
    assert.match(contrib, /treatment instructions/i);
    assert.match(contrib, /unsupported diagnoses/i);
    assert.match(contrib, /unmoderated medical-advice discussion surface/i);

    const templates = [
      'literature_suggestion.yml',
      'factual_citation_correction.yml',
      'contradictory_evidence.yml',
      'alternative_hypothesis.yml',
    ];
    for (const t of templates) {
      const p = join(repoRoot, '.github/ISSUE_TEMPLATE', t);
      assert.ok(existsSync(p), t);
      const body = readFileSync(p, 'utf8');
      assert.match(body, /private medical records|personal identifiers/i, t);
    }
  });

  it('private monorepo Python requirements document PyYAML (when present)', () => {
    // Private monorepo only — sanitized export intentionally omits scripts/.
    const reqPath = join(repoRoot, 'scripts/requirements.txt');
    if (!existsSync(reqPath)) return;
    const req = readFileSync(reqPath, 'utf8');
    assert.match(req, /PyYAML/);
    const readme = readFileSync(join(repoRoot, 'scripts/README.md'), 'utf8');
    assert.match(readme, /pip install -r scripts\/requirements\.txt/);
  });
});
