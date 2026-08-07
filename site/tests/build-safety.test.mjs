/**
 * Post-build safety checks. Skips gracefully if dist/ is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const dist = join(siteRoot, 'dist');

const REQUIRED_ROUTES = [
  'index.html',
  'case/index.html',
  'working-model/index.html',
  'working-model/evidence-table/index.html',
  'questions-for-clinicians/index.html',
  'questions-for-clinicians/packet/index.html',
  'questions-for-clinicians/prediction-matrix/index.html',
  'for-clinicians/index.html',
  'how-this-could-be-wrong/index.html',
  'literature/index.html',
  'methods/index.html',
  'changelog/index.html',
  'legal/index.html',
  'about/snapshot/index.html',
  'about/downloads/index.html',
  'about/contribute/index.html',
  '404.html',
  'robots.txt',
  '.artifact_manifest.txt',
];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, acc);
    else acc.push(relative(dist, abs).split('\\').join('/'));
  }
  return acc;
}

const hasDist = existsSync(dist);

// Checkpoint H P1-8: make dist absence visible — do not silently count as green coverage.
describe('post-build content-safety suite visibility', () => {
  it('reports whether site/dist is present (skipped content-safety tests are not CI coverage)', () => {
    if (!hasDist) {
      console.warn(
        '[build-safety] site/dist absent — post-build content-safety tests are SKIPPED. ' +
          'Run a publication build, then re-run npm test (or the CI post-build job). ' +
          'These skips must not be treated as evidence that content-safety passed.',
      );
    }
    // Always pass: absence is expected on clean checkout before build.
    assert.equal(typeof hasDist, 'boolean');
  });
});

describe('post-build artifact (requires npm run build)', { skip: !hasDist }, () => {
  const files = walk(dist);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));

  it('contains required routes', () => {
    for (const r of REQUIRED_ROUTES) {
      assert.ok(files.includes(r) || existsSync(join(dist, r)), `missing ${r}`);
    }
  });

  it('has no PDF files', () => {
    const pdfs = files.filter((f) => f.toLowerCase().endsWith('.pdf'));
    assert.deepEqual(pdfs, []);
  });

  it('manifest matches dist files exactly (path lines; comments ignored)', () => {
    const manifestText = readFileSync(join(dist, '.artifact_manifest.txt'), 'utf8');
    // Mode-aware header (P0-4)
    assert.match(manifestText, /# DRIFT0R_SITE_MODE=/);
    assert.match(manifestText, /# sha256 [a-f0-9]{64} /i);
    const manifest = manifestText
      .trim()
      .split('\n')
      .map((ln) => ln.trim())
      .filter((ln) => ln && !ln.startsWith('#'))
      .sort();
    const actual = files.slice().sort();
    assert.deepEqual(actual, manifest);
  });

  it('every medical HTML page has disclaimer, version, indexing status, patient approval status, and clinician negative', () => {
    const medical = htmlFiles.filter(
      (f) =>
        !f.includes('404') &&
        (f === 'index.html' ||
          f.startsWith('case/') ||
          f.startsWith('working-model/') ||
          f.startsWith('questions-for-clinicians/') ||
          f.startsWith('for-clinicians/') ||
          f.startsWith('literature/') ||
          f.startsWith('methods/') ||
          f.startsWith('legal/') ||
          f.startsWith('changelog/') ||
          f.startsWith('about/')),
    );
    assert.ok(medical.length >= 10);
    for (const f of medical) {
      const html = readFileSync(join(dist, f), 'utf8');
      assert.match(html, /name="robots"\s+content="index,\s*follow"/i, f);
      assert.match(html, /not medical advice/i, f);
      // Analysis version = content_version; accept legacy "content v…" or new "analysis version v…"
      assert.match(
        html,
        /analysis version v0|content v0\.1\.0|content_version|content v0|analysis v0/i,
        f,
      );
      assert.match(html, /patient approval/i, f);
      assert.match(html, /patient approval[^<\n]{0,80}(obtained|not_obtained|not obtained)/i, f);
      assert.match(html, /clinician review/i, f);
      assert.match(html, /not performed|not_reviewed|not reviewed/i, f);
      // F.1.1 persistent status notice on every medical HTML route
      assert.match(html, /Research preview/i, f);
      assert.match(html, /Permission is not endorsement/i, f);
      assert.match(html, /Not clinician-reviewed/i, f);
      assert.match(html, /Published with Drift0r/i, f);
    }
  });

  it('landing page opens with caveat, direct permission, non-endorsement, and clinician non-review', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /Initial research preview — incomplete and open to correction/i);
    assert.match(html, /AI-assisted research portfolio/i);
    assert.match(html, /not[\s\S]{0,40}medical advice[\s\S]{0,40}diagnosis[\s\S]{0,40}treatment/i);
    assert.match(html, /Drift0r directly granted permission/i);
    assert.match(html, /does[\s\S]{0,40}not[\s\S]{0,40}imply[\s\S]{0,120}endorses/i);
    assert.match(html, /Clinician review has\s+not\s+been\s+performed/i);
    assert.match(html, /Licensed clinicians must verify all records/i);
    assert.match(html, /Do not post private medical records/i);
    // J.2 / J.2.1: material disclosures once — not duplicated Approval callout; no marketing noindex lede
    assert.doesNotMatch(html, /Approval status/i);
    // Compact provenance: region label + collapsed version + short review-status (not full wall)
    assert.match(html, /aria-label="Version and review status"|provenance--compact/i);
    /*
     * The landing page must surface the live analysis version. Assert it matches
     * release.yaml rather than a literal — pinning the literal here just means every
     * version promotion trips a build-safety failure that has nothing to do with safety.
     */
    const releaseYaml = readFileSync(join(siteRoot, 'src/data/release.yaml'), 'utf8');
    const contentVersion = releaseYaml.match(/^content_version:\s*(\S+)/m)?.[1];
    assert.ok(contentVersion, 'release.yaml must declare content_version');
    assert.match(html, new RegExp(contentVersion.replace(/\./g, '\\.')));
    assert.match(html, /published/i);
    // Stable public release permits indexing while keeping the research caveat.
    assert.match(html, /name="robots"\s+content="index,\s*follow"/i);
    // Lede paragraph only (do not spill into the hero disclaimer callout)
    const ledeOnly = html.match(/<p class="lede landing-lede">([\s\S]*?)<\/p>/i);
    if (ledeOnly) {
      assert.doesNotMatch(ledeOnly[1], /noindex/i);
      assert.doesNotMatch(ledeOnly[1], /incomplete and open to correction/i);
    }
  });

  it('contribute route states safety prohibitions', () => {
    const html = readFileSync(join(dist, 'about/contribute/index.html'), 'utf8');
    assert.match(html, /private medical records/i);
    assert.match(html, /treatment instructions/i);
    assert.match(html, /not[\s\S]{0,40}medical-advice discussion/i);
    assert.match(html, /Permission from Drift0r|permission is not endorsement/i);
  });

  /**
   * Contribution CTA placements (G.2.2). When PUBLIC_REPO_URL is empty (local default),
   * surfaces show the unconfigured CTA (no fake href). When configured at build time,
   * every required placement must include the moderated issues/new/choose link.
   */
  function assertContributionCtaSurface(html, label) {
    assert.match(
      html,
      /Found incorrect data, a citation problem, contradictory evidence, new research/i,
      `${label}: lead copy`,
    );
    assert.match(
      html,
      /A GitHub account is currently required to submit an issue/i,
      `${label}: account note`,
    );
    assert.match(
      html,
      /Do not post private medical records, personal identifiers, treatment instructions/i,
      `${label}: safety note`,
    );
    assert.match(html, /data-contribution-cta=/i, `${label}: data-contribution-cta`);
    const configured = /data-contribution-cta=["']configured["']/.test(html);
    const unconfigured = /data-contribution-cta=["']unconfigured["']/.test(html);
    assert.ok(configured || unconfigured, `${label}: configured or unconfigured CTA`);
    if (configured) {
      assert.match(html, /View project on GitHub/i, label);
      assert.match(html, /Report an issue or contribute research/i, label);
      assert.match(html, /Browse existing issues/i, label);
      assert.match(html, /\/issues\/new\/choose/i, label);
      // Never invent example.invalid as the contribution target
      assert.doesNotMatch(html, /href=["']https:\/\/example\.invalid[^"']*\/issues/i, label);
    } else {
      assert.match(html, /no actionable GitHub issue link yet|not been set for this build/i, label);
      assert.doesNotMatch(html, /href=["']https?:\/\/[^"']*\/issues\/new\/choose["']/i, label);
    }
  }

  it('homepage has prominent contribution CTA', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assertContributionCtaSurface(html, 'homepage');
  });

  it('literature index has contribution CTA', () => {
    const html = readFileSync(join(dist, 'literature/index.html'), 'utf8');
    assertContributionCtaSurface(html, 'literature index');
  });

  it('about/contribute has contribution CTA', () => {
    const html = readFileSync(join(dist, 'about/contribute/index.html'), 'utf8');
    assertContributionCtaSurface(html, 'contribute page');
  });

  it('how-this-could-be-wrong has contribution CTA', () => {
    const html = readFileSync(join(dist, 'how-this-could-be-wrong/index.html'), 'utf8');
    assertContributionCtaSurface(html, 'how-this-could-be-wrong');
  });

  it('site footer includes contribution CTA on every medical page sample', () => {
    for (const r of [
      'index.html',
      'literature/index.html',
      'about/contribute/index.html',
      'how-this-could-be-wrong/index.html',
      'case/index.html',
    ]) {
      const html = readFileSync(join(dist, r), 'utf8');
      assert.match(html, /site-footer|data-site-footer/i, r);
      // Footer embeds ContributionCta (at least one CTA marker per page)
      const ctaCount = (html.match(/data-contribution-cta=/g) || []).length;
      assert.ok(ctaCount >= 1, `${r}: expected ≥1 contribution CTA (footer at minimum), got ${ctaCount}`);
      assert.match(
        html,
        /A GitHub account is currently required to submit an issue/i,
        `${r} footer/account note`,
      );
    }
  });

  /**
   * The footer deliberately does not restate the header chrome. Guard both directions:
   * the full disclaimer must appear exactly once per rendered page (never zero, never a
   * second footer copy), and the provenance bar anchor must exist everywhere, since the
   * fragment scan whitelists #site-provenance.
   */
  it('full disclaimer renders exactly once per page and provenance anchor is global', () => {
    const htmlFiles = readdirSync(dist, { recursive: true }).filter((f) => String(f).endsWith('.html'));
    assert.ok(htmlFiles.length > 10, 'expected a built dist');
    for (const f of htmlFiles) {
      const html = readFileSync(join(dist, String(f)), 'utf8');
      assert.equal(
        (html.match(/id="site-provenance"/g) || []).length,
        1,
        `${f}: expected exactly one #site-provenance anchor`,
      );
      const full = (html.match(/AI-assisted research summary for educational purposes only/g) || [])
        .length;
      // Print routes carry the equivalent notice per printed page instead of the aside.
      const isPrintRoute = /class="print-sheet|print-route/.test(html);
      // /legal/ quotes the disclaimer a second time as the governing text itself.
      const isLegal = String(f) === 'legal/index.html';
      if (isPrintRoute) {
        assert.match(html, /Licensed clinicians must verify underlying records/i, String(f));
      } else if (isLegal) {
        assert.ok(full >= 1, `${f}: legal page must state the full disclaimer`);
      } else {
        assert.equal(full, 1, `${f}: expected the full disclaimer exactly once, got ${full}`);
      }
    }
  });

  it('working model includes what would change this and polarity structure', () => {
    const html = readFileSync(join(dist, 'working-model/index.html'), 'utf8');
    assert.match(html, /What would change this/i);
    assert.match(html, /does not explain/i);
    assert.match(html, /would explain/i);
    assert.match(html, /H4/);
    assert.match(html, /NOT INDEPENDENTLY CONFIRMED|not independently confirmed|contradicting literature/i);
  });

  it('home includes specialty two-channel and atlas table', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /NOT INDEPENDENTLY CONFIRMED/);
    assert.match(html, /Evidence Atlas|atlas/i);
    assert.match(html, /Complete table equivalent|table equivalent/i);
    assert.match(html, /Signal channel/i);
    assert.match(html, /Reference channel/i);
  });

  it('internal links match artifact manifest base_path (project path or custom-domain root)', () => {
    const manifestText = readFileSync(join(dist, '.artifact_manifest.txt'), 'utf8');
    const baseMatch = manifestText.match(/^#\s*base_path=(.+)$/m);
    assert.ok(baseMatch, 'manifest must declare base_path=');
    const baseRaw = baseMatch[1].trim();
    // Normalize: '/' for custom domain / user Pages; '/drift0r' for project Pages.
    const base = baseRaw === '' || baseRaw === '/' ? '/' : baseRaw.replace(/\/$/, '');
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    if (base === '/') {
      // Root/custom-domain deploy: root-relative medical routes; never ship /drift0r/ prefixes.
      assert.match(html, /href="\/(?:case|working-model|methods|literature)\//);
      assert.doesNotMatch(html, /(?:href|src)="\/drift0r\//);
    } else {
      const escaped = base.replace(/\//g, '\\/');
      assert.match(html, new RegExp(`href="${escaped}\\/`));
      // Bare /case/ without the project base is wrong for non-root deploys.
      assert.doesNotMatch(html, /href="\/case\/"/);
    }
  });

  it('no external font/CDN/analytics runtime hosts in HTML/CSS/JS', () => {
    const assets = files.filter((f) => /\.(html|css|js)$/.test(f));
    const banned = [
      /fonts\.googleapis\.com/i,
      /fonts\.gstatic\.com/i,
      /googletagmanager/i,
      /google-analytics/i,
      /cdn\.jsdelivr/i,
      /unpkg\.com/i,
      /cloudflareinsights/i,
    ];
    for (const f of assets) {
      const text = readFileSync(join(dist, f), 'utf8');
      for (const re of banned) {
        assert.equal(re.test(text), false, `${f} matches ${re}`);
      }
    }
  });

  it('robots.txt permits crawl (no Disallow: /) so bots can read HTML noindex', () => {
    const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
    assert.match(robots, /User-agent:\s*\*/i);
    assert.match(robots, /Allow:\s*\//i);
    assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
    // Must not blanket-block while HTML noindex is the indexing control
    assert.doesNotMatch(robots, /Disallow:\s*\/\s*\n/);
  });

  it('live published release → robots meta index,follow; provenance agrees', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /name="robots"\s+content="index,\s*follow"/i);
    assert.doesNotMatch(html, /name="robots"\s+content="noindex/i);
    // Provenance disclosure (compact on home) still records indexing status accurately
    assert.match(html, /indexing:\s*enabled/i);
    assert.doesNotMatch(html, /indexing:\s*disabled/i);
    // Social preview meta
    assert.match(html, /property="og:image"/i);
    assert.match(html, /name="twitter:card"\s+content="summary_large_image"/i);
    assert.match(html, /property="og:image:width"\s+content="1200"/i);
    assert.match(html, /property="og:image:height"\s+content="630"/i);
    assert.match(html, /og-default\.png/i);
  });

  it('creator/independence disclosure present in footer on medical surfaces', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /Justin Wojciechowski/i);
    assert.match(html, /@justinwojo|justinwojo/i);
    assert.match(html, /Independent community research/i);
    assert.match(html, /not a clinician/i);
    assert.match(html, /Not operated by,\s*affiliated with,\s*or\s*endorsed by Drift0r/i);
    assert.match(html, /permission is not endorsement/i);
    assert.match(html, /No financial relationship/i);
  });

  it('print routes include print stylesheet cues, disclaimer, and persistent status notice', () => {
    for (const r of [
      'for-clinicians/index.html',
      'working-model/evidence-table/index.html',
      'questions-for-clinicians/packet/index.html',
      'about/snapshot/index.html',
      'about/downloads/index.html',
    ]) {
      const html = readFileSync(join(dist, r), 'utf8');
      assert.match(html, /not medical advice/i, r);
      assert.match(html, /@media print|print\.css|print-sheet/i, r);
      assert.match(html, /Permission is not endorsement/i, r);
      assert.match(html, /Not clinician-reviewed/i, r);
    }
  });

  /**
   * Strip display:none / .no-print / .site-footer subtrees so tests assert
   * print-VISIBLE markup, not hidden chrome (P0-2).
   */
  function printVisibleText(html) {
    let s = html;
    // Remove common print-hidden regions
    s = s.replace(/<footer\b[^>]*class="[^"]*site-footer[^"]*"[\s\S]*?<\/footer>/gi, ' ');
    s = s.replace(/class="[^"]*no-print[^"]*"[^>]*>[\s\S]*?(?=<\/(?:div|section|nav|aside|p|header)>)/gi, ' ');
    // Crude: drop elements that carry no-print in class attribute entirely (non-greedy blocks)
    s = s.replace(/<[^>]+class="[^"]*\bno-print\b[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ');
    // Drop style blocks that only hide things — keep body content
    // Prefer content inside .print-page / .print-sheet / print-page-disclaimer
    const pages = [...s.matchAll(/<section[^>]*class="[^"]*print-page[^"]*"[^>]*>[\s\S]*?<\/section>/gi)].map(
      (m) => m[0],
    );
    if (pages.length) return pages.join('\n');
    const sheets = [...s.matchAll(/class="[^"]*print-sheet[^"]*"[^>]*>[\s\S]*$/i)].map((m) => m[0]);
    if (sheets.length) return sheets.join('\n');
    return s;
  }

  it('print-visible per-page disclaimer on every print-page (P0-2)', () => {
    const routes = [
      'for-clinicians/index.html',
      'working-model/evidence-table/index.html',
      'questions-for-clinicians/packet/index.html',
      'about/snapshot/index.html',
      'about/downloads/index.html',
    ];
    const required = [
      /Research preview/i,
      /Not medical advice/i,
      /Published with Drift0r/i,
      /Permission is not endorsement/i,
      /Not clinician-reviewed/i,
      /Licensed clinicians must verify underlying records/i,
      /Do not start, stop, or change treatment based on this material/i,
    ];
    for (const r of routes) {
      const html = readFileSync(join(dist, r), 'utf8');
      const visible = printVisibleText(html);
      assert.match(visible, /print-page-disclaimer|print-page-banner|data-print-disclaimer/i, r);
      // Every .print-page must contain the compact notice class
      const pageBlocks = [
        ...html.matchAll(/<section[^>]*class="[^"]*print-page[^"]*"[^>]*>[\s\S]*?<\/section>/gi),
      ];
      assert.ok(pageBlocks.length >= 1, `${r} needs .print-page sections`);
      for (const [i, block] of pageBlocks.entries()) {
        const body = block[0];
        // Must not rely on .no-print or .site-footer for the notice
        assert.match(body, /print-page-disclaimer|data-print-disclaimer/i, `${r} page ${i}`);
        for (const re of required) {
          assert.match(body, re, `${r} page ${i} missing ${re}`);
        }
      }
      // Visible aggregate also carries the operational clause
      for (const re of required) {
        assert.match(visible, re, `${r} print-visible missing ${re}`);
      }
    }
  });

  it('for-clinicians does not falsely claim status on every printed page without print-page notices', () => {
    const html = readFileSync(join(dist, 'for-clinicians/index.html'), 'utf8');
    // Old false promise removed or only true when print-pages carry notices (which they do)
    if (/stated on every printed page/i.test(html)) {
      // If the phrase remains, every print-page must actually carry the notice
      const pages = [...html.matchAll(/print-page/g)];
      assert.ok(pages.length >= 2);
    }
  });

  it('evidence table includes H-NULL and counts-are-not-weights (P1-09)', () => {
    const html = readFileSync(join(dist, 'working-model/evidence-table/index.html'), 'utf8');
    assert.match(html, /H-NULL/);
    assert.match(html, /counts are not weights|Citation counts are not weights/i);
    assert.match(html, /of \d+ published claims/i);
  });

  it('dist ships .nojekyll for GitHub Pages _astro/ (P1-10)', () => {
    assert.ok(existsSync(join(dist, '.nojekyll')));
  });

  it('for-clinicians leads with gaps and states no primary records', () => {
    const html = readFileSync(join(dist, 'for-clinicians/index.html'), 'utf8');
    assert.match(html, /No original laboratory report, DXA printout, radiology report, or clinic note/i);
    const gapsIdx = html.search(/Documented gaps and open questions/i);
    const hypIdx = html.search(/Working hypotheses/i);
    assert.ok(gapsIdx >= 0 && hypIdx > gapsIdx, 'gaps must precede hypotheses');
  });

  it('lab values are not destroyed as [dose withheld] on /case/ (Checkpoint H P0-1)', () => {
    const html = readFileSync(join(dist, 'case/index.html'), 'utf8');
    for (const token of ['17.7', '14.5', '0.33', '283', '254', '333']) {
      assert.match(html, new RegExp(token.replace('.', '\\.')), `missing lab token ${token}`);
    }
    // Signature of the over-redaction bug: withheld marker adjacent to unit denominators.
    assert.doesNotMatch(html, /\[dose withheld\]\s*\/\s*(?:L|mL|ml|dL|24h|kg)/i);
  });

  it('correction/privacy/removal channel is GitHub issues, not a privacy@ email (Checkpoint H P1-2)', () => {
    for (const r of ['legal/index.html', 'about/contribute/index.html']) {
      const html = readFileSync(join(dist, r), 'utf8');
      assert.doesNotMatch(html, /privacy@drift0rresearch\.org|mailto:privacy@/i, r);
      assert.match(html, /Correction, privacy, or removal|privacy, or removal|private medical/i, r);
      assert.match(html, /private correspondence|GitHub issue/i, r);
    }
    // No privacy@ anywhere in the built site
    const files = walk(dist).filter((f) => f.endsWith('.html'));
    for (const f of files) {
      const html = readFileSync(join(dist, f), 'utf8');
      assert.doesNotMatch(html, /privacy@drift0rresearch\.org/i, f);
    }
  });

  it('safe canonical and Open Graph tags without medical unfurl detail', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /rel="canonical"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /property="og:description"/);
    assert.match(html, /name="twitter:card"/);
    // Assert the *configured* canonical host, so CI (DRIFT0R_SITE_URL=https://drift0rresearch.org)
    // still fails on a wrong/placeholder origin. Local default builds use the example.invalid
    // placeholder, which require-publication-mode.mjs blocks from ever deploying.
    const expectedHost = new URL(process.env.DRIFT0R_SITE_URL || 'https://example.invalid/drift0r')
      .hostname;
    assert.match(html, new RegExp(expectedHost.replace(/\./g, '\\.')));
    // Unfurl description must not carry lab-dose medical detail.
    const og = html.match(/property="og:description"\s+content="([^"]*)"/i);
    assert.ok(og, 'og:description present');
    assert.doesNotMatch(og[1], /\d+\s*mg|\d+\s*ng\/dL|T-score|tryptase/i);
  });

  it('how-this-could-be-wrong covers core failure modes', () => {
    const html = readFileSync(join(dist, 'how-this-could-be-wrong/index.html'), 'utf8');
    for (const phrase of [
      'Transcription error',
      'Missing primary records',
      'Shared model scaffolding',
      'Literature-summary error',
      'Anchoring bias',
      'Selection bias',
      'Coexisting common processes',
    ]) {
      assert.match(html, new RegExp(phrase, 'i'), phrase);
    }
  });

  it('working model includes H-NULL baseline honesty', () => {
    const html = readFileSync(join(dist, 'working-model/index.html'), 'utf8');
    assert.match(html, /H-NULL/);
    assert.match(html, /null model|base-rate|numeric population prior/i);
  });

  it('evidence atlas uses real record IDs; relationship meaning in legend/table not per-edge text spam', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /CLM-\d{4}/);
    assert.match(html, /would explain|leaves open|contradicted by|does not explain/i);
    assert.match(html, /UQ-\d{4}/);
    // Desktop edges encode verb as data attribute / title, not dense midpoint labels
    assert.match(html, /data-atlas-verb|atlas-edge|Complete table equivalent/i);
  });

  /*
   * The landing page must surface the working hypotheses with both sides of each record —
   * what it accounts for and what it does not — and link into the full working model.
   * Section renamed from "Current working synthesis" to "What we think is going on" in the
   * plain-language rewrite; the requirement is the content, not the heading.
   */
  it('homepage surfaces working hypotheses with their gaps and links into the working model', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    assert.match(html, /What we think is going on|Current working synthesis/i);
    assert.match(html, /Working research models, not diagnoses|research models/i);
    // Each record states what it fits and what it fails to explain — never one without the other.
    assert.match(html, /Fits\s|May help explain/i);
    assert.match(html, /account for|Important gap/i);
    // Leading H1–H3 present with links into working model
    assert.match(html, /working-model\/#H1/);
    assert.match(html, /working-model\/#H2/);
    assert.match(html, /working-model\/#H3/);
    assert.match(html, /working models with their support and counterevidence|Full working model/i);
  });

  it('internal route and fragment scan of dist has zero failures', () => {
    const htmlFiles = files.filter((f) => f.endsWith('.html'));
    // Map route path (with trailing slash) -> set of ids
    const pageIds = new Map();
    const pageExists = new Set();

    for (const f of htmlFiles) {
      let route;
      if (f === 'index.html') route = '/';
      else if (f === '404.html') route = '/404/';
      else if (f.endsWith('/index.html')) route = '/' + f.slice(0, -'index.html'.length);
      else route = '/' + f.replace(/\.html$/, '/');
      pageExists.add(route);
      // also without trailing for flexibility
      pageExists.add(route.replace(/\/$/, '') || '/');
      const html = readFileSync(join(dist, f), 'utf8');
      const ids = new Set();
      for (const m of html.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]);
      for (const m of html.matchAll(/\bname=["']([^"']+)["']/g)) ids.add(m[1]);
      pageIds.set(route, ids);
      pageIds.set(route.replace(/\/$/, '') || '/', ids);
    }

    const failures = [];
    for (const f of htmlFiles) {
      const html = readFileSync(join(dist, f), 'utf8');
      // Internal site links with base path
      for (const m of html.matchAll(/href=["'](\/drift0r\/[^"'#]*)(#[^"']+)?["']/g)) {
        let path = m[1].replace(/^\/drift0r/, '') || '/';
        if (!path.endsWith('/') && !path.includes('.')) path += '/';
        const hash = m[2] ? m[2].slice(1) : '';
        // Skip asset files
        if (path.includes('/_astro/') || path.endsWith('.svg') || path.endsWith('.ico')) continue;
        if (path.endsWith('.txt') || path.endsWith('.xml')) continue;
        const pathKey = path.endsWith('/') ? path : path + '/';
        if (!pageExists.has(pathKey) && !pageExists.has(path)) {
          // literature detail pages exist as literature/lit-xxxx/index.html
          failures.push(`${f}: missing route ${pathKey} (from ${m[0]})`);
          continue;
        }
        if (hash) {
          const ids = pageIds.get(pathKey) || pageIds.get(path) || new Set();
          // Same-page fragments resolved against target page
          if (!ids.has(hash) && !ids.has(decodeURIComponent(hash))) {
            // Global chrome anchors present on every rendered page (verified separately below)
            if (hash === 'main' || hash === 'research-disclaimer' || hash === 'site-provenance')
              continue;
            failures.push(`${f}: missing fragment #${hash} on ${pathKey}`);
          }
        }
      }
      // Same-page hash links
      let selfRoute;
      if (f === 'index.html') selfRoute = '/';
      else if (f.endsWith('/index.html')) selfRoute = '/' + f.slice(0, -'index.html'.length);
      else selfRoute = '/' + f;
      const selfIds = pageIds.get(selfRoute) || pageIds.get(selfRoute.replace(/\/$/, '') || '/') || new Set();
      for (const m of html.matchAll(/href=["']#([^"']+)["']/g)) {
        const hash = m[1];
        if (hash === 'main' || hash === 'research-disclaimer' || hash === 'site-provenance')
          continue;
        if (!selfIds.has(hash) && !selfIds.has(decodeURIComponent(hash))) {
          failures.push(`${f}: missing same-page fragment #${hash}`);
        }
      }
    }
    assert.equal(failures.length, 0, failures.slice(0, 30).join('\n'));
  });
});

describe('source tree constraints', () => {
  it('does not offer papers_local paths as publishable URLs', () => {
    const dataTs = readFileSync(join(siteRoot, 'src/lib/data.ts'), 'utf8');
    const langTs = readFileSync(join(siteRoot, 'src/lib/language.ts'), 'utf8');
    // litPublicUrl must reject local/pdf traps; trail terminal must refuse publishing source PDFs
    assert.match(dataTs, /papers_local/);
    assert.match(dataTs, /not publish|never publish|Local PDF/i);
    assert.match(langTs, /not published/i);
    // Must not construct download links into data/papers_local
    assert.doesNotMatch(dataTs, /href.*papers_local/);
  });
});
