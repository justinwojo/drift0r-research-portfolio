/**
 * Dark mode — M4_DESIGN_SPEC.md §2.2.
 *
 * The spec's rule is that dark is "a token swap only": no component may have a different
 * structure, different content, or a different amount of disclosed information. These
 * tests hold that rule mechanically:
 *
 *   - the dark blocks override token NAMES that already exist in the light block, never
 *     introducing dark-only colour tokens that some component could branch on;
 *   - the two dark blocks (system preference, manual override) stay in lock-step, so the
 *     toggle can never render something the OS preference cannot;
 *   - `--ink` is never a background anywhere, because it is a text colour in dark and a
 *     surface fill in light — the one substitution that silently produces unreadable
 *     chrome rather than a visibly wrong colour;
 *   - the theme survives a reload without a flash (inline init, in <head>, guarded);
 *   - print stays theme-independent, since the four browser-print routes are the
 *     deliverable and must not vary with a visitor's OS setting.
 *
 * Source-string tests always run. Built-HTML tests read site/dist and skip cleanly when
 * no build is present, matching the existing suites' pattern.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const readSrc = (rel) => readFileSync(join(siteRoot, 'src', rel), 'utf8');

const tokensCss = readSrc('styles/tokens.css');
const globalCss = readSrc('styles/global.css');
const printCss = readSrc('styles/print.css');
const baseLayout = readSrc('layouts/BaseLayout.astro');
const siteHeader = readSrc('components/SiteHeader.astro');
const evidenceAtlas = readSrc('components/EvidenceAtlas.astro');

const distHome = join(siteRoot, 'dist/index.html');
const skipDist = existsSync(distHome) ? false : 'skip: site/dist missing (run a build first)';

/** Body of the first `{ … }` rule whose selector line matches `selectorRe`. */
function ruleBody(css, selectorRe) {
  const at = css.search(selectorRe);
  assert.notEqual(at, -1, `selector not found: ${selectorRe}`);
  const open = css.indexOf('{', at);
  assert.notEqual(open, -1, `no block for ${selectorRe}`);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block for ${selectorRe}`);
}

/** CSS with `/* … *\/` comments removed, so prose that mentions a hex is not a finding. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * CSS with every `@media print { … }` block removed, brace-balanced. Print is deliberately
 * insulated (forced #fff/#000 paper), so its literals are correct and must not be scanned;
 * everything else in the file renders to a visitor and must go through tokens.
 */
function stripPrintBlocks(css) {
  let out = '';
  let i = 0;
  for (;;) {
    const at = css.indexOf('@media print', i);
    if (at === -1) return out + css.slice(i);
    out += css.slice(i, at);
    const open = css.indexOf('{', at);
    assert.notEqual(open, -1, 'unterminated @media print');
    let depth = 0;
    let j = open;
    for (; j < css.length; j += 1) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    assert.ok(depth === 0, 'unbalanced @media print block');
    i = j + 1;
  }
}

/** Raw colour literals: hex, and rgb()/rgba() outside a custom-property declaration. */
function colourLiterals(css) {
  return [...css.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)/gi)].map((m) => m[0]);
}

/** Custom-property names declared directly in a rule body. */
function declaredTokens(body) {
  return new Set([...body.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]));
}

const lightBody = ruleBody(tokensCss, /^:root \{/m);
const autoDarkBody = ruleBody(tokensCss, /^\s*:root:not\(\[data-theme='light'\]\) \{/m);
const manualDarkBody = ruleBody(tokensCss, /^\s*:root\[data-theme='dark'\] \{/m);

describe('dark mode — token architecture', () => {
  it('light palette stays on bare :root', () => {
    const light = declaredTokens(lightBody);
    for (const t of ['--parchment', '--card', '--ink', '--muted', '--hairline', '--firm', '--focus', '--link']) {
      assert.ok(light.has(t), `light block missing ${t}`);
    }
    // Unchanged spec values — the swap must not have edited the light palette.
    assert.match(lightBody, /--parchment:\s*#f4f1ea/i);
    assert.match(lightBody, /--ink:\s*#12202b/i);
  });

  it('both dark blocks exist and are guarded', () => {
    assert.match(tokensCss, /@media screen and \(prefers-color-scheme: dark\)/);
    assert.match(tokensCss, /:root:not\(\[data-theme='light'\]\)/);
    assert.match(tokensCss, /:root\[data-theme='dark'\]/);
  });

  it('the two dark blocks define exactly the same token set', () => {
    const auto = [...declaredTokens(autoDarkBody)].sort();
    const manual = [...declaredTokens(manualDarkBody)].sort();
    assert.deepEqual(auto, manual);
    assert.ok(auto.length >= 14, `expected a full palette, got ${auto.length} tokens`);
  });

  it('dark golden values (spec §2.2) hold in both blocks', () => {
    // Mirrors the light golden values above. These three are the ones every other dark
    // decision is measured against: the plate, the text colour, and the inverse surface
    // that stops --ink-as-a-background from turning chrome into a light panel.
    for (const [name, body] of [
      ['auto', autoDarkBody],
      ['manual', manualDarkBody],
    ]) {
      assert.match(body, /--parchment:\s*#101418/i, `${name}: --parchment`);
      assert.match(body, /--ink:\s*#e6eaef/i, `${name}: --ink`);
      assert.match(body, /--inverse-bg:\s*#1e252d/i, `${name}: --inverse-bg`);
    }
  });

  it('the two dark blocks define the same VALUES (toggle cannot diverge from the OS)', () => {
    const decls = (body) =>
      Object.fromEntries(
        [...body.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim)].map((m) => [m[1], m[2].trim()]),
      );
    assert.deepEqual(decls(autoDarkBody), decls(manualDarkBody));
  });

  it('dark only overrides token names the light block already defines', () => {
    const light = declaredTokens(lightBody);
    for (const t of declaredTokens(autoDarkBody)) {
      assert.ok(light.has(t), `dark-only token ${t} — dark must be a swap, not a new palette`);
    }
  });

  it('declares color-scheme in every state', () => {
    assert.match(lightBody, /color-scheme:\s*light/);
    assert.match(autoDarkBody, /color-scheme:\s*dark/);
    assert.match(manualDarkBody, /color-scheme:\s*dark/);
  });

  it('inverse-surface tokens exist so no chrome uses --ink as a background', () => {
    for (const t of ['--inverse-bg', '--inverse-text', '--inverse-text-muted', '--inverse-accent']) {
      assert.ok(declaredTokens(lightBody).has(t), `missing ${t}`);
      assert.ok(declaredTokens(autoDarkBody).has(t), `missing dark ${t}`);
    }
    // Light keeps the exact surface the provenance bar and tooltip had before.
    assert.match(lightBody, /--inverse-bg:\s*#12202b/i);
  });
});

describe('dark mode — de-hardcoded surfaces', () => {
  it('--ink is a background only where --parchment is the paired text colour', () => {
    // `background: var(--ink); color: var(--parchment)` inverts correctly under a pure swap
    // (skip link, method-step bullet). `background: var(--ink)` with any other text colour
    // is the failure mode: in dark, --ink IS the text colour, so the surface goes light and
    // the text on it stays light. Match each rule body that paints with --ink and require
    // the paired declaration.
    const offenders = [];
    for (const m of globalCss.matchAll(/\{[^{}]*background(?:-color)?:\s*var\(--ink\b[^{}]*\}/g)) {
      if (!/color:\s*var\(--parchment\)/.test(m[0])) offenders.push(m[0].replace(/\s+/g, ' ').slice(0, 90));
    }
    assert.deepEqual(offenders, [], 'var(--ink) as a background without --parchment text');
  });

  it('the two inverse surfaces are on the inverse tokens', () => {
    assert.match(ruleBody(globalCss, /^\.provenance \{/m), /background:\s*var\(--inverse-bg\)/);
    assert.match(ruleBody(globalCss, /^\.provenance--compact \{/m), /background:\s*var\(--inverse-bg\)/);
    assert.match(ruleBody(globalCss, /^\.claim-preview-tooltip \{/m), /background:\s*var\(--inverse-bg\)/);
  });

  it('screen CSS carries no raw colour literals anywhere outside @media print', () => {
    /*
     * The whole file, not a prefix of it: an earlier version of this test sliced global.css
     * at the .print-sheet marker and left the last third unscanned, which is exactly the
     * region a late-added rule would land in. Comments are stripped so prose that names a
     * hex is not a finding, and the @media print blocks are removed brace-balanced because
     * their literals are deliberate (forced paper).
     *
     * The allowlist is empty on purpose. If a literal genuinely has to ship on screen, add
     * it here WITH a reason — do not widen the scan.
     */
    const ALLOWED = [];
    for (const [name, css] of [
      ['global.css', globalCss],
      ['print.css', printCss],
    ]) {
      const screenOnly = stripPrintBlocks(stripComments(css));
      const found = colourLiterals(screenOnly).filter((lit) => !ALLOWED.includes(lit));
      assert.deepEqual(found, [], `${name}: raw colour literals on a screen-visible rule`);
    }
    // Guard the mechanism itself: the print blocks are a small fraction of the file, so a
    // strip that swallowed most of it (or a slice that kept only a prefix) shows up here.
    const scanned = stripPrintBlocks(stripComments(globalCss));
    assert.ok(
      scanned.length > globalCss.length * 0.85,
      `scan covers only ${Math.round((scanned.length / globalCss.length) * 100)}% of global.css`,
    );
    assert.ok(scanned.trimEnd().endsWith('}'), 'scan does not reach the end of global.css');
  });

  it('the Atlas SVG paints through classes, not presentation attributes', () => {
    // Presentation attributes cannot resolve var(); a hex here is a dark-mode break on the
    // most visible element of the homepage.
    assert.deepEqual([...evidenceAtlas.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]), []);
    assert.doesNotMatch(evidenceAtlas, /\b(?:fill|stroke)="#/);
    for (const cls of [
      'atlas-band',
      'atlas-band-label',
      'atlas-edge-line--contra',
      'atlas-node--plain',
      'atlas-node-label',
      'atlas-terminal-note',
    ]) {
      assert.ok(evidenceAtlas.includes(cls), `missing atlas class ${cls}`);
    }
    // Class names alone prove nothing — assert the rules actually bind tokens, which is
    // what makes the diagram swap with the theme.
    assert.match(ruleBody(evidenceAtlas, /^\s*\.atlas-node-label \{/m), /fill:\s*var\(--ink\)/);
    assert.match(ruleBody(evidenceAtlas, /^\s*\.atlas-band \{/m), /fill:\s*var\(--card\)/);
    assert.match(ruleBody(evidenceAtlas, /^\s*\.atlas-edge-line--contra \{/m), /stroke:\s*var\(--contra\)/);
    assert.match(ruleBody(evidenceAtlas, /^\s*\.atlas-terminal-note \{/m), /fill:\s*var\(--/);
  });

  it('print output does not follow the theme', () => {
    // Both dark blocks are screen-scoped, so @media print reads the bare light :root.
    assert.match(tokensCss, /@media screen and \(prefers-color-scheme: dark\)/);
    assert.match(tokensCss, /@media screen \{\s*\n\s*:root\[data-theme='dark'\]/);
    // The on-screen paper preview is a token, but prints as literal paper.
    assert.match(ruleBody(globalCss, /^\.print-sheet \{/m), /background:\s*var\(--card\)/);
    assert.match(globalCss, /\.print-sheet \{\s*\n\s*background:\s*#fff\s*!important/);
  });
});

describe('dark mode — theme init and toggle', () => {
  it('BaseLayout advertises both schemes', () => {
    assert.match(baseLayout, /<meta name="color-scheme" content="light dark" \/>/);
    assert.match(baseLayout, /name="theme-color"[^>]*media="\(prefers-color-scheme: dark\)"/);
  });

  it('theme init is inline, in <head>, and guarded', () => {
    const head = baseLayout.slice(baseLayout.indexOf('<head>'), baseLayout.indexOf('</head>'));
    assert.match(head, /<script is:inline>/);
    assert.match(head, /localStorage\.getItem\('theme'\)/);
    assert.match(head, /try \{/);
    assert.match(head, /catch \(/);
    assert.match(head, /setAttribute\('data-theme'/);
    // Only 'light' and 'dark' may reach data-theme. Without the acceptance set, any string
    // a third party wrote into the key would become a selector on <html>.
    assert.match(head, /===\s*'light'\s*\|\|\s*\w+\s*===\s*'dark'/);
  });

  it('the toggle is a real, labelled button that cycles three states', () => {
    assert.match(siteHeader, /<button\s+type="button"[^>]*class="theme-toggle"/);
    assert.match(siteHeader, /aria-label="Colour theme:/);
    assert.match(siteHeader, /\['auto', 'light', 'dark'\]/);
    // Auto is the ABSENCE of the attribute and of the stored value — same contract the
    // head init script reads.
    assert.match(siteHeader, /removeAttribute\('data-theme'\)/);
    assert.match(siteHeader, /removeItem\('theme'\)/);
    assert.match(siteHeader, /setItem\('theme', mode\)/);
    // The live attribute — not storage — decides the next state, so a storage write that
    // fails while reads still succeed cannot freeze the cycle on one mode.
    assert.match(siteHeader, /function current\(\)\s*\{\s*\n\s*var attr = root\.getAttribute\('data-theme'\)/);
    assert.doesNotMatch(siteHeader, /ORDER\.indexOf\(stored\(\)\)/);
    // Never hidden: a control the visitor cannot see is worse than an inert one.
    assert.doesNotMatch(siteHeader, /\.theme-toggle[^{]*\{[^}]*display:\s*none/);
  });

  it('the toggle fits the ≤480px masthead compaction rather than forcing 44px', () => {
    // A rigid 44px control in the 320px column masthead is the classic overflow source;
    // the nav links are 36px there (global.css) and the toggle matches them.
    const compact = siteHeader.slice(siteHeader.indexOf('@media (max-width: 480px)'));
    assert.match(compact, /min-height:\s*36px/);
    assert.match(siteHeader, /min-height:\s*44px/); // still 44px where the layout affords it
  });

  it('adds no new @media block to global.css', () => {
    // case-redesign.test.mjs regex-slices the (min-width: 481px) block; a pure token swap
    // needs no media query, and a stray one there breaks an unrelated suite.
    const queries = [...globalCss.matchAll(/@media ([^{]+)\{/g)].map((m) => m[1].trim());
    assert.ok(!queries.some((q) => /prefers-color-scheme/.test(q)), `theme @media leaked into global.css: ${queries}`);
  });
});

describe('dark mode — built output', { skip: skipDist }, () => {
  const html = () => readFileSync(distHome, 'utf8');

  it('ships the init script before the first stylesheet — the whole FOUC guarantee', () => {
    const s = html();
    const script = s.indexOf("localStorage.getItem('theme')");
    assert.notEqual(script, -1, 'theme init script missing from built page');
    assert.ok(script < s.indexOf('</head>'), 'theme init script is not in <head>');
    const firstSheet = s.indexOf('<link rel="stylesheet"');
    assert.notEqual(firstSheet, -1, 'no stylesheet link in built page');
    assert.ok(
      script < firstSheet,
      `init script at ${script} must precede the first stylesheet at ${firstSheet}`,
    );
  });

  it('ships the toggle and advertises both schemes', () => {
    const s = html();
    // includes(), not match(): a failed regex here would print the whole page.
    assert.ok(s.includes('data-theme-toggle'), 'theme toggle missing from built page');
    assert.ok(s.includes('content="light dark"'), 'color-scheme meta not updated');
  });
});
