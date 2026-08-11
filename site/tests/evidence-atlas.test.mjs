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
    // Focus colour is tokenised (dark mode is a token swap), so assert the token, not a hex.
    assert.match(src, /stroke:\s*var\(--focus\)\s*!important/);
    assert.match(src, /fill:\s*var\(--focus-tint\)\s*!important/);
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

  it('CLM / H / UQ / lit nodes carry record-preview data for accessible tooltips', () => {
    assert.match(src, /data-record-preview|data-claim-preview/);
    assert.match(src, /claimExcerpt|previewAttrsForLabel|recordPreviewDataAttrs/);
    assert.match(src, /isHypothesisId|hypothesisPreviewFromHypothesis/);
    assert.match(src, /isUqId|uqPreviewFromUq/);
    // Literature nodes resolve through the launch-set map, so a preview never points at a
    // /literature/<id>/ route that was not built.
    assert.match(src, /isLitId/);
    assert.match(src, /getLiteraturePreviewMap/);
    // The mobile path cards' contradicting-literature links get the same attributes.
    assert.match(
      src,
      /contradicting_lit[\s\S]{0,400}previewAttrsForLabel\(id\)/,
      'mobile contradicting-literature links must carry preview attributes',
    );
  });

  it('band layout wraps rows instead of shrinking slots below the chip width', () => {
    /*
     * Regression lock for the bunched contradicting-evidence band: 16 chips in one row of
     * equal slots gave each chip 65.3px of a 69.6px width, so their borders overlapped.
     * The spacing parameters and the wrap arithmetic are asserted here; the rendered
     * geometry they produce is asserted against dist/ below.
     */
    assert.match(src, /const NODE_GAP_X = \d+/);
    assert.match(src, /const NODE_GAP_Y = \d+/);
    assert.match(src, /const NODE_H = \d+/);
    // One chip-width definition, used by both the layout math and the rendered <rect>.
    assert.match(src, /function nodeWidth\(label: string\): number/);
    assert.match(src, /width=\{w\}/);
    assert.doesNotMatch(src, /const w = Math\.max\(52, n\.label\.length/);
    // Rows: a slot must hold the widest chip in the band plus the gutter.
    assert.match(src, /Math\.floor\(usableW \/ \(widest \+ NODE_GAP_X\)\)/);
    assert.match(src, /Math\.ceil\(count \/ perRow\)/);
    // Bands stack by measured height rather than a single fixed bandH.
    assert.doesNotMatch(src, /const bandH = \d+/);
    assert.match(src, /bandCursorY \+= L\.height \+ bandGap/);
    assert.match(src, /height=\{h\}/);
    /*
     * Band styling keys off band.key. Empty bands are filtered out upstream, so an
     * index-based rule repaints the wrong band as soon as a band appears or disappears —
     * including putting the hatch fill on something other than the contradicting band.
     */
    assert.match(src, /band\.key === 'contradictions'|isContraBand/);
    assert.doesNotMatch(src, /bi === 3/);
    assert.doesNotMatch(src, /bi === 4/);
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

  /**
   * Rendered node chips, in document order: label, band, and the hit-rect box.
   * Reads the geometry the browser actually gets rather than re-deriving it from source.
   */
  function atlasChips(html) {
    return html
      .split('data-atlas-node="')
      .slice(1)
      .map((chunk) => {
        const label = chunk.slice(0, chunk.indexOf('"'));
        const band = (chunk.match(/data-atlas-band="([^"]+)"/) || [])[1];
        const rect = chunk.match(
          /class="atlas-node-hit"[^>]*?x="([-\d.]+)"[^>]*?y="([-\d.]+)"[^>]*?width="([\d.]+)"[^>]*?height="([\d.]+)"/,
        );
        return rect
          ? {
              label,
              band,
              x: Number(rect[1]),
              y: Number(rect[2]),
              w: Number(rect[3]),
              h: Number(rect[4]),
            }
          : { label, band };
      });
  }

  it('no node chip overlaps another, in any band, at the rendered geometry', () => {
    const html = readFileSync(distHome, 'utf8');
    const chips = atlasChips(html);
    assert.ok(chips.length > 20, `expected atlas chips in dist, got ${chips.length}`);
    for (const c of chips) {
      assert.ok(Number.isFinite(c.x), `${c.label}: no hit rect`);
    }
    const bands = [...new Set(chips.map((c) => c.band))];
    assert.ok(bands.includes('contradictions'), 'contradicting band must be rendered');

    for (const band of bands) {
      const inBand = chips.filter((c) => c.band === band);
      const rowYs = [...new Set(inBand.map((c) => c.y))].sort((a, b) => a - b);
      // Rows never collide vertically.
      for (let i = 1; i < rowYs.length; i += 1) {
        assert.ok(
          rowYs[i] - rowYs[i - 1] >= inBand[0].h,
          `${band}: rows at ${rowYs[i - 1]} and ${rowYs[i]} overlap vertically`,
        );
      }
      for (const y of rowYs) {
        const row = inBand.filter((c) => c.y === y).sort((a, b) => a.x - b.x);
        for (let i = 1; i < row.length; i += 1) {
          const gap = row[i].x - (row[i - 1].x + row[i - 1].w);
          /*
           * 16px is the NODE_GAP_X the layout reserves; the epsilon absorbs the fractional
           * chip width (label.length * 7.2). Before the wrap fix the contradicting band's
           * gap was −4.35px — borders overlapping, which is what "bunched" looked like.
           */
          assert.ok(
            gap >= 15.9,
            `${band} row y=${y}: ${row[i - 1].label} → ${row[i].label} gap ${gap.toFixed(2)}px`,
          );
        }
        // Chips stay inside the band rect (x=20, width=1060) at every viewport, since the
        // SVG scales as one unit.
        assert.ok(row[0].x >= 20, `${band} row y=${y}: leftmost chip escapes the band`);
        const right = row[row.length - 1];
        assert.ok(right.x + right.w <= 1080, `${band} row y=${y}: rightmost chip escapes the band`);
      }
    }
  });

  it('the contradicting band wraps onto multiple rows and the SVG grows to hold them', () => {
    const html = readFileSync(distHome, 'utf8');
    const chips = atlasChips(html);
    const contra = chips.filter((c) => c.band === 'contradictions');
    assert.ok(contra.length > 12, `expected a dense contradicting band, got ${contra.length}`);
    const rowYs = [...new Set(contra.map((c) => c.y))];
    assert.ok(
      rowYs.length >= 2,
      `${contra.length} contradicting chips must wrap onto more than one row`,
    );
    // Rows are balanced, not one full row plus a stub.
    const counts = rowYs.map((y) => contra.filter((c) => c.y === y).length);
    assert.ok(
      Math.max(...counts) - Math.min(...counts) <= 1,
      `contradicting rows must be balanced, got ${counts.join('/')}`,
    );
    // The viewBox has to cover the lowest chip plus the terminal caption.
    const viewBox = html.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    assert.ok(viewBox, 'atlas viewBox');
    const lowest = Math.max(...chips.map((c) => c.y + c.h));
    assert.ok(
      Number(viewBox[2]) > lowest,
      `viewBox height ${viewBox[2]} must exceed the lowest chip edge ${lowest}`,
    );
  });

  it('literature chips carry the literature record preview', () => {
    const html = readFileSync(distHome, 'utf8');
    const chips = atlasChips(html);
    const lits = chips.filter((c) => /^lit-\d{4}$/.test(c.label));
    assert.ok(lits.length > 0, 'expected lit nodes on the atlas');
    for (const c of lits) {
      const chunk = html.split(`data-atlas-node="${c.label}"`)[1].slice(0, 1200);
      assert.match(
        chunk,
        new RegExp(`data-record-preview="${c.label}"`),
        `${c.label} must carry data-record-preview`,
      );
      assert.match(chunk, /data-record-type="literature"/, `${c.label} record type`);
      assert.match(chunk, /data-record-excerpt="[^"]+"/, `${c.label} excerpt`);
      assert.match(chunk, /data-record-type-label="Published literature card/, `${c.label} label`);
      assert.match(chunk, /data-record-year="\d{4}"/, `${c.label} year`);
      assert.match(chunk, /data-record-study-type="[^"]+"/, `${c.label} study design`);
    }
    // Each lit chip is a link to the per-entry route that route generation actually builds.
    for (const c of lits) {
      assert.ok(
        existsSync(join(siteRoot, 'dist', 'literature', c.label, 'index.html')),
        `${c.label} atlas node links to a route that must exist in dist`,
      );
    }
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
