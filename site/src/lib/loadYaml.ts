import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import { REPO_ROOT, SITE_ROOT } from './paths';

export function loadYamlFile<T = unknown>(absPath: string): T {
  const text = readFileSync(absPath, 'utf8');
  return loadYaml(text) as T;
}

export function loadRepoYaml<T = unknown>(relFromRepo: string): T {
  return loadYamlFile<T>(join(REPO_ROOT, relFromRepo));
}

export function loadSiteYaml<T = unknown>(relFromSite: string): T {
  return loadYamlFile<T>(join(SITE_ROOT, relFromSite));
}

export function loadYamlDir<T extends { id?: string }>(absDir: string, prefix: string): T[] {
  const files = readdirSync(absDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.yaml'))
    .sort();
  return files.map((f) => loadYamlFile<T>(join(absDir, f)));
}
