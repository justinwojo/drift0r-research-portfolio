/**
 * End-to-end false-polarity indexing build scan (Checkpoint I.1.1 P1).
 *
 * Builds publication mode against an *isolated* release fixture with
 * noindex: false (via DRIFT0R_RELEASE_YAML). Never rewrites the tracked
 * site/src/data/release.yaml — safe under concurrent npm test.
 *
 * Asserts:
 *   - robots meta is index, follow
 *   - provenance says indexing enabled
 *   - no hard-coded "indexing: disabled" / "noindex research preview" body copy
 * Scratch outDir + temp release removed in finally. Never clobbers site/dist.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
  rmSync,
  mkdtempSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { STUCK_NOINDEX_BODY_PATTERNS } from '../src/lib/indexing.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const liveReleasePath = join(siteRoot, 'src/data/release.yaml');
const scratch = join(siteRoot, '.test-scratch-noindex-false-dist');

function walkHtml(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

/** Strip head so body/prose scan does not false-positive on meta robots when true. */
function bodyOnly(html) {
  const m = html.match(/<body[\s\S]*$/i);
  return m ? m[0] : html;
}

describe('indexing false-polarity publication build scan', () => {
  it('noindex:false fixture → index,follow meta; body has no stuck disabled/noindex copy', () => {
    const live = readFileSync(liveReleasePath, 'utf8');
    assert.match(live, /^noindex:\s*false\s*$/m, 'published live release must enable indexing');

    // Isolated fixture only — never write the tracked release.yaml.
    const fixtureDir = mkdtempSync(join(tmpdir(), 'drift0r-noindex-false-'));
    const fixtureRelease = join(fixtureDir, 'release-noindex-false.yaml');
    const fixture = `${live}\n# Isolated noindex:false publication-test fixture.\n`;
    assert.match(fixture, /^noindex:\s*false\s*$/m);
    assert.notEqual(fixture, live);
    writeFileSync(fixtureRelease, fixture, 'utf8');

    // Pre-flight: live file unchanged after writing fixture.
    assert.equal(readFileSync(liveReleasePath, 'utf8'), live);

    try {
      rmSync(scratch, { recursive: true, force: true });

      const r = spawnSync('npx', ['astro', 'build', '--outDir', scratch], {
        cwd: siteRoot,
        env: {
          ...process.env,
          DRIFT0R_SITE_MODE: 'publication',
          DRIFT0R_SITE_URL: 'https://drift0rresearch.org/',
          DRIFT0R_PUBLIC_REPO_URL: 'https://github.com/example-org/drift0r-public',
          DRIFT0R_RELEASE_YAML: fixtureRelease,
        },
        encoding: 'utf8',
        timeout: 300000,
      });
      assert.equal(
        r.status,
        0,
        `noindex:false publication build failed:\n${r.stderr || ''}\n${r.stdout || ''}`,
      );

      // Live release must still be untouched after the build.
      assert.equal(
        readFileSync(liveReleasePath, 'utf8'),
        live,
        'tracked release.yaml must not be mutated by polarity test',
      );
      assert.match(readFileSync(liveReleasePath, 'utf8'), /^noindex:\s*false\s*$/m);

      const home = readFileSync(join(scratch, 'index.html'), 'utf8');
      assert.match(
        home,
        /name="robots"\s+content="index,\s*follow"/i,
        'home robots meta must be index, follow when noindex false',
      );
      assert.doesNotMatch(
        home,
        /name="robots"\s+content="noindex/i,
        'home robots meta must not remain noindex',
      );
      assert.match(home, /indexing:\s*enabled/i, 'provenance must report indexing enabled');
      assert.doesNotMatch(
        home,
        /indexing:\s*disabled/i,
        'home must not claim indexing disabled when enabled',
      );

      const stuckHits = [];
      for (const file of walkHtml(scratch)) {
        const html = readFileSync(file, 'utf8');
        const body = bodyOnly(html);
        if (/name="robots"/i.test(html)) {
          if (!/name="robots"\s+content="index,\s*follow"/i.test(html)) {
            stuckHits.push({
              file,
              kind: 'robots_meta',
              sample: html.match(/name="robots"[^>]*>/i)?.[0],
            });
          }
        }
        for (const re of STUCK_NOINDEX_BODY_PATTERNS) {
          if (re.test(body)) {
            const m = body.match(re);
            stuckHits.push({
              file: file.replace(scratch + '/', ''),
              kind: String(re),
              sample: m ? m[0] : '',
            });
          }
        }
      }

      assert.equal(
        stuckHits.length,
        0,
        `stuck noindex/disabled body copy when noindex:false:\n${JSON.stringify(stuckHits, null, 2)}`,
      );

      for (const rel of ['for-clinicians/index.html', 'about/snapshot/index.html']) {
        const html = readFileSync(join(scratch, rel), 'utf8');
        assert.match(html, /indexing:\s*enabled/i, rel);
        assert.doesNotMatch(html, /indexing:\s*disabled/i, rel);
      }
    } finally {
      // Always restore isolation artifacts; never leave live release dirty (we never wrote it).
      rmSync(scratch, { recursive: true, force: true });
      rmSync(fixtureDir, { recursive: true, force: true });
    }

    assert.match(readFileSync(liveReleasePath, 'utf8'), /^noindex:\s*false\s*$/m);
  });
});
