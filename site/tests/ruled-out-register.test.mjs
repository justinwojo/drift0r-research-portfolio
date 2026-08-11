/**
 * Grounding contract for the public ruled-out register (evidence/ruled_out.yaml).
 *
 * This surface was added in v0.3.0 and initially shipped outside the mechanism that
 * gates every other public medical statement: it had no claim ids, no approval check,
 * and `/` being an approved route implicitly published whatever the file contained.
 * A paired Codex/Grok review caught it (DEC-0038). These assertions exist so it cannot
 * drift back — an entry that outruns its claim rows should fail here, not on the live site.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const register = loadYaml(readFileSync(join(repoRoot, 'evidence/ruled_out.yaml'), 'utf8'));
const inventory = loadYaml(
  readFileSync(
    join(repoRoot, 'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml'),
    'utf8',
  ),
);
const claimsById = new Map(inventory.claims.map((c) => [c.id, c]));

describe('ruled-out register grounding (DEC-0038)', () => {
  it('every entry names claim rows that exist and are approved for publication', () => {
    assert.ok(register.entries.length > 0, 'register must not be empty');
    for (const e of register.entries) {
      assert.ok(
        Array.isArray(e.claim_ids) && e.claim_ids.length > 0,
        `${e.suggestion}: claim_ids is required — an entry with none is ungoverned`,
      );
      for (const id of e.claim_ids) {
        const claim = claimsById.get(id);
        assert.ok(claim, `${e.suggestion}: ${id} is not in the public claim inventory`);
        assert.equal(
          claim.public_approved,
          true,
          `${e.suggestion}: ${id} is not approved for publication`,
        );
      }
    }
  });

  /*
   * Scope rule from the file header, as amended by DEC-0039 (2026-08-10).
   *
   * This assertion used to bar numeric lab values outright, on the ground that they "have
   * not been cleared for publication". That was a permission claim and it is now false —
   * DEC-0039 scopes publication by provenance, so values traceable to the documents
   * Drift0r provided may be published as attributed historical record.
   *
   * Deleting the assertion would have traded a real guard for nothing, so it is inverted
   * instead: a bare number is less honest than no number, and the failure mode worth
   * catching is now an unanchored value. Any unit-bound lab value must therefore appear
   * with a reference interval — or, where the source document prints none, with that gap
   * stated explicitly (the blood-thiamine 158 case, whose source table has no units column).
   *
   * Unrelated and still absolute: confidence language is never numeric. That bars invented
   * probabilities ("73% likely") and is untouched here — see constants.ts CONFIDENCE_VOCAB.
   */
  it('anchors every numeric lab value to a reference interval or a stated gap', () => {
    const LAB_VALUE = /\d+(\.\d+)?\s*(nmol|pmol|mmol|mcg|µg|ug|mg|ng|pg|g)\s*\/\s*(L|dL|mL|g|24h)|\d+(\.\d+)?\s*(mm\/h|g\/cm|%|IU\/L|U\/L)/i;
    // An interval printed as a range, a bounded threshold, or named in prose. ISO dates are
    // stripped first: "2025-10-01" contains "2025-10", which reads as a numeric range and would
    // otherwise satisfy this test on nothing more than a draw date sitting beside the value.
    const withoutDates = (s) => s.replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{4}-\d{2}\b/g, ' ');
    const HAS_INTERVAL = /referen|\bref\b|\d+(\.\d+)?\s*[–—-]\s*\d+(\.\d+)?|[<>≤≥]\s*\d/i;
    // Or an explicit disclosure that the source prints no interval/units.
    const GAP_STATED = /not stated|not printed|not given|no reference interval|units? (are|is) not/i;

    for (const e of register.entries) {
      const joined = ['tested', 'result', 'still_open'].map((f) => e[f] || '').join(' ');
      if (!LAB_VALUE.test(joined)) continue;
      assert.ok(
        HAS_INTERVAL.test(withoutDates(joined)) || GAP_STATED.test(joined),
        `${e.suggestion}: carries a lab value with no reference interval and no stated gap — ` +
          'an unanchored number is not interpretable; print the interval or say the source omits it',
      );
    }
  });

  /*
   * Epistemic rule: an entry may not read more strongly than its claim rows. Where every
   * supporting row is reported_history or hypothesis, the entry must attribute the result
   * rather than state it flatly — the same discipline the landing page applies to CLM-0025.
   */
  it('attributes results whose claim rows are all patient-reported or hypothesis', () => {
    const SOFT = new Set(['reported_history', 'hypothesis']);
    const ATTRIBUTED = /\breport(s|ed|ing)?\b|\bpatient-reported\b|\bhis own account\b/i;
    for (const e of register.entries) {
      const kinds = e.claim_ids.map((id) => claimsById.get(id).kind);
      if (!kinds.every((k) => SOFT.has(k))) continue;
      const text = `${e.result} ${e.still_open || ''}`;
      assert.match(
        text,
        ATTRIBUTED,
        `${e.suggestion}: every supporting claim is ${[...new Set(kinds)].join('/')}, ` +
          'so the entry must say who reported it',
      );
    }
  });

  /*
   * The mast-cell entry is the one a reader is most likely to be misled by: tryptase is
   * elevated on both documented draws (CLM-0030) and incomplete exclusion of systemic
   * mastocytosis is on the project's own don't-miss list (CLM-0065). It shipped once as a
   * clean negative. It must never read that way again.
   */
  it('the mast-cell entry discloses the elevated tryptase and the incomplete exclusion', () => {
    const e = register.entries.find((x) => /mast cell/i.test(x.suggestion));
    assert.ok(e, 'mast-cell entry expected in the register');
    assert.match(e.result, /above the reference range|elevated/i);
    assert.match(e.result, /alpha-tryptasemia/i);
    assert.ok(e.still_open, 'mast-cell entry must not claim the question is closed');
    assert.match(e.still_open, /limit of detection|not documented/i);
  });

  /*
   * still_open: null asserts the question is closed on the present record. Entries resting
   * on a soft claim kind have not earned that.
   */
  it('does not close entries that rest only on reported history or hypothesis', () => {
    const SOFT = new Set(['reported_history', 'hypothesis']);
    for (const e of register.entries) {
      if (e.still_open) continue;
      const kinds = e.claim_ids.map((id) => claimsById.get(id).kind);
      assert.ok(
        kinds.some((k) => !SOFT.has(k)),
        `${e.suggestion}: still_open is null but every supporting claim is ${kinds.join('/')}`,
      );
    }
  });

  it('the loader gates on claim approval and the page renders the source trail', () => {
    const data = readFileSync(join(repoRoot, 'site/src/lib/data.ts'), 'utf8');
    const ruledOutFn = data.slice(
      data.indexOf('export function getRuledOut'),
      data.indexOf('export function getHypotheses'),
    );
    assert.match(ruledOutFn, /getSiteMode\(\)/);
    assert.match(ruledOutFn, /claim_ids/);
    assert.match(ruledOutFn, /approved === null \|\| ids\.every/);

    const index = readFileSync(join(repoRoot, 'site/src/pages/index.astro'), 'utf8');
    assert.match(index, /ruled-out-claims/);
    assert.match(index, /e\.claim_ids\.join/);
  });
});
