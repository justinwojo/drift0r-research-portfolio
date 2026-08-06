/**
 * Regression: a fresh sanitized export must build and test independently.
 * Skips when already inside a sanitized tree (sentinel present) or when the
 * monorepo exporter is absent — so nested `npm test` inside the export does not recurse.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const repoRoot = join(siteRoot, '..');
const SENTINEL = '.drift0r_sanitized_export_sentinel';
const EXPORTER = join(repoRoot, 'scripts/export_sanitized_public_repo.py');

const PRIVATE_ONLY = [
  'audits/2026-08-publication-readiness/01_claim_inventory.yaml',
  'evidence/sources/',
  'data/papers_local/',
  'community/raw/',
  'private/',
  'PublishApproval.jpg',
];

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walkFiles(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
  return r;
}

describe(
  'sanitized export independent build (Checkpoint F.1)',
  { timeout: 900_000 },
  () => {
    it('exports, npm ci, check, publication build, and test inside export', () => {
      if (process.env.DRIFT0R_SKIP_EXPORT_BUILD_TEST === '1') {
        return;
      }
      if (existsSync(join(repoRoot, SENTINEL))) {
        // Nested run inside sanitized tree — pass without re-exporting.
        return;
      }
      if (!existsSync(EXPORTER)) {
        // Public tree without monorepo exporter — not applicable.
        return;
      }

      // Exporter requires monorepo PyYAML (scripts/requirements.txt).
      assert.ok(
        existsSync(join(repoRoot, 'scripts/requirements.txt')),
        'missing scripts/requirements.txt for private monorepo Python deps',
      );
      const pyCheck = run(
        'python3',
        ['-c', 'import yaml; print(yaml.__version__)'],
        { cwd: repoRoot },
      );
      assert.equal(
        pyCheck.status,
        0,
        `PyYAML missing for export regression. Install: python3 -m pip install -r scripts/requirements.txt\n${pyCheck.stderr}`,
      );

      // Exporter refuses to clear a non-sentinel dir; use a fresh non-existent path.
      const parent = mkdtempSync(join(tmpdir(), 'drift0r-f1-parent-'));
      const out = join(parent, 'export');
      try {
        const exp = run('python3', [EXPORTER, '--out', out], {
          cwd: repoRoot,
        });
        assert.equal(
          exp.status,
          0,
          `export failed:\n${exp.stdout}\n${exp.stderr}`,
        );
        assert.ok(
          existsSync(join(out, 'CONTRIBUTING.md')),
          'CONTRIBUTING.md must export for public contribution path',
        );
        assert.ok(
          existsSync(join(out, '.github/ISSUE_TEMPLATE/literature_suggestion.yml')),
          'issue templates must export',
        );
        assert.ok(existsSync(join(out, SENTINEL)), 'missing export sentinel');
        assert.ok(
          existsSync(
            join(
              out,
              'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml',
            ),
          ),
          'public inventory missing from export',
        );
        assert.ok(
          !existsSync(
            join(
              out,
              'audits/2026-08-publication-readiness/01_claim_inventory.yaml',
            ),
          ),
          'private inventory must not be exported',
        );
        assert.ok(!existsSync(join(out, 'evidence/sources')), 'sources must not export');
        assert.ok(!existsSync(join(out, 'scripts/validate_all.py')), 'python scripts excluded');

        // Object-level scan: no PDFs, no PublishApproval, no private inventory path strings as files
        const files = walkFiles(out);
        for (const f of files) {
          const rel = f.slice(out.length + 1);
          assert.notEqual(f.endsWith('.pdf'), true, `PDF in export: ${rel}`);
          assert.ok(!rel.includes('PublishApproval'), `consent artifact: ${rel}`);
          assert.ok(
            !rel.endsWith('01_claim_inventory.yaml'),
            `private inventory path: ${rel}`,
          );
        }

        // Site source must not hardcode private inventory path for runtime
        const dataTs = readFileSync(join(out, 'site/src/lib/data.ts'), 'utf8');
        assert.match(dataTs, /01_claim_inventory_public\.yaml/);
        assert.doesNotMatch(
          dataTs,
          /loadRepoYaml[^;]*01_claim_inventory\.yaml/,
        );

        const site = join(out, 'site');
        const npmCi = run('npm', ['ci'], { cwd: site, timeout: 300_000 });
        assert.equal(npmCi.status, 0, `npm ci failed:\n${npmCi.stdout}\n${npmCi.stderr}`);

        const check = run('npm', ['run', 'check'], { cwd: site, timeout: 180_000 });
        assert.equal(check.status, 0, `check failed:\n${check.stdout}\n${check.stderr}`);

        const build = run('npm', ['run', 'build'], {
          cwd: site,
          timeout: 300_000,
          env: {
            ...process.env,
            DRIFT0R_SITE_MODE: 'publication',
            DRIFT0R_SKIP_EXPORT_BUILD_TEST: '1',
          },
        });
        assert.equal(
          build.status,
          0,
          `publication build failed:\n${build.stdout}\n${build.stderr}`,
        );

        // Fail if build artifact references missing private-only paths as required inputs
        const dist = join(site, 'dist');
        assert.ok(existsSync(join(dist, 'index.html')), 'dist/index.html missing');
        const home = readFileSync(join(dist, 'index.html'), 'utf8');
        assert.match(home, /patient approval:\s*obtained/i);
        assert.match(home, /clinician review:\s*not performed/i);
        assert.doesNotMatch(home, /Patient permission is pending/i);
        assert.doesNotMatch(home, /public_approved values remain false/i);
        assert.doesNotMatch(home, /Private internal review/i);

        const test = run('npm', ['test'], {
          cwd: site,
          timeout: 300_000,
          env: {
            ...process.env,
            DRIFT0R_SKIP_EXPORT_BUILD_TEST: '1',
          },
        });
        assert.equal(test.status, 0, `npm test failed:\n${test.stdout}\n${test.stderr}`);

        // Record private-only markers for reportability
        for (const p of PRIVATE_ONLY) {
          assert.ok(
            !existsSync(join(out, p.replace(/\/$/, ''))),
            `private-only path present: ${p}`,
          );
        }
      } finally {
        try {
          rmSync(parent, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    });
  },
);
