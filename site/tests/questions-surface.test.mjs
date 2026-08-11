/**
 * Unified questions surface (/questions/) — ROADMAP §7.
 *
 * Two registers on one route: the ten clinician questions (also kept, in full framing,
 * on /questions-for-clinicians/) and the twenty unresolved record questions, which
 * before this page existed were public only as machine-readable YAML.
 *
 * The load-bearing invariants:
 *   - every CQ and UQ id is a real fragment target on the page (nothing filtered away);
 *   - /questions-for-clinicians/ keeps all ten of its own anchors (no route moved);
 *   - the `owner` field of a UQ never reaches a reader;
 *   - registers are *sections*, not filters — no entry ships hidden.
 *
 * Source-string tests always run. Built-HTML tests read site/dist and skip cleanly
 * when no build is present, matching the existing suites' pattern.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const src = (rel) => readFileSync(join(siteRoot, 'src', rel), 'utf8');

const dist = join(siteRoot, 'dist');
const questionsPath = join(dist, 'questions/index.html');
const clinicianPath = join(dist, 'questions-for-clinicians/index.html');
const workingModelPath = join(dist, 'working-model/index.html');
const hasDist = existsSync(questionsPath) && existsSync(clinicianPath);
const skipDist = hasDist ? false : 'skip: site/dist missing (run a build first)';
const questionsHtml = () => readFileSync(questionsPath, 'utf8');

/**
 * Every distinct `owner` value in the register, read from the YAML rather than restated
 * here, so a value added later is covered without anyone remembering to update this file.
 *
 * `owner` names who would hold a document that has not been retrieved. It is an internal
 * acquisition note, not a public statement about the record, and must never render.
 */
const uqYaml = loadYaml(
  readFileSync(
    join(siteRoot, '..', 'audits/2026-08-publication-readiness/02_unresolved_record_questions.yaml'),
    'utf8',
  ),
);
const OWNER_VALUES = [
  ...new Set((uqYaml.questions || []).map((q) => (q.owner || '').trim()).filter(Boolean)),
];

/**
 * Values distinctive enough for a substring search to mean something. A bare English word
 * like `patient` occurs throughout ordinary prose on this page, so asserting its absence
 * would fail on copy that has nothing to do with the field. Those values are covered
 * instead by the source-level assertion that the page never reads `owner` at all, and by
 * the review trigger below.
 */
const isDistinctiveOwner = (v) => v.includes('_');

const uqs = async () => (await import('../src/lib/data.ts')).getUnresolvedQuestions();
const cqs = async () => (await import('../src/lib/data.ts')).getClinicianQuestions();

describe('/questions/ — page source', () => {
  it('renders both registers as whole sections, never as a filtered view', async () => {
    const page = src('pages/questions/index.astro');
    // Chips navigate. Nothing on this page may hide, reorder, or interleave entries —
    // the site publishes copy committing to "registers are sections, not filters".
    assert.match(page, /class="domain-nav"/, 'jump-nav chip row present');
    assert.doesNotMatch(page, /display:\s*none/i, 'no inline hiding');
    assert.doesNotMatch(page, /\shidden(\s|=|>)/, 'no hidden attribute on entries');
    assert.match(page, /data-register="clinician_question"/);
    // The two UQ buckets are sibling register sections driven by the bucket list.
    assert.match(page, /data-register=\{bucket\.key\}/);
    assert.match(page, /key:\s*'uq-blocking'/);
    assert.match(page, /key:\s*'uq-open'/);
  });

  it('splits the record questions on blocks_launch_critical_wording as sections, not a badge', () => {
    const page = src('pages/questions/index.astro');
    assert.match(page, /blocks_launch_critical_wording/, 'flag drives the split');
    // The raw boolean must not surface as a chip/badge value.
    assert.doesNotMatch(page, /blocks_launch_critical_wording\s*\}/, 'flag never printed');
    assert.match(page, /Still blocks launch-critical wording/);
    assert.match(page, /Absence of a record is never a negative finding/);
  });

  it('never reads the internal owner field', () => {
    const page = src('pages/questions/index.astro');
    // The doc comment says why owner stays internal, so match on reads, not the word.
    assert.doesNotMatch(page, /\bq\.owner\b/, 'owner is not read');
    assert.doesNotMatch(page, /\{[^}]*\.owner[^}]*\}/, 'owner is not interpolated');
  });

  it('emits the RecordFinder progressive-enhancement contract', () => {
    const page = src('pages/questions/index.astro');
    assert.match(page, /<RecordFinder\b/, 'finder mounted');
    assert.match(page, /data-register-title=/, 'sections labelled for the finder');
    assert.match(page, /data-record-card=/, 'cards discoverable');
    assert.match(page, /data-kind="clinician_question"/);
    assert.match(page, /data-kind="unresolved_question"/);
    assert.match(page, /class="record-body"/, 'finder indexes .record-body text');
  });

  it('links a clinician question to a hypothesis only when that hypothesis renders', () => {
    const page = src('pages/questions/index.astro');
    // related_hypothesis_ids is a raw list off the question record; getHypotheses() is
    // mode-filtered. Under a partial approval the two disagree, and an ungated link would
    // be a fragment pointing at a hypothesis /working-model/ never rendered.
    assert.match(page, /const rendersHypothesis = \(id: string\) => hypothesisAttrs\.has\(id\)/);
    assert.match(page, /\{rendersHypothesis\(id\) \? \(/);
  });

  it('public-language gate covers every UQ field the page renders', () => {
    const data = src('lib/data.ts');
    // topic and closest_available_record went from internal to rendered with this page.
    // A field that renders and is not gated is exactly the hole the gate exists to close.
    for (const field of ['topic', 'question', 'why_it_matters', 'closest_available_record']) {
      assert.match(
        data,
        new RegExp(`${field}:\\s*toPublicLanguage\\(`),
        `${field} transformed to public language`,
      );
      assert.match(
        data,
        new RegExp(`text:\\s*q\\.${field}`),
        `${field} passed through assertSafePublicLanguage`,
      );
    }
  });
});

describe('/questions/ — inbound links and nav', () => {
  it('the primary nav points at the unified surface', () => {
    const constants = src('lib/constants.ts');
    assert.match(constants, /href:\s*'\/questions\/',\s*label:\s*'Questions'/);
  });

  it('UQ record previews resolve to a real fragment', () => {
    const preview = src('lib/claimPreview.ts');
    assert.match(preview, /withBase\(`\/questions\/#\$\{q\.id\}`\)/);
    assert.doesNotMatch(preview, /No stable public UQ fragment route/);
  });

  it('HypothesisRecord UQ chips link only when the target resolves', () => {
    const comp = src('components/HypothesisRecord.astro');
    assert.match(comp, /<a class="mono uq-chip" href=\{withBase\(`\/questions\/#\$\{item\.id\}`\)\}/);
    // Fail closed: the anchor is gated on getUqById resolving, and a UQ that is not
    // rendered in the current mode keeps the pre-route span rather than a dangling link.
    assert.match(comp, /\{uq \? \(/, 'anchor is conditional on the UQ resolving');
    assert.match(comp, /<span class="mono uq-chip" tabindex="0"/, 'unlinked fallback kept');
  });

  it('/questions-for-clinicians/ points here and is otherwise unchanged', () => {
    const page = src('pages/questions-for-clinicians/index.astro');
    assert.match(page, /withBase\('\/questions\/'\)/, 'pointer added');
    assert.match(page, /unresolved record questions/i);
  });

  it('/for-clinicians/ links its excerpted UQ ids and names the overflow', () => {
    const page = src('pages/for-clinicians.astro');
    assert.match(page, /withBase\(`\/questions\/#\$\{u\.id\}`\)/, 'ids link out');
    assert.match(page, /uqs\.length > uqsLead\.length/, 'overflow note gated on the count');
    // The page prints; the route has to be readable on paper.
    assert.match(page, /\/questions\//, 'route spelled out in plain text');
  });

  it('the route is approved for publication and allowlisted', () => {
    const scope = readFileSync(join(siteRoot, 'src/data/release_scope.yaml'), 'utf8');
    assert.match(scope, /^\s*-\s*\/questions\/\s*$/m, 'approved_hardcoded_routes carries it');
    const allowlist = readFileSync(
      join(siteRoot, '..', 'governance/public_allowlist.yaml'),
      'utf8',
    );
    assert.match(allowlist, /^\s*-\s*questions\/\s*$/m, 'v1_site_artifact carries it');
    const canary = readFileSync(join(siteRoot, 'scripts/partial-approval-canary-build.mjs'), 'utf8');
    assert.match(canary, /'\/questions\/'/, 'canary build approves it too');
  });
});

describe('/questions/ — built HTML', { skip: skipDist }, () => {
  it('renders all ten clinician questions as fragment targets', async () => {
    const html = questionsHtml();
    const ids = (await cqs()).map((q) => q.id);
    assert.equal(ids.length, 10, 'ten clinician questions in the register');
    for (const id of ids) {
      assert.ok(html.includes(`id="${id}"`), `${id} anchor missing from /questions/`);
    }
  });

  it('renders all twenty unresolved record questions as fragment targets', async () => {
    const html = questionsHtml();
    const ids = (await uqs()).map((q) => q.id);
    assert.equal(ids.length, 20, 'twenty record questions in the register');
    for (const id of ids) {
      assert.ok(html.includes(`id="${id}"`), `${id} anchor missing from /questions/`);
    }
  });

  it('keeps every CQ anchor resolving on /questions-for-clinicians/', async () => {
    const html = readFileSync(clinicianPath, 'utf8');
    for (const q of await cqs()) {
      assert.ok(html.includes(`id="${q.id}"`), `${q.id} anchor lost from the clinician page`);
    }
  });

  it('renders related claims and corrections as links to their canonical records', async () => {
    const html = questionsHtml();
    let sawClaim = false;
    let sawCorrection = false;
    for (const q of await uqs()) {
      for (const id of q.related_claims || []) {
        assert.match(
          html,
          new RegExp(`href="[^"]*/case/#${id}"`),
          `${q.id} → ${id} must link to /case/#${id}`,
        );
        sawClaim = true;
      }
      for (const id of q.related_corrections || []) {
        assert.match(
          html,
          new RegExp(`href="[^"]*/changelog/#${id}"`),
          `${q.id} → ${id} must link to /changelog/#${id}`,
        );
        sawCorrection = true;
      }
    }
    assert.ok(sawClaim, 'at least one related claim exercised the assertion');
    assert.ok(sawCorrection, 'at least one related correction exercised the assertion');
  });

  it('renders the closest available record for entries that name one', async () => {
    const html = questionsHtml();
    const withRecord = (await uqs()).filter((q) => (q.closest_available_record || '').trim());
    assert.ok(withRecord.length >= 2, 'expected several entries to name a closest record');
    assert.match(html, /Closest available record\./);
    for (const q of withRecord.slice(0, 3)) {
      const words = q.closest_available_record.split(/\s+/).slice(0, 4).join(' ');
      assert.ok(
        html.includes(words),
        `${q.id} closest_available_record text missing ("${words}")`,
      );
    }
  });

  it('renders the topic of every record question', async () => {
    const html = questionsHtml();
    for (const q of await uqs()) {
      const topic = (q.topic || '').trim();
      if (!topic) continue;
      assert.ok(html.includes(topic), `${q.id} topic "${topic}" missing`);
    }
  });

  it('never ships an owner value', () => {
    const html = questionsHtml();
    assert.ok(OWNER_VALUES.length > 0, 'owner values were read from the register YAML');
    const checked = OWNER_VALUES.filter(isDistinctiveOwner);
    assert.ok(checked.length > 0, 'at least one owner value is searchable');
    for (const owner of checked) {
      assert.ok(!html.includes(owner), `owner value "${owner}" leaked into /questions/`);
    }
    // Review trigger, not coverage: a NEW owner value that a substring search cannot
    // distinguish from ordinary prose has to be looked at by a human rather than silently
    // dropped from the assertion above.
    assert.deepEqual(
      OWNER_VALUES.filter((v) => !isDistinctiveOwner(v)).sort(),
      ['patient'],
      'unsearchable owner values changed — confirm by hand that the new one cannot render',
    );
  });

  it('ships no hidden question entries', async () => {
    const html = questionsHtml();
    assert.doesNotMatch(html, /display:\s*none/i, 'nothing hidden by inline style');
    for (const q of [...(await uqs()), ...(await cqs())]) {
      const at = html.indexOf(`id="${q.id}"`);
      assert.ok(at > 0, `${q.id} not rendered`);
      const open = html.lastIndexOf('<article', at);
      assert.ok(open >= 0, `${q.id} card boundary`);
      const tag = html.slice(open, html.indexOf('>', at) + 1);
      assert.doesNotMatch(tag, /\shidden[\s>=]/, `${q.id} shipped hidden`);
      assert.doesNotMatch(tag, /aria-hidden="true"/, `${q.id} shipped aria-hidden`);
    }
  });

  it('the working-model UQ chips are anchors into this page', { skip: existsSync(workingModelPath) ? false : 'skip: no working-model build' }, () => {
    const html = readFileSync(workingModelPath, 'utf8');
    assert.match(html, /<a class="mono uq-chip" href="[^"]*\/questions\/#UQ-\d{4}"/);
  });
});
