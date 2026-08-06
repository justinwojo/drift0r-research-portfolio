/**
 * Checkpoint G.2 — artifact integrity + URL gate negative tests.
 * Uses scratch dist trees so site/dist is never mutated.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const scratchRoot = join(siteRoot, '.test-scratch-artifact-integrity');

/**
 * Spawn a site script with an isolated DRIFT0R_* env.
 *
 * Checkpoint J-B1: pages.yml post-build `npm test` exports DRIFT0R_PUBLIC_REPO_URL /
 * DRIFT0R_SITE_URL. Spreading process.env into the child previously poisoned tests that
 * intentionally omit those vars (e.g. base-path mismatch), causing a different rejection
 * message and a false fail under CI. Strip ambient DRIFT0R_* by default; callers pass
 * only the values they need. PATH/HOME/etc. still inherit from the host.
 */
function runNode(script, args, env = {}) {
  const cleaned = { ...process.env };
  for (const key of Object.keys(cleaned)) {
    if (key.startsWith('DRIFT0R_')) delete cleaned[key];
  }
  return spawnSync('node', [script, ...args], {
    cwd: siteRoot,
    env: { ...cleaned, ...env },
    encoding: 'utf8',
  });
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function writeMiniDist(dir, { html = '', withNojekyll = true, base = '/drift0r' } = {}) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, 'about', 'contribute'), { recursive: true });
  const prefix = base === '/' ? '/' : `${base}/`;
  const defaultBody = `site mode: publication <a href="${prefix}case/">case</a>`;
  writeFileSync(join(dir, 'index.html'), html || `<html><body>${defaultBody}</body></html>`);
  writeFileSync(
    join(dir, 'about', 'contribute', 'index.html'),
    html ||
      `<html><body><p>Public remote not configured — there is no actionable issue link yet.</p>
       <a href="${prefix}methods/">methods</a></body></html>`,
  );
  if (withNojekyll) writeFileSync(join(dir, '.nojekyll'), '');
}

function writeManifestForDir(dir, mode, extraHeaderLines = []) {
  const files = [];
  function walk(d, prefix = '') {
    for (const name of readdirSync(d)) {
      const abs = join(d, name);
      const st = statSync(abs);
      if (st.isDirectory()) walk(abs, prefix ? `${prefix}/${name}` : name);
      else if (name !== '.artifact_manifest.txt') {
        files.push(prefix ? `${prefix}/${name}` : name);
      }
    }
  }
  walk(dir);
  files.sort();
  const digests = files.map((rel) => {
    const hex = sha256(readFileSync(join(dir, rel)));
    return { rel, hex };
  });
  const paths = [...files, '.artifact_manifest.txt'].sort();
  const hasBase = extraHeaderLines.some((l) => /base_path=/.test(l));
  const header = [
    `# site_mode=${mode}`,
    `# DRIFT0R_SITE_MODE=${mode}`,
    ...(hasBase ? [] : ['# base_path=/drift0r']),
    ...extraHeaderLines,
    `# digests:`,
    ...digests.map((d) => `# ${d.rel} sha256=${d.hex}`),
    ...digests.map((d) => `# sha256 ${d.hex} ${d.rel}`),
    `# --- paths ---`,
  ];
  writeFileSync(join(dir, '.artifact_manifest.txt'), header.join('\n') + '\n' + paths.join('\n') + '\n');
}

describe('artifact integrity gate (G.2)', () => {
  before(() => {
    mkdirSync(scratchRoot, { recursive: true });
  });
  after(() => {
    // keep for debug on failure; clean common
  });

  it('rejects unmanifested extra file', () => {
    const dir = join(scratchRoot, 'extra-file');
    writeMiniDist(dir);
    writeManifestForDir(dir, 'publication');
    writeFileSync(join(dir, 'evil-extra.txt'), 'boom');
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /missing from artifact manifest|extra|evil-extra/i);
  });

  it('rejects symlink in dist', () => {
    const dir = join(scratchRoot, 'symlink');
    writeMiniDist(dir);
    writeManifestForDir(dir, 'publication');
    try {
      symlinkSync(join(dir, 'index.html'), join(dir, 'link.html'));
    } catch (e) {
      // windows may fail; skip
      if (e.code === 'EPERM') return;
      throw e;
    }
    // rewrite manifest without the symlink first — gate must still reject symlink on disk
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /symlink/i);
  });

  it('rejects missing file listed in manifest', () => {
    const dir = join(scratchRoot, 'missing-file');
    writeMiniDist(dir);
    writeManifestForDir(dir, 'publication');
    rmSync(join(dir, 'index.html'));
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /missing file|lists missing/i);
  });

  it('rejects digest mismatch', () => {
    const dir = join(scratchRoot, 'digest-mismatch');
    writeMiniDist(dir);
    writeManifestForDir(dir, 'publication');
    writeFileSync(join(dir, 'index.html'), '<html>tampered site mode: publication</html>');
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /digest mismatch/i);
  });

  it('rejects missing .nojekyll', () => {
    const dir = join(scratchRoot, 'no-nojekyll');
    writeMiniDist(dir, { withNojekyll: false });
    writeManifestForDir(dir, 'publication');
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /\.nojekyll/i);
  });

  it('rejects traversal/absolute manifest path', () => {
    const dir = join(scratchRoot, 'traversal');
    writeMiniDist(dir);
    writeManifestForDir(dir, 'publication');
    const man = readFileSync(join(dir, '.artifact_manifest.txt'), 'utf8');
    writeFileSync(
      join(dir, '.artifact_manifest.txt'),
      man + '../etc/passwd\n',
      'utf8',
    );
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /traversal|absolute|REJECTED/i);
  });

  it('write-manifest rejects symlink via lstat', () => {
    const dir = join(scratchRoot, 'wm-symlink');
    writeMiniDist(dir);
    try {
      symlinkSync(join(dir, 'index.html'), join(dir, 'sneaky.html'));
    } catch (e) {
      if (e.code === 'EPERM') return;
      throw e;
    }
    const r = runNode('scripts/write-manifest.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /symlink/i);
  });
});

describe('URL gate certifies rendered contribution page (G.2)', () => {
  it('launch gate rejects env override when HTML has no actionable issue link', () => {
    const dir = join(scratchRoot, 'url-env-vs-empty-html');
    writeMiniDist(dir, {
      html: '<html><body>site mode: publication — there is no actionable issue link yet. PUBLIC_REPO_URL in site constants is empty.</body></html>',
    });
    // craft contribute page with empty messaging
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>
        <p>site mode: publication</p>
        <div>A public repository URL has not been set — there is no actionable issue link yet.</div>
      </body></html>`,
    );
    writeFileSync(join(dir, 'index.html'), '<html><body>site mode: publication</body></html>');
    writeManifestForDir(dir, 'publication', [
      '# public_repo_url=',
      '# site_url=https://example.invalid/drift0r',
    ]);
    // Fix site_url placeholder in manifest so we hit the URL/HTML check path...
    // Actually placeholder site_url also fails — use valid site in manifest for this test's focus
    writeManifestForDir(dir, 'publication', [
      '# public_repo_url=',
      '# site_url=https://owner.github.io/drift0r',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_REQUIRE_PUBLIC_REPO_URL: '1',
        DRIFT0R_PUBLIC_REPO_URL: 'https://github.com/fake-owner/fake-drift0r',
        DRIFT0R_SITE_URL: 'https://owner.github.io/drift0r',
      },
    );
    assert.notEqual(r.status, 0, 'fake env URL must not certify empty HTML');
    assert.match(
      `${r.stdout}\n${r.stderr}`,
      /actionable|rendered|contribution|cannot certify|empty/i,
    );
  });

  it('launch gate rejects env URL that differs from rendered issue link', () => {
    const dir = join(scratchRoot, 'url-env-mismatch');
    const baked = 'https://github.com/real-owner/real-repo';
    writeMiniDist(dir, { base: '/real-repo' });
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>
        <p>site mode: publication</p>
        <a href="/real-repo/case/">case</a>
        <a href="${baked}/issues/new/choose">New issue (choose a template)</a>
      </body></html>`,
    );
    writeFileSync(
      join(dir, 'index.html'),
      '<html><body>site mode: publication <a href="/real-repo/">home</a></body></html>',
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${baked}`,
      '# site_url=https://real-owner.github.io/real-repo',
      '# base_path=/real-repo',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_REQUIRE_PUBLIC_REPO_URL: '1',
        DRIFT0R_PUBLIC_REPO_URL: 'https://github.com/other-owner/other-repo',
        DRIFT0R_SITE_URL: 'https://real-owner.github.io/real-repo',
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /does not match|rendered/i);
  });

  it('launch gate rejects placeholder and non-https repo URLs', () => {
    for (const bad of [
      'https://example.invalid/drift0r',
      'http://github.com/owner/repo',
      'not-a-url',
      'https://github.com/only-owner',
    ]) {
      const dir = join(scratchRoot, 'url-bad-' + sha256(bad).slice(0, 8));
      writeMiniDist(dir);
      writeFileSync(
        join(dir, 'about', 'contribute', 'index.html'),
        `<html><body><a href="${bad.replace(/\/$/, '')}/issues/new/choose">x</a> site mode: publication</body></html>`,
      );
      writeFileSync(join(dir, 'index.html'), '<html>site mode: publication</html>');
      writeManifestForDir(dir, 'publication', [
        `# public_repo_url=${bad}`,
        '# site_url=https://owner.github.io/repo',
      ]);
      const r = runNode(
        'scripts/require-publication-mode.mjs',
        ['--require-public-repo'],
        {
          DRIFT0R_SITE_MODE: 'publication',
          DRIFT0R_DIST_DIR: dir,
          DRIFT0R_PUBLIC_REPO_URL: bad,
          DRIFT0R_SITE_URL: 'https://owner.github.io/repo',
        },
      );
      assert.notEqual(r.status, 0, `must reject ${bad}`);
    }
  });

  it('rejects example.invalid site URL / HTML', () => {
    const dir = join(scratchRoot, 'site-placeholder');
    writeMiniDist(dir);
    writeFileSync(
      join(dir, 'index.html'),
      '<html><link rel="canonical" href="https://example.invalid/drift0r/"><body>site mode: publication</body></html>',
    );
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      '<html><body>site mode: publication — no actionable issue link yet</body></html>',
    );
    writeManifestForDir(dir, 'publication', [
      '# public_repo_url=',
      '# site_url=https://example.invalid/drift0r',
    ]);
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
      DRIFT0R_SITE_URL: 'https://example.invalid/drift0r',
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /example\.invalid|placeholder|site URL/i);
  });

  function writeLaunchReadyPages(dir, { repo, base = '/drift0r' }) {
    const issues = `${repo}/issues/new/choose`;
    const cta = `
      <aside data-contribution-cta="configured" data-contribution-repo="${repo}" aria-label="Contribute via GitHub">
        <p>Found incorrect data, a citation problem, contradictory evidence, new research, or another possible interpretation? Please raise a GitHub issue.</p>
        <a href="${repo}" data-contribution-link="repo">View project on GitHub</a>
        <a href="${issues}" data-contribution-link="issues-new-choose">Report an issue or contribute research</a>
        <a href="${repo}/issues" data-contribution-link="issues-list">Browse existing issues</a>
        <p>A GitHub account is currently required to submit an issue. Do not post private medical records, personal identifiers, treatment instructions, or unsupported diagnoses.</p>
      </aside>`;
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication
        <a href="${base}/">home</a><link href="${base}/_astro/x.css" rel="stylesheet">
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>
        <p>site mode: publication</p>
        <a href="${base}/case/">case</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
  }

  it('accepts launch when HTML, manifest, env, site URL agree', () => {
    const dir = join(scratchRoot, 'url-ok');
    const repo = 'https://github.com/acme/drift0r';
    const site = 'https://acme.github.io/drift0r';
    writeMiniDist(dir, { base: '/drift0r' });
    writeLaunchReadyPages(dir, { repo });
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/drift0r',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
        DRIFT0R_BASE_PATH: '/drift0r',
      },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.match(`${r.stdout}`, /publication mode confirmed|issues link certified|base_path/i);
  });

  it('launch gate rejects when homepage lacks issue-template CTA', () => {
    const dir = join(scratchRoot, 'cta-missing-home');
    const repo = 'https://github.com/acme/drift0r';
    const site = 'https://acme.github.io/drift0r';
    writeMiniDist(dir, { base: '/drift0r' });
    writeLaunchReadyPages(dir, { repo });
    // Break homepage CTA only
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication <a href="/drift0r/">home</a>
        <footer class="site-footer" data-site-footer>
          <a href="${repo}/issues/new/choose">Report an issue or contribute research</a>
          <span data-contribution-cta="configured"></span>
        </footer>
      </body></html>`,
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/drift0r',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
    );
    // Footer has link but homepage body may still pass if footer is on homepage...
    // Our broken home still has footer with link — strengthen: remove issues link entirely from home
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication <a href="/drift0r/">home</a>
        <footer class="site-footer" data-site-footer>no github links here</footer>
      </body></html>`,
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/drift0r',
    ]);
    const r2 = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
    );
    assert.notEqual(r2.status, 0);
    assert.match(`${r2.stdout}\n${r2.stderr}`, /homepage|contribution CTA|issue-template|footer/i);
  });
});

describe('Pages base-path consistency (G.2.1)', () => {
  it('repo other-name with rendered /drift0r/ → REJECT', () => {
    const dir = join(scratchRoot, 'base-other-name-wrong-html');
    const repo = 'https://github.com/testowner/other-name';
    const site = 'https://testowner.github.io/other-name';
    writeMiniDist(dir, { base: '/drift0r' }); // wrong rendered base
    const issues = `${repo}/issues/new/choose`;
    const cta = `<aside data-contribution-cta="configured"><a href="${issues}">Report an issue or contribute research</a></aside>`;
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>site mode: publication
        <a href="/drift0r/case/">case</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication <a href="/drift0r/">home</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/other-name',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /base-path|\/drift0r\/|expected base/i);
  });

  it('repo drift0r, site /drift0r, rendered /drift0r/ → PASS', () => {
    const dir = join(scratchRoot, 'base-drift0r-ok');
    const repo = 'https://github.com/testowner/drift0r';
    const site = 'https://testowner.github.io/drift0r';
    writeMiniDist(dir, { base: '/drift0r' });
    const issues = `${repo}/issues/new/choose`;
    const cta = `<aside data-contribution-cta="configured"><a href="${issues}">Report an issue or contribute research</a></aside>`;
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>site mode: publication
        <a href="/drift0r/methods/">methods</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication <a href="/drift0r/case/">case</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/drift0r',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
        DRIFT0R_BASE_PATH: '/drift0r',
      },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  });

  it('repo/site path mismatch → REJECT', () => {
    const dir = join(scratchRoot, 'base-repo-site-mismatch');
    const repo = 'https://github.com/testowner/drift0r';
    const site = 'https://testowner.github.io/other-name';
    writeMiniDist(dir, { base: '/other-name' });
    const issues = `${repo}/issues/new/choose`;
    const cta = `<aside data-contribution-cta="configured"><a href="${issues}">Report an issue or contribute research</a></aside>`;
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      `<html><body>site mode: publication
        <a href="/other-name/">home</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeFileSync(
      join(dir, 'index.html'),
      `<html><body>site mode: publication <a href="/other-name/case/">case</a>
        ${cta}
        <footer class="site-footer" data-site-footer>${cta}</footer>
      </body></html>`,
    );
    writeManifestForDir(dir, 'publication', [
      `# public_repo_url=${repo}`,
      `# site_url=${site}`,
      '# base_path=/other-name',
    ]);
    const r = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
    );
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /mismatch|base-path|repository name/i);
  });

  it('manifest base vs rendered base mismatch → REJECT', () => {
    const dir = join(scratchRoot, 'base-manifest-html-mismatch');
    writeMiniDist(dir, { base: '/drift0r' });
    writeFileSync(
      join(dir, 'index.html'),
      '<html><body>site mode: publication <a href="/drift0r/case/">case</a></body></html>',
    );
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      '<html><body>site mode: publication <a href="/drift0r/">x</a> no actionable issue link yet</body></html>',
    );
    writeManifestForDir(dir, 'publication', [
      '# public_repo_url=',
      '# site_url=',
      '# base_path=/other-name',
    ]);
    // Explicit empty URL vars (defense in depth; runNode also strips ambient DRIFT0R_*).
    const r = runNode('scripts/require-publication-mode.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: dir,
      DRIFT0R_PUBLIC_REPO_URL: '',
      DRIFT0R_SITE_URL: '',
    });
    assert.notEqual(r.status, 0);
    assert.match(`${r.stdout}\n${r.stderr}`, /base-path|expected base|\/drift0r\//i);
  });

  it('J-B1 regression: ambient Pages CI DRIFT0R_PUBLIC_REPO_URL must not poison base-path mismatch rejection', () => {
    // Reproduces .github/workflows/pages.yml post-build test env:
    // DRIFT0R_SITE_MODE + DRIFT0R_PUBLIC_REPO_URL + DRIFT0R_SITE_URL exported for npm test.
    const dir = join(scratchRoot, 'base-manifest-html-mismatch-ci-env');
    writeMiniDist(dir, { base: '/drift0r' });
    writeFileSync(
      join(dir, 'index.html'),
      '<html><body>site mode: publication <a href="/drift0r/case/">case</a></body></html>',
    );
    writeFileSync(
      join(dir, 'about', 'contribute', 'index.html'),
      '<html><body>site mode: publication <a href="/drift0r/">x</a> no actionable issue link yet</body></html>',
    );
    writeManifestForDir(dir, 'publication', [
      '# public_repo_url=',
      '# site_url=',
      '# base_path=/other-name',
    ]);
    const prevPublic = process.env.DRIFT0R_PUBLIC_REPO_URL;
    const prevSite = process.env.DRIFT0R_SITE_URL;
    const prevMode = process.env.DRIFT0R_SITE_MODE;
    const prevSkip = process.env.DRIFT0R_SKIP_EXPORT_BUILD_TEST;
    try {
      process.env.DRIFT0R_SITE_MODE = 'publication';
      process.env.DRIFT0R_PUBLIC_REPO_URL = 'https://github.com/example-owner/example-repo';
      process.env.DRIFT0R_SITE_URL = 'https://example-owner.github.io/example-repo';
      process.env.DRIFT0R_SKIP_EXPORT_BUILD_TEST = '1';
      // Call with only the vars this assertion needs — ambient Pages vars must not leak in.
      const r = runNode('scripts/require-publication-mode.mjs', [], {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: dir,
        DRIFT0R_PUBLIC_REPO_URL: '',
        DRIFT0R_SITE_URL: '',
      });
      assert.notEqual(r.status, 0, `expected reject; got stdout=${r.stdout} stderr=${r.stderr}`);
      const out = `${r.stdout}\n${r.stderr}`;
      // Must reject on base-path mismatch, not on contribution-link short-circuit from ambient URL.
      assert.match(out, /base-path|expected base|\/drift0r\//i);
      assert.doesNotMatch(out, /contribution link|issues\/new|public_repo_url is required/i);
    } finally {
      if (prevPublic === undefined) delete process.env.DRIFT0R_PUBLIC_REPO_URL;
      else process.env.DRIFT0R_PUBLIC_REPO_URL = prevPublic;
      if (prevSite === undefined) delete process.env.DRIFT0R_SITE_URL;
      else process.env.DRIFT0R_SITE_URL = prevSite;
      if (prevMode === undefined) delete process.env.DRIFT0R_SITE_MODE;
      else process.env.DRIFT0R_SITE_MODE = prevMode;
      if (prevSkip === undefined) delete process.env.DRIFT0R_SKIP_EXPORT_BUILD_TEST;
      else process.env.DRIFT0R_SKIP_EXPORT_BUILD_TEST = prevSkip;
    }
  });

  it('astro build with other-name site URL bakes /other-name/ and launch gate passes', () => {
    const scratch = join(siteRoot, '.test-scratch-base-other-name');
    const repo = 'https://github.com/testowner/other-name';
    const site = 'https://testowner.github.io/other-name';
    // Strip ambient DRIFT0R_* (e.g. DRIFT0R_BASE_PATH=/) so local QA env does not
    // contradict the intentional /other-name site URL pathname base.
    const cleanedEnv = { ...process.env };
    for (const key of Object.keys(cleanedEnv)) {
      if (key.startsWith('DRIFT0R_')) delete cleanedEnv[key];
    }
    const r = spawnSync('npx', ['astro', 'build', '--outDir', scratch], {
      cwd: siteRoot,
      env: {
        ...cleanedEnv,
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
      encoding: 'utf8',
      timeout: 180000,
    });
    assert.equal(r.status, 0, `astro build failed: ${r.stderr || r.stdout}`);
    const man = runNode('scripts/write-manifest.mjs', [], {
      DRIFT0R_SITE_MODE: 'publication',
      DRIFT0R_DIST_DIR: scratch,
      DRIFT0R_PUBLIC_REPO_URL: repo,
      DRIFT0R_SITE_URL: site,
    });
    assert.equal(man.status, 0, man.stderr || man.stdout);
    const indexHtml = readFileSync(join(scratch, 'index.html'), 'utf8');
    assert.match(indexHtml, /href="\/other-name\//);
    assert.doesNotMatch(indexHtml, /href="\/drift0r\//);
    const manText = readFileSync(join(scratch, '.artifact_manifest.txt'), 'utf8');
    assert.match(manText, /# base_path=\/other-name/);
    const gate = runNode(
      'scripts/require-publication-mode.mjs',
      ['--require-public-repo'],
      {
        DRIFT0R_SITE_MODE: 'publication',
        DRIFT0R_DIST_DIR: scratch,
        DRIFT0R_PUBLIC_REPO_URL: repo,
        DRIFT0R_SITE_URL: site,
      },
    );
    assert.equal(gate.status, 0, `${gate.stdout}\n${gate.stderr}`);
  });
});

describe('certified dist preservation (G.2 P2)', () => {
  it('test sources never spawn npm run build without scratch outDir', () => {
    const testsDir = join(siteRoot, 'tests');
    for (const name of readdirSync(testsDir)) {
      if (!name.endsWith('.test.mjs')) continue;
      const src = readFileSync(join(testsDir, name), 'utf8');
      // Flag: npm run build without --outDir or DRIFT0R_DIST_DIR nearby
      if (/npm['"\s,]+run['"\s,]+build/.test(src) || /['"]build['"]\s*,\s*\{/.test(src)) {
        // Allow only if clearly using outDir override in the same block is hard;
        // require explicit comment + scratch or absence of bare npm run build
        assert.doesNotMatch(
          src,
          /spawnSync\(\s*['"]npm['"]\s*,\s*\[[^\]]*['"]run['"]\s*,\s*['"]build['"]/,
          `${name} must not call npm run build against real dist`,
        );
      }
    }
  });

  it('scratch fail/preview builds leave an existing certified digest set unchanged', () => {
    const dist = join(siteRoot, 'dist');
    const manPath = join(dist, '.artifact_manifest.txt');
    if (!existsSync(manPath)) {
      // No certified dist in this workspace — structural skip
      return;
    }
    const before = readFileSync(manPath, 'utf8');
    if (!/# site_mode=publication/.test(before) && !/# DRIFT0R_SITE_MODE=publication/.test(before)) {
      return;
    }
    const digestLines = before
      .split('\n')
      .filter((l) => l.startsWith('# sha256 '))
      .sort();
    assert.ok(digestLines.length > 0);

    // Run the previously dangerous patterns (scratch only)
    const scratch1 = join(siteRoot, '.test-scratch-preserve-unknown');
    spawnSync('npx', ['astro', 'build', '--outDir', scratch1], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'publciation' },
      encoding: 'utf8',
      timeout: 180000,
    });
    const scratch2 = join(siteRoot, '.test-scratch-preserve-preview');
    spawnSync('npx', ['astro', 'build', '--outDir', scratch2], {
      cwd: siteRoot,
      env: { ...process.env, DRIFT0R_SITE_MODE: 'preview' },
      encoding: 'utf8',
      timeout: 180000,
    });

    const after = readFileSync(manPath, 'utf8');
    const afterDigests = after
      .split('\n')
      .filter((l) => l.startsWith('# sha256 '))
      .sort();
    assert.deepEqual(afterDigests, digestLines, 'certified digests must not change during test builds');
    assert.equal(after, before, 'certified artifact manifest must be byte-identical');
  });
});
