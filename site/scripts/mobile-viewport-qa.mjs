/**
 * Automated mobile viewport QA for launch-critical routes.
 *
 * Uses system Chrome headless + DevTools Protocol. Results are AUTOMATED
 * emulation only — never described as real-device testing.
 *
 * Requires site/dist from a publication build. Serves dist statically and
 * captures screenshots + overflow/focus checks at multiple viewports.
 *
 * Usage (from site/): node scripts/mobile-viewport-qa.mjs
 * Output: audits/2026-08-publication-readiness/mobile-qa/
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  createReadStream,
} from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const dist = join(siteRoot, 'dist');
const repoRoot = join(siteRoot, '..');
const outDir = join(repoRoot, 'audits', '2026-08-publication-readiness', 'mobile-qa');

const chromeCandidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const VIEWPORTS = [
  { id: '320x568', width: 320, height: 568, label: 'iPhone SE (1st) portrait' },
  { id: '360x800', width: 360, height: 800, label: 'Android mid portrait' },
  { id: '390x844', width: 390, height: 844, label: 'iPhone 12/13 portrait' },
  { id: '430x932', width: 430, height: 932, label: 'iPhone 14 Pro Max portrait' },
  { id: '844x390', width: 844, height: 390, label: 'iPhone landscape' },
  { id: '1280x800', width: 1280, height: 800, label: 'desktop reference' },
];

/**
 * Route-specific markers + optional interactions (Checkpoint I.1).
 * markers: CSS selectors that must exist on the route.
 * require_h1_in_first_viewport: home conversion check (value prop above the fold).
 * scroll_samples: fractions of scrollHeight for mid-page screenshots.
 * interactions: click/toggle selectors exercised before re-check.
 */
const ROUTES = [
  {
    id: 'home',
    path: '/',
    markers: ['h1.landing-h1, .landing-hero h1, h1', '.landing-opening', '.status-notice', 'nav.primary-nav'],
    // Portrait phones only — short landscape heights cannot fit compliance chrome + h1.
    require_h1_in_first_viewport: true,
    require_h1_min_height: 560,
    scroll_samples: [0.35, 0.7],
    interactions: [{ type: 'click', selector: 'details.prov-mobile summary, .provenance summary' }],
  },
  {
    id: 'case',
    path: '/case/',
    markers: ['h1', '.record, article, .claim-card, [id^="CLM-"]', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'working-model',
    path: '/working-model/',
    markers: ['h1', 'article.hypothesis, [id^="H"]', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'evidence-table',
    path: '/working-model/evidence-table/',
    markers: ['h1', 'table, .evidence-table, .print-sheet', '.status-notice'],
    scroll_samples: [0.5],
    interactions: [],
  },
  {
    id: 'for-clinicians',
    path: '/for-clinicians/',
    markers: ['h1', '.print-sheet, .print-page', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'clinician-packet',
    path: '/questions-for-clinicians/packet/',
    markers: ['h1', '.print-sheet, .print-page, article', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'prediction-matrix',
    path: '/questions-for-clinicians/prediction-matrix/',
    markers: ['h1', 'table, .matrix, [class*="matrix"]', '.status-notice'],
    scroll_samples: [0.45],
    interactions: [],
  },
  {
    id: 'literature',
    path: '/literature/',
    markers: ['h1', 'a[href*="/literature/"]', '.status-notice'],
    scroll_samples: [0.5],
    interactions: [],
  },
  {
    id: 'literature-detail',
    path: null, // filled from first lit card if present
    markers: ['h1', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'changelog',
    path: '/changelog/',
    markers: ['h1', '.changelog-page, li, article', '.status-notice'],
    scroll_samples: [0.5],
    interactions: [],
  },
  {
    id: 'contribute',
    path: '/about/contribute/',
    markers: ['h1', 'a[href*="github.com"], a[href*="issues"]', '.status-notice'],
    scroll_samples: [],
    interactions: [],
  },
  {
    id: 'legal',
    path: '/legal/',
    markers: ['h1', '.status-notice'],
    scroll_samples: [0.4],
    interactions: [],
  },
  {
    id: 'about',
    path: '/about/',
    markers: ['h1', '.status-notice'],
    scroll_samples: [],
    interactions: [],
  },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function findChrome() {
  for (const c of chromeCandidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

function startStaticServer(root, port) {
  const server = createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      if (urlPath === '') urlPath = '/index.html';
      const filePath = join(root, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      createReadStream(filePath).pipe(res);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function cdp(wsUrl, method, params = {}, sessionId = null) {
  const { default: WebSocket } = await import('ws').catch(() => ({ default: null }));
  // Fallback: use chrome --dump-dom path if no ws module — but we install via dynamic fetch to CDP HTTP
  throw new Error('use runViaChromeProtocol');
}

/**
 * Drive Chrome via remote debugging HTTP + WebSocket using only Node builtins +
 * a tiny WS handshake implemented with the `ws` package if present, else child
 * chrome --screenshot per viewport (degraded).
 */
async function tryImportWs() {
  try {
    return (await import('ws')).default;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withChromeCdp(chromePath, fn) {
  const debugPort = await freePort();
  const userData = join(outDir, '.chrome-profile');
  mkdirSync(userData, { recursive: true });
  const proc = spawn(
    chromePath,
    [
      `--remote-debugging-port=${debugPort}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${userData}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      /* wait */
    }
    await sleep(100);
  }
  if (!ready) {
    proc.kill();
    throw new Error('Chrome remote debugging failed to start');
  }
  try {
    return await fn(debugPort);
  } finally {
    proc.kill('SIGTERM');
  }
}

async function openPage(debugPort, WebSocket) {
  const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: 'PUT',
  }).catch(() => null);
  let target;
  if (listRes && listRes.ok) {
    target = await listRes.json();
  } else {
    const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    target = tabs.find((t) => t.type === 'page') || tabs[0];
  }
  const wsUrl = target.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  let id = 0;
  const pending = new Map();
  ws.on('message', (data) => {
    const msg = JSON.parse(String(data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  function send(method, params = {}) {
    const msgId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  return {
    send,
    async goto(url) {
      const nav = send('Page.navigate', { url });
      await send('Page.loadEventFired').catch(() => null);
      await nav;
      await sleep(400);
    },
    async setViewport(width, height, dpr = 2) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: dpr,
        mobile: width < 800,
      });
    },
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.text || 'evaluate failed');
      }
      return r.result?.value;
    },
    async screenshot(path) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(path, Buffer.from(r.data, 'base64'));
    },
    close() {
      ws.close();
    },
  };
}

/**
 * Build page-check expression. routeSpec is JSON-serialized route config.
 * Touch-target *count* is always full (not capped); samples list is capped for report size.
 */
function buildPageChecksJs(routeSpec, viewport) {
  const requireH1 =
    Boolean(routeSpec.require_h1_in_first_viewport) &&
    (viewport?.height || 0) >= (routeSpec.require_h1_min_height || 0);
  const specJson = JSON.stringify({
    markers: routeSpec.markers || [],
    require_h1_in_first_viewport: requireH1,
  });
  return `(() => {
  const spec = ${specJson};
  const issues = [];
  const docEl = document.documentElement;
  const body = document.body;
  const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
  const clientW = docEl.clientWidth;
  const scrollH = Math.max(docEl.scrollHeight, body.scrollHeight);
  if (scrollW > clientW + 1) {
    issues.push({ kind: 'horizontal_overflow', scrollWidth: scrollW, clientWidth: clientW, delta: scrollW - clientW });
  }
  const sticky = document.querySelector('.disclaimer-sticky, .status-notice, .status-notice-bar');
  if (!sticky) issues.push({ kind: 'missing_status_or_disclaimer' });

  const sample = document.querySelector('a, button, summary');
  let focusOk = true;
  if (sample) {
    sample.focus();
    const cs = getComputedStyle(sample);
    if (cs.outlineStyle === 'none' && cs.boxShadow === 'none' && cs.outlineWidth === '0px') {
      focusOk = false;
    }
  }

  // Full touch-target inventory (count uncapped); keep only first 24 samples in report.
  const smallTargets = [];
  let smallTouchCount = 0;
  let interactiveCount = 0;
  for (const el of document.querySelectorAll('a, button, summary, input, select')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    interactiveCount++;
    if (r.width < 44 || r.height < 44) {
      smallTouchCount++;
      if (smallTargets.length < 24) {
        smallTargets.push({
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 40),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }
  }

  let stickyClipped = false;
  if (sticky) {
    const r = sticky.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) stickyClipped = true;
  }

  const marker_hits = {};
  let markers_missing = [];
  for (const sel of spec.markers || []) {
    const found = !!document.querySelector(sel);
    marker_hits[sel] = found;
    if (!found) markers_missing.push(sel);
  }

  const h1 = document.querySelector('h1.landing-h1, .landing-hero h1, main h1, h1');
  let h1_top = null;
  let h1_in_first_viewport = null;
  if (h1) {
    const r = h1.getBoundingClientRect();
    h1_top = Math.round(r.top + window.scrollY);
    // Element top is within first screen (allow sticky chrome overlap up to ~half viewport).
    h1_in_first_viewport = r.top < window.innerHeight && r.bottom > 0 && r.top < window.innerHeight * 0.92;
  }
  if (spec.require_h1_in_first_viewport && h1_in_first_viewport === false) {
    issues.push({ kind: 'h1_below_fold', h1_top, viewport_height: window.innerHeight });
  }

  const tableCount = document.querySelectorAll('table').length;
  const cardCount = document.querySelectorAll('.record, article.hypothesis, .claim-card, [id^="CLM-"], [id^="H"]').length;
  const atlasPresent = !!document.querySelector('.atlas, #evidence-atlas, [data-atlas], .evidence-atlas');
  const hasBrowserBlock = !!document.querySelector('.print-browser-block');
  const isPrintRoute = document.body.classList.contains('print-route');

  return {
    title: document.title,
    horizontal_overflow: scrollW > clientW + 1,
    overflow_delta: Math.max(0, scrollW - clientW),
    scroll_height: scrollH,
    sticky_present: !!sticky,
    sticky_clipped: stickyClipped,
    focus_outline_soft: focusOk,
    small_touch_targets: smallTargets,
    small_touch_count: smallTouchCount,
    interactive_count: interactiveCount,
    markers: marker_hits,
    markers_missing,
    markers_ok: markers_missing.length === 0,
    h1_top,
    h1_in_first_viewport,
    table_count: tableCount,
    card_count: cardCount,
    atlas_present: atlasPresent,
    has_browser_block: hasBrowserBlock,
    is_print_route: isPrintRoute,
    creator_disclosure: /Justin Wojciechowski|Independent community research/i.test(document.body.innerText),
    noindex_meta: (document.querySelector('meta[name="robots"]')?.content || '').toLowerCase(),
    issues,
  };
})()`;
}

function pickLiteratureDetail() {
  const litDir = join(dist, 'literature');
  if (!existsSync(litDir)) return '/literature/';
  for (const name of readdirSync(litDir)) {
    if (name === 'index.html') continue;
    const p = join(litDir, name, 'index.html');
    if (existsSync(p)) return `/literature/${name}/`;
  }
  // may be flat
  for (const name of readdirSync(litDir)) {
    if (name.endsWith('.html') && name !== 'index.html') {
      return `/literature/${name}`;
    }
  }
  return '/literature/';
}

async function main() {
  if (!existsSync(join(dist, 'index.html'))) {
    console.error('site/dist missing — run a publication build first');
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error('Chrome not found — cannot run automated mobile QA');
    process.exit(1);
  }
  const WebSocket = await tryImportWs();
  if (!WebSocket) {
    // install ws locally without polluting package.json permanently if needed
    console.error('Installing ws for CDP…');
    const r = spawnSync('npm', ['install', '--no-save', 'ws@8'], {
      cwd: siteRoot,
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.error('Failed to install ws', r.stderr);
      process.exit(1);
    }
  }
  const WS = (await tryImportWs()) || (await import(join(siteRoot, 'node_modules/ws/wrapper.mjs'))).default;

  mkdirSync(outDir, { recursive: true });
  const port = await freePort();
  const server = await startStaticServer(dist, port);
  const base = `http://127.0.0.1:${port}`;

  // Resolve literature detail
  for (const r of ROUTES) {
    if (r.id === 'literature-detail') r.path = pickLiteratureDetail();
  }

  const results = [];
  let failCount = 0;
  const scrollShots = [];

  try {
    await withChromeCdp(chrome, async (debugPort) => {
      const page = await openPage(debugPort, WS);
      for (const route of ROUTES) {
        for (const vp of VIEWPORTS) {
          const shotName = `${route.id}__${vp.id}.png`;
          const shotPath = join(outDir, shotName);
          await page.setViewport(vp.width, vp.height, 2);
          await page.goto(`${base}${route.path}`);
          await sleep(350);

          // First-viewport measurement BEFORE interactions (expanding provenance
          // must not push the landing h1 below the fold for the conversion check).
          await page.evaluate('window.scrollTo(0, 0)');
          await sleep(100);
          const checks = await page.evaluate(buildPageChecksJs(route, vp));
          await page.screenshot(shotPath);

          // Interactions after fold check; re-check overflow only.
          for (const act of route.interactions || []) {
            if (act.type === 'click' && act.selector) {
              await page.evaluate(`(() => {
                const el = document.querySelector(${JSON.stringify(act.selector)});
                if (el) el.click();
                return !!el;
              })()`);
              await sleep(150);
            }
          }
          if ((route.interactions || []).length) {
            const postIx = await page.evaluate(`(() => {
              const d = document.documentElement;
              return Math.max(0, Math.max(d.scrollWidth, document.body.scrollWidth) - d.clientWidth);
            })()`);
            if (postIx > 1) {
              checks.horizontal_overflow = true;
              checks.overflow_delta = Math.max(checks.overflow_delta || 0, postIx);
              checks.issues = checks.issues || [];
              checks.issues.push({ kind: 'horizontal_overflow_after_interaction', delta: postIx });
            }
            checks.interaction_exercised = true;
          }

          // Sampled mid-page screenshots (portrait phones only — keep artifact count bounded)
          const sampleScrolls = vp.width <= 430 ? route.scroll_samples || [] : [];
          const scrollShotNames = [];
          for (const frac of sampleScrolls) {
            const name = `${route.id}__${vp.id}__scroll${Math.round(frac * 100)}.png`;
            await page.evaluate(`window.scrollTo(0, Math.floor(document.documentElement.scrollHeight * ${frac}))`);
            await sleep(120);
            // overflow re-check at scroll position
            const midOverflow = await page.evaluate(`(() => {
              const d = document.documentElement;
              return Math.max(0, Math.max(d.scrollWidth, document.body.scrollWidth) - d.clientWidth);
            })()`);
            if (midOverflow > 1) {
              checks.horizontal_overflow = true;
              checks.overflow_delta = Math.max(checks.overflow_delta || 0, midOverflow);
              checks.issues = checks.issues || [];
              checks.issues.push({ kind: 'horizontal_overflow_scrolled', frac, delta: midOverflow });
            }
            await page.screenshot(join(outDir, name));
            scrollShotNames.push(name);
            scrollShots.push({ route: route.id, viewport: vp.id, frac, screenshot: name });
          }
          await page.evaluate('window.scrollTo(0, 0)');

          const requireH1 =
            Boolean(route.require_h1_in_first_viewport) &&
            vp.height >= (route.require_h1_min_height || 0);
          const hardFail =
            checks.horizontal_overflow ||
            checks.sticky_clipped ||
            !checks.sticky_present ||
            !checks.markers_ok ||
            (requireH1 && checks.h1_in_first_viewport === false);
          if (hardFail) failCount++;
          results.push({
            route: route.id,
            path: route.path,
            viewport: vp.id,
            viewport_label: vp.label,
            width: vp.width,
            height: vp.height,
            screenshot: shotName,
            scroll_screenshots: scrollShotNames,
            hard_fail: hardFail,
            ...checks,
          });
          process.stderr.write(
            `${hardFail ? 'FAIL' : 'ok  '} ${route.id} @ ${vp.id} overflow=${checks.overflow_delta}px h1@${checks.h1_top}px markers=${checks.markers_ok ? 'ok' : 'MISS'} touch<44=${checks.small_touch_count}/${checks.interactive_count}\n`,
          );
        }
      }
      page.close();
    });
  } finally {
    server.close();
  }

  // Checkpoint J.1: stamp live analysis version so validate_all can reject stale evidence.
  let contentVersion = '';
  try {
    const { load: loadYaml } = await import('js-yaml');
    const release = loadYaml(
      readFileSync(join(siteRoot, 'src/data/release.yaml'), 'utf8'),
    );
    contentVersion = String(release?.content_version || '').trim();
  } catch {
    contentVersion = '';
  }
  if (!contentVersion) {
    throw new Error(
      'release.yaml missing content_version — cannot stamp mobile QA report',
    );
  }

  const report = {
    generated_at: new Date().toISOString(),
    method: 'automated_chrome_headless_device_metrics_emulation',
    not_real_device_testing: true,
    checkpoint: 'J.1',
    content_version: contentVersion,
    content_version_matches_release: true,
    disclaimer:
      'This report is automated viewport emulation only. It is not real-device testing and does not replace physical iPhone/Android or VoiceOver/TalkBack smoke tests. Checks include route markers, first-viewport h1 (home), sampled scroll screenshots, interactions, and uncapped small-touch counts.',
    chrome,
    viewports: VIEWPORTS,
    routes: ROUTES.map((r) => ({
      id: r.id,
      path: r.path,
      markers: r.markers,
      require_h1_in_first_viewport: r.require_h1_in_first_viewport || false,
      scroll_samples: r.scroll_samples || [],
    })),
    hard_fail_count: failCount,
    result_count: results.length,
    scroll_screenshot_count: scrollShots.length,
    results,
  };

  writeFileSync(join(outDir, 'MOBILE_QA_REPORT.json'), JSON.stringify(report, null, 2));

  let md = `# Automated mobile viewport QA — Checkpoint J.1\n\n`;
  md += `> **Not real-device testing.** Chrome headless device-metrics emulation only.\n\n`;
  md += `Generated: ${report.generated_at}  \n`;
  md += `Content version: **${contentVersion}**  \n`;
  md += `Hard fails (overflow / sticky / missing markers / home h1 below fold): **${failCount}**  \n`;
  md += `Cells: ${results.length} (routes × viewports) · scroll samples: ${scrollShots.length}\n\n`;
  md += `## Viewport matrix\n\n`;
  md += `| ID | Size | Label |\n|----|------|-------|\n`;
  for (const v of VIEWPORTS) {
    md += `| ${v.id} | ${v.width}×${v.height} | ${v.label} |\n`;
  }
  md += `\n## Routes and markers\n\n`;
  for (const r of ROUTES) {
    md += `- \`${r.path}\` (${r.id}) markers: ${(r.markers || []).map((m) => '`' + m + '`').join(', ')}`;
    if (r.require_h1_in_first_viewport) md += ' · **h1 in first viewport required**';
    md += `\n`;
  }
  md += `\n## Results summary\n\n`;
  md += `| Route | Viewport | Overflow Δ | h1 top | Markers | Small targets | Hard fail | Screenshot |\n`;
  md += `|-------|----------|------------|--------|---------|---------------|-----------|------------|\n`;
  for (const x of results) {
    md += `| ${x.route} | ${x.viewport} | ${x.overflow_delta}px | ${x.h1_top ?? '—'} | ${x.markers_ok ? 'ok' : 'MISS'} | ${x.small_touch_count}/${x.interactive_count} | ${x.hard_fail ? 'YES' : 'no'} | ${x.screenshot} |\n`;
  }
  md += `\n## Soft findings (touch targets < 44px)\n\n`;
  md += `\`small_touch_count\` is the **full** count (not capped). Sample list is capped at 24 entries for report size. Dense citation links may remain under 44px.\n\n`;
  md += `## Owner real-device checklist\n\n`;
  md += `See \`docs/ops/REAL_DEVICE_A11Y_SMOKE_CHECKLIST.md\` for physical iPhone/Android and VoiceOver/TalkBack smoke after quiet deploy.\n`;
  writeFileSync(join(outDir, 'MOBILE_QA_REPORT.md'), md);

  console.log(JSON.stringify({ hard_fail_count: failCount, outDir, results: results.length, scroll_shots: scrollShots.length }, null, 2));
  // Hard gate: overflow, sticky, markers, home h1 fold; not small touch targets alone
  if (failCount > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
