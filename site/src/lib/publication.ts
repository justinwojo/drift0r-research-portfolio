/**
 * Site publication modes + explicit release-scope surface approval.
 *
 * preview (default): may show unapproved claims with unmistakable non-approved badges.
 * publication: only public_approved===true claims AND explicitly release-scoped
 *              derived surfaces (hypotheses, H-NULL, questions, UQs, specialty channels,
 *              literature applicability, hardcoded medical routes).
 *
 * Claim approval never auto-approves derived surfaces.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';

/** Locate monorepo root without importing paths.ts (Node test ESM needs extension). */
function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), '..'),
    resolve(dirname(fileURLToPath(import.meta.url)), '../../..'),
    resolve(dirname(fileURLToPath(import.meta.url)), '../../../..'),
  ];
  for (const c of candidates) {
    if (
      existsSync(resolve(c, 'ROADMAP.md')) &&
      existsSync(resolve(c, 'governance/public_allowlist.yaml'))
    ) {
      return c;
    }
  }
  return resolve(process.cwd(), '..');
}
const REPO_ROOT = findRepoRoot();
const SITE_ROOT = resolve(REPO_ROOT, 'site');

export type SiteMode = 'preview' | 'publication';

export type SourceClass =
  | 'primary_instrument_record'
  | 'clinician_document'
  | 'patient_compiled_summary'
  | 'patient_reported_narrative'
  | 'video_statement'
  | 'unknown';

export const SOURCE_CLASS_LABELS: Record<SourceClass, string> = {
  primary_instrument_record: 'Primary instrument record',
  clinician_document: 'Clinician document',
  patient_compiled_summary: 'Patient-compiled summary',
  patient_reported_narrative: 'Patient-reported narrative',
  video_statement: 'Video statement',
  unknown: 'Unknown source class',
};

export interface ReleaseScope {
  version: string;
  as_of?: string;
  notes?: string;
  approved_hypothesis_ids: string[];
  approved_null_model: boolean;
  approved_question_ids: string[];
  approved_uq_ids: string[];
  approved_specialty_pathogens: string[];
  approved_literature_applicability_ids: string[];
  approved_hardcoded_routes: string[];
}

const EMPTY_SCOPE: ReleaseScope = {
  version: '0.0.0',
  approved_hypothesis_ids: [],
  approved_null_model: false,
  approved_question_ids: [],
  approved_uq_ids: [],
  approved_specialty_pathogens: [],
  approved_literature_applicability_ids: [],
  approved_hardcoded_routes: [],
};

let _scopeCache: ReleaseScope | null = null;

/** Test helper. */
export function resetReleaseScopeCache(): void {
  _scopeCache = null;
}

/**
 * Load explicit release-scope approvals.
 * Override path via DRIFT0R_RELEASE_SCOPE (repo- or site-relative, or absolute).
 */
export function loadReleaseScope(env: NodeJS.ProcessEnv = process.env): ReleaseScope {
  if (_scopeCache) return _scopeCache;
  const override = (env.DRIFT0R_RELEASE_SCOPE || '').trim();
  let path: string;
  if (override) {
    path = override.startsWith('/')
      ? override
      : join(REPO_ROOT, override);
  } else {
    path = join(SITE_ROOT, 'src/data/release_scope.yaml');
  }
  try {
    const raw = loadYaml(readFileSync(path, 'utf8')) as Partial<ReleaseScope> | null;
    _scopeCache = {
      version: String(raw?.version || '0.0.0'),
      as_of: raw?.as_of,
      notes: raw?.notes,
      approved_hypothesis_ids: [...(raw?.approved_hypothesis_ids || [])].map(String),
      approved_null_model: raw?.approved_null_model === true,
      approved_question_ids: [...(raw?.approved_question_ids || [])].map(String),
      approved_uq_ids: [...(raw?.approved_uq_ids || [])].map(String),
      approved_specialty_pathogens: [...(raw?.approved_specialty_pathogens || [])].map(String),
      approved_literature_applicability_ids: [
        ...(raw?.approved_literature_applicability_ids || []),
      ].map(String),
      approved_hardcoded_routes: [...(raw?.approved_hardcoded_routes || [])].map(String),
    };
  } catch {
    _scopeCache = { ...EMPTY_SCOPE };
  }
  return _scopeCache;
}

/**
 * Read DRIFT0R_SITE_MODE.
 * Default: preview. Exact "publication" required for publication.
 * Unknown nonempty values (e.g. typo "publciation") throw — fail closed.
 */
export function getSiteMode(env: NodeJS.ProcessEnv = process.env): SiteMode {
  const raw = (env.DRIFT0R_SITE_MODE ?? 'preview').trim().toLowerCase();
  if (raw === '' || raw === 'preview') return 'preview';
  if (raw === 'publication') return 'publication';
  throw new Error(
    `Unknown DRIFT0R_SITE_MODE="${env.DRIFT0R_SITE_MODE}". ` +
      `Allowed values: "preview" (default) or "publication". ` +
      `A typo must not silently fall back to preview.`,
  );
}

/**
 * Infer source_class from a repository path.
 * Known specialty PDF summaries are NEVER clinician_document or primary_instrument_record.
 */
export function inferSourceClass(path: string | undefined | null): SourceClass {
  if (!path) return 'unknown';
  const p = path.replace(/\\/g, '/').toLowerCase();

  if (p.includes('transcript') || p.includes('youtube')) {
    return 'video_statement';
  }

  if (
    p.includes('evidence/sources/') &&
    (p.endsWith('.pdf') ||
      p.includes('bonedensity') ||
      p.includes('endocrine') ||
      p.includes('imaging') ||
      p.includes('infectious') ||
      p.includes('mentalhealth') ||
      p.includes('mental_health') ||
      p.includes('rheumatology') ||
      p.includes('thiamine') ||
      p.includes('urology') ||
      p.includes('nephrology') ||
      p.includes('medical-psychological') ||
      p.includes('medical_psychological'))
  ) {
    return 'patient_compiled_summary';
  }

  if (p.endsWith('.pdf') && (p.includes('summary') || p.includes('drift0r_'))) {
    return 'patient_compiled_summary';
  }

  if (
    p.includes('evidence_pack') ||
    p.includes('tests_ledger') ||
    p.includes('patient.yaml') ||
    p.includes('timeline.yaml') ||
    p.includes('00_master_symptoms') ||
    p.includes('facts/')
  ) {
    return 'patient_compiled_summary';
  }

  if (
    p.includes('swarm-runs') ||
    p.includes('current_ranking') ||
    p.includes('synthesis') ||
    p.includes('clinician_onepager')
  ) {
    return 'unknown';
  }

  return 'unknown';
}

/** Claims visible in the given mode. */
export function filterClaimsForMode<T extends { public_approved: boolean; id: string }>(
  claims: T[],
  mode: SiteMode,
): T[] {
  if (mode === 'publication') {
    return claims.filter((c) => c.public_approved === true);
  }
  return claims;
}

/**
 * Hypotheses in publication mode require:
 * 1. Explicit release-scope approval (or approved_null_model for H-NULL), AND
 * 2. Every referenced claim ID is in the approved claim set (null model may have zero refs).
 * Claim approval alone never surfaces a hypothesis.
 */
export function filterHypothesesForMode<
  T extends {
    explains_claim_ids: string[];
    does_not_explain_claim_ids: string[];
    kind?: string;
    id?: string;
  },
>(
  hyps: T[],
  approvedClaimIds: Set<string>,
  mode: SiteMode,
  scope: ReleaseScope = loadReleaseScope(),
): T[] {
  if (mode !== 'publication') return hyps;
  const approvedHyps = new Set(scope.approved_hypothesis_ids);
  return hyps.filter((h) => {
    const isNull = h.kind === 'null_model' || h.id === 'H-NULL';
    if (isNull) {
      if (!scope.approved_null_model) return false;
      // Null model is claimless; still require at least one approved claim so the
      // publication build is not an empty null-model-only site by accident.
      return approvedClaimIds.size > 0;
    }
    if (!h.id || !approvedHyps.has(h.id)) return false;
    const refs = [...(h.explains_claim_ids || []), ...(h.does_not_explain_claim_ids || [])];
    if (refs.length === 0) return false;
    return refs.every((id) => approvedClaimIds.has(id));
  });
}

/**
 * Clinician questions in publication mode require explicit question-id approval
 * AND every related claim approved. Claimless questions fail closed without their own ID.
 */
export function filterQuestionsForMode<
  T extends { id?: string; related_claim_ids: string[] },
>(
  questions: T[],
  approvedClaimIds: Set<string>,
  mode: SiteMode,
  scope: ReleaseScope = loadReleaseScope(),
): T[] {
  if (mode !== 'publication') return questions;
  const approvedQs = new Set(scope.approved_question_ids);
  return questions.filter((q) => {
    if (!q.id || !approvedQs.has(q.id)) return false;
    const refs = q.related_claim_ids || [];
    // Claimless questions still need explicit scope approval (already checked)
    // but must not pass solely because refs are empty.
    if (refs.length === 0) return true; // explicit id approval is the gate
    return refs.every((id) => approvedClaimIds.has(id));
  });
}

/** UQs: explicit id + related claims all approved (empty related_claims allowed only with id). */
export function filterUqsForMode<
  T extends { id?: string; related_claims?: string[] },
>(
  uqs: T[],
  approvedClaimIds: Set<string>,
  mode: SiteMode,
  scope: ReleaseScope = loadReleaseScope(),
): T[] {
  if (mode !== 'publication') return uqs;
  const approved = new Set(scope.approved_uq_ids);
  return uqs.filter((u) => {
    if (!u.id || !approved.has(u.id)) return false;
    const refs = u.related_claims || [];
    if (refs.length === 0) return true;
    return refs.every((id) => approvedClaimIds.has(id));
  });
}

/** Specialty channels: pathogen must be release-scoped and every claim approved. */
export function filterSpecialtyChannelsForMode<
  T extends { pathogen: string; claim_ids: string[] },
>(
  channels: T[],
  approvedClaimIds: Set<string>,
  mode: SiteMode,
  scope: ReleaseScope = loadReleaseScope(),
): T[] {
  if (mode !== 'publication') return channels;
  const pathogens = new Set(scope.approved_specialty_pathogens);
  return channels.filter(
    (ch) =>
      pathogens.has(ch.pathogen) && ch.claim_ids.every((id) => approvedClaimIds.has(id)),
  );
}

/** Whether literature applicability / patient_overlap notes may render for a lit id. */
export function literatureApplicabilityApproved(
  litId: string,
  mode: SiteMode,
  scope: ReleaseScope = loadReleaseScope(),
): boolean {
  if (mode !== 'publication') return true;
  return scope.approved_literature_applicability_ids.includes(litId);
}

/**
 * Routes with hardcoded case prose must be explicitly approved in publication mode.
 * Meta routes (legal, methods without case prose, 404) may opt out via requireRouteApproval=false.
 */
export function assertRouteApprovedForPublication(
  mode: SiteMode,
  routePath: string,
  scope: ReleaseScope = loadReleaseScope(),
): void {
  if (mode !== 'publication') return;
  const normalized = routePath.endsWith('/') ? routePath : `${routePath}/`;
  const approved = new Set(
    scope.approved_hardcoded_routes.map((r) => (r.endsWith('/') ? r : `${r}/`)),
  );
  if (!approved.has(normalized)) {
    throw new Error(
      `DRIFT0R_SITE_MODE=publication is fail-closed: route ${normalized} is not in ` +
        `release_scope.approved_hardcoded_routes. Claim approval does not authorize hardcoded case prose.`,
    );
  }
}

/**
 * Fail closed: publication mode must not claim medical content when nothing is approved.
 * Call from loaders or required medical pages during build.
 *
 * Also rejects env/marker inconsistencies that would ship a preview artifact as publication
 * (Checkpoint G P0-4): mode must be exactly publication; optional dist scan for preview markers.
 */
export function assertPublicationSafe(
  mode: SiteMode,
  approvedClaimCount: number,
  options: {
    surface?: string;
    requireApprovedClaims?: boolean;
    routePath?: string;
    requireRouteApproval?: boolean;
    scope?: ReleaseScope;
    /** When set, reject if any HTML under this dist root contains "site mode: preview". */
    distHtmlPreviewScan?: string;
  } = {},
): void {
  if (mode !== 'publication') return;

  // Env must still be exactly publication (typos already throw in getSiteMode).
  const envMode = (process.env.DRIFT0R_SITE_MODE || '').trim().toLowerCase();
  if (envMode && envMode !== 'publication') {
    throw new Error(
      `DRIFT0R_SITE_MODE=publication is fail-closed: process env is ${JSON.stringify(process.env.DRIFT0R_SITE_MODE)} while assertPublicationSafe ran as publication.`,
    );
  }

  const requireClaims = options.requireApprovedClaims !== false;
  if (requireClaims && approvedClaimCount === 0) {
    const surface = options.surface || 'medical content';
    throw new Error(
      `DRIFT0R_SITE_MODE=publication is fail-closed: zero public_approved claims while rendering ${surface}. ` +
        `Approve claims explicitly or build in preview mode.`,
    );
  }
  if (options.requireRouteApproval && options.routePath) {
    assertRouteApprovedForPublication(mode, options.routePath, options.scope || loadReleaseScope());
  }

  if (options.distHtmlPreviewScan) {
    const root = options.distHtmlPreviewScan;
    if (existsSync(root)) {
      const hits: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const abs = join(dir, name);
          const st = statSync(abs);
          if (st.isDirectory()) walk(abs);
          else if (st.isFile() && name.endsWith('.html')) {
            if (htmlLooksLikePreviewArtifact(readFileSync(abs, 'utf8'))) hits.push(abs);
          }
        }
      };
      walk(root);
      if (hits.length) {
        throw new Error(
          `DRIFT0R_SITE_MODE=publication is fail-closed: found "${PREVIEW_MODE_HTML_MARKER}" in ${hits.length} dist HTML file(s). Preview artifact cannot pass publication gate.`,
        );
      }
    }
  }
}

/** Marker string that identifies a preview-mode HTML artifact. */
export const PREVIEW_MODE_HTML_MARKER = 'site mode: preview';

/** True if text looks like a preview-mode built page. */
export function htmlLooksLikePreviewArtifact(html: string): boolean {
  return html.includes(PREVIEW_MODE_HTML_MARKER);
}
