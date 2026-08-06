/**
 * Checkpoint J.2 / J.2.1 — record preview excerpts + maps (CLM, H, UQ).
 * No AI rewrite; private fields never enter payloads.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');

describe('claimExcerpt / recordExcerpt', () => {
  it('truncates on word boundary and never invents content', async () => {
    const { claimExcerpt, isClaimId, isHypothesisId, isUqId } = await import(
      '../src/lib/claimPreview.ts'
    );
    const full =
      'For a male younger than 50, DXA interpretation should emphasize Z-scores and secondary-cause evaluation rather than using T-score alone as a standalone diagnostic label.';
    const ex = claimExcerpt(full, 80);
    assert.ok(ex.endsWith('…'));
    assert.ok(ex.length <= 81);
    assert.ok(full.startsWith(ex.replace(/…$/, '').trimEnd()) || full.includes(ex.replace(/…$/, '').trim()));
    assert.equal(claimExcerpt('Short.', 80), 'Short.');
    assert.equal(isClaimId('CLM-0003'), true);
    assert.equal(isClaimId('H1'), false);
    assert.equal(isHypothesisId('H1'), true);
    assert.equal(isHypothesisId('H-NULL'), true);
    assert.equal(isHypothesisId('CLM-0001'), false);
    assert.equal(isUqId('UQ-0001'), true);
    assert.equal(isUqId('H1'), false);
  });

  it('preview map keys are CLM ids with kind domain excerpt', async () => {
    const { resetDataCaches } = await import('../src/lib/data.ts');
    const { getClaimPreviewMap } = await import('../src/lib/claimPreview.ts');
    resetDataCaches();
    const map = getClaimPreviewMap();
    const ids = Object.keys(map);
    assert.ok(ids.length > 10, `expected many claims, got ${ids.length}`);
    for (const id of ids.slice(0, 5)) {
      assert.match(id, /^CLM-\d{4}$/);
      assert.ok(map[id].kind_label);
      assert.ok(map[id].excerpt);
      assert.equal(map[id].record_type, 'claim');
      assert.ok(!/definitely proven|AI generated/i.test(map[id].excerpt));
    }
  });

  it('unified record map includes approved H and UQ with type labels', async () => {
    const { resetDataCaches } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, PREVIEW_FORBIDDEN_PAYLOAD_KEYS } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const map = getRecordPreviewMap();

    assert.ok(map['H1'], 'H1 present');
    assert.equal(map['H1'].record_type, 'hypothesis');
    assert.match(map['H1'].type_label, /Working research hypothesis/i);
    assert.ok(map['H1'].title);
    assert.ok(map['H1'].confidence);
    assert.ok(map['H1'].hypothesis_kind);
    assert.ok(map['H1'].excerpt);
    assert.ok(map['H1'].href && map['H1'].href.includes('working-model'));
    // Excerpt is truncation of public_summary only
    const { getHypothesisById } = await import('../src/lib/data.ts');
    const h1 = getHypothesisById('H1');
    assert.ok(h1);
    const bare = map['H1'].excerpt.replace(/…$/, '').trim();
    assert.ok(
      h1.public_summary.replace(/\s+/g, ' ').includes(bare) ||
        h1.public_summary.startsWith(bare),
      'H1 excerpt must derive from public_summary',
    );

    assert.ok(map['H-NULL'], 'H-NULL present');
    assert.equal(map['H-NULL'].record_type, 'hypothesis');

    assert.ok(map['UQ-0001'], 'UQ-0001 present');
    assert.equal(map['UQ-0001'].record_type, 'unresolved_question');
    assert.match(map['UQ-0001'].type_label, /open research question/i);
    assert.ok(map['UQ-0001'].excerpt);
    assert.equal(map['UQ-0001'].href, null, 'UQ has no invented route');
    const { getUqById } = await import('../src/lib/data.ts');
    const uq = getUqById('UQ-0001');
    assert.ok(uq);
    const uqBare = map['UQ-0001'].excerpt.replace(/…$/, '').trim();
    assert.ok(
      uq.question.replace(/\s+/g, ' ').includes(uqBare) || uq.question.startsWith(uqBare),
      'UQ excerpt must derive from approved question text',
    );

    // No private / unapproved fields in any payload
    for (const [id, p] of Object.entries(map)) {
      const keys = Object.keys(p);
      for (const bad of PREVIEW_FORBIDDEN_PAYLOAD_KEYS) {
        assert.ok(!keys.includes(bad), `${id} must not expose ${bad}`);
      }
      const serialized = JSON.stringify(p);
      assert.doesNotMatch(serialized, /"owner"\s*:/);
      assert.doesNotMatch(serialized, /closest_available_record/);
      assert.doesNotMatch(serialized, /blocks_launch_critical_wording/);
    }
  });
});

describe('claim preview wiring', () => {
  it('BaseLayout mounts ClaimPreviewRuntime', () => {
    const layout = readFileSync(join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf8');
    assert.match(layout, /ClaimPreviewRuntime/);
  });

  it('runtime script handles Escape, generation guard, single aria association', () => {
    const rt = readFileSync(join(siteRoot, 'src/components/ClaimPreviewRuntime.astro'), 'utf8');
    assert.match(rt, /Escape/);
    assert.match(rt, /prefers-reduced-motion|reduceMotion/);
    assert.match(rt, /hover:\s*none/);
    assert.match(rt, /role="tooltip"/);
    assert.match(rt, /aria-describedby/);
    assert.match(rt, /showGen|expectedGen/);
    assert.match(rt, /clearAllDescribedBy/);
    assert.match(rt, /relatedTarget|relatedIsPreview/);
    assert.match(rt, /scrollX|pageXOffset/);
    assert.match(rt, /getRecordPreviewMap|data-record-preview/);
  });

  it('ClaimLink sets data-record-preview / data-claim-preview', () => {
    const src = readFileSync(join(siteRoot, 'src/components/ClaimLink.astro'), 'utf8');
    assert.match(src, /data-record-preview|recordPreviewDataAttrs/);
    assert.match(src, /claimPreviewFromClaim|data-claim-preview/);
  });
});
