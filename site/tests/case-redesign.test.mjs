/**
 * /case/ redesign — compact record cards, correction scope split, domain grouping,
 * sticky jump-nav, and the progressive-enhancement record finder.
 *
 * Source-string tests always run. Built-HTML tests read site/dist and skip cleanly
 * when no build is present, matching the existing suites' pattern.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const src = (rel) => readFileSync(join(siteRoot, 'src', rel), 'utf8');

const dist = join(siteRoot, 'dist');
const casePath = join(dist, 'case/index.html');
const questionsPath = join(dist, 'questions-for-clinicians/index.html');
const hasDist = existsSync(casePath) && existsSync(questionsPath);
const skipDist = hasDist ? false : 'skip: site/dist missing (run a build first)';

/** HTML of one record card, sliced on the non-nesting <article> boundary. */
function cardHtml(html, id) {
  const marker = html.indexOf(`data-record-card="${id}"`);
  assert.ok(marker > 0, `card ${id} not rendered`);
  const open = html.lastIndexOf('<article', marker);
  const end = html.indexOf('</article>', marker);
  assert.ok(open >= 0 && end > open, `card ${id} boundaries`);
  return html.slice(open, end + '</article>'.length);
}

/** Correction ids rendered as claim-specific pills inside a card. */
function pillIds(cardMarkup) {
  const out = [];
  const re = /<a class="cor-pill[^"]*"[^>]*data-record-preview="(COR-\d{4})"/g;
  let m;
  while ((m = re.exec(cardMarkup))) out.push(m[1]);
  return out;
}

describe('/case/ record card — correction scope split (mockups A1 + A3)', () => {
  it('RecordCard reads the split buckets and never re-renders the union as pills', () => {
    const card = src('components/RecordCard.astro');
    assert.match(card, /corrections_claim_specific/, 'claim-specific bucket used');
    assert.match(card, /corrections_domain_wide/, 'domain-wide bucket used');
    // The union must not be mapped over again — that was the original per-claim bloat.
    assert.doesNotMatch(card, /claim\.corrections\.map/);
    // Duplicate "Correction / supersession notices:" link line is gone.
    assert.doesNotMatch(card, /Correction \/ supersession notices:/);
    // Pills carry the shared record-preview attributes (tooltip for free).
    assert.match(card, /recordPreviewDataAttrs\(correctionPreviewFromCorrection\(c\)\)/);
  });

  it('publication mode drops the public_approved line but keeps it when not true', () => {
    const card = src('components/RecordCard.astro');
    assert.match(
      card,
      /getSiteMode\(\)\s*!==\s*'publication'\s*\|\|\s*claim\.public_approved\s*!==\s*true/,
      'approval line must survive in preview mode and whenever the flag is not true',
    );
  });

  it(
    'built cards: claim-specific ids are pills, domain-wide ids are not',
    { skip: skipDist },
    async () => {
      const { resetDataCaches, getClaims } = await import('../src/lib/data.ts');
      resetDataCaches();
      const html = readFileSync(casePath, 'utf8');
      const claims = getClaims().filter((c) => c.corrections.length > 0);
      assert.ok(claims.length > 5, `expected corrected claims, got ${claims.length}`);

      let checkedDomainWide = 0;
      for (const c of claims) {
        const markup = cardHtml(html, c.id);
        const pills = pillIds(markup);
        assert.deepEqual(
          pills,
          c.corrections_claim_specific.map((x) => x.id),
          `${c.id}: pills must be exactly the claim-specific corrections, in register order`,
        );
        for (const dw of c.corrections_domain_wide) {
          assert.ok(
            !pills.includes(dw.id),
            `${c.id}: domain-wide ${dw.id} must not render as a per-claim pill`,
          );
          checkedDomainWide += 1;
        }
      }
      assert.ok(checkedDomainWide > 10, 'domain-wide notices must actually be exercised');
    },
  );

  it(
    'built cards: domain-wide notices collapse into one summary line naming the domain',
    { skip: skipDist },
    async () => {
      const { resetDataCaches, getClaims } = await import('../src/lib/data.ts');
      resetDataCaches();
      const html = readFileSync(casePath, 'utf8');
      const sample = getClaims().find((c) => c.corrections_domain_wide.length > 1);
      assert.ok(sample, 'need a claim with several domain-wide notices');
      const markup = cardHtml(html, sample.id);
      const domain = sample.medical_domain.replace(/_/g, ' ');
      const n = sample.corrections_domain_wide.length;
      assert.match(
        markup,
        new RegExp(`<summary>${n} domain-wide correction notices? for ${domain}</summary>`),
        `${sample.id}: single collapsed domain-wide summary line`,
      );
      // …and exactly one such expander per card (never one line per notice).
      const summaries = markup.match(/domain-wide correction notice/g) || [];
      assert.equal(summaries.length, 1, `${sample.id}: one domain-wide expander per card`);
    },
  );

  it(
    'built cards: full correction titles exist server-side, not tooltip-only',
    { skip: skipDist },
    async () => {
      const { resetDataCaches, getClaims } = await import('../src/lib/data.ts');
      resetDataCaches();
      const html = readFileSync(casePath, 'utf8');
      const sample = getClaims().find(
        (c) => c.corrections_claim_specific.length > 0 && c.corrections_domain_wide.length > 0,
      );
      assert.ok(sample, 'need a claim with both correction kinds');
      // Strip every data-* attribute so only rendered text can satisfy the assertion —
      // a title that lives solely in a tooltip payload must not count.
      const markup = cardHtml(html, sample.id).replace(/\sdata-[a-z-]+="[^"]*"/g, '');
      for (const c of [...sample.corrections_claim_specific, ...sample.corrections_domain_wide]) {
        assert.ok(
          markup.includes(c.id),
          `${sample.id}: ${c.id} id missing from server-rendered card`,
        );
        assert.ok(
          markup.includes(c.title),
          `${sample.id}: ${c.id} full title must be server-rendered (touch users have no hover)`,
        );
      }
    },
  );
});

describe('/case/ page shape — domain grouping and jump-nav (mockup B)', () => {
  it(
    'built page: domains appear in first-appearance order and claim order is preserved',
    { skip: skipDist },
    async () => {
      const { resetDataCaches, getClaimsByKind } = await import('../src/lib/data.ts');
      resetDataCaches();
      const html = readFileSync(casePath, 'utf8');

      let checkedDomains = 0;
      for (const kind of [
        'observed_fact',
        'reported_history',
        'interpretation',
        'research_question',
        'hypothesis',
      ]) {
        const claims = getClaimsByKind(kind);
        if (!claims.length) continue;

        // Slice the register section out of the page so neighbouring registers cannot
        // satisfy the ordering assertions for this one.
        const start = html.indexOf(`data-register="${kind}"`);
        assert.ok(start > 0, `register section for ${kind}`);
        const end = html.indexOf('<section class="page-section"', start + 1);
        const section = html.slice(start, end > start ? end : html.length);

        // Expected first-appearance domain order, straight from claim order.
        const expectedDomains = [];
        for (const c of claims) {
          const d = c.medical_domain || 'unspecified';
          if (!expectedDomains.includes(d)) expectedDomains.push(d);
        }
        const renderedDomains = [...section.matchAll(/<h3 class="domain-h" id="reg-[a-z_]+-dom-([a-z_]+)">/g)].map(
          (m) => m[1],
        );
        assert.deepEqual(
          renderedDomains,
          expectedDomains,
          `${kind}: domain subheads must follow first appearance in claim order`,
        );
        checkedDomains += renderedDomains.length;

        // Claim order inside the register must be unchanged: grouping by domain is a
        // stable partition, so cards read as the claims of domain 1, then domain 2, …
        const renderedIds = [...section.matchAll(/data-record-card="([A-Z]+-\d+)"/g)].map((m) => m[1]);
        const expectedIds = expectedDomains.flatMap((d) =>
          claims.filter((c) => (c.medical_domain || 'unspecified') === d).map((c) => c.id),
        );
        assert.deepEqual(renderedIds, expectedIds, `${kind}: claim order preserved within domains`);
      }
      assert.ok(checkedDomains >= 10, `expected many domain groups, got ${checkedDomains}`);
    },
  );

  it('grouping helper does not sort or alphabetize', () => {
    const page = src('pages/case.astro');
    assert.match(page, /function groupByDomain/);
    // Map insertion order == first appearance. Guards the implementation; the built-page
    // test above is the behavioural gate.
    assert.doesNotMatch(page, /groupByDomain\([^)]*\)[\s\S]{0,80}\.sort\(/);
    assert.doesNotMatch(page, /function groupByDomain[\s\S]{0,400}\.sort\(/);
  });

  it('adds no control that filters, reorders, or interleaves registers', () => {
    const page = src('pages/case.astro');
    for (const banned of [/<select/i, /type="checkbox"/i, /type="radio"/i]) {
      assert.doesNotMatch(page, banned, 'registers are sections, not filters');
    }
  });

  it('renames the research-question register and its kind label consistently', () => {
    const page = src('pages/case.astro');
    assert.match(page, /title: 'Research-question claims'/);
    // The colored jump-nav chips are the register key; no separate badge row remains.
    assert.match(page, /short: 'Research questions'/);
    assert.doesNotMatch(page, /label="Question for clinicians"/);
    assert.doesNotMatch(page, /title: 'Questions for clinicians'/);
    // The kind label follows the register rename so the same page never shows both
    // strings — "Questions for clinicians" now names only the curated CQ page.
    const constants = src('lib/constants.ts');
    assert.match(constants, /research_question: \{ glyph: '\?', label: 'Research-question claim'/);
  });

  it('jump-nav sticks only above the mobile disclaimer strip, and offsets its targets', () => {
    const css = src('styles/global.css');
    const sticky = css.match(/@media \(min-width: 481px\) \{[\s\S]*?\n\}/);
    assert.ok(sticky, 'jump-nav sticky block exists');
    assert.match(sticky[0], /\.jumpnav \{[\s\S]*?position: sticky;[\s\S]*?top: 0;/);
    // A stuck bar hides whatever a hash link lands on unless the targets clear it —
    // and the offset must stay scoped to this page, which is the only one with a nav.
    assert.match(sticky[0], /section\[data-register\] \.sec\[id\^='reg-'\][\s\S]*?scroll-margin-top:/);
    assert.match(sticky[0], /section\[data-register\] \.record\[id\][\s\S]*?scroll-margin-top:/);
    assert.doesNotMatch(sticky[0], /\n\s+\.record\[id\]/, 'offset must not apply site-wide');
    // Below 481px the disclaimer strip owns top: 0 — nothing may stack on it, so the
    // only sticky declaration for .jumpnav must be the one inside that media block.
    const withoutBlock = css.replace(sticky[0], '');
    assert.doesNotMatch(withoutBlock, /\.jumpnav[^{}]*\{[^}]*position: sticky/);
  });

  it('built page: jump-nav is a plain anchor list to every register', { skip: skipDist }, () => {
    const html = readFileSync(casePath, 'utf8');
    assert.match(html, /<nav class="jumpnav" aria-label="Jump to a register">/);
    for (const kind of [
      'observed_fact',
      'reported_history',
      'interpretation',
      'research_question',
      'hypothesis',
    ]) {
      assert.match(
        html,
        new RegExp(`<a href="#reg-${kind}" class="jn-[a-z]+">`),
        `jump-nav link for ${kind}`,
      );
      assert.match(
        html,
        new RegExp(`<h2 class="sec" id="reg-${kind}">`),
        `register heading target for ${kind}`,
      );
    }
    // Counts render next to each link.
    assert.match(html, /<span class="count mono">\d+<\/span>/);
    // No JS required for the nav itself.
    assert.doesNotMatch(html, /class="jumpnav"[^>]*hidden/);
  });

  it('built page: domain subheads carry counts', { skip: skipDist }, () => {
    const html = readFileSync(casePath, 'utf8');
    const heads = html.match(/<h3 class="domain-h" id="reg-[a-z_]+-dom-[a-z_]+">/g) || [];
    assert.ok(heads.length >= 10, `expected many domain subheads, got ${heads.length}`);
    assert.match(html, /<h3 class="domain-h"[^>]*><span>bone<\/span><span class="count mono">\(\d+\)<\/span>/);
  });

  it('built page: register titles renamed, register order unchanged', { skip: skipDist }, () => {
    const html = readFileSync(casePath, 'utf8');
    assert.match(html, /<h2 class="sec" id="reg-research_question">Research-question claims<\/h2>/);
    const order = [
      'reg-observed_fact',
      'reg-reported_history',
      'reg-interpretation',
      'reg-research_question',
      'reg-hypothesis',
    ].map((id) => html.indexOf(`<h2 class="sec" id="${id}">`));
    for (const idx of order) assert.ok(idx > 0, 'every register section renders');
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i] > order[i - 1], 'registers keep their fixed order');
    }
  });
});

describe('/case/ ↔ /questions-for-clinicians/ cross-links', () => {
  it('built pages link both ways', { skip: skipDist }, () => {
    const caseHtml = readFileSync(casePath, 'utf8');
    const qHtml = readFileSync(questionsPath, 'utf8');
    assert.match(
      caseHtml,
      /The curated clinician-facing set lives on <a href="[^"]*\/questions-for-clinicians\/">Questions for clinicians<\/a>/,
    );
    assert.match(qHtml, /href="[^"]*\/case\/#reg-research_question"/);
    assert.match(qHtml, /This page is the curated question set/);
  });
});

describe('/case/ record finder — progressive enhancement only (mockup C)', () => {
  it('ships a hidden shell and builds its index from the page, not a new payload', () => {
    const finder = src('components/RecordFinder.astro');
    assert.match(finder, /id="record-finder"[^>]*hidden/, 'shell must ship hidden');
    assert.match(finder, /root\.hidden = false;/, 'only JS reveals it');
    assert.match(finder, /querySelectorAll\('section\[data-register\]'\)/);
    assert.match(finder, /querySelectorAll\('article\[data-record-card\]'\)/);
    // No second serialization of preview data.
    assert.doesNotMatch(finder, /getRecordPreviewMap|JSON\.stringify/);
  });

  // Behaviour with JS on (enhancement, register-ordered groups, Escape) is covered by
  // the CDP cases in j2-1-ux-interaction.test.mjs; this one is the no-JS shape.
  it('built page: finder ships hidden, and its register hooks are on the sections', { skip: skipDist }, () => {
    const html = readFileSync(casePath, 'utf8');
    assert.match(html, /<div class="finder" id="record-finder" hidden data-record-finder>/);
    // Labeled input, live region for result counts.
    assert.match(html, /<label class="finder-label" for="record-finder-input">/);
    assert.match(html, /id="record-finder-status" role="status" aria-live="polite"/);
    assert.match(html, /<div class="finder-results" id="record-finder-results" hidden>/);
    // Register grouping payload the script needs is on the sections themselves.
    assert.match(html, /<section class="page-section" aria-labelledby="reg-observed_fact" data-register="observed_fact" data-register-title="Documented findings">/);
  });

  it('finder never hides, filters, or reorders page content', () => {
    const finder = src('components/RecordFinder.astro');
    // It may only read the DOM and scroll to a target.
    assert.doesNotMatch(finder, /\.style\.display\s*=/);
    assert.doesNotMatch(finder, /card\.hidden\s*=/);
    assert.match(finder, /scrollIntoView/);
    assert.match(finder, /record-flash/);
    assert.match(finder, /prefers-reduced-motion/);
  });
});
