/**
 * Render local QA medical print PDFs (Letter + A4), stamp a margin footer on
 * every page, extract text, and assert footer clearance + in-bounds geometry.
 *
 * These PDFs are QA artifacts only — they are NOT shipped to website visitors.
 * Public browser print policy (H.1.3): only body.print-route pages print medical
 * content; all other routes print a one-page safety notice (see print.css).
 *
 * Why stamp (not CSS fixed)?
 * Chromium anchors position:fixed to the content area and paints over flowing
 * content; negative bottom offsets clip off-page before clearing cards. QA PDFs
 * therefore: (1) hide .print-footer, (2) reserve @page bottom margin,
 * (3) stamp disclosure text into that margin after Chrome render (word-wrapped).
 *
 * Routes: /for-clinicians/, /case/, /questions-for-clinicians/prediction-matrix/
 * (case + prediction-matrix shells force .print-route so the browser-block does
 * not hide content during this local QA pipeline.)
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { load as loadYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const dist = join(siteRoot, 'dist');
const repoRoot = join(siteRoot, '..');
const outDir = join(repoRoot, 'audits', '2026-08-publication-readiness', 'print-pdfs');
const chromeCandidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

/** Reserved @page bottom margin (inches). Must match print.css + shell inject. */
const FOOTER_MARGIN_IN = 1.0;
/** Top of stamped footer rule from page bottom (inches) — must be < FOOTER_MARGIN_IN. */
const FOOTER_BAND_TOP_IN = 0.92;

const PAPERS = [
  { key: 'letter', pageCss: 'letter', paperLabel: '8.5in × 11in (Letter)' },
  { key: 'a4', pageCss: 'A4', paperLabel: '210mm × 297mm (A4)' },
];

const PRINT_ROUTES = [
  {
    id: 'for-clinicians',
    distRel: 'for-clinicians/index.html',
    minPages: 2,
    maxPages: 6,
    visualNote: () =>
      'for-clinicians: stamped margin footer; medical content must stay above footer band.',
  },
  {
    id: 'case',
    distRel: 'case/index.html',
    minPages: 1,
    maxPages: 40,
    visualNote: () =>
      'case: multi-page cards; stamped footer must not cover claim bottoms (e.g. CLM-0003).',
  },
  {
    id: 'prediction-matrix',
    distRel: 'questions-for-clinicians/prediction-matrix/index.html',
    minPages: 1,
    maxPages: 40,
    visualNote: () =>
      'prediction-matrix: multi-page tables; stamped footer must not cover CQ card bottoms.',
  },
];

function findChrome() {
  for (const c of chromeCandidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function footerLines(release) {
  const clinician =
    release.clinician_review_scope.status === 'not_reviewed'
      ? 'not performed'
      : String(release.clinician_review_scope.status).replace(/_/g, ' ');
  // Use ASCII hyphen (not em-dash) so PDF Helvetica + text extract match assertions.
  return [
    `Research only - not medical advice. Research preview · Published with Drift0r's permission · Permission is not endorsement · Not clinician-reviewed · clinician review: ${clinician}`,
    `Research Evidence Portfolio · content ${release.content_version} · as of ${release.as_of} · patient approval: ${release.patient_approval.status}. Licensed clinicians must verify underlying records. Do not start, stop, or change treatment based on this material.`,
  ];
}

/**
 * Stamp footer into every page's bottom margin via stamp_print_footer.py (pypdf).
 */
function stampFooterOnPdf(pdfPath, lines) {
  const stampScript = join(__dirname, 'stamp_print_footer.py');
  const py = spawnSync(
    'python3',
    [stampScript, pdfPath, String(FOOTER_BAND_TOP_IN), ...lines],
    { encoding: 'utf8', timeout: 120000 },
  );
  if (py.status !== 0) {
    throw new Error(`footer stamp failed: ${py.stderr || py.stdout}`);
  }
  return String(py.stdout).trim();
}

function pdfPageCount(pdfPath, buf) {
  const py = spawnSync(
    'python3',
    [
      '-c',
      `
import sys
from pathlib import Path
from pypdf import PdfReader
print(len(PdfReader(sys.argv[1]).pages))
`,
      pdfPath,
    ],
    { encoding: 'utf8', timeout: 30000 },
  );
  if (py.status === 0) {
    const n = parseInt(String(py.stdout).trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const text = buf.toString('latin1');
  const m = text.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/);
  if (m) return parseInt(m[1], 10);
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

function mediaBoxInches(buf) {
  const text = buf.toString('latin1');
  const m = text.match(/\/MediaBox\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  if (!m) return null;
  return {
    width_in: +((parseFloat(m[3]) - parseFloat(m[1])) / 72).toFixed(3),
    height_in: +((parseFloat(m[4]) - parseFloat(m[2])) / 72).toFixed(3),
  };
}

function extractPdfTextByPage(pdfPath) {
  const py = spawnSync(
    'python3',
    [
      '-c',
      `
import json, sys
from pypdf import PdfReader
reader = PdfReader(sys.argv[1])
pages = [{"page": i, "text": (p.extract_text() or "")} for i, p in enumerate(reader.pages, 1)]
print(json.dumps(pages))
`,
      pdfPath,
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  if (py.status !== 0) {
    return { error: py.stderr || py.stdout, pages: [] };
  }
  try {
    return { pages: JSON.parse(py.stdout) };
  } catch (e) {
    return { error: String(e), pages: [] };
  }
}

/**
 * Fail if:
 * 1) non-footer medical text has a baseline inside the reserved bottom margin band, OR
 * 2) footer disclosure text itself leaves the page box (x0/x1/y0/y1 out of bounds).
 * pdfminer y is distance from page bottom; zone = FOOTER_MARGIN_IN * 72 * 0.95.
 */
function assertFooterClearancePdf(pdfPath, marginIn = FOOTER_MARGIN_IN) {
  const py = spawnSync(
    'python3',
    [
      '-c',
      `
import json, re, sys
from pathlib import Path

pdf = Path(sys.argv[1])
margin_in = float(sys.argv[2])
zone_pt = margin_in * 72.0 * 0.95
# Small pad for pdfminer float noise; right edge soft-pad for glyph metrics.
PAD_X = 1.5
PAD_Y = 1.0

FOOTER_RE = re.compile(
    r"research only|not medical advice|drift0r.?s permission|permission is not endorsement|"
    r"not clinician-reviewed|clinician review:\\s*not performed|licensed clinicians must verify|"
    r"patient approval:|research preview|research evidence portfolio|content v\\d",
    re.I,
)
MEDICAL_RE = re.compile(
    r"\\bCLM-\\d{4}\\b|\\bCQ-\\d{3}\\b|\\bH-?NULL\\b|\\bH[0-9]\\b|"
    r"documented finding|clinician:\\s*not reviewed|public_approved|"
    r"\\bCOR-\\d{4}\\b|pre-registered qualitative|if result supports|"
    r"strengthen|weaken|reframe|unchanged|"
    r"hypothesis\\b|working hypothesis|source trail|"
    r"DXA|BMD|Z-score|T-score|hypercalciuria|tryptase",
    re.I,
)

try:
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTTextContainer
except Exception as e:
    print(json.dumps({"ok": False, "error": f"pdfminer required: {e}"}))
    raise SystemExit(0)

pages_out = []
all_ok = True
try:
    for pi, page in enumerate(extract_pages(str(pdf)), 1):
        x0_page, y0_page, x1_page, y1_page = page.bbox
        page_w = x1_page - x0_page
        page_h = y1_page - y0_page
        offenders = []
        bounds_offenders = []
        footer_hits = 0
        for el in page:
            if not isinstance(el, LTTextContainer):
                continue
            for line in el:
                if not hasattr(line, "get_text"):
                    continue
                t = (line.get_text() or "").replace("\\n", " ").strip()
                if not t:
                    continue
                lx0, ly0, lx1, ly1 = line.bbox
                is_footer = bool(FOOTER_RE.search(t))
                if is_footer:
                    footer_hits += 1
                    # Footer text must remain fully inside the page box.
                    if (
                        lx0 < x0_page - PAD_X
                        or lx1 > x1_page + PAD_X
                        or ly0 < y0_page - PAD_Y
                        or ly1 > y1_page + PAD_Y
                    ):
                        bounds_offenders.append({
                            "text": t[:140],
                            "x0": round(lx0, 1),
                            "x1": round(lx1, 1),
                            "y0": round(ly0, 1),
                            "y1": round(ly1, 1),
                            "page_w": round(page_w, 1),
                            "page_h": round(page_h, 1),
                            "reason": "footer_outside_page_box",
                        })
                    continue
                # Medical content must not enter the reserved footer band.
                if ly0 >= zone_pt:
                    continue
                if MEDICAL_RE.search(t):
                    offenders.append({
                        "text": t[:140],
                        "y0_pt": round(ly0, 1),
                        "from_bottom_in": round(ly0 / 72.0, 3),
                    })
        page_ok = len(offenders) == 0 and len(bounds_offenders) == 0 and footer_hits > 0
        if not page_ok:
            all_ok = False
        pages_out.append({
            "page": pi,
            "ok": page_ok,
            "footer_line_hits": footer_hits,
            "offenders": offenders[:8],
            "footer_bounds_offenders": bounds_offenders[:8],
            "page_width_pt": round(page_w, 1),
            "page_height_pt": round(page_h, 1),
            "reserved_band_in": margin_in,
            "zone_pt": round(zone_pt, 1),
        })
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
    raise SystemExit(0)

print(json.dumps({
    "ok": all_ok,
    "method": "pdfminer_medical_clearance_and_footer_page_bounds",
    "margin_in": margin_in,
    "pages": pages_out,
}))
`,
      pdfPath,
      String(marginIn),
    ],
    { encoding: 'utf8', timeout: 180000 },
  );
  if (py.status !== 0) {
    return { ok: false, error: py.stderr || py.stdout || 'footer clearance failed' };
  }
  try {
    return JSON.parse(py.stdout);
  } catch (e) {
    return { ok: false, error: `parse error: ${e}`, raw: String(py.stdout).slice(0, 400) };
  }
}

function assertPageText(pageText, release) {
  const t = pageText.replace(/\s+/g, ' ');
  const patientLabel = release.patient_approval.status.replace(/_/g, ' ');
  const checks = {
    research_preview: /Research preview/i.test(t),
    not_medical_advice: /Not medical advice/i.test(t),
    published_with_permission: /Published with Drift0r.?s permission/i.test(t),
    permission_not_endorsement: /Permission is not endorsement/i.test(t),
    not_clinician_reviewed: /Not clinician-reviewed/i.test(t),
    // Accept em-dash, en-dash, single hyphen, or double-hyphen (Helvetica stamp).
    research_only: /Research only\s*(?:—|–|--|-)\s*not medical advice/i.test(t),
    licensed_clinician: /licensed clinician.?s? must verify/i.test(t),
    patient_approval: new RegExp(`patient approval:\\s*${patientLabel}`, 'i').test(t),
    clinician_not_performed: /clinician review:\s*not performed/i.test(t),
    content_version: new RegExp(release.content_version.replace(/\./g, '\\.'), 'i').test(t),
    as_of: new RegExp(release.as_of).test(t),
  };
  if (release.patient_approval.status === 'obtained') {
    checks.no_false_not_obtained =
      !/patient approval:\s*not obtained/i.test(t) && !/patient:\s*not obtained/i.test(t);
  } else {
    checks.no_false_not_obtained = true;
  }
  checks.pass = Object.values(checks).every(Boolean);
  return checks;
}

/** Rewrite site-absolute asset paths so headless Chrome can load file:// dist. */
function rewriteDistAssetPaths(builtHtml) {
  const distUrl = pathToFileURL(dist).href;
  let html = builtHtml
    .replaceAll('href="/drift0r/', `href="${distUrl}/`)
    .replaceAll('src="/drift0r/', `src="${distUrl}/`)
    .replaceAll('url(/drift0r/', `url(${distUrl}/`)
    .replaceAll('href="/_astro/', `href="${distUrl}/_astro/`)
    .replaceAll('src="/_astro/', `src="${distUrl}/_astro/`)
    .replaceAll('url(/_astro/', `url(${distUrl}/_astro/`)
    .replaceAll('href="/favicon', `href="${distUrl}/favicon`)
    .replaceAll('src="/favicon', `src="${distUrl}/favicon`)
    .replaceAll('href="/images/', `href="${distUrl}/images/`)
    .replaceAll('src="/images/', `src="${distUrl}/images/`);
  html = html.replace(/(?:href|src)="\/(?!https?:|\/|#)([^"]+)"/g, (full, rel) => {
    if (full.includes('file:')) return full;
    const attr = full.startsWith('src=') ? 'src' : 'href';
    return `${attr}="${distUrl}/${rel}"`;
  });
  return html;
}

/**
 * Local QA multi-page medical PDFs: force print-route shell so medical content prints.
 * Stamped PDFs are not shipped to visitors.
 */
function makePrintableHtml(distRel, pageSizeCss) {
  let html = rewriteDistAssetPaths(readFileSync(join(dist, distRel), 'utf8'));
  // Force print-route so H.1.3 browser-block does not hide medical content in QA shells
  // (case + prediction-matrix are not public print routes; stamped PDFs stay local-only).
  html = html.replace(/<body([^>]*)>/i, (full, attrs) => {
    if (/\bclass\s*=\s*"/i.test(attrs)) {
      return `<body${attrs.replace(/\bclass\s*=\s*"/i, 'class="print-route print-qa-shell ')}>`;
    }
    if (/\bclass\s*=\s*'/i.test(attrs)) {
      return `<body${attrs.replace(/\bclass\s*=\s*'/i, "class='print-route print-qa-shell ")}>`;
    }
    return `<body class="print-route print-qa-shell"${attrs}>`;
  });
  // Reserve bottom margin; hide CSS fixed footer + browser-block (stamped after render).
  html = html.replace(
    '</head>',
    `<style>
      @page {
        size: ${pageSizeCss};
        margin: 0.45in 0.5in ${FOOTER_MARGIN_IN}in 0.5in;
      }
      html, body { font-size: 9.5pt !important; }
      .print-page { break-after: page; page-break-after: always; }
      .print-page:last-child { break-after: auto; page-break-after: auto; }
      .print-footer { display: none !important; }
      .print-browser-block { display: none !important; }
      body.print-qa-shell main, body.print-qa-shell .wrap { display: block !important; }
    </style></head>`,
  );
  return html;
}

/**
 * Visitor browser-print smoke: do NOT force print-route — expect exactly one
 * safety-notice page from .print-browser-block with no medical IDs.
 */
function makeBrowserBlockHtml(distRel) {
  let html = rewriteDistAssetPaths(readFileSync(join(dist, distRel), 'utf8'));
  // Ensure body is NOT a print-route (strip accidental print-route from source).
  html = html.replace(
    /<body([^>]*)\bclass\s*=\s*(["'])([^"']*)\2([^>]*)>/i,
    (full, pre, q, cls, post) => {
      const cleaned = cls
        .split(/\s+/)
        .filter((c) => c && c !== 'print-route' && c !== 'print-qa-shell')
        .join(' ');
      if (!cleaned) return `<body${pre}${post}>`;
      return `<body${pre}class=${q}${cleaned}${q}${post}>`;
    },
  );
  html = html.replace(
    '</head>',
    `<style>
      @page { size: letter; margin: 0.5in; }
    </style></head>`,
  );
  return html;
}

/** Assert browser-block PDF: 1 page, required safety text, zero medical terms. */
function assertBrowserBlockPdf(pdfPath, release) {
  const buf = readFileSync(pdfPath);
  const pages = pdfPageCount(pdfPath, buf);
  const extracted = extractPdfTextByPage(pdfPath);
  if (extracted.error) {
    return { ok: false, pages, reason: extracted.error, text: '' };
  }
  const text = extracted.pages.map((p) => p.text || '').join('\n');
  const flat = text.replace(/\s+/g, ' ');
  const required = [
    [/not a designated browser-print route|print-browser-block|This page is not a designated/i, 'safety notice title'],
    [/Research only/i, 'research only'],
    [/not medical advice/i, 'not medical advice'],
    [/Permission is not endorsement/i, 'permission not endorsement'],
    [/Not clinician-reviewed|clinician review:\s*not performed/i, 'clinician status'],
    [new RegExp(String(release.content_version).replace(/\./g, '\\.'), 'i'), 'content version'],
  ];
  const missing = required.filter(([re]) => !re.test(flat)).map(([, name]) => name);
  const forbidden = [];
  if (/\bCLM-\d{4}\b/i.test(text)) forbidden.push('CLM-*');
  if (/\bCQ-\d{3}\b/i.test(text)) forbidden.push('CQ-*');
  if (/\bDXA\b/i.test(text)) forbidden.push('DXA');
  if (/\bT-score\b/i.test(text)) forbidden.push('T-score');
  if (/\bZ-score\b/i.test(text)) forbidden.push('Z-score');
  const ok = pages === 1 && missing.length === 0 && forbidden.length === 0;
  return {
    ok,
    pages,
    missing,
    forbidden,
    text_excerpt: flat.slice(0, 400),
    reason: ok
      ? 'PASS'
      : `pages=${pages} missing=[${missing.join(',')}] forbidden=[${forbidden.join(',')}]`,
  };
}

function chromePrint(chrome, htmlPath, pdfPath) {
  return spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--allow-file-access-from-files',
      '--virtual-time-budget=25000',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { encoding: 'utf8', timeout: 120000 },
  );
}

function rasterizePdf(pdfPath, prefix) {
  const pngs = [];
  const ppm = spawnSync('pdftoppm', ['-png', '-r', '120', pdfPath, join(outDir, prefix)], {
    encoding: 'utf8',
  });
  if (ppm.status === 0) {
    for (const name of readdirSync(outDir).filter((n) => n.startsWith(prefix) && n.endsWith('.png'))) {
      pngs.push(join(outDir, name));
    }
  }
  return pngs;
}

function main() {
  for (const route of PRINT_ROUTES) {
    if (!existsSync(join(dist, route.distRel))) {
      console.error(`dist/${route.distRel} missing — run npm run build first`);
      process.exit(1);
    }
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error('Chrome not found');
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  const release = loadYaml(readFileSync(join(siteRoot, 'src/data/release.yaml'), 'utf8'));
  const lines = footerLines(release);
  const results = [];
  let allTextOk = true;
  let allPageCountsOk = true;
  let allVisualOk = true;

  for (const route of PRINT_ROUTES) {
    for (const paper of PAPERS) {
      const artifactId = `${route.id}-${paper.key}`;
      const shell = join(outDir, `${artifactId}-shell.html`);
      const pdfPath = join(outDir, `${artifactId}.pdf`);
      writeFileSync(shell, makePrintableHtml(route.distRel, paper.pageCss), 'utf8');
      const r = chromePrint(chrome, shell, pdfPath);
      if (!existsSync(pdfPath)) {
        console.error(`${artifactId} PDF missing`, r.status, r.stderr?.slice(0, 500));
        process.exit(1);
      }
      // Stamp margin footer after Chrome layout (content already kept out of margin).
      try {
        stampFooterOnPdf(pdfPath, lines);
      } catch (e) {
        console.error(`${artifactId} stamp failed`, e);
        process.exit(1);
      }

      const buf = readFileSync(pdfPath);
      const pages = pdfPageCount(pdfPath, buf);
      const media = mediaBoxInches(buf);
      const prefix = `${artifactId}-page`;
      for (const n of readdirSync(outDir)) {
        if (n.startsWith(prefix) && n.endsWith('.png')) {
          try {
            unlinkSync(join(outDir, n));
          } catch {
            /* ignore */
          }
        }
      }
      const pngPaths = rasterizePdf(pdfPath, prefix);
      const extracted = extractPdfTextByPage(pdfPath);
      const clearance = assertFooterClearancePdf(pdfPath, FOOTER_MARGIN_IN);
      if (clearance.ok !== true) allVisualOk = false;

      const pageReports = [];
      let routeTextOk = true;
      if (extracted.error) {
        allTextOk = false;
        routeTextOk = false;
        pageReports.push({ error: extracted.error });
      } else {
        for (const pg of extracted.pages) {
          const checks = assertPageText(pg.text, release);
          if (!checks.pass) {
            allTextOk = false;
            routeTextOk = false;
          }
          const png =
            pngPaths.find(
              (p) =>
                p.includes(`-${String(pg.page).padStart(2, '0')}.png`) ||
                p.includes(`-${pg.page}.png`) ||
                p.endsWith(`-${pg.page}.png`),
            ) || null;
          const pageClear = (clearance.pages || []).find((x) => x.page === pg.page) || null;
          pageReports.push({
            page: pg.page,
            text_len: pg.text.length,
            text_excerpt: pg.text.replace(/\s+/g, ' ').slice(0, 280),
            checks,
            footer_clearance: pageClear,
            visible_png: png,
            visual_note: route.visualNote(pg.page),
          });
        }
      }

      const pageCountOk = pages >= route.minPages && pages <= route.maxPages;
      if (!pageCountOk) allPageCountsOk = false;

      results.push({
        name: artifactId,
        route: `/${route.distRel.replace(/index\.html$/, '')}`,
        paper: paper.paperLabel,
        path: pdfPath,
        bytes: buf.length,
        page_count: pages,
        media_box_inches: media,
        min_pages: route.minPages,
        max_pages: route.maxPages,
        status: pageCountOk ? 'PASS_PAGE_COUNT' : 'FAIL_PAGE_COUNT',
        text_ok: routeTextOk,
        visual_ok: clearance.ok === true,
        footer_clearance_summary: {
          ok: clearance.ok === true,
          method: clearance.method || null,
          error: clearance.error || null,
          offender_pages: (clearance.pages || [])
            .filter((p) => !p.ok)
            .map((p) => ({
              page: p.page,
              offenders: p.offenders,
              footer_bounds_offenders: p.footer_bounds_offenders || [],
              footer_hits: p.footer_line_hits,
            })),
        },
        text_extraction: extracted.error ? 'FAIL' : 'PASS',
        per_page: pageReports,
        png_pages: pngPaths,
        chrome_status: r.status,
      });
    }
  }

  // --- Browser-print smoke (visitor path): case + prediction-matrix ---
  // Must produce exactly one safety-notice page; no CLM/CQ/DXA medical terms.
  const BROWSER_BLOCK_ROUTES = [
    { id: 'case-browser-block', distRel: 'case/index.html', outName: 'case-browser-block-test.pdf' },
    {
      id: 'prediction-matrix-browser-block',
      distRel: 'questions-for-clinicians/prediction-matrix/index.html',
      outName: 'prediction-matrix-browser-block-test.pdf',
    },
  ];
  const browserBlockResults = [];
  let allBrowserBlockOk = true;
  for (const br of BROWSER_BLOCK_ROUTES) {
    if (!existsSync(join(dist, br.distRel))) {
      allBrowserBlockOk = false;
      browserBlockResults.push({ id: br.id, ok: false, reason: `missing dist/${br.distRel}` });
      continue;
    }
    const shell = join(outDir, `${br.id}-shell.html`);
    const pdfPath = join(outDir, br.outName);
    writeFileSync(shell, makeBrowserBlockHtml(br.distRel), 'utf8');
    const r = chromePrint(chrome, shell, pdfPath);
    if (!existsSync(pdfPath)) {
      allBrowserBlockOk = false;
      browserBlockResults.push({
        id: br.id,
        ok: false,
        reason: `PDF missing (chrome status ${r.status})`,
      });
      continue;
    }
    const assertion = assertBrowserBlockPdf(pdfPath, release);
    if (!assertion.ok) allBrowserBlockOk = false;
    browserBlockResults.push({
      id: br.id,
      path: pdfPath,
      ...assertion,
    });
  }

  const clinicianHtml = readFileSync(join(dist, 'for-clinicians/index.html'), 'utf8');
  const caseHtml = readFileSync(join(dist, 'case/index.html'), 'utf8');
  const printCss = readFileSync(join(siteRoot, 'src/styles/print.css'), 'utf8');
  const baseLayoutSrc = readFileSync(join(siteRoot, 'src/layouts/BaseLayout.astro'), 'utf8');
  const structural = {
    uses_deterministic_two_sections: /print-page-1/.test(clinicianHtml) && /print-page-2/.test(clinicianHtml),
    dynamic_patient_status: !/patient approval: not obtained/i.test(clinicianHtml),
    patient_status_in_html: new RegExp(
      `patient approval:\\s*${release.patient_approval.status.replace(/_/g, ' ')}`,
      'i',
    ).test(clinicianHtml),
    clinician_not_performed_in_html: /clinician review:\s*not performed/i.test(clinicianHtml),
    research_only_in_html: /Research only/i.test(clinicianHtml),
    case_route_built: existsSync(join(dist, 'case/index.html')),
    prediction_matrix_built: existsSync(
      join(dist, 'questions-for-clinicians/prediction-matrix/index.html'),
    ),
    css_hides_fixed_print_footer: /\.print-footer\s*\{[^}]*display:\s*none\s*!important/s.test(
      printCss,
    ),
    // H.1.3: non-print routes must print only the safety block.
    css_browser_block_non_print_routes:
      /body:not\(\.print-route\)\s*>\s\*:not\(\.print-browser-block\)/.test(printCss) &&
      /body:not\(\.print-route\)\s+\.print-browser-block/.test(printCss),
    base_layout_emits_browser_block: /print-browser-block/.test(baseLayoutSrc),
    case_is_not_print_route: !/class="[^"]*print-route/.test(caseHtml),
    case_has_browser_block: /print-browser-block/.test(caseHtml),
    browser_block_smokes_pass: allBrowserBlockOk,
  };

  // Renamed from PASS_WITH_TEXT_AND_VISUAL: automated layout/bbox only; no documented
  // human visual review of PNGs was performed in this pipeline.
  const disposition =
    allPageCountsOk &&
    allTextOk &&
    allVisualOk &&
    allBrowserBlockOk &&
    structural.uses_deterministic_two_sections &&
    structural.case_route_built &&
    structural.prediction_matrix_built &&
    structural.css_hides_fixed_print_footer &&
    structural.css_browser_block_non_print_routes &&
    structural.base_layout_emits_browser_block &&
    structural.case_is_not_print_route &&
    structural.case_has_browser_block
      ? 'PASS_WITH_TEXT_AND_AUTOMATED_LAYOUT'
      : 'FAIL';

  // Checkpoint I.1 P2: refuse a report whose content_version ≠ live release.yaml
  if (!release.content_version || typeof release.content_version !== 'string') {
    throw new Error('release.yaml missing content_version — cannot stamp print report');
  }

  const report = {
    generated_at: new Date().toISOString(),
    chrome,
    release_patient_approval: release.patient_approval.status,
    release_clinician_review: release.clinician_review_scope.status,
    content_version: release.content_version,
    content_version_matches_release: true,
    footer_geometry: {
      mechanism: 'post_render_pdf_stamp_in_page_margin_word_wrapped',
      page_margin_bottom_in: FOOTER_MARGIN_IN,
      stamp_band_top_in: FOOTER_BAND_TOP_IN,
      css_fixed_footer: 'hidden under @media print (Chromium paints fixed over content)',
      shipped_to_visitors: false,
    },
    browser_print_policy: {
      designated_routes: [
        '/for-clinicians/',
        '/working-model/evidence-table/',
        '/questions-for-clinicians/packet/',
        '/about/snapshot/',
        '/about/downloads/',
      ],
      non_print_routes: 'one-page .print-browser-block safety notice only (H.1.3)',
      stamped_pdfs: 'local QA only — not published or downloadable',
      browser_block_smokes: browserBlockResults,
    },
    routes: PRINT_ROUTES.map((r) => r.id),
    papers: PAPERS.map((p) => p.key),
    results,
    structural,
    text_assertions_pass: allTextOk,
    visual_footer_clearance_pass: allVisualOk,
    browser_block_smokes_pass: allBrowserBlockOk,
    // Automated bbox check only — do not claim a human reviewed PNGs.
    visual_inspection_completed: false,
    visual_inspection_method:
      'pdfminer: medical text must stay above reserved bottom margin; footer text x0/x1/y0/y1 must stay inside page box (catches A4 horizontal clip); PNG raster for optional human spot-check; browser-block smokes are automated Chromium print only',
    disposition,
    residual:
      'Visitors: only body.print-route pages print medical content; all other routes print a one-page safety notice. Stamped Letter/A4 PDFs are local QA artifacts and are not shipped. Disposition is automated layout only (not human visual review).',
  };

  writeFileSync(join(outDir, 'PRINT_PDF_REPORT.json'), JSON.stringify(report, null, 2));
  let md = `# Print PDF report — Checkpoint I (browser-block smokes + automated layout)\n\n`;
  md += `Content version: **${release.content_version}**  \n`;
  md += `QA mechanism: **word-wrapped post-render PDF stamp** into @page bottom margin (**${FOOTER_MARGIN_IN}in**); CSS fixed footer **hidden**  \n`;
  md += `Visitor browser print: **print-route only**; non-print → \`.print-browser-block\` safety notice  \n`;
  md += `Browser-block smokes (/case/, /prediction-matrix/): **${allBrowserBlockOk ? 'PASS' : 'FAIL'}**  \n`;
  md += `Stamped PDFs shipped: **no** (local QA only)  \n`;
  md += `Text assertions: **${allTextOk ? 'PASS' : 'FAIL'}**  \n`;
  md += `Footer clearance + bounds (pdfminer): **${allVisualOk ? 'PASS' : 'FAIL'}**  \n`;
  md += `visual_inspection_completed: **false** (automated only)  \n`;
  md += `Disposition: **${report.disposition}**\n\n`;
  md += `Papers: Letter + A4. QA routes: ${PRINT_ROUTES.map((r) => r.id).join(', ')}.\n\n`;
  md += `Structural: ${JSON.stringify(structural)}\n\n`;
  md += `## Browser-block smokes\n\n`;
  for (const b of browserBlockResults) {
    md += `- **${b.id}**: ${b.ok ? 'PASS' : 'FAIL'} — pages=${b.pages ?? '?'} ${b.reason || ''}\n`;
  }
  md += `\n`;
  for (const x of results) {
    md += `## ${x.name}\n\n`;
    md += `- Route: \`${x.route}\` · ${x.paper}\n`;
    md += `- Pages: **${x.page_count}** (${x.status})\n`;
    md += `- text_ok=${x.text_ok} · visual_ok=${x.visual_ok}\n`;
    md += `- Footer clearance: ${JSON.stringify(x.footer_clearance_summary)}\n\n`;
    for (const pg of x.per_page || []) {
      if (pg.error) {
        md += `- ERROR page: ${pg.error}\n`;
        continue;
      }
      if (pg.footer_clearance && !pg.footer_clearance.ok) {
        md += `### Page ${pg.page} CLEARANCE FAIL\n`;
        md += `- ${JSON.stringify(pg.footer_clearance)}\n\n`;
      }
    }
  }
  writeFileSync(join(outDir, 'PRINT_PDF_REPORT.md'), md);
  console.log(JSON.stringify(report, null, 2));
  if (report.disposition !== 'PASS_WITH_TEXT_AND_AUTOMATED_LAYOUT') process.exit(2);
}

main();
