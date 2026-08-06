/**
 * Expanded partial-approval integration build + canary scan (E2.2).
 *
 * Approves a minimal coherent surface (one claim + matching hyp + question + routes)
 * so the launch literature index is nonempty, then proves unapproved canaries for:
 *   - claim ID
 *   - hypothesis
 *   - clinician question
 *   - UQ
 *   - specialty channel
 *   - literature applicability note (unique string)
 *   - hardcoded-route prose phrase
 *
 * Restores inventory, release_scope, and dist even after exceptions.
 */
import { spawnSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  cpSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { load as loadYaml, dump as dumpYaml } from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');

// --- Approved canaries (must appear) ---
const CANARY_APPROVED_CLAIM = 'CLM-0003';
const CANARY_APPROVED_HYP = 'H1';
const CANARY_APPROVED_QUESTION = 'CQ-001';

// --- Unapproved canaries (must be absent) ---
// Must NOT be referenced by H1 (explains + does_not_explain) or the canary auto-approves it
// when building a coherent H1 surface (Checkpoint G.1: H1.does_not_explain includes CLM-0036).
const CANARY_UNAPPROVED_CLAIM = 'CLM-0037';
const CANARY_UNAPPROVED_HYP = 'H4';
const CANARY_UNAPPROVED_QUESTION = 'CQ-009';
const CANARY_UNAPPROVED_UQ = 'UQ-0001';
const CANARY_UNAPPROVED_PATHOGEN = 'Babesia';
// Unique applicability string from a launch-cited lit card — withheld from scope
const CANARY_LIT_APPLICABILITY_NEEDLE = 'COR-0021'; // lit-0104 quality_notes marker
const CANARY_LIT_ID = 'lit-0104';
// Hardcoded specialty-channel medical prose (only renders when pathogen is release-scoped).
// Unapproved pathogen must not inject this specialty signal wording into the artifact.
const CANARY_HARDCODED_PHRASE = 'FISH positive on two draws';

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function main() {
  // Mutate the public inventory only — site runtime never requires the private inventory.
  const invPath = join(
    repoRoot,
    'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml',
  );
  const scopePath = join(siteRoot, 'src/data/release_scope.yaml');
  const liveDist = join(siteRoot, 'dist');
  const invBackup = readFileSync(invPath, 'utf8');
  const scopeBackup = readFileSync(scopePath, 'utf8');
  const tmpRoot = mkdtempSync(join(tmpdir(), 'drift0r-partial-'));
  const liveDistBackup = join(tmpRoot, 'live-dist-backup');
  let hadLiveDist = false;
  let failed = false;
  let report = {};

  const restore = () => {
    try {
      writeFileSync(invPath, invBackup, 'utf8');
    } catch {
      /* ignore */
    }
    try {
      writeFileSync(scopePath, scopeBackup, 'utf8');
    } catch {
      /* ignore */
    }
    try {
      if (hadLiveDist && existsSync(liveDistBackup)) {
        rmSync(liveDist, { recursive: true, force: true });
        cpSync(liveDistBackup, liveDist, { recursive: true });
      }
    } catch {
      /* ignore */
    }
  };

  try {
    if (existsSync(liveDist)) {
      cpSync(liveDist, liveDistBackup, { recursive: true });
      hadLiveDist = true;
    }

    const inv = loadYaml(invBackup);
    let foundClaim = false;
    const h1 = loadYaml(
      readFileSync(join(repoRoot, 'differentials/hypotheses/H1.yaml'), 'utf8'),
    );
    const h1Claims = new Set([
      ...(h1.explains_claim_ids || []),
      ...(h1.does_not_explain_claim_ids || []),
    ]);
    // Approve all claims H1 references + the explicit canary claim so H1 can pass claim-ref filter
    for (const c of inv.claims) {
      if (c.id === CANARY_APPROVED_CLAIM || h1Claims.has(c.id)) {
        c.public_approved = true;
        if (c.id === CANARY_APPROVED_CLAIM) foundClaim = true;
      } else {
        c.public_approved = false;
      }
    }
    if (!foundClaim) throw new Error(`canary claim ${CANARY_APPROVED_CLAIM} not found`);

    // CQ-001 related claims must also be approved for the question to pass claim filter
    const cq001 = loadYaml(
      readFileSync(join(repoRoot, 'differentials/clinician_questions/CQ-001.yaml'), 'utf8'),
    );
    for (const c of inv.claims) {
      if ((cq001.related_claim_ids || []).includes(c.id)) {
        c.public_approved = true;
      }
    }

    const scope = {
      version: 'canary-test-e22',
      as_of: '2026-08-05',
      notes: 'Temporary expanded partial-approval canary — not a real approval',
      approved_hypothesis_ids: [CANARY_APPROVED_HYP],
      approved_null_model: false,
      approved_question_ids: [CANARY_APPROVED_QUESTION],
      approved_uq_ids: [], // no UQs — UQ-0001 must not appear
      approved_specialty_pathogens: [], // Babesia must not appear
      approved_literature_applicability_ids: [], // lit-0104 applicability withheld
      // All prerendered medical routes must be listed or the publication build fails closed.
      // Unapproved *content* canaries (hyps, questions, UQs, specialty, lit notes) still fail closed.
      approved_hardcoded_routes: [
        '/',
        '/case/',
        '/working-model/',
        '/working-model/evidence-table/',
        '/questions-for-clinicians/',
        '/questions-for-clinicians/packet/',
        '/questions-for-clinicians/prediction-matrix/',
        '/for-clinicians/',
        '/how-this-could-be-wrong/',
        '/methods/',
        '/changelog/',
        '/legal/',
        '/about/snapshot/',
        '/about/downloads/',
        '/literature/',
      ],
    };

    writeFileSync(invPath, dumpYaml(inv, { lineWidth: 120, noRefs: true }), 'utf8');
    writeFileSync(scopePath, dumpYaml(scope, { lineWidth: 100, noRefs: true }), 'utf8');

    const r = spawnSync('npm', ['run', 'build'], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'publication' },
      encoding: 'utf8',
      timeout: 300000,
    });

    if (r.status !== 0) {
      failed = true;
      report = {
        ok: false,
        reason: 'publication partial-approval build failed',
        status: r.status,
        stderr_tail: (r.stderr || '').slice(-2500),
        stdout_tail: (r.stdout || '').slice(-2500),
      };
    } else {
      const files = walk(liveDist).filter((f) => f.endsWith('.html'));
      const blobs = files.map((f) => ({
        file: relative(liveDist, f),
        text: readFileSync(f, 'utf8'),
      }));
      const allText = blobs.map((b) => b.text).join('\n');
      const leaks = [];
      const missingApproved = [];

      // --- Approved must be present ---
      if (!new RegExp(`\\b${CANARY_APPROVED_CLAIM}\\b`).test(allText)) {
        missingApproved.push(`approved claim ${CANARY_APPROVED_CLAIM}`);
      }
      const wm = blobs.find((b) => b.file.includes('working-model/index.html'));
      if (!wm || !new RegExp(`\\b${CANARY_APPROVED_HYP}\\b`).test(wm.text)) {
        missingApproved.push(`approved hyp ${CANARY_APPROVED_HYP} on working-model`);
      }
      const qq = blobs.find((b) => b.file.includes('questions-for-clinicians/index.html'));
      if (!qq || !new RegExp(`\\b${CANARY_APPROVED_QUESTION}\\b`).test(qq.text)) {
        missingApproved.push(`approved question ${CANARY_APPROVED_QUESTION}`);
      }
      const litIndex = blobs.find((b) => b.file === 'literature/index.html');
      if (!litIndex || !/lit-\d{4}/.test(litIndex.text)) {
        missingApproved.push('launch literature index should be nonempty (lit IDs)');
      }

      // --- Unapproved must be absent ---
      if (new RegExp(`\\b${CANARY_UNAPPROVED_CLAIM}\\b`).test(allText)) {
        leaks.push(`unapproved claim ${CANARY_UNAPPROVED_CLAIM}`);
      }
      const hypLeaks = blobs.filter(
        (b) =>
          (b.file.includes('working-model') || b.file.includes('for-clinicians')) &&
          new RegExp(`\\b${CANARY_UNAPPROVED_HYP}\\b`).test(b.text),
      );
      if (hypLeaks.length) {
        leaks.push(
          `unapproved hyp ${CANARY_UNAPPROVED_HYP} in ${hypLeaks.map((h) => h.file).join(',')}`,
        );
      }
      if (new RegExp(`\\b${CANARY_UNAPPROVED_QUESTION}\\b`).test(allText)) {
        leaks.push(`unapproved question ${CANARY_UNAPPROVED_QUESTION}`);
      }
      if (new RegExp(`\\b${CANARY_UNAPPROVED_UQ}\\b`).test(allText)) {
        leaks.push(`unapproved UQ ${CANARY_UNAPPROVED_UQ}`);
      }
      {
        // Specialty two-channel readout only (not generic "not independently confirmed" prose
        // or UQ text that happens to mention Babesia under an approved hypothesis).
        const chHits = blobs.filter(
          (b) =>
            b.text.includes(CANARY_UNAPPROVED_PATHOGEN) &&
            (b.text.includes('specialty LDT vs independent') ||
              b.text.includes(CANARY_HARDCODED_PHRASE) ||
              /class="two-channel"[\s\S]{0,400}Babesia|Babesia[\s\S]{0,400}class="two-channel"/i.test(
                b.text,
              )),
        );
        if (chHits.length) {
          leaks.push(
            `unapproved specialty channel ${CANARY_UNAPPROVED_PATHOGEN} on ${chHits.map((h) => h.file).join(',')}`,
          );
        }
      }

      // Literature applicability withheld on index + detail
      const litIndexHit = litIndex && litIndex.text.includes(CANARY_LIT_APPLICABILITY_NEEDLE);
      const litDetail = blobs.find((b) => b.file.includes(`literature/${CANARY_LIT_ID}/`));
      const litDetailHit =
        litDetail && litDetail.text.includes(CANARY_LIT_APPLICABILITY_NEEDLE);
      if (litIndexHit) {
        leaks.push(
          `unapproved lit applicability "${CANARY_LIT_APPLICABILITY_NEEDLE}" on literature index`,
        );
      }
      if (litDetailHit) {
        leaks.push(
          `unapproved lit applicability "${CANARY_LIT_APPLICABILITY_NEEDLE}" on ${CANARY_LIT_ID} detail`,
        );
      }

      // Hardcoded specialty-channel medical prose must not appear without pathogen scope
      if (allText.includes(CANARY_HARDCODED_PHRASE)) {
        leaks.push(
          `unapproved hardcoded specialty prose "${CANARY_HARDCODED_PHRASE}" present in artifact`,
        );
      }

      report = {
        ok: leaks.length === 0 && missingApproved.length === 0,
        approved: {
          claim: CANARY_APPROVED_CLAIM,
          hypothesis: CANARY_APPROVED_HYP,
          question: CANARY_APPROVED_QUESTION,
        },
        unapproved_canaries: {
          claim: CANARY_UNAPPROVED_CLAIM,
          hypothesis: CANARY_UNAPPROVED_HYP,
          question: CANARY_UNAPPROVED_QUESTION,
          uq: CANARY_UNAPPROVED_UQ,
          specialty: CANARY_UNAPPROVED_PATHOGEN,
          lit_applicability: CANARY_LIT_APPLICABILITY_NEEDLE,
          hardcoded_specialty_prose: CANARY_HARDCODED_PHRASE,
        },
        missing_approved: missingApproved,
        leaks,
        html_files_scanned: files.length,
        literature_index_nonempty: Boolean(litIndex && /lit-\d{4}/.test(litIndex.text)),
      };
      if (leaks.length || missingApproved.length) failed = true;
    }
  } catch (e) {
    failed = true;
    report = { ok: false, reason: String(e), stack: e?.stack };
  } finally {
    restore();
  }

  const outPath = join(
    repoRoot,
    'audits/2026-08-publication-readiness/partial-approval-canary-report.json',
  );
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failed) {
    console.error('PARTIAL_APPROVAL_CANARY: FAIL');
    process.exit(1);
  }
  console.log('PARTIAL_APPROVAL_CANARY: PASS');
}

main();
