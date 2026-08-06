/**
 * ESM resolve hook: allow extensionless and .js → .ts resolution for site/src
 * under node --experimental-strip-types (Astro uses extensionless imports).
 */
import { existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  const tryResolve = async (spec) => nextResolve(spec, context);

  try {
    return await tryResolve(specifier);
  } catch (err) {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) throw err;
    const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const baseDir = dirname(parent);

    const candidates = [];
    if (specifier.endsWith('.js')) {
      candidates.push(specifier.replace(/\.js$/, '.ts'));
    } else if (!extname(specifier)) {
      candidates.push(`${specifier}.ts`, `${specifier}.mjs`, `${specifier}.js`);
    }

    for (const cand of candidates) {
      const abs = cand.startsWith('/')
        ? cand
        : join(baseDir, cand);
      if (existsSync(abs) || existsSync(fileURLToPath(new URL(cand, context.parentURL || pathToFileURL(process.cwd() + '/'))))) {
        try {
          return await tryResolve(cand);
        } catch {
          /* continue */
        }
      }
      try {
        return await tryResolve(cand);
      } catch {
        /* continue */
      }
    }
    throw err;
  }
}
