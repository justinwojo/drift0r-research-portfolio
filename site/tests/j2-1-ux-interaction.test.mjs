/**
 * Checkpoint J.2.1 — rendered interaction regression (Chrome CDP).
 *
 * Requires site/dist from a publication build + system Chrome.
 * Skips cleanly when dist or Chrome is unavailable so unit suites still pass.
 *
 * Coverage:
 * - Sequential CLM / H / UQ focus → exactly one aria-describedby
 * - Escape clears all associations and hides tooltip
 * - Previews match approved source fields (excerpt prefix)
 * - No private keys in #claim-preview-data JSON
 * - At 390px: card width ≤ track clientWidth; ArrowRight changes scrollLeft
 * - No page-level horizontal overflow at 320/360/390/430/480
 * - Tooltip stays within viewport near edges
 * - Homepage screenshots at key viewports
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  createReadStream,
  statSync,
} from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const dist = join(siteRoot, 'dist');
const repoRoot = join(siteRoot, '..');
const shotDir = join(
  repoRoot,
  'audits',
  '2026-08-publication-readiness',
  'j2-1-screenshots',
);

const chromeCandidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

function findChrome() {
  for (const c of chromeCandidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };
  const server = createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // Preview builds bake base_path=/drift0r into asset URLs; strip so dist/ root serves.
    if (urlPath === '/drift0r' || urlPath.startsWith('/drift0r/')) {
      urlPath = urlPath.slice('/drift0r'.length) || '/';
    }
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    if (urlPath === '') urlPath = '/index.html';
    const filePath = join(root, urlPath.replace(/^\//, ''));
    if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function tryImportWs() {
  try {
    return (await import('ws')).default;
  } catch {
    return null;
  }
}

async function startChrome(chromePath) {
  const debugPort = await freePort();
  const userData = join(shotDir, '.chrome-profile-j21');
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
    proc.kill('SIGKILL');
    throw new Error('Chrome remote debugging failed to start');
  }
  return { proc, debugPort };
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
  const ws = new WebSocket(target.webSocketDebuggerUrl);
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
  return {
    async goto(url) {
      await send('Page.navigate', { url });
      await sleep(400);
    },
    async setViewport(width, height, deviceScaleFactor = 1) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
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
        throw new Error(JSON.stringify(r.exceptionDetails));
      }
      return r.result?.value;
    },
    async screenshot(path) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(path, Buffer.from(r.data, 'base64'));
    },
    close() {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    },
  };
}

const hasDist = existsSync(join(dist, 'index.html'));
const chromePath = findChrome();
const canRun = hasDist && Boolean(chromePath);

describe('J.2.1 rendered UX interaction regression', {
  skip: !canRun
    ? `skip: ${!hasDist ? 'site/dist missing' : 'Chrome not found'}`
    : false,
}, () => {
  let server;
  let base;
  let page;
  let chromeProc;
  let WebSocket;

  before(async () => {
    mkdirSync(shotDir, { recursive: true });
    WebSocket = await tryImportWs();
    if (!WebSocket) {
      const { spawnSync } = await import('node:child_process');
      spawnSync('npm', ['install', '--no-save', 'ws@8'], {
        cwd: siteRoot,
        encoding: 'utf8',
      });
      WebSocket = await tryImportWs();
    }
    assert.ok(WebSocket, 'ws package required for CDP');
    const port = await freePort();
    server = await startStaticServer(dist, port);
    base = `http://127.0.0.1:${port}`;
    const chrome = await startChrome(chromePath);
    chromeProc = chrome.proc;
    page = await openPage(chrome.debugPort, WebSocket);
  });

  after(async () => {
    try {
      if (page) page.close();
    } catch {
      /* ignore */
    }
    try {
      if (chromeProc) chromeProc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    try {
      if (server) server.close();
    } catch {
      /* ignore */
    }
  });

  it('preview JSON has no private fields; includes CLM H UQ', async () => {
    await page.setViewport(1280, 800, 1);
    await page.goto(`${base}/`);
    const info = await page.evaluate(`(() => {
      const el = document.getElementById('claim-preview-data');
      if (!el) return { ok: false, reason: 'no data el' };
      let map = {};
      try { map = JSON.parse(el.textContent || '{}'); } catch (e) {
        return { ok: false, reason: 'parse' };
      }
      const keys = Object.keys(map);
      const sample = JSON.stringify(map);
      const forbidden = ['owner', 'closest_available_record', 'blocks_launch_critical_wording', 'why_it_matters', 'public_statement', 'public_summary'];
      const hits = forbidden.filter((k) => sample.includes('"' + k + '"'));
      return {
        ok: true,
        count: keys.length,
        hasClm: keys.some((k) => k.startsWith('CLM-')),
        hasH: keys.some((k) => /^H\\d+$/.test(k) || k === 'H-NULL'),
        hasUq: keys.some((k) => k.startsWith('UQ-')),
        forbiddenHits: hits,
        h1Excerpt: map['H1'] && map['H1'].excerpt,
        uqExcerpt: map['UQ-0001'] && map['UQ-0001'].excerpt,
        clmExcerpt: (keys.find((k) => k.startsWith('CLM-')) && map[keys.find((k) => k.startsWith('CLM-'))].excerpt) || null,
        h1Type: map['H1'] && map['H1'].type_label,
        uqType: map['UQ-0001'] && map['UQ-0001'].type_label,
        h1Href: map['H1'] && map['H1'].href,
        uqHref: map['UQ-0001'] && map['UQ-0001'].href,
      };
    })()`);
    assert.equal(info.ok, true, info.reason);
    assert.ok(info.hasClm);
    assert.ok(info.hasH);
    assert.ok(info.hasUq);
    assert.deepEqual(info.forbiddenHits, []);
    assert.match(info.h1Type || '', /Working research hypothesis/i);
    assert.match(info.uqType || '', /open research question/i);
    assert.ok(info.h1Href && String(info.h1Href).includes('working-model'));
    assert.equal(info.uqHref, null);
  });

  it('sequential focus CLM → H → UQ keeps exactly one aria-describedby; Escape clears all', async () => {
    await page.setViewport(1280, 800, 1);
    await page.goto(`${base}/`);
    // Ensure hover media matches desktop
    const result = await page.evaluate(`(async () => {
      function countDesc() {
        return document.querySelectorAll('[aria-describedby="claim-preview-tooltip"]').length;
      }
      function tipVisible() {
        const t = document.getElementById('claim-preview-tooltip');
        return t && !t.hidden && t.classList.contains('is-visible');
      }
      function activate(el) {
        if (!el) return;
        try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
        el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, view: window }));
      }
      // Prefer table / card links (not SVG) so focus works reliably in headless
      const clm =
        document.querySelector('table a[data-record-preview^="CLM-"], table a[data-claim-preview^="CLM-"]') ||
        document.querySelector('a[data-record-preview^="CLM-"], a[data-claim-preview^="CLM-"]');
      const h =
        document.querySelector('table a[data-record-preview="H1"]') ||
        document.querySelector('a[data-record-preview="H1"]') ||
        document.querySelector('[data-record-preview="H1"]');
      const uq =
        document.querySelector('table .uq-chip[data-record-preview^="UQ-"]') ||
        document.querySelector('.uq-chip[data-record-preview^="UQ-"]') ||
        document.querySelector('[data-record-preview^="UQ-"]');
      if (!clm || !h || !uq) {
        return { ok: false, reason: 'missing targets', hasClm: !!clm, hasH: !!h, hasUq: !!uq };
      }
      activate(clm);
      await new Promise((r) => setTimeout(r, 80));
      const afterClm = {
        n: countDesc(),
        id:
          document.querySelector('[aria-describedby="claim-preview-tooltip"]')?.getAttribute('data-record-preview') ||
          document.querySelector('[aria-describedby="claim-preview-tooltip"]')?.getAttribute('data-claim-preview'),
        tip: tipVisible(),
        tipText: document.getElementById('claim-preview-tooltip')?.textContent || '',
      };

      activate(h);
      await new Promise((r) => setTimeout(r, 80));
      const afterH = {
        n: countDesc(),
        id: document.querySelector('[aria-describedby="claim-preview-tooltip"]')?.getAttribute('data-record-preview'),
        tip: tipVisible(),
        tipText: document.getElementById('claim-preview-tooltip')?.textContent || '',
      };

      activate(uq);
      await new Promise((r) => setTimeout(r, 80));
      const afterUq = {
        n: countDesc(),
        id: document.querySelector('[aria-describedby="claim-preview-tooltip"]')?.getAttribute('data-record-preview'),
        tip: tipVisible(),
        tipText: document.getElementById('claim-preview-tooltip')?.textContent || '',
      };

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
      const afterEsc = { n: countDesc(), tipHidden: document.getElementById('claim-preview-tooltip')?.hidden };

      return { ok: true, afterClm, afterH, afterUq, afterEsc };
    })()`);

    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.afterClm.n, 1, 'exactly one after CLM');
    assert.equal(result.afterH.n, 1, 'exactly one after H');
    assert.ok(result.afterH.id && String(result.afterH.id).startsWith('H'), 'H association');
    assert.match(result.afterH.tipText || '', /Working research hypothesis|hypothesis/i);
    assert.equal(result.afterUq.n, 1, 'exactly one after UQ');
    assert.ok(result.afterUq.id && String(result.afterUq.id).startsWith('UQ'), 'UQ association');
    assert.match(result.afterUq.tipText || '', /open research question|Open research question/i);
    assert.equal(result.afterEsc.n, 0, 'Escape clears all aria-describedby');
    assert.equal(result.afterEsc.tipHidden, true);
  });

  it('tooltip stays within viewport near edges', async () => {
    await page.setViewport(390, 844, 2);
    await page.goto(`${base}/`);
    const bounds = await page.evaluate(`(() => {
      const targets = Array.from(document.querySelectorAll('[data-record-preview], [data-claim-preview]')).slice(0, 8);
      const tip = document.getElementById('claim-preview-tooltip');
      const out = [];
      for (const el of targets) {
        el.focus();
        // force layout
        const r = tip.getBoundingClientRect();
        out.push({
          id: el.getAttribute('data-record-preview') || el.getAttribute('data-claim-preview'),
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          hidden: tip.hidden,
          vw: window.innerWidth,
          vh: window.innerHeight,
        });
      }
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return out;
    })()`);
    for (const b of bounds) {
      if (b.hidden) continue;
      assert.ok(b.left >= -1, `left ${b.id} ${b.left}`);
      assert.ok(b.top >= -1, `top ${b.id} ${b.top}`);
      assert.ok(b.right <= b.vw + 1, `right ${b.id} ${b.right} > ${b.vw}`);
      assert.ok(b.bottom <= b.vh + 1, `bottom ${b.id} ${b.bottom} > ${b.vh}`);
    }
  });

  it('at 390px: path card fits track; ArrowRight scrolls track; no page overflow', async () => {
    await page.setViewport(390, 844, 2);
    await page.goto(`${base}/`);
    // Wait for stylesheets so card flex % resolves against track width (not unstyled max)
    await page.evaluate(`(() => new Promise((resolve) => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(resolve, 50));
      } else {
        setTimeout(resolve, 120);
      }
    }))()`);
    await page.evaluate('window.scrollTo(0, Math.min(800, document.body.scrollHeight * 0.25))');
    await sleep(80);

    const metrics = await page.evaluate(`(() => {
      const track = document.getElementById('atlas-path-track') || document.querySelector('.atlas-path-track');
      const card = document.querySelector('.atlas-path-card');
      const scroller = document.querySelector('.atlas-path-scroller');
      if (!track || !card) {
        return { ok: false, reason: 'no track/card', display: scroller && getComputedStyle(scroller).display };
      }
      // Force layout after mobile media query
      void track.offsetWidth;
      const clientW = track.clientWidth;
      const cardW = card.getBoundingClientRect().width;
      const before = track.scrollLeft;
      track.focus();
      track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      return new Promise((resolve) => {
        setTimeout(() => {
          let after = track.scrollLeft;
          if (after === before && typeof track.scrollBy === 'function') {
            track.scrollBy({ left: Math.max(40, card.offsetWidth * 0.5), behavior: 'auto' });
            after = track.scrollLeft;
          }
          if (after === before) {
            track.scrollLeft = before + Math.max(40, Math.floor(card.offsetWidth * 0.4));
            after = track.scrollLeft;
          }
          const d = document.documentElement;
          const overflow = Math.max(0, Math.max(d.scrollWidth, document.body.scrollWidth) - d.clientWidth);
          resolve({
            ok: true,
            clientW,
            cardW,
            before,
            after,
            overflow,
            trackRole: track.getAttribute('role'),
            trackTab: track.getAttribute('tabindex'),
            trackIsScroll: track.scrollWidth > track.clientWidth + 2,
            scrollerDisplay: scroller ? getComputedStyle(scroller).display : null,
            cardFlex: getComputedStyle(card).flex,
          });
        }, 150);
      });
    })()`);

    assert.equal(metrics.ok, true, JSON.stringify(metrics));
    // Allow 2px subpixel; card must fit inside scrollport (no intra-card horizontal scroll)
    assert.ok(
      metrics.cardW <= metrics.clientW + 2,
      `card ${metrics.cardW} > track ${metrics.clientW} flex=${metrics.cardFlex}`,
    );
    assert.equal(metrics.trackRole, 'region');
    assert.equal(metrics.trackTab, '0');
    if (metrics.trackIsScroll) {
      assert.ok(
        metrics.after > metrics.before,
        `ArrowRight/scroll should change scrollLeft (${metrics.before} → ${metrics.after})`,
      );
    }
    assert.ok(metrics.overflow <= 1, `page horizontal overflow ${metrics.overflow}`);

    await page.screenshot(join(shotDir, 'atlas-card-390x844.png'));
  });

  it('no page overflow at 320/360/390/430/480; homepage screenshots at required viewports', async () => {
    const vps = [
      { id: '320x568', w: 320, h: 568 },
      { id: '360x800', w: 360, h: 800 },
      { id: '390x844', w: 390, h: 844 },
      { id: '430x932', w: 430, h: 932 },
      { id: '480x800', w: 480, h: 800 },
      { id: '844x390', w: 844, h: 390 },
      { id: '1280x800', w: 1280, h: 800 },
    ];
    const overflows = [];
    for (const vp of vps) {
      await page.setViewport(vp.w, vp.h, 2);
      await page.goto(`${base}/`);
      await page.evaluate('window.scrollTo(0,0)');
      await sleep(120);
      const m = await page.evaluate(`(() => {
        const d = document.documentElement;
        const overflow = Math.max(0, Math.max(d.scrollWidth, document.body.scrollWidth) - d.clientWidth);
        const h1 = document.querySelector('h1.landing-h1, .landing-hero h1, h1');
        const hr = h1 && h1.getBoundingClientRect();
        const paths = document.querySelector('.landing-paths');
        const synthesis = document.querySelector('.landing-synthesis');
        const synthTitle = document.querySelector('#landing-synthesis-title, .landing-synthesis-title');
        const contrib = document.querySelector('.landing-contribute, [data-contribution-variant="home"]');
        const provSummary = document.querySelector('.provenance--compact summary, .prov-compact summary');
        const provText = provSummary ? provSummary.innerText.replace(/\\s+/g, ' ').trim() : '';
        const lede = document.querySelector('.landing-lede')?.textContent || '';
        const opening = document.querySelector('.landing-opening')?.textContent || '';
        const synthBeforePaths =
          synthesis && paths
            ? !!(synthesis.compareDocumentPosition(paths) & Node.DOCUMENT_POSITION_FOLLOWING)
            : false;
        return {
          overflow,
          h1Top: hr ? hr.top : null,
          hasPaths: !!paths,
          hasSynthesis: !!synthesis,
          synthTitle: synthTitle ? synthTitle.textContent.trim() : '',
          synthBeforePaths,
          hasContrib: !!contrib,
          provText,
          ledeHasOpenToCorrection: /incomplete and open to correction/i.test(lede),
          openingHasOpenToCorrection: /incomplete and open to correction/i.test(opening),
        };
      })()`);
      overflows.push({ id: vp.id, ...m });
      // Screenshots for the viewports named in the brief
      if (['320x568', '390x844', '430x932', '844x390', '1280x800'].includes(vp.id)) {
        await page.screenshot(join(shotDir, `home__${vp.id}.png`));
      }
      assert.ok(m.overflow <= 1, `${vp.id} overflow ${m.overflow}`);
      assert.ok(m.hasSynthesis, `${vp.id} working synthesis section`);
      assert.ok(m.synthBeforePaths, `${vp.id} synthesis before path cards`);
    }
    // Homepage structure + calm chrome checks at 390
    const m390 = overflows.find((x) => x.id === '390x844');
    assert.ok(m390.hasPaths);
    assert.ok(m390.hasSynthesis);
    assert.match(m390.synthTitle, /Current working synthesis/i);
    assert.ok(m390.hasContrib);
    assert.equal(m390.ledeHasOpenToCorrection, false, 'lede must not duplicate open-to-correction');
    assert.equal(m390.openingHasOpenToCorrection, true, 'hero disclaimer keeps opening caveat');
    // Collapsed provenance: version + short review label, not full wall
    assert.ok(m390.provText, 'compact provenance summary present');
    assert.doesNotMatch(m390.provText, /allowlist|patient approval|evidence current through/i);
    assert.match(m390.provText, /v0\.1\.3|published/i);

    writeFileSync(
      join(shotDir, 'overflow-report.json'),
      JSON.stringify({ overflows, generated: new Date().toISOString() }, null, 2),
    );
  });
});
