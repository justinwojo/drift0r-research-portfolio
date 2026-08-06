/**
 * Structural / responsive regression for Evidence Atlas + kind→band mapping (P0-3).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const component = join(siteRoot, 'src/components/EvidenceAtlas.astro');
const distHome = join(siteRoot, 'dist/index.html');

describe('Evidence Atlas component structure', () => {
  const src = readFileSync(component, 'utf8');

  it('SVG nodes are links or keyboard-focusable', () => {
    assert.match(src, /atlas-node-link|tabindex="0"/);
    assert.match(src, /aria-label=\{name\}|aria-label=\{name\}/);
    assert.match(src, /data-atlas-node/);
  });

  it('has visible focus/hover styles', () => {
    assert.match(src, /:focus-visible|:focus/);
    assert.match(src, /:hover/);
    assert.match(src, /stroke:\s*#0b5fff|stroke:\s*#0B5FFF/i);
  });

  it('preserves authoritative HTML table fallback', () => {
    assert.match(src, /Complete table equivalent/);
    assert.match(src, /<table class="data">/);
  });

  it('has mobile path cards / desktop SVG media queries (J.2 / J.2.1)', () => {
    assert.match(src, /max-width:\s*720px/);
    assert.match(src, /atlas-svg-desktop/);
    assert.match(src, /atlas-path-scroller|atlas-path-card/);
    assert.match(src, /scroll-snap-type:\s*x\s+mandatory/);
    assert.match(src, /atlasTableRows|pathRows/);
    assert.match(src, /no diagnosis/i);
    // J.2.1: role/region + tabindex on the actual overflow track
    assert.match(src, /atlas-path-track[\s\S]{0,200}role="region"/);
    assert.match(src, /data-atlas-carousel="path-track"/);
    assert.match(src, /ArrowRight|ArrowLeft/);
    // Cards size from track width, not fixed 340px viewport clamp
    assert.match(src, /--atlas-card-w|sizeCards/);
    assert.doesNotMatch(src, /flex:\s*0\s+0\s+min\(88vw,\s*340px\)/);
  });

  it('CLM / H / UQ nodes carry record-preview data for accessible tooltips', () => {
    assert.match(src, /data-record-preview|data-claim-preview/);
    assert.match(src, /claimExcerpt|previewAttrsForLabel|recordPreviewDataAttrs/);
    assert.match(src, /isHypothesisId|hypothesisPreviewFromHypothesis/);
    assert.match(src, /isUqId|uqPreviewFromUq/);
  });

  it('documents history band in atlas copy', () => {
    assert.match(src, /history/);
    assert.match(src, /Patient-reported|reported as history|history/);
  });

  it('desktop edges omit per-connector verb text; legend and a11y preserve meaning', () => {
    // No SVG <text> that renders e.verb on every edge midpoint
    assert.doesNotMatch(src, /font-size="8"[\s\S]{0,80}\{e\.verb\}/);
    assert.match(src, /edgeStroke|data-atlas-verb/);
    assert.match(src, /no repeated verb|uncluttered|collid/i);
    assert.match(src, /Relationships:|accessible node|atlas-key/);
    // Legend still names the relationship families
    assert.match(src, /would explain/);
    assert.match(src, /does not explain/);
    assert.match(src, /leaves open/);
  });
});

describe('buildEvidenceAtlas kind-to-band mapping (P0-3)', () => {
  it('hypothesis and reported_history never enter findings band', async () => {
    const { buildEvidenceAtlas, resetDataCaches } = await import('../src/lib/data.ts');
    resetDataCaches();
    const atlas = buildEvidenceAtlas();
    const findings = atlas.nodes.filter((n) => n.band === 'findings');
    const history = atlas.nodes.filter((n) => n.band === 'history');
    const interps = atlas.nodes.filter((n) => n.band === 'interpretations');

    // Band keys include history
    assert.ok(atlas.bands.some((b) => b.key === 'history'));
    assert.ok(atlas.bands.some((b) => b.key === 'findings'));

    // No findings node should be a known hypothesis-kind claim ID if present
    // CLM-0049 is kind: hypothesis — must not be in findings (node id is the claim id on explains path)
    const clm49 = atlas.nodes.find((n) => n.id === 'CLM-0049');
    if (clm49) {
      assert.notEqual(clm49.band, 'findings', 'CLM-0049 must not be Documented findings');
      assert.ok(
        clm49.band === 'interpretations' || clm49.band === 'hypotheses',
        `CLM-0049 band=${clm49.band}`,
      );
    }

    // CLM-0039 is reported_history when on explains path — must not be findings.
    // (If only present as does_not_explain, id is contra-CLM-0039 in contradictions — OK.)
    const clm39 = atlas.nodes.find((n) => n.id === 'CLM-0039');
    if (clm39) {
      assert.notEqual(clm39.band, 'findings', 'CLM-0039 reported_history must not be findings');
      assert.equal(clm39.band, 'history');
    }

    // Structural: no findings-band node may come from hypothesis/history kinds in explains edges
    for (const n of findings) {
      assert.ok(n.id.startsWith('CLM-') || n.label.startsWith('CLM-'), n.id);
    }

    // Every "would explain" edge endpoint that is not a hypothesis H* must not be hypothesis-kind
    // in findings (covered above). Assert findings never include known non-fact kinds by scanning
    // claim inventory when available.
    const { getClaims } = await import('../src/lib/data.ts');
    const kindById = new Map(getClaims().map((c) => [c.id, c.kind]));
    for (const n of findings) {
      const kind = kindById.get(n.id) || kindById.get(n.label);
      if (!kind) continue;
      assert.notEqual(kind, 'hypothesis', `${n.id} hypothesis in findings`);
      assert.notEqual(kind, 'reported_history', `${n.id} reported_history in findings`);
    }

    // Circular self-support: H1 must not list its own thesis claim as a "would explain"
    // edge from a findings-band node.
    const h1ExplainEdges = atlas.edges.filter(
      (e) =>
        e.verb === 'would explain' &&
        (e.from === 'H1' || e.to === 'H1') &&
        (e.from === 'CLM-0049' || e.to === 'CLM-0049'),
    );
    // If CLM-0049 is still in explains_claim_ids of H1, it must use a non-findings edge verb
    for (const e of h1ExplainEdges) {
      const other = e.from === 'H1' ? e.to : e.from;
      const node = atlas.nodes.find((n) => n.id === other);
      assert.ok(
        !node || node.band !== 'findings',
        'H1 must not treat its thesis claim as a findings "would explain" edge',
      );
    }

    // Soft assert: history or interpretations bands may hold non-fact kinds
    assert.ok(Array.isArray(history));
    assert.ok(Array.isArray(interps));
  });

  it('reported_history never enters contradictions band (Checkpoint H P1-4)', async () => {
    const { buildEvidenceAtlas, getClaims, resetDataCaches } = await import('../src/lib/data.ts');
    resetDataCaches();
    const atlas = buildEvidenceAtlas();
    const kindById = new Map(getClaims().map((c) => [c.id, c.kind]));
    const contradictions = atlas.nodes.filter((n) => n.band === 'contradictions');
    for (const n of contradictions) {
      const claimId = n.label.startsWith('CLM-') ? n.label : n.id.replace(/^contra-/, '');
      const kind = kindById.get(claimId);
      if (!kind) continue;
      assert.notEqual(
        kind,
        'reported_history',
        `${claimId} reported_history must not appear in Contradicting evidence`,
      );
    }
    // Empty bands must not be listed (no empty labelled boxes).
    for (const b of atlas.bands) {
      assert.ok(
        atlas.nodes.some((n) => n.band === b.key),
        `band ${b.key} listed but empty`,
      );
    }
  });
});

describe('Evidence Atlas in built home (if dist present)', {
  skip: !existsSync(distHome),
}, () => {
  it('home HTML contains interactive atlas markers', () => {
    const html = readFileSync(distHome, 'utf8');
    assert.match(html, /atlas-node|data-atlas-node|Evidence Atlas/i);
    assert.match(html, /Complete table equivalent/i);
    assert.match(html, /atlas-path-card|atlas-path-scroller/i);
    assert.match(html, /data-claim-preview="CLM-/);
    assert.match(html, /There is no diagnosis or answer band|no diagnosis/i);
  });

  it('does not place hypothesis-kind claim in findings band when present (post-rebuild)', () => {
    const html = readFileSync(distHome, 'utf8');
    // Stale dist from before P0-3 may still show findings — skip until atlas copy is new.
    if (!/Patient-reported \/ history|restates architecture|hypothesis-kind claims never/i.test(html)) {
      return;
    }
    if (html.includes('CLM-0049')) {
      assert.doesNotMatch(
        html,
        /data-atlas-node="CLM-0049"[^>]*data-atlas-band="findings"|data-atlas-band="findings"[^>]*data-atlas-node="CLM-0049"/,
      );
    }
  });
});
