/**
 * Language safety tests — import real modules (not re-implementations).
 * Checkpoint G P1-02 / P3-44.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

import {
  toPublicLanguage,
  findForbiddenPhrases,
  hasForbiddenPhrasing,
  findForbiddenTreatmentPatterns,
  assertSafePublicLanguage,
  polarityForClaim,
  REPLACEMENTS,
} from '../src/lib/language.ts';
import { FORBIDDEN_PHRASES, FORBIDDEN_TREATMENT_PATTERNS } from '../src/lib/constants.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

describe('public language transforms (real modules)', () => {
  it('exports non-empty REPLACEMENTS and FORBIDDEN_PHRASES from shared modules', () => {
    assert.ok(REPLACEMENTS.length >= 9);
    assert.ok(FORBIDDEN_PHRASES.length >= 20);
    assert.ok(FORBIDDEN_TREATMENT_PATTERNS.length >= 1);
  });

  it('rewrites catastrophic osteoporosis', () => {
    assert.equal(toPublicLanguage('catastrophic osteoporosis noted'), 'markedly low BMD noted');
  });

  it('rewrites severe osteoporosis', () => {
    assert.match(toPublicLanguage('severe osteoporosis age 38'), /markedly low BMD for age/i);
  });

  it('rewrites almost certainly', () => {
    assert.match(toPublicLanguage('almost certainly metabolic'), /current working model favors/);
  });

  it('does not invent numeric probabilities', () => {
    const text = toPublicLanguage('confidence is medium');
    assert.doesNotMatch(text, /\d+%/);
  });

  it('strips prescription dose/frequency tokens from public text', () => {
    const out = toPublicLanguage('clomiphene 25 mg daily; anastrozole 1 mg weekly');
    assert.doesNotMatch(out, /\d+\s*mg/i);
    assert.match(out, /dose withheld/i);
  });

  it('preserves laboratory measurement values (Checkpoint H P0-1)', () => {
    const samples = [
      'Serum tryptase elevated (17.7 µg/L on 2025-10-01; 14.5 mcg/L on 2026-06 panel) above ref <11',
      '24-hour urine calcium values 283 → 254 → 333 mg/24h (male; common threshold often 300 mg/day or 4 mg/kg — 2 of 3 collections below 300)',
      'Hib IgG titer non-protective (0.33 mcg/mL, ref ≥1.00)',
    ];
    for (const s of samples) {
      const out = toPublicLanguage(s);
      assert.doesNotMatch(out, /dose withheld/i, s);
      assert.match(out, /17\.7|14\.5|0\.33|283|254|333|300|4/, s);
    }
  });

  it('does not rewrite mid-hyphenated drug tokens', () => {
    const out = toPublicLanguage('historical-clomiphene-response');
    assert.equal(out, 'historical-clomiphene-response');
  });

  it('rewrites severe early osteoporosis interleaved form', () => {
    assert.match(toPublicLanguage('severe early osteoporosis noted'), /markedly low BMD for age/i);
  });

  it('findForbiddenPhrases uses real FORBIDDEN_PHRASES', () => {
    const hits = findForbiddenPhrases('this is a boss fight');
    assert.ok(hits.includes('boss fight'));
    assert.equal(hasForbiddenPhrasing('safe text about BMD'), false);
  });

  it('detects treatment patterns', () => {
    assert.ok(findForbiddenTreatmentPatterns('needing anabolic therapy').length >= 1);
  });

  it('assertSafePublicLanguage throws on residual forbidden phrases', () => {
    assert.throws(
      () =>
        assertSafePublicLanguage([{ surface: 'test', text: 'order this test now' }], {
          checkTreatment: false,
        }),
      /Unsafe public language|forbidden phrase/i,
    );
  });

  it('polarityForClaim helper', () => {
    assert.equal(polarityForClaim('CLM-0001', ['CLM-0001'], []), '+');
    assert.equal(polarityForClaim('CLM-0002', [], ['CLM-0002']), '−');
    assert.equal(polarityForClaim('CLM-0003', [], []), '·');
  });
});

describe('claim inventory safety for site body sources', () => {
  const publicPath = join(
    repoRoot,
    'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml',
  );
  const privatePath = join(
    repoRoot,
    'audits/2026-08-publication-readiness/01_claim_inventory.yaml',
  );
  const inv = loadYaml(readFileSync(publicPath, 'utf8'));

  it('public inventory has 79 approved A/B/C claims and accurate meta', () => {
    assert.equal(inv.claims.length, 79);
    assert.equal(inv.meta.claim_count, 79);
    assert.ok(inv.claims.every((c) => c.public_approved === true));
    assert.ok(!inv.claims.some((c) => c.public_tier === 'do_not_publish'));
    assert.ok(!('Do not publish' in (inv.meta.tier_counts || {})));
  });

  it('private inventory (if present in monorepo) keeps do_not_publish unapproved', () => {
    if (!existsSync(privatePath)) return;
    const priv = loadYaml(readFileSync(privatePath, 'utf8'));
    const dnp = priv.claims.filter((c) => c.public_tier === 'do_not_publish');
    assert.ok(dnp.length >= 1);
    assert.ok(dnp.every((c) => c.public_approved === false));
  });

  it('flags forbidden phrasing if present in claim statements (after public language)', () => {
    const hits = [];
    for (const c of inv.claims) {
      if (c.public_tier === 'do_not_publish') continue;
      const publicText = toPublicLanguage(c.statement);
      const f = findForbiddenPhrases(publicText);
      if (f.length) hits.push({ id: c.id, f });
    }
    assert.deepEqual(hits, []);
  });
});

describe('hypothesis polarity and what-would-change', () => {
  const hyps = ['H1', 'H2', 'H3', 'H4', 'H5'].map((id) =>
    loadYaml(readFileSync(join(repoRoot, `differentials/hypotheses/${id}.yaml`), 'utf8')),
  );
  const nullHyp = loadYaml(
    readFileSync(join(repoRoot, 'differentials/hypotheses/H-NULL.yaml'), 'utf8'),
  );

  it('loads five ranked hypotheses plus H-NULL', () => {
    assert.equal(hyps.length, 5);
    assert.equal(nullHyp.id, 'H-NULL');
    assert.equal(nullHyp.kind, 'null_model');
  });

  it('H4 has both support and contradiction literature', () => {
    const h4 = hyps.find((h) => h.id === 'H4');
    assert.ok(h4.supporting_literature_ids.length >= 1);
    assert.ok(h4.contradicting_literature_ids.length >= 1);
  });

  it('every hypothesis has open questions for what-would-change', () => {
    for (const h of hyps) {
      assert.ok(
        Array.isArray(h.open_question_ids) && h.open_question_ids.length >= 1,
        `${h.id} missing open_question_ids`,
      );
    }
  });

  it('support and contradiction claim lists are disjoint per hypothesis', () => {
    for (const h of hyps) {
      const a = new Set(h.explains_claim_ids || []);
      for (const id of h.does_not_explain_claim_ids || []) {
        assert.equal(a.has(id), false, `${h.id} overlaps on ${id}`);
      }
    }
  });

  it('hypothesis summaries clean under toPublicLanguage', () => {
    for (const h of hyps) {
      const publicSum = toPublicLanguage(h.summary);
      assert.equal(hasForbiddenPhrasing(publicSum), false, h.id);
    }
  });
});

describe('specialty LDT two-channel requirement', () => {
  const inv = loadYaml(
    readFileSync(
      join(repoRoot, 'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml'),
      'utf8',
    ),
  );
  const byId = Object.fromEntries(inv.claims.map((c) => [c.id, c]));

  it('has Babesia and Bartonella specialty claims', () => {
    assert.ok(byId['CLM-0036']);
    assert.ok(byId['CLM-0037']);
  });

  it('infection claims are not labeled verified primary', () => {
    assert.notEqual(byId['CLM-0036'].verification_status, 'verified');
    assert.notEqual(byId['CLM-0037'].verification_status, 'verified');
  });
});

describe('clinician questions forbid order language', () => {
  const files = ['CQ-001', 'CQ-002', 'CQ-005', 'CQ-009'];
  for (const id of files) {
    it(`${id} question+rationale clean after public language`, () => {
      const q = loadYaml(
        readFileSync(join(repoRoot, `differentials/clinician_questions/${id}.yaml`), 'utf8'),
      );
      assert.ok(Array.isArray(q.forbidden_phrasings));
      assert.ok(q.forbidden_phrasings.some((p) => /order this test now/i.test(p)));
      const text = toPublicLanguage(`${q.question}\n${q.rationale}`);
      assert.equal(hasForbiddenPhrasing(text), false, id);
    });
  }
});

describe('corrections register exact equality (P1-01)', () => {
  it('site CORRECTIONS match CORRECTIONS.md IDs and count 32', async () => {
    const { getCorrections, resetDataCaches } = await import('../src/lib/data.ts');
    resetDataCaches();
    const site = getCorrections();
    const md = readFileSync(
      join(repoRoot, 'audits/2026-08-publication-readiness/CORRECTIONS.md'),
      'utf8',
    );
    const mdIds = [...md.matchAll(/^### (COR-\d{4})\s*—\s*(.+)$/gm)].map((m) => ({
      id: m[1],
      title: m[2].trim(),
    }));
    assert.equal(mdIds.length, 32, 'register must list 32 corrections');
    assert.equal(site.length, 32, 'site must publish 32 corrections');
    assert.deepEqual(
      site.map((c) => c.id),
      mdIds.map((c) => c.id),
    );
    // Titles must match register headings (normalize quotes)
    const norm = (s) => s.replace(/[“”"']/g, '"').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < 32; i++) {
      assert.equal(
        norm(site[i].title),
        norm(mdIds[i].title),
        `${site[i].id} title mismatch`,
      );
    }
    // Key mismatch fixes
    const byId = Object.fromEntries(site.map((c) => [c.id, c]));
    assert.match(byId['COR-0008'].title, /SSD reversal/i);
    assert.match(byId['COR-0010'].title, /Catalog duplicate/i);
    assert.match(byId['COR-0013'].title, /probability vocabulary/i);
    assert.match(byId['COR-0017'].title, /DOI\/PMID/i);
    assert.ok(byId['COR-0018']);
    assert.ok(byId['COR-0019']);
    assert.ok(byId['COR-0020']);
  });
});
