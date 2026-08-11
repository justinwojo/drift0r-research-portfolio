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

  it('isCorrectionId matches COR-#### only', async () => {
    const { isCorrectionId } = await import('../src/lib/claimPreview.ts');
    assert.equal(isCorrectionId('COR-0001'), true);
    assert.equal(isCorrectionId('COR-0040'), true);
    assert.equal(isCorrectionId('COR-001'), false);
    assert.equal(isCorrectionId('COR-00011'), false);
    assert.equal(isCorrectionId('CLM-0001'), false);
    assert.equal(isCorrectionId('UQ-0001'), false);
    assert.equal(isCorrectionId(''), false);
    assert.equal(isCorrectionId(null), false);
    assert.equal(isCorrectionId(undefined), false);
  });

  it('isLitId matches lit-#### only', async () => {
    const { isLitId } = await import('../src/lib/claimPreview.ts');
    assert.equal(isLitId('lit-0340'), true);
    assert.equal(isLitId('lit-0042'), true);
    assert.equal(isLitId('lit-042'), false);
    assert.equal(isLitId('lit-00420'), false);
    assert.equal(isLitId('LIT-0042'), false);
    assert.equal(isLitId('lit-abcd'), false);
    assert.equal(isLitId('CLM-0042'), false);
    assert.equal(isLitId('COR-0042'), false);
    assert.equal(isLitId(''), false);
    assert.equal(isLitId(null), false);
    assert.equal(isLitId(undefined), false);
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
    // Until /questions/ existed there was no public UQ fragment to link to, and this
    // asserted null. The route is real now, so the assertion pins the route instead.
    assert.match(
      String(map['UQ-0001'].href || ''),
      /\/questions\/#UQ-0001$/,
      'UQ links to its entry on the unified questions surface',
    );
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

describe('claim correction split (Stream 1 data layer)', () => {
  it('claim_specific ∪ domain_wide equals corrections, and the two are disjoint', async () => {
    const { resetDataCaches, getClaimsUnfiltered, getCorrections } = await import(
      '../src/lib/data.ts'
    );
    resetDataCaches();
    const claims = getClaimsUnfiltered();
    assert.ok(claims.length > 10, `expected many claims, got ${claims.length}`);
    // Corrections-register order — `corrections` must stay in it for every claim, not just
    // hold the right members, because the current /case/ UI renders it unchanged.
    const registerOrder = getCorrections().map((x) => x.id);

    let withSpecific = 0;
    let withDomain = 0;
    for (const c of claims) {
      assert.ok(Array.isArray(c.corrections), `${c.id} corrections array`);
      assert.ok(Array.isArray(c.corrections_claim_specific), `${c.id} claim-specific array`);
      assert.ok(Array.isArray(c.corrections_domain_wide), `${c.id} domain-wide array`);

      const specific = c.corrections_claim_specific.map((x) => x.id);
      const domain = c.corrections_domain_wide.map((x) => x.id);
      const union = [...specific, ...domain].sort();
      const all = c.corrections.map((x) => x.id).slice().sort();

      // Disjoint: no id appears in both buckets (no double-listing).
      assert.equal(
        new Set(union).size,
        union.length,
        `${c.id}: correction id listed in both buckets: ${union.join(',')}`,
      );
      // Union equals the unchanged `corrections` union.
      assert.deepEqual(union, all, `${c.id}: split must equal corrections`);
      // …and `corrections` keeps corrections-register ORDER, not merely the same members.
      // (Sorted comparison above would pass a regression that concatenated the buckets.)
      const unionSet = new Set(union);
      assert.deepEqual(
        c.corrections.map((x) => x.id),
        registerOrder.filter((id) => unionSet.has(id)),
        `${c.id}: corrections must stay in corrections-register order`,
      );
      // Both buckets are register-ordered too, so Stream 2 renders them deterministically.
      assert.deepEqual(
        specific,
        registerOrder.filter((id) => specific.includes(id)),
        `${c.id}: claim-specific must be register-ordered`,
      );
      assert.deepEqual(
        domain,
        registerOrder.filter((id) => domain.includes(id)),
        `${c.id}: domain-wide must be register-ordered`,
      );
      // Each bucket is itself duplicate-free.
      assert.equal(new Set(specific).size, specific.length, `${c.id}: duplicate claim-specific`);
      assert.equal(new Set(domain).size, domain.length, `${c.id}: duplicate domain-wide`);
      // Every entry carries the public register shape.
      for (const ref of c.corrections) {
        assert.match(ref.id, /^COR-\d{4}$/, `${c.id}: ${ref.id}`);
        assert.ok(ref.title, `${c.id}: ${ref.id} title`);
        assert.ok(ref.status, `${c.id}: ${ref.id} status`);
      }
      if (specific.length) withSpecific += 1;
      if (domain.length) withDomain += 1;
    }
    assert.ok(withSpecific > 0, 'some claims must have claim-specific corrections');
    assert.ok(withDomain > 0, 'some claims must have domain-wide corrections');
  });

  it('CLM-0003 splits into COR-0002/COR-0003 specific and COR-0001/COR-0011/COR-0028 domain-wide', async () => {
    const { resetDataCaches, getClaimsUnfiltered } = await import('../src/lib/data.ts');
    resetDataCaches();
    const c = getClaimsUnfiltered().find((x) => x.id === 'CLM-0003');
    assert.ok(c, 'CLM-0003 present');
    assert.equal(c.medical_domain, 'bone');
    assert.deepEqual(
      c.corrections_claim_specific.map((x) => x.id),
      ['COR-0002', 'COR-0003'],
    );
    assert.deepEqual(
      c.corrections_domain_wide.map((x) => x.id),
      ['COR-0001', 'COR-0011', 'COR-0028'],
    );
    // Union field is unchanged in content and register order (current UI keeps rendering as-is).
    assert.deepEqual(
      c.corrections.map((x) => x.id),
      ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0011', 'COR-0028'],
    );
  });

  it('keeps a claim-specific correction that is not in the claim’s domain map', async () => {
    const { resetDataCaches, getClaimsUnfiltered } = await import('../src/lib/data.ts');
    resetDataCaches();
    const claims = getClaimsUnfiltered();

    /*
     * CORRECTION_BY_CLAIM can name a correction the claim's domain map does not list.
     * Guards against a "claim-specific = claim ∩ domain" mistake, which would silently
     * drop the out-of-domain id from `corrections` altogether.
     */
    const c9 = claims.find((x) => x.id === 'CLM-0009');
    assert.ok(c9, 'CLM-0009 present');
    assert.equal(c9.medical_domain, 'bone');
    // COR-0015 is claim-specific to CLM-0009 but is not a bone domain-wide notice.
    assert.deepEqual(
      c9.corrections_claim_specific.map((x) => x.id),
      ['COR-0002', 'COR-0015'],
    );
    assert.deepEqual(
      c9.corrections_domain_wide.map((x) => x.id),
      ['COR-0001', 'COR-0003', 'COR-0011', 'COR-0028'],
    );
    assert.deepEqual(
      c9.corrections.map((x) => x.id),
      ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0011', 'COR-0015', 'COR-0028'],
    );

    /*
     * CLM-0010 is a bone claim whose only claim-specific correction (COR-0006) belongs to
     * the laboratory domain map — nothing is subtracted from the bone domain list, and the
     * out-of-domain id must interleave into the middle of the register-ordered union.
     */
    const c10 = claims.find((x) => x.id === 'CLM-0010');
    assert.ok(c10, 'CLM-0010 present');
    assert.equal(c10.medical_domain, 'bone');
    assert.deepEqual(
      c10.corrections_claim_specific.map((x) => x.id),
      ['COR-0006'],
    );
    assert.deepEqual(
      c10.corrections_domain_wide.map((x) => x.id),
      ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0011', 'COR-0028'],
    );
    assert.deepEqual(
      c10.corrections.map((x) => x.id),
      ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0006', 'COR-0011', 'COR-0028'],
    );
  });

  it('matches compound medical_domain keys exactly and re-orders them to the register', async () => {
    const { resetDataCaches, getClaimsUnfiltered } = await import('../src/lib/data.ts');
    resetDataCaches();
    const claims = getClaimsUnfiltered();

    /*
     * CORRECTION_BY_DOMAIN keys such as `endocrine_bone` are matched exactly, never split
     * on the underscore. Golden-lock the membership: a regression that unioned the
     * underscore parts would give an endocrine_bone claim the whole bone list
     * (COR-0002, COR-0003, COR-0028 as well) and still satisfy the union/disjoint/order
     * invariants, because those only check internal consistency.
     *
     * endocrine_bone is also stored out of register order in the map
     * (['COR-0004', 'COR-0001', 'COR-0011']), so this doubles as proof that the split
     * normalises domain lists to corrections-register order.
     */
    const compoundGoldens = {
      endocrine_bone: ['COR-0001', 'COR-0004', 'COR-0011'],
      endocrine_mental_health: ['COR-0004', 'COR-0008', 'COR-0036'],
      renal_bone: ['COR-0042'],
      renal: ['COR-0042'],
    };
    for (const [domain, expected] of Object.entries(compoundGoldens)) {
      const rows = claims.filter((c) => c.medical_domain === domain);
      assert.ok(rows.length > 0, `expected claims in domain ${domain}`);
      for (const c of rows) {
        const specific = c.corrections_claim_specific.map((x) => x.id);
        assert.deepEqual(
          c.corrections_domain_wide.map((x) => x.id),
          expected.filter((id) => !specific.includes(id)),
          `${c.id} (${domain}) domain-wide`,
        );
      }
    }

    // The bone list must NOT leak into endocrine_bone via underscore splitting.
    const c17 = claims.find((x) => x.id === 'CLM-0017');
    assert.ok(c17, 'CLM-0017 present');
    assert.equal(c17.medical_domain, 'endocrine_bone');
    assert.deepEqual(
      c17.corrections.map((x) => x.id),
      ['COR-0001', 'COR-0004', 'COR-0011'],
    );
    for (const boneOnly of ['COR-0002', 'COR-0003', 'COR-0028']) {
      assert.ok(
        !c17.corrections.some((x) => x.id === boneOnly),
        `CLM-0017 must not inherit bone-only ${boneOnly} by splitting endocrine_bone`,
      );
    }
  });

  it('a domain-wide-only claim carries no claim-specific corrections', async () => {
    const { resetDataCaches, getClaimsUnfiltered } = await import('../src/lib/data.ts');
    resetDataCaches();
    const claims = getClaimsUnfiltered();
    const bone = claims.filter(
      (c) => c.medical_domain === 'bone' && c.corrections_claim_specific.length === 0,
    );
    assert.ok(bone.length > 0, 'expected bone claims with no claim-specific corrections');
    for (const c of bone) {
      assert.deepEqual(
        c.corrections_domain_wide.map((x) => x.id),
        ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0011', 'COR-0028'],
        c.id,
      );
    }
  });
});

describe('correction record previews (COR)', () => {
  it('every register correction is in the preview map with public-only fields', async () => {
    const { resetDataCaches, getCorrections } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, PREVIEW_FORBIDDEN_PAYLOAD_KEYS } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const map = getRecordPreviewMap();
    const corrections = getCorrections();
    assert.ok(corrections.length >= 40, `expected the full register, got ${corrections.length}`);

    for (const c of corrections) {
      const p = map[c.id];
      assert.ok(p, `${c.id} present in preview map`);
      assert.equal(p.record_type, 'correction');
      assert.match(p.type_label, /Correction \/ supersession notice/i);
      assert.match(p.type_label, /never silently edited/i);
      assert.ok(p.excerpt, `${c.id} excerpt`);
      // Excerpt is a deterministic truncation of the public register title — no paraphrase.
      const bare = p.excerpt.replace(/…$/, '').trim();
      assert.ok(
        c.title.replace(/\s+/g, ' ').includes(bare),
        `${c.id} excerpt must derive from the register title`,
      );
      assert.ok(p.href && p.href.endsWith(`/changelog/#${c.id}`), `${c.id} href: ${p.href}`);
      assert.equal(p.status, c.status.replace(/_/g, ' '));
      assert.doesNotMatch(p.status, /_/, `${c.id} status must be human-readable`);
      // Correction payloads carry no claim/hypothesis/UQ-only fields.
      for (const bad of ['kind', 'kind_label', 'medical_domain', 'title', 'confidence', 'category']) {
        assert.ok(!(bad in p), `${c.id} must not carry ${bad}`);
      }
      for (const bad of PREVIEW_FORBIDDEN_PAYLOAD_KEYS) {
        assert.ok(!Object.keys(p).includes(bad), `${c.id} must not expose ${bad}`);
      }
    }
  });

  it('COR previews do not collide with CLM/H/UQ keys', async () => {
    const { resetDataCaches, getCorrections } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, isCorrectionId } = await import('../src/lib/claimPreview.ts');
    resetDataCaches();
    const map = getRecordPreviewMap();
    const corCount = Object.values(map).filter((p) => p.record_type === 'correction').length;
    assert.equal(corCount, getCorrections().length);
    for (const [id, p] of Object.entries(map)) {
      assert.equal(
        p.record_type === 'correction',
        isCorrectionId(id),
        `${id}: record_type must match id shape`,
      );
    }
  });

  it('recordPreviewDataAttrs emits correction status attributes', async () => {
    const { resetDataCaches, getCorrectionById } = await import('../src/lib/data.ts');
    const { correctionPreviewFromCorrection, recordPreviewDataAttrs } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const c = getCorrectionById('COR-0003');
    assert.ok(c);
    const p = correctionPreviewFromCorrection(c);
    const attrs = recordPreviewDataAttrs(p);
    assert.equal(attrs['data-record-preview'], 'COR-0003');
    assert.equal(attrs['data-record-type'], 'correction');
    assert.equal(attrs['data-record-excerpt'], p.excerpt);
    assert.equal(attrs['data-record-type-label'], p.type_label);
    assert.equal(attrs['data-record-status'], 'applied to public draft');
    // Correction targets are not CLM chips — no claim back-compat attributes.
    assert.ok(!('data-claim-preview' in attrs));
    assert.ok(!('data-claim-excerpt' in attrs));
  });
});

describe('literature record previews (lit)', () => {
  it('every launch literature card is in the preview map with public-only fields', async () => {
    const { resetDataCaches, getLaunchLiterature } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, recordExcerpt, PREVIEW_FORBIDDEN_PAYLOAD_KEYS } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const map = getRecordPreviewMap();
    const launch = getLaunchLiterature();
    assert.ok(launch.length >= 20, `expected the launch literature set, got ${launch.length}`);

    for (const e of launch) {
      const p = map[e.id];
      assert.ok(p, `${e.id} present in preview map`);
      assert.equal(p.record_type, 'literature');
      assert.match(p.type_label, /Published literature card/i);
      assert.match(p.type_label, /not patient data/i);
      // Excerpt is exactly the deterministic truncation of the public catalog title.
      assert.equal(p.excerpt, recordExcerpt(e.title || '', 180), `${e.id} excerpt`);
      assert.ok(p.excerpt, `${e.id} excerpt non-empty`);
      const bare = p.excerpt.replace(/…$/, '').trim();
      assert.ok(
        e.title.replace(/\s+/g, ' ').includes(bare),
        `${e.id} excerpt must derive from the catalog title`,
      );
      // href targets the per-entry route the launch set actually builds.
      assert.ok(p.href && p.href.endsWith(`/literature/${e.id}/`), `${e.id} href: ${p.href}`);
      // Two public catalog facts, verbatim as the /literature/<id>/ card renders them.
      assert.equal(p.year, String(e.year));
      assert.equal(p.study_type, e.study_type || '');
      // Literature payloads carry no claim/hypothesis/UQ/correction-only fields.
      for (const bad of [
        'kind',
        'kind_label',
        'medical_domain',
        'title',
        'hypothesis_kind',
        'confidence',
        'status',
        'category',
        'related_hypothesis_ids',
      ]) {
        assert.ok(!(bad in p), `${e.id} must not carry ${bad}`);
      }
      // Exact key set — a new field cannot appear in the payload without a test change.
      assert.deepEqual(
        Object.keys(p).sort(),
        ['excerpt', 'href', 'id', 'record_type', 'study_type', 'type_label', 'year'],
        `${e.id} payload keys`,
      );
      for (const bad of PREVIEW_FORBIDDEN_PAYLOAD_KEYS) {
        assert.ok(!Object.keys(p).includes(bad), `${e.id} must not expose ${bad}`);
      }
    }
  });

  it('forbids the gated / repository-path LitEntry fields, in the payload and the serialized map', async () => {
    const { resetDataCaches } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, PREVIEW_FORBIDDEN_PAYLOAD_KEYS } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    /*
     * quality_notes and patient_overlap are applicability prose gated per site mode by
     * literatureApplicabilityApproved(); local_pdf and _file are repository paths that are
     * never hosted or linked. None may reach the tooltip JSON, which BaseLayout inlines on
     * every route.
     */
    for (const k of ['quality_notes', 'patient_overlap', 'local_pdf', '_file']) {
      assert.ok(
        PREVIEW_FORBIDDEN_PAYLOAD_KEYS.includes(k),
        `${k} must be listed in PREVIEW_FORBIDDEN_PAYLOAD_KEYS`,
      );
    }
    const serialized = JSON.stringify(getRecordPreviewMap());
    for (const k of PREVIEW_FORBIDDEN_PAYLOAD_KEYS) {
      assert.ok(!serialized.includes(`"${k}"`), `serialized preview map exposes ${k}`);
    }
  });

  it('catalog-only literature ids stay out of the map (no href to an unbuilt route)', async () => {
    const { resetDataCaches, getLiterature, getLaunchLiteratureIds } = await import(
      '../src/lib/data.ts'
    );
    const { getRecordPreviewMap, getLiteraturePreviewMap } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const launchIds = new Set(getLaunchLiteratureIds());
    const catalogOnly = getLiterature()
      .map((e) => e.id)
      .filter((id) => !launchIds.has(id));
    assert.ok(
      catalogOnly.length > 0,
      'the catalog must hold cards outside the launch set for this test to mean anything',
    );
    const map = getRecordPreviewMap();
    for (const id of catalogOnly) {
      assert.ok(!(id in map), `${id} has no /literature/${id}/ route and must not be previewed`);
    }
    assert.deepEqual(Object.keys(getLiteraturePreviewMap()).sort(), [...launchIds].sort());
  });

  it('lit previews do not collide with CLM/H/UQ/COR keys', async () => {
    const { resetDataCaches, getLaunchLiterature } = await import('../src/lib/data.ts');
    const { getRecordPreviewMap, isLitId } = await import('../src/lib/claimPreview.ts');
    resetDataCaches();
    const map = getRecordPreviewMap();
    const litCount = Object.values(map).filter((p) => p.record_type === 'literature').length;
    assert.equal(litCount, getLaunchLiterature().length);
    for (const [id, p] of Object.entries(map)) {
      assert.equal(
        p.record_type === 'literature',
        isLitId(id),
        `${id}: record_type must match id shape`,
      );
    }
  });

  it('recordPreviewDataAttrs emits literature year and study-design attributes', async () => {
    const { resetDataCaches, getLitById } = await import('../src/lib/data.ts');
    const { litPreviewFromEntry, recordPreviewDataAttrs } = await import(
      '../src/lib/claimPreview.ts'
    );
    resetDataCaches();
    const e = getLitById('lit-0340');
    assert.ok(e, 'lit-0340 present in the catalog');
    const p = litPreviewFromEntry(e);
    const attrs = recordPreviewDataAttrs(p);
    assert.equal(attrs['data-record-preview'], 'lit-0340');
    assert.equal(attrs['data-record-type'], 'literature');
    assert.equal(attrs['data-record-excerpt'], p.excerpt);
    assert.equal(attrs['data-record-type-label'], p.type_label);
    assert.equal(attrs['data-record-year'], String(e.year));
    assert.equal(attrs['data-record-study-type'], e.study_type);
    // lit chips are not CLM chips — no claim back-compat attributes, no UQ/COR status.
    assert.ok(!('data-claim-preview' in attrs));
    assert.ok(!('data-claim-excerpt' in attrs));
    assert.ok(!('data-record-status' in attrs));
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

  it('runtime renders the correction record type with status and changelog hint', () => {
    const rt = readFileSync(join(siteRoot, 'src/components/ClaimPreviewRuntime.astro'), 'utf8');
    assert.match(rt, /type === 'correction'/);
    assert.match(rt, /Correction \/ supersession notice — recorded publicly, never silently edited\./);
    assert.match(rt, /open link for the full changelog entry/);
    assert.match(rt, /cpt-k">Status/);
    // Progressive-enhancement fallback must recognise COR ids without the JSON map.
    assert.match(rt, /indexOf\('COR-'\)/);

    /*
     * Every value interpolated inside the correction branch must go through escapeHtml.
     * The title and status come from the corrections register, but the fallback path reads
     * them from DOM attributes, so a raw concatenation here would be an injection sink.
     */
    const branch = rt.match(/\} else if \(type === 'correction'\) \{[\s\S]*?\n {6}\}/);
    assert.ok(branch, 'correction render branch');
    const interpolations = branch[0].match(/\+\s*(?:escapeHtml\()?p\.\w+/g) || [];
    assert.ok(interpolations.length >= 2, 'correction branch interpolates excerpt and status');
    for (const hit of interpolations) {
      assert.match(hit, /escapeHtml\(p\./, `unescaped interpolation in correction branch: ${hit}`);
    }
  });

  it('runtime renders the literature record type with year, study design and card hint', () => {
    const rt = readFileSync(join(siteRoot, 'src/components/ClaimPreviewRuntime.astro'), 'utf8');
    assert.match(rt, /type === 'literature'/);
    assert.match(rt, /Published literature card — a bibliographic reference, not patient data\./);
    assert.match(rt, /open link for the full card/);
    assert.match(rt, /cpt-k">Year/);
    assert.match(rt, /cpt-k">Study design/);
    // Progressive-enhancement fallback must recognise lit ids without the JSON map…
    assert.match(rt, /indexOf\('lit-'\)/);
    // …and read the two literature attributes off the element.
    assert.match(rt, /data-record-year/);
    assert.match(rt, /data-record-study-type/);
    // The generic excerpt push must not double-render the title the branch already emitted.
    assert.match(rt, /type !== 'correction' && type !== 'literature'/);

    /*
     * Every value interpolated inside the literature branch must go through escapeHtml.
     * Titles come from the catalog, but the fallback path reads them from DOM attributes,
     * so a raw concatenation here would be an injection sink.
     */
    const branch = rt.match(/\} else if \(type === 'literature'\) \{[\s\S]*?\n {6}\}/);
    assert.ok(branch, 'literature render branch');
    const interpolations = branch[0].match(/\+\s*(?:escapeHtml\()?p\.\w+/g) || [];
    assert.ok(
      interpolations.length >= 3,
      'literature branch interpolates excerpt, year and study design',
    );
    for (const hit of interpolations) {
      assert.match(hit, /escapeHtml\(p\./, `unescaped interpolation in literature branch: ${hit}`);
    }
  });

  it('ClaimLink sets data-record-preview / data-claim-preview', () => {
    const src = readFileSync(join(siteRoot, 'src/components/ClaimLink.astro'), 'utf8');
    assert.match(src, /data-record-preview|recordPreviewDataAttrs/);
    assert.match(src, /claimPreviewFromClaim|data-claim-preview/);
  });
});
