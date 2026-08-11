/**
 * Language safety tests — import real modules (not re-implementations).
 * Checkpoint G P1-02 / P3-44.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
import { FORBIDDEN_CARE_PLAN_PATTERNS } from '../src/lib/constants.ts';
import { FORBIDDEN_PHRASES, FORBIDDEN_TREATMENT_PATTERNS } from '../src/lib/constants.ts';
import { claimExcerpt } from '../src/lib/claimPreview.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

/*
 * DEC-0039's exemption is the one place this project deliberately lets a dose figure print, so
 * it is also the one place a too-generous rule publishes dosing advice. The first version keyed
 * off mood words — "history", "prior", "took", a bare year — which occur constantly in ordinary
 * medical prose, so "No history of clomiphene 25 mg daily" and "Take 100 mg daily as of 2024"
 * both read as attributed record and shipped intact.
 *
 * Each case below is a string that must NOT survive with its figure or drug name intact, either
 * by redaction or by failing the gate. They are kept as literals because the failure they guard
 * against is a specific sentence reaching a reader, not an abstract property.
 */
describe('DEC-0039 historical exemption fails closed on unframed dosing', () => {
  const MUST_NOT_PUBLISH = [
    'Take 100 mg daily as of 2024.',
    'Documented finding: severe fatigue. Benfotiamine 1000 mg daily.',
    'Family history of hypogonadism; consider clomiphene 25 mg daily.',
    'Stone history is positive. Consider starting 25 mg daily.',
    'No history of clomiphene 25 mg daily',
    'It took weeks; clomiphene 25 mg daily',
    'Symptoms stopped; clomiphene 25 mg daily',
    'Documented BMD loss; consider clomiphene.',
    'Prior labs normal; consider starting anastrozole.',
    'In 2019 the patient had symptoms. Notes list 25 mg of compound daily.',
    'In 2021 consider teriparatide.',
    'clomiphene 25 mg daily',
    // A semicolon joins independent clauses, so an attribution in the first does not reach the
    // second. These published intact while the clause splitter only broke on '.', '?', '!'.
    'The summary records fatigue; benfotiamine 1000 mg daily.',
    'The record lists the findings; clomiphene 25 mg daily.',
    // Advice does not stop being advice because a document is named as its source.
    'The chart records recommended clomiphene 25 mg daily.',
    'The summary lists suggested clomiphene 25 mg daily.',
    // "documents"/"records"/"files" are ordinary verbs; the attribution needs the document noun.
    'Imaging documents pars defects and clomiphene 25 mg daily.',
    'The scan files show clomiphene 25 mg daily.',
    // Care-plan wording survived by being laundered: the transform generalised the drug name,
    // and the gate then looked for a name that no longer existed in the string it was given.
    'Plan starting clomiphene.',
    'Consider adding anastrozole.',
    // An instruction with no figure in it: the gate consulted isPrescriptive only while walking
    // dose matches, so a bare imperative naming a drug had nothing to walk and passed clean.
    'Take teriparatide.',
    'Start clomiphene.',
    // Frequency spelled out rather than abbreviated, and not adjacent to the unit.
    '25 mg of compound every other day.',
    // An instruction after a comma or a dash. The attribution is real, but it does not reach past
    // the comma — what follows is an instruction, and the clause opener set had only ever counted
    // sentence-ending punctuation, so the imperative was invisible to both the transform and gate.
    'Per the record, start clomiphene 25 mg daily.',
    'Per the record, take clomiphene 25 mg daily.',
    'The summary records fatigue — start 25 mg daily.',
    // Advice frames that name no drug and give no order, but still say what ought to be taken.
    'The summary records that the patient should be on clomiphene 25 mg daily.',
    'The chart records clomiphene 25 mg daily is indicated.',
    // A category of fact is not a document: "family history" and "no record" name what is known,
    // not a source doing the filing.
    'Family history lists clomiphene 25 mg daily.',
    'No record lists clomiphene 25 mg daily.',
    // Forward-looking adjuncts under an otherwise clean attribution. The tense is historical and
    // the intent is not.
    'The note documents clomiphene 25 mg daily for future use.',
    'The pack lists dose as 25 mg daily until further notice.',
  ];

  // Asserting `out !== text` was too weak to mean anything: any incidental rewrite passed, so a
  // string could satisfy this battery while still printing its dose. What has to be true is that
  // the reader never sees the figure or the real drug name — so assert on those directly.
  for (const text of MUST_NOT_PUBLISH) {
    it(`redacts or gates: ${text}`, () => {
      const out = toPublicLanguage(text);
      const gated = findForbiddenTreatmentPatterns(out).length > 0;
      if (gated) return; // Blocked outright; nothing reaches a reader.
      assert.doesNotMatch(
        out,
        /\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|iu)\b(?!\s*\/)/i,
        `dose figure survived ungated: ${out}`,
      );
      assert.doesNotMatch(
        out,
        /\b(?:clomiphene|clomifene|anastrozole|teriparatide|forteo)\b/i,
        `drug name survived ungated: ${out}`,
      );
    });
  }

  // The transform and the gate ask the same questions about the same sentence. If they disagree
  // the build still fails closed, but the disagreement means one of them is wrong about policy.
  it('transform and gate agree: nothing the transform keeps is flagged by the gate', () => {
    const disagreements = [];
    for (const text of MUST_NOT_PUBLISH) {
      const out = toPublicLanguage(text);
      // A care-plan construction is barred outright and is not something the transform rewrites,
      // so it is the one shape where "kept, then gated" is the designed outcome. The exemption is
      // taken from the patterns themselves rather than a copied verb list: a hardcoded
      // /consider|plan/ here went stale the moment the gate learned bare imperatives, and reported
      // "Take teriparatide." — working exactly as designed — as a policy disagreement. Deriving it
      // leaves the real question intact, which is whether the transform and the *dose* gate ever
      // read the same sentence differently.
      if (FORBIDDEN_CARE_PLAN_PATTERNS.some((re) => re.test(out))) continue;
      if (out === text && findForbiddenTreatmentPatterns(out).length) disagreements.push(text);
    }
    assert.deepEqual(disagreements, []);
  });

  // Twice now the transform and the gate have disagreed about where a clause begins — the
  // semicolon, then the comma — and both times every existing test still passed, because each
  // side was only ever checked against openers it already knew. This walks the set instead of
  // trusting it: put the same instruction behind each opener in turn and require that none of
  // them lets a drug name and a dose figure through together.
  it('an instruction is caught behind every clause opener, not just a full stop', () => {
    const openers = ['', '. ', '; ', ': ', '! ', '? ', ', ', ' — ', ' - ', '\n'];
    for (const opener of openers) {
      const text = opener
        ? `The summary records fatigue${opener}start clomiphene 25 mg daily.`
        : 'Start clomiphene 25 mg daily.';
      const out = toPublicLanguage(text);
      if (findForbiddenTreatmentPatterns(out).length > 0) continue;
      assert.doesNotMatch(
        out,
        /\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|iu)\b(?!\s*\/)/i,
        `dose survived ungated behind opener ${JSON.stringify(opener)}: ${out}`,
      );
      assert.doesNotMatch(
        out,
        /\b(?:clomiphene|clomifene|anastrozole|teriparatide|forteo)\b/i,
        `drug name survived ungated behind opener ${JSON.stringify(opener)}: ${out}`,
      );
    }
  });

  // The exemption exists for these; if the rules above ever tighten to the point of eating the
  // real record, this is what says so.
  it('still publishes the attributed history DEC-0039 was written to allow', () => {
    const inventory = loadYaml(
      readFileSync(join(repoRoot, 'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml'), 'utf8'),
    );
    const byId = new Map(inventory.claims.map((c) => [c.id, c]));
    for (const [id, mustKeep] of [
      ['CLM-0096', '1000 mg benfotiamine daily'],
      ['CLM-0097', '75 mg weekly'],
      ['CLM-0097', 'clomiphene citrate 25 mg daily'],
    ]) {
      const out = toPublicLanguage(byId.get(id).statement);
      assert.ok(out.includes(mustKeep), `${id} lost its attributed history: ${mustKeep}`);
      assert.deepEqual(findForbiddenTreatmentPatterns(out), []);
    }
  });

  // A colon introduces the material being attributed, so unlike a semicolon it must NOT split
  // the clause — CLM-0096 is written in exactly this shape. This is the counterweight to the
  // semicolon cases above: tightening one must not quietly take the other with it.
  it('keeps attribution that runs through a colon', () => {
    const text = 'The thiamine summary records: benfotiamine 1000 mg daily.';
    const out = toPublicLanguage(text);
    assert.equal(out, text);
    assert.deepEqual(findForbiddenTreatmentPatterns(out), []);
  });
});

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

  /*
   * DEC-0039 (v0.4.0). Historical dosing drawn from Drift0r's own documents is publishable as
   * attributed record; prescriptive content stays barred. The transform enforces the framing
   * requirement rather than the subject matter — these cases pin both directions.
   */
  it('preserves historical dosing that is framed as attributed record (DEC-0039)', () => {
    const out = toPublicLanguage(
      'Clomiphene citrate 25 mg daily is recorded as a previous prescription.',
    );
    assert.match(out, /25\s*mg/i, 'historical dose must survive');
    assert.match(out, /clomiphene/i, 'drug name must survive in historical record');
    assert.doesNotMatch(out, /dose withheld/i);
  });

  it('still redacts dosing with no historical framing', () => {
    const out = toPublicLanguage('clomiphene 25 mg daily; anastrozole 1 mg weekly');
    assert.doesNotMatch(out, /\d+\s*mg/i);
    assert.match(out, /dose withheld/i);
    assert.match(out, /selective estrogen-receptor modulator/i);
  });

  it('redacts prescriptive framing even when history words are present', () => {
    const out = toPublicLanguage(
      'As recorded previously, you should start clomiphene 25 mg daily.',
    );
    assert.doesNotMatch(out, /\d+\s*mg/i, 'prescriptive framing must fail closed');
    assert.match(out, /dose withheld/i);
    assert.match(out, /selective estrogen-receptor modulator/i);
  });

  it('treats a bare present participle as insufficient historical framing', () => {
    // "taking" reads as ongoing instruction as easily as history — must not unlock the figure.
    const out = toPublicLanguage('taking benfotiamine 1000 mg daily');
    assert.doesNotMatch(out, /1000\s*mg/i);
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

  /*
   * The publication gate is a second, independent check that runs after the transform. Before
   * DEC-0039 it duplicated the redaction rule, so relaxing only the transform made the two
   * disagree: the dose survived toPublicLanguage and then failed the build. These four fix the
   * boundary in both directions.
   */
  it('does not fail a historical dose the transform deliberately preserved (DEC-0039)', () => {
    const text = 'His 2021 endocrine summary records clomiphene citrate 25 mg daily.';
    assert.deepEqual(findForbiddenTreatmentPatterns(toPublicLanguage(text)), []);
  });

  it('still fails a dose with no historical framing', () => {
    const hits = findForbiddenTreatmentPatterns('clomiphene citrate 25 mg daily');
    assert.ok(hits.length >= 1, 'unframed dose must remain a gate failure');
  });

  it('care-plan advice is absolute — historical wording does not buy it passage', () => {
    const hits = findForbiddenTreatmentPatterns(
      'The record documents prior fracture; consider teriparatide.',
    );
    assert.ok(
      hits.some((h) => /teriparatide/.test(h)),
      'DEC-0039 relaxed what he took, never what a reader should take',
    );
  });

  it('prescriptive framing overrides historical framing at the gate', () => {
    const hits = findForbiddenTreatmentPatterns(
      'He previously took it; you should start 25 mg daily.',
    );
    assert.ok(hits.length >= 1, 'any prescriptive framing re-arms the dose patterns');
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

  it('public inventory has 109 approved A/B/C claims and accurate meta', () => {
    assert.equal(inv.claims.length, 109);
    assert.equal(inv.meta.claim_count, 109);
    assert.ok(inv.claims.every((c) => c.public_approved === true));
    assert.ok(!inv.claims.some((c) => c.public_tier === 'do_not_publish'));
    assert.ok(!('Do not publish' in (inv.meta.tier_counts || {})));
  });

  // The meta tallies are maintained by hand and are the kind of thing that silently drifts
  // when rows are added or removed in bulk. Derive them instead of trusting them.
  it('meta tallies are derived correctly from the claim rows', () => {
    const tally = (fn) => inv.claims.reduce((a, c) => ((a[fn(c)] = (a[fn(c)] || 0) + 1), a), {});
    assert.deepEqual(tally((c) => `Tier ${c.public_tier}`), inv.meta.tier_counts);
    assert.deepEqual(tally((c) => c.kind), inv.meta.kind_counts);
    assert.deepEqual(tally((c) => c.verification_status), inv.meta.verification_counts);
  });

  // Every claim is one row of a provenance chain, so a source_id must name exactly one
  // document and every cited path must exist. Two ids for one file breaks the chain quietly.
  it('claim sources use one id per document and cite files that exist', () => {
    const byPath = new Map();
    for (const c of inv.claims) {
      for (const s of c.patient_sources || []) {
        if (!byPath.has(s.path)) byPath.set(s.path, new Set());
        byPath.get(s.path).add(s.source_id);
      }
    }
    const aliased = [...byPath].filter(([, ids]) => ids.size > 1).map(([p, ids]) => `${p}: ${[...ids].join(', ')}`);
    assert.deepEqual(aliased, []);
    // The existence half is monorepo-only: evidence/sources/ is gitignored, so a clean CI
    // checkout has none of these files and asserting on them there would fail every run.
    if (!existsSync(join(repoRoot, 'evidence/sources'))) return;
    const missing = [...byPath.keys()]
      .filter((p) => p.startsWith('evidence/sources/'))
      .filter((p) => !existsSync(join(repoRoot, p)));
    assert.deepEqual(missing, []);
  });

  /*
   * literature/catalog.yaml is generated from entry frontmatter (build_catalog.py), but only the
   * catalog is loaded by the site. A hand-edit to one side is therefore invisible until someone
   * regenerates, at which point the visitor-facing text silently reverts to whatever the entry
   * says. Cards written directly into the catalog fork exactly this way.
   */
  it('literature catalog rows match the entry frontmatter they are generated from', () => {
    const catalog = loadYaml(readFileSync(join(repoRoot, 'literature/catalog.yaml'), 'utf8'));
    const rows = Array.isArray(catalog) ? catalog : catalog.entries;
    const byId = new Map(rows.filter((r) => r && r.id).map((r) => [r.id, r]));
    const drift = [];
    for (const file of readdirSync(join(repoRoot, 'literature/entries'))) {
      if (!file.endsWith('.md')) continue;
      const text = readFileSync(join(repoRoot, 'literature/entries', file), 'utf8');
      const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
      if (!fm) continue;
      const entry = loadYaml(fm[1]);
      const row = entry && byId.get(entry.id);
      if (!row) continue;
      for (const field of ['title', 'quality_notes', 'doi', 'pmid', 'journal', 'year', 'access']) {
        if ((entry[field] ?? '') !== (row[field] ?? '')) drift.push(`${entry.id}.${field}`);
      }
    }
    assert.deepEqual(drift, []);
  });

  // coverage.yaml states the same facts three ways — scalar counts, per-status id lists, and a
  // by_status map — and nothing regenerates it, so the three drift apart silently. Adding five
  // cards updated the scalars and the identity_verified list but not by_status, leaving the file
  // asserting 49 verified cards in one field and 44 in another.
  it('attestation coverage counts, id lists and by_status all agree', () => {
    const cov = loadYaml(
      readFileSync(join(repoRoot, 'literature/attestations/coverage.yaml'), 'utf8'),
    );
    const catalog = loadYaml(readFileSync(join(repoRoot, 'literature/catalog.yaml'), 'utf8'));
    const rows = Array.isArray(catalog) ? catalog : catalog.entries;

    for (const status of ['identity_verified', 'identity_unverified', 'identity_unresolvable', 'identity_mismatch']) {
      assert.equal(
        (cov[status] || []).length,
        cov[`${status}_count`],
        `${status}: list length must equal ${status}_count`,
      );
    }

    const byStatus = cov.by_status || {};
    assert.equal(
      Object.keys(byStatus).length,
      cov.catalog_card_count,
      'by_status must carry one entry per catalog card',
    );
    assert.equal(rows.length, cov.catalog_card_count, 'catalog_card_count must match the catalog');

    const tally = {};
    for (const v of Object.values(byStatus)) tally[v] = (tally[v] || 0) + 1;
    assert.equal(tally.identity_verified || 0, cov.identity_verified_count);
    assert.equal(tally.identity_unverified || 0, cov.identity_unverified_count);
    assert.equal(tally.alias || 0, cov.alias_count);

    // Every id in a status list must carry that same status in the map.
    const mismatched = [];
    for (const status of ['identity_verified', 'identity_unverified']) {
      for (const id of cov[status] || []) {
        if (byStatus[id] !== status) mismatched.push(`${id}: list=${status} map=${byStatus[id] ?? 'absent'}`);
      }
    }
    assert.deepEqual(mismatched, []);
  });

  // medical_domain is looked up by exact string in CORRECTION_BY_DOMAIN, so a space-separated
  // compound domain matches nothing and the claim silently renders with no corrections.
  it('medical_domain values are underscore-joined, never space-separated', () => {
    const spaced = inv.claims.filter((c) => / /.test(c.medical_domain || '')).map((c) => `${c.id}: ${c.medical_domain}`);
    assert.deepEqual(spaced, []);
  });

  it('claim cross-references in statements and notes resolve to real claims', () => {
    const ids = new Set(inv.claims.map((c) => c.id));
    const dangling = [];
    for (const c of inv.claims) {
      for (const text of [c.statement, c.notes]) {
        for (const m of String(text || '').match(/CLM-\d{4}/g) || []) {
          if (!ids.has(m)) dangling.push(`${c.id} -> ${m}`);
        }
      }
    }
    assert.deepEqual(dangling, []);
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

  // The treatment gate runs on the full statement, but search results, hover previews and the
  // evidence atlas show a truncated excerpt. DEC-0039 permits historical dose figures precisely
  // because their past-tense attribution travels with them — so a claim that puts the figure
  // early and the framing late would pass the gate and still reach a reader as bare dosing.
  // It currently holds for every row, but by word order rather than by construction.
  it('excerpts keep dose figures with their framing, not just full statements', () => {
    const stranded = [];
    for (const c of inv.claims) {
      if (c.public_tier === 'do_not_publish') continue;
      const publicText = toPublicLanguage(c.statement);
      for (const len of [140, 160]) {
        const hits = findForbiddenTreatmentPatterns(claimExcerpt(publicText, len));
        if (hits.length) stranded.push(`${c.id} @${len}: ${claimExcerpt(publicText, len)}`);
      }
    }
    assert.deepEqual(stranded, []);
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
  it('site CORRECTIONS match CORRECTIONS.md IDs and count 42', async () => {
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
    assert.equal(mdIds.length, 42, 'register must list 42 corrections');
    assert.equal(site.length, 42, 'site must publish 42 corrections');
    assert.deepEqual(
      site.map((c) => c.id),
      mdIds.map((c) => c.id),
    );
    // Titles must match register headings (normalize quotes).
    // Iterate the whole list — a hardcoded bound here silently stopped checking every
    // correction added after it, which is exactly when a title can drift unnoticed.
    const norm = (s) => s.replace(/[“”"']/g, '"').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < mdIds.length; i++) {
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
