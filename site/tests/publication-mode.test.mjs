/**
 * Publication-mode mutation tests + source_class safety + release-scope gates.
 * Drives the SHIPPED site/src/lib/publication.ts module (not a reimplementation).
 * Requires Node --experimental-strip-types (see package.json "test" script).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { load as loadYaml } from 'js-yaml';
import { spawnSync } from 'node:child_process';

import {
  getSiteMode,
  filterClaimsForMode,
  filterHypothesesForMode,
  filterQuestionsForMode,
  filterUqsForMode,
  filterSpecialtyChannelsForMode,
  assertPublicationSafe,
  assertRouteApprovedForPublication,
  inferSourceClass,
  loadReleaseScope,
  resetReleaseScopeCache,
  literatureApplicabilityApproved,
} from '../src/lib/publication.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

const publicInvPath = join(
  repoRoot,
  'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml',
);
const inv = loadYaml(readFileSync(publicInvPath, 'utf8'));
const claims = inv.claims.filter(
  (c) => c.public_tier !== 'do_not_publish' && c.triage !== 'Do not publish',
);

const emptyScope = {
  version: 'test',
  approved_hypothesis_ids: [],
  approved_null_model: false,
  approved_question_ids: [],
  approved_uq_ids: [],
  approved_specialty_pathogens: [],
  approved_literature_applicability_ids: [],
  approved_hardcoded_routes: [],
};

describe('publication mode mutation (shipped publication.ts)', () => {
  it('defaults to preview', () => {
    assert.equal(getSiteMode({}), 'preview');
    assert.equal(getSiteMode({ DRIFT0R_SITE_MODE: 'preview' }), 'preview');
  });

  it('recognizes publication mode', () => {
    assert.equal(getSiteMode({ DRIFT0R_SITE_MODE: 'publication' }), 'publication');
  });

  it('unknown nonempty mode throws (typo publciation)', () => {
    assert.throws(
      () => getSiteMode({ DRIFT0R_SITE_MODE: 'publciation' }),
      /Unknown DRIFT0R_SITE_MODE/,
    );
    assert.throws(() => getSiteMode({ DRIFT0R_SITE_MODE: 'prod' }), /Unknown/);
  });

  it('publication filter returns only public_approved true claims', () => {
    const out = filterClaimsForMode(claims, 'publication');
    assert.ok(out.every((c) => c.public_approved === true));
    // Public inventory omits do_not_publish rows; ensure withheld IDs are absent
    assert.ok(!out.some((c) => c.id === 'CLM-0075' || c.id === 'CLM-0076'));
    assert.equal(out.length, 74);
  });

  it('site claim inventory resolution prefers public inventory (source contract)', () => {
    const src = readFileSync(join(siteRoot, 'src/lib/data.ts'), 'utf8');
    assert.match(src, /CLAIM_INVENTORY_PUBLIC_REL/);
    assert.match(src, /01_claim_inventory_public\.yaml/);
    // Must not hardcode the private monorepo inventory as the load path
    assert.doesNotMatch(src, /loadRepoYaml<[^>]*>\(\s*['"]audits\/2026-08-publication-readiness\/01_claim_inventory\.yaml['"]/);
    assert.doesNotMatch(src, /['"]audits\/2026-08-publication-readiness\/01_claim_inventory\.yaml['"]/);
  });

  it('preview still returns public-draft claims including unapproved', () => {
    const out = filterClaimsForMode(claims, 'preview');
    assert.ok(out.length > 0);
    // preview shows draft set regardless of approval flag
    assert.ok(out.length >= claims.filter((c) => c.public_tier !== 'do_not_publish').length - 2);
  });

  it('publication mode cannot leak unapproved claim IDs after mutation', () => {
    const mutated = claims.map((c, i) =>
      i === 0 ? { ...c, public_approved: true } : { ...c, public_approved: false },
    );
    const leaked = filterClaimsForMode(mutated, 'publication');
    assert.equal(leaked.length, 1);
    assert.equal(leaked[0].public_approved, true);
    assert.equal(leaked[0].id, mutated[0].id);
  });

  it('claim approval does not auto-approve hypotheses', () => {
    const hypFiles = readdirSync(join(repoRoot, 'differentials/hypotheses')).filter((f) =>
      f.endsWith('.yaml'),
    );
    const hyps = hypFiles.map((f) =>
      loadYaml(readFileSync(join(repoRoot, 'differentials/hypotheses', f), 'utf8')),
    );
    const h1 = hyps.find((h) => h.id === 'H1');
    assert.ok(h1);
    const allClaims = new Set([
      ...(h1.explains_claim_ids || []),
      ...(h1.does_not_explain_claim_ids || []),
    ]);
    // Empty scope: no hyps even with all claims "approved"
    const kept = filterHypothesesForMode(hyps, allClaims, 'publication', emptyScope);
    assert.equal(kept.length, 0);

    const scopeH1 = {
      ...emptyScope,
      approved_hypothesis_ids: ['H1'],
    };
    const kept2 = filterHypothesesForMode(hyps, allClaims, 'publication', scopeH1);
    assert.ok(kept2.some((h) => h.id === 'H1'));
    assert.ok(!kept2.some((h) => h.id === 'H-NULL'));
  });

  it('H-NULL fails closed without approved_null_model', () => {
    const hypFiles = readdirSync(join(repoRoot, 'differentials/hypotheses')).filter((f) =>
      f.endsWith('.yaml'),
    );
    const hyps = hypFiles.map((f) =>
      loadYaml(readFileSync(join(repoRoot, 'differentials/hypotheses', f), 'utf8')),
    );
    const withApproval = new Set(['CLM-0001']);
    const none = filterHypothesesForMode(hyps, withApproval, 'publication', {
      ...emptyScope,
      approved_null_model: false,
    });
    assert.ok(!none.some((h) => h.id === 'H-NULL'));

    const withNull = filterHypothesesForMode(hyps, withApproval, 'publication', {
      ...emptyScope,
      approved_null_model: true,
    });
    assert.ok(withNull.some((h) => h.id === 'H-NULL'));
  });

  it('assertPublicationSafe throws in publication with zero approved claims', () => {
    assert.throws(
      () => assertPublicationSafe('publication', 0, { surface: 'test' }),
      /fail-closed|zero public_approved/i,
    );
    assert.doesNotThrow(() => assertPublicationSafe('preview', 0));
    assert.doesNotThrow(() => assertPublicationSafe('publication', 1));
  });

  it('claimless questions fail closed without explicit question approval', () => {
    const qs = [
      { id: 'CQ-X', related_claim_ids: ['CLM-0001', 'CLM-0002'] },
      { id: 'CQ-Y', related_claim_ids: [] },
    ];
    const only1 = new Set(['CLM-0001']);
    const out = filterQuestionsForMode(qs, only1, 'publication', emptyScope);
    assert.equal(out.length, 0);

    const scoped = filterQuestionsForMode(qs, only1, 'publication', {
      ...emptyScope,
      approved_question_ids: ['CQ-Y'],
    });
    assert.ok(scoped.some((q) => q.id === 'CQ-Y'));
    assert.ok(!scoped.some((q) => q.id === 'CQ-X'));
  });

  it('UQs and specialty channels require explicit scope', () => {
    const uqs = filterUqsForMode(
      [{ id: 'UQ-1', related_claims: [] }],
      new Set(['CLM-0001']),
      'publication',
      emptyScope,
    );
    assert.equal(uqs.length, 0);

    const ch = filterSpecialtyChannelsForMode(
      [{ pathogen: 'Babesia', claim_ids: ['CLM-0036'] }],
      new Set(['CLM-0036']),
      'publication',
      emptyScope,
    );
    assert.equal(ch.length, 0);
  });

  it('route approval required for hardcoded medical surfaces', () => {
    assert.throws(
      () => assertRouteApprovedForPublication('publication', '/for-clinicians/', emptyScope),
      /approved_hardcoded_routes/,
    );
    assert.doesNotThrow(() =>
      assertRouteApprovedForPublication('publication', '/for-clinicians/', {
        ...emptyScope,
        approved_hardcoded_routes: ['/for-clinicians/'],
      }),
    );
  });

  it('literature applicability withheld without scope', () => {
    assert.equal(literatureApplicabilityApproved('lit-0104', 'preview', emptyScope), true);
    assert.equal(literatureApplicabilityApproved('lit-0104', 'publication', emptyScope), false);
    assert.equal(
      literatureApplicabilityApproved('lit-0104', 'publication', {
        ...emptyScope,
        approved_literature_applicability_ids: ['lit-0104'],
      }),
      true,
    );
  });

  it('live release_scope.yaml is explicit (v0.1 candidate lists required)', () => {
    resetReleaseScopeCache();
    delete process.env.DRIFT0R_RELEASE_SCOPE;
    const scope = loadReleaseScope(process.env);
    // Checkpoint F candidate populates explicit IDs — still fail-closed for unlisted surfaces.
    assert.ok(Array.isArray(scope.approved_hypothesis_ids));
    assert.ok(scope.approved_hypothesis_ids.includes('H1'));
    assert.equal(scope.approved_null_model, true);
    assert.ok(scope.approved_question_ids.includes('CQ-001'));
    assert.ok(scope.approved_hardcoded_routes.includes('/for-clinicians/'));
  });
});

describe('strict unknown-mode build must fail', () => {
  it('DRIFT0R_SITE_MODE=publciation causes build to fail (scratch outDir — never clobber site/dist)', () => {
    // G.2 P2: never run npm run build against the real site/dist during tests.
    const scratch = join(siteRoot, '.test-scratch-unknown-mode-dist');
    const r = spawnSync('npx', ['astro', 'build', '--outDir', scratch], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'publciation' },
      encoding: 'utf8',
      timeout: 180000,
    });
    assert.notEqual(r.status, 0, 'typo mode must fail build');
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    assert.match(out, /Unknown DRIFT0R_SITE_MODE|publciation/i);
  });
});

describe('zero-approval publication build must fail', () => {
  it('DRIFT0R_SITE_MODE=publication with empty release_scope fails closed', () => {
    // Live inventory may have public_approved claims for the release candidate.
    // Fail-closed is proven by emptying release_scope (no routes authorized).
    // Use scratch outDir so a failed/partial build cannot clobber site/dist (P0-4).
    const scopePath = join(siteRoot, 'src/data/release_scope.yaml');
    const backup = readFileSync(scopePath, 'utf8');
    const scratch = join(siteRoot, '.test-scratch-fail-dist');
    try {
      writeFileSync(
        scopePath,
        [
          'version: "0.0.0-test"',
          'approved_hypothesis_ids: []',
          'approved_null_model: false',
          'approved_question_ids: []',
          'approved_uq_ids: []',
          'approved_specialty_pathogens: []',
          'approved_literature_applicability_ids: []',
          'approved_hardcoded_routes: []',
          '',
        ].join('\n'),
        'utf8',
      );
      const r = spawnSync('npx', ['astro', 'build', '--outDir', scratch], {
        cwd: siteRoot,
        env: { ...process.env, DRIFT0R_SITE_MODE: 'publication' },
        encoding: 'utf8',
        timeout: 180000,
      });
      assert.notEqual(r.status, 0);
      const out = `${r.stdout || ''}\n${r.stderr || ''}`;
      assert.match(out, /fail-closed|approved_hardcoded_routes|zero public_approved/i);
    } finally {
      writeFileSync(scopePath, backup, 'utf8');
    }
  });

  it('intentional preview build uses scratch outDir (does not clobber publication dist)', () => {
    // P0-4: never silently downgrade site/dist to preview during npm test.
    const scratch = join(siteRoot, '.test-scratch-preview-dist');
    const r = spawnSync(
      'npx',
      ['astro', 'build', '--outDir', scratch],
      {
        cwd: siteRoot,
        env: { ...process.env, DRIFT0R_SITE_MODE: 'preview' },
        encoding: 'utf8',
        timeout: 180000,
      },
    );
    assert.equal(r.status, 0, `preview scratch build failed: ${r.stderr || r.stdout}`);

    // Write mode-aware manifest into the scratch dist
    const man = spawnSync('node', ['scripts/write-manifest.mjs'], {
      cwd: siteRoot,
      env: {
        ...process.env,
        DRIFT0R_SITE_MODE: 'preview',
        DRIFT0R_DIST_DIR: scratch,
      },
      encoding: 'utf8',
    });
    assert.equal(man.status, 0, man.stderr || man.stdout);

    // Preview artifact must not pass the publication gate
    const gate = spawnSync('node', ['scripts/require-publication-mode.mjs'], {
      cwd: siteRoot,
      env: {
        ...process.env,
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: scratch,
      },
      encoding: 'utf8',
    });
    assert.notEqual(gate.status, 0, 'preview scratch dist must fail publication gate');
    assert.match(
      `${gate.stdout || ''}\n${gate.stderr || ''}`,
      /preview|not publication|REJECTED/i,
    );
  });
});

/**
 * Isolated publication-mode dist for launch-gate URL tests.
 * Never uses site/dist — clean-checkout / pages.yml test-before-build safe.
 */
function writeUrlGateScratch(dir, { contributeBody, homeBody = 'site mode: publication', headers = [] }) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'about', 'contribute'), { recursive: true });
  writeFileSync(join(dir, 'index.html'), `<html><body>${homeBody}</body></html>`);
  writeFileSync(
    join(dir, 'about', 'contribute', 'index.html'),
    `<html><body>${contributeBody}</body></html>`,
  );
  writeFileSync(join(dir, '.nojekyll'), '');
  const files = [];
  function walk(d, prefix = '') {
    for (const name of readdirSync(d)) {
      const abs = join(d, name);
      const st = statSync(abs);
      if (st.isDirectory()) walk(abs, prefix ? `${prefix}/${name}` : name);
      else if (name !== '.artifact_manifest.txt') {
        files.push(prefix ? `${prefix}/${name}` : name);
      }
    }
  }
  walk(dir);
  files.sort();
  const digests = files.map((rel) => {
    const hex = createHash('sha256').update(readFileSync(join(dir, rel))).digest('hex');
    return { rel, hex };
  });
  const paths = [...files, '.artifact_manifest.txt'].sort();
  const hasBase = headers.some((l) => /base_path=/.test(l));
  const header = [
    '# site_mode=publication',
    '# DRIFT0R_SITE_MODE=publication',
    ...(hasBase ? [] : ['# base_path=/drift0r']),
    ...headers,
    '# digests:',
    ...digests.map((d) => `# ${d.rel} sha256=${d.hex}`),
    ...digests.map((d) => `# sha256 ${d.hex} ${d.rel}`),
    '# --- paths ---',
  ];
  writeFileSync(join(dir, '.artifact_manifest.txt'), header.join('\n') + '\n' + paths.join('\n') + '\n');
}

describe('deploy command requires publication mode', () => {
  it('require-publication-mode.mjs rejects env preview', () => {
    const r = spawnSync('node', ['scripts/require-publication-mode.mjs'], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'preview' },
      encoding: 'utf8',
    });
    assert.equal(r.status, 1);
  });
  it('require-publication-mode.mjs accepts publication only when dist is publication', () => {
    const r = spawnSync('node', ['scripts/require-publication-mode.mjs'], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'publication' },
      encoding: 'utf8',
    });
    // Pass only if dist was built in publication mode with digests; otherwise fail closed.
    // Local gate does not require PUBLIC_REPO_URL (launch gate is opt-in).
    if (r.status === 0) {
      assert.match(`${r.stdout || ''}`, /publication mode confirmed/i);
    } else {
      assert.match(
        `${r.stdout || ''}\n${r.stderr || ''}`,
        /REJECTED|preview|missing|digest/i,
      );
    }
  });

  it('launch gate rejects empty PUBLIC_REPO_URL when required (OBJECTIVE §10)', () => {
    // Isolated scratch: does not assume site/dist exists (clean checkout / pages.yml).
    // Exercises the URL condition — not merely “dist missing.”
    const scratch = join(siteRoot, '.test-scratch-empty-public-repo');
    writeUrlGateScratch(scratch, {
      contributeBody: `
        <p>site mode: publication</p>
        <div data-contribution-cta="unconfigured">
          A public repository URL has not been set — there is no actionable issue link yet.
          PUBLIC_REPO_URL in site constants is empty.
        </div>`,
      homeBody: 'site mode: publication — no contribution links',
      headers: [
        '# public_repo_url=',
        '# site_url=https://owner.github.io/drift0r',
      ],
    });
    const r = spawnSync(
      'node',
      ['scripts/require-publication-mode.mjs', '--require-public-repo'],
      {
        cwd: siteRoot,
        env: {
          ...process.env,
          DRIFT0R_SITE_MODE: 'publication',
          DRIFT0R_DIST_DIR: scratch,
          DRIFT0R_REQUIRE_PUBLIC_REPO_URL: '1',
          DRIFT0R_PUBLIC_REPO_URL: '',
          DRIFT0R_SITE_URL: 'https://owner.github.io/drift0r',
        },
        encoding: 'utf8',
      },
    );
    assert.notEqual(r.status, 0, 'empty public repo URL must fail launch gate');
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    assert.doesNotMatch(out, /dist missing/i, 'must exercise URL condition, not missing dist');
    assert.match(
      out,
      /actionable|rendered|contribution|PUBLIC_REPO_URL|public.repo|no actionable/i,
    );
  });

  it('launch gate rejects placeholder PUBLIC_REPO_URL', () => {
    const scratch = join(siteRoot, '.test-scratch-placeholder-public-repo');
    writeUrlGateScratch(scratch, {
      contributeBody: `
        <p>site mode: publication</p>
        <a href="https://example.invalid/drift0r/issues/new/choose">Report an issue</a>`,
      headers: [
        '# public_repo_url=https://example.invalid/drift0r',
        '# site_url=https://owner.github.io/drift0r',
      ],
    });
    const r = spawnSync(
      'node',
      ['scripts/require-publication-mode.mjs', '--require-public-repo'],
      {
        cwd: siteRoot,
        env: {
          ...process.env,
          DRIFT0R_SITE_MODE: 'publication',
          DRIFT0R_DIST_DIR: scratch,
          DRIFT0R_REQUIRE_PUBLIC_REPO_URL: '1',
          DRIFT0R_PUBLIC_REPO_URL: 'https://example.invalid/drift0r',
          DRIFT0R_SITE_URL: 'https://owner.github.io/drift0r',
        },
        encoding: 'utf8',
      },
    );
    assert.notEqual(r.status, 0, 'placeholder public repo URL must fail');
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    assert.doesNotMatch(out, /dist missing/i);
    assert.match(out, /placeholder|PUBLIC_REPO_URL|REJECTED/i);
  });

  it('pages.yml test-before-build sequence does not require site/dist (clean checkout)', () => {
    // Mirrors .github/workflows/pages.yml: npm run check + npm test before publication build.
    // URL-gate tests must use DRIFT0R_DIST_DIR scratch fixtures, never assume site/dist.
    const pubTest = readFileSync(join(siteRoot, 'tests/publication-mode.test.mjs'), 'utf8');
    assert.match(
      pubTest,
      /DRIFT0R_DIST_DIR:\s*scratch/,
      'empty-PUBLIC_REPO_URL launch gate test must pin DRIFT0R_DIST_DIR to an isolated scratch',
    );
    assert.match(
      pubTest,
      /writeUrlGateScratch|test-scratch-empty-public-repo/,
      'must construct an isolated publication artifact for the empty-URL case',
    );
    // Structural: pages.yml runs check then test before build:publication
    const workflow = readFileSync(join(repoRoot, '.github/workflows/pages.yml'), 'utf8');
    const checkIdx = workflow.indexOf('npm run check');
    const testIdx = workflow.indexOf('npm test');
    const buildIdx = workflow.indexOf('npm run build:publication');
    assert.ok(checkIdx > 0 && testIdx > checkIdx && buildIdx > testIdx,
      'pages.yml must run check → test → build:publication in that order');
    // When site/dist is absent, the empty-URL scratch fixture still fails for the right reason
    const realDist = join(siteRoot, 'dist');
    const distWasPresent = existsSync(realDist);
    let renamed = false;
    const park = join(siteRoot, '.test-park-dist-clean-checkout');
    try {
      if (distWasPresent) {
        rmSync(park, { recursive: true, force: true });
        // Prefer rename when possible to avoid copying large trees
        spawnSync('mv', [realDist, park], { encoding: 'utf8' });
        renamed = existsSync(park) && !existsSync(realDist);
      }
      assert.equal(existsSync(realDist), false, 'site/dist must be absent for this regression');
      const scratch = join(siteRoot, '.test-scratch-clean-checkout-empty-url');
      writeUrlGateScratch(scratch, {
        contributeBody:
          '<p>site mode: publication</p><p>no actionable issue link yet. PUBLIC_REPO_URL empty.</p>',
        headers: ['# public_repo_url=', '# site_url=https://owner.github.io/drift0r'],
      });
      const r = spawnSync(
        'node',
        ['scripts/require-publication-mode.mjs', '--require-public-repo'],
        {
          cwd: siteRoot,
          env: {
            ...process.env,
            DRIFT0R_SITE_MODE: 'publication',
            DRIFT0R_DIST_DIR: scratch,
            DRIFT0R_REQUIRE_PUBLIC_REPO_URL: '1',
            DRIFT0R_PUBLIC_REPO_URL: '',
            DRIFT0R_SITE_URL: 'https://owner.github.io/drift0r',
          },
          encoding: 'utf8',
        },
      );
      assert.notEqual(r.status, 0);
      const out = `${r.stdout || ''}\n${r.stderr || ''}`;
      assert.doesNotMatch(out, /dist missing/i);
      assert.match(out, /actionable|rendered|contribution|PUBLIC_REPO_URL/i);
    } finally {
      if (renamed && existsSync(park)) {
        spawnSync('mv', [park, realDist], { encoding: 'utf8' });
      }
    }
  });

  it('build:publication npm script applies DRIFT0R_SITE_MODE=publication to write-manifest (J.1)', () => {
    // Regression: `VAR=x cmd1 && cmd2` only sets VAR for cmd1. write-manifest must
    // also receive publication mode or the manifest header is site_mode=preview.
    const pkg = JSON.parse(readFileSync(join(siteRoot, 'package.json'), 'utf8'));
    const script = pkg.scripts['build:publication'] || '';
    const parts = script.split('&&').map((s) => s.trim());
    assert.ok(parts.length >= 2, 'build:publication must chain astro build and write-manifest');
    assert.match(parts[0], /DRIFT0R_SITE_MODE=publication/);
    assert.match(parts[0], /astro build/);
    assert.match(
      parts[1],
      /DRIFT0R_SITE_MODE=publication/,
      'write-manifest leg must set DRIFT0R_SITE_MODE=publication (not inherit only from first command)',
    );
    assert.match(parts[1], /write-manifest\.mjs/);
    const launch = pkg.scripts['build:publication:launch'] || '';
    assert.match(
      launch,
      /DRIFT0R_SITE_MODE=publication\s+node\s+scripts\/write-manifest\.mjs/,
      'build:publication:launch must also pass publication mode to write-manifest',
    );
  });

  it('htmlLooksLikePreviewArtifact detects preview marker', async () => {
    const { htmlLooksLikePreviewArtifact, PREVIEW_MODE_HTML_MARKER } = await import(
      '../src/lib/publication.ts'
    );
    assert.equal(htmlLooksLikePreviewArtifact(`x ${PREVIEW_MODE_HTML_MARKER} y`), true);
    assert.equal(htmlLooksLikePreviewArtifact('site mode: publication'), false);
  });
});

describe('source class never clinician_document for specialty PDFs (shipped inferSourceClass)', () => {
  const specialtyPaths = [
    'evidence/sources/Drift0r_BoneDensity_Summary.pdf',
    'evidence/sources/Drift0r_Endocrine_Summary.pdf',
    'evidence/sources/Drift0r_Imaging_Summary.pdf',
    'evidence/sources/Drift0r_infectious_disease_summary.pdf',
    'evidence/sources/Drift0r_MentalHealth_Summary.pdf',
    'evidence/sources/Drift0r_Rheumatology_Lab_Summary.pdf',
    'evidence/sources/Drift0r_Thiamine_Deficiency_Summary.pdf',
    'evidence/sources/Drift0r_urology_nephrology_summary.pdf',
    'evidence/sources/medical-psychological-history.pdf',
  ];

  it('inferSourceClass maps specialty PDFs to patient_compiled_summary', () => {
    for (const p of specialtyPaths) {
      const sc = inferSourceClass(p);
      assert.equal(sc, 'patient_compiled_summary', p);
      assert.notEqual(sc, 'clinician_document', p);
      assert.notEqual(sc, 'primary_instrument_record', p);
    }
  });

  it('inventory source_class never clinician_document/primary for specialty PDFs', () => {
    for (const c of inv.claims) {
      for (const s of c.patient_sources || []) {
        const p = (s.path || '').toLowerCase();
        if (p.includes('evidence/sources/') && p.endsWith('.pdf')) {
          assert.notEqual(s.source_class, 'clinician_document', `${c.id} ${s.path}`);
          assert.notEqual(s.source_class, 'primary_instrument_record', `${c.id} ${s.path}`);
        }
      }
    }
  });

  it('video transcript is video_statement', () => {
    assert.equal(
      inferSourceClass('evidence/sources/transcript-youtube-krP9EGyLCRE.txt'),
      'video_statement',
    );
  });
});

describe('patient approval status rendering', () => {
  it('for-clinicians source uses release.patient_approval dynamically', () => {
    const src = readFileSync(join(siteRoot, 'src/pages/for-clinicians.astro'), 'utf8');
    assert.match(src, /release\.patient_approval\.status/);
    assert.doesNotMatch(src, /patient approval: not obtained/);
    assert.doesNotMatch(src, /patient: not obtained/);
  });

  it('live release.yaml records patient approval obtained', () => {
    const rel = loadYaml(readFileSync(join(siteRoot, 'src/data/release.yaml'), 'utf8'));
    assert.equal(rel.patient_approval.status, 'obtained');
    assert.equal(rel.clinician_review_scope.status, 'not_reviewed');
    assert.equal(rel.noindex, true);
  });
});

describe('prediction matrix consistency', () => {
  it('CQ-005 maps to H1 not H4; CQ-009 maps to H4 not H5', () => {
    // Read shipped data.ts matrix definitions without importing the full module graph
    // (Node strip-types cannot resolve extensionless paths.ts imports used by Astro).
    const dataSrc = readFileSync(join(siteRoot, 'src/lib/data.ts'), 'utf8');
    // CQ-005 block must mention H1 and must not list H4 as a cell hypothesis nearby
    const cq5 = dataSrc.match(/question_id:\s*'CQ-005'[\s\S]*?question_id:\s*'CQ-009'/);
    assert.ok(cq5, 'CQ-005 block present');
    assert.match(cq5[0], /hypothesis_id:\s*'H1'/);
    assert.doesNotMatch(cq5[0], /hypothesis_id:\s*'H4'/);
    const cq9 = dataSrc.match(/question_id:\s*'CQ-009'[\s\S]*?\]\s*,\s*\n\s*\}/);
    assert.ok(cq9, 'CQ-009 block present');
    assert.match(cq9[0], /hypothesis_id:\s*'H4'/);
    assert.doesNotMatch(cq9[0], /hypothesis_id:\s*'H5'/);

    const cq5yaml = loadYaml(
      readFileSync(join(repoRoot, 'differentials/clinician_questions/CQ-005.yaml'), 'utf8'),
    );
    const cq9yaml = loadYaml(
      readFileSync(join(repoRoot, 'differentials/clinician_questions/CQ-009.yaml'), 'utf8'),
    );
    assert.ok((cq5yaml.related_hypothesis_ids || []).includes('H1'));
    assert.ok((cq9yaml.related_hypothesis_ids || []).includes('H4'));
  });
});
