import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './paths';
import { loadRepoYaml, loadSiteYaml, loadYamlDir, loadYamlFile } from './loadYaml';
import {
  assertSafePublicLanguage,
  toPublicLanguage,
  trailTerminal,
} from './language';
import { CONFIDENCE_LABELS, KIND_LABELS, REVIEW_LABELS, VERIFICATION_LABELS } from './constants';
import {
  assertPublicationSafe,
  filterClaimsForMode,
  filterHypothesesForMode,
  filterQuestionsForMode,
  filterSpecialtyChannelsForMode,
  filterUqsForMode,
  getSiteMode,
  inferSourceClass,
  literatureApplicabilityApproved,
  loadReleaseScope,
  resetReleaseScopeCache,
  SOURCE_CLASS_LABELS,
  type ReleaseScope,
  type SiteMode,
  type SourceClass,
} from './publication';

/** Public ship-set inventory (required for sanitized export and publication builds). */
export const CLAIM_INVENTORY_PUBLIC_REL =
  'audits/2026-08-publication-readiness/01_claim_inventory_public.yaml';

/**
 * Resolve claim inventory path for site data loading.
 * Prefer the public inventory always when present so sanitized exports build independently.
 * DRIFT0R_CLAIM_INVENTORY may override (relative to repo root or absolute) for tests/canaries.
 * Never requires the private monorepo inventory.
 */
export function resolveClaimInventoryRel(env: NodeJS.ProcessEnv = process.env): string {
  const override = (env.DRIFT0R_CLAIM_INVENTORY || '').trim();
  if (override) {
    if (override.startsWith('/')) return override;
    return override;
  }
  const publicAbs = join(REPO_ROOT, CLAIM_INVENTORY_PUBLIC_REL);
  if (existsSync(publicAbs)) return CLAIM_INVENTORY_PUBLIC_REL;
  throw new Error(
    `Claim inventory not found at ${CLAIM_INVENTORY_PUBLIC_REL} (repo root: ${REPO_ROOT}). ` +
      `Sanitized public builds require the public inventory; private monorepo must ship it too.`,
  );
}

export type { SiteMode, SourceClass, ReleaseScope };
export {
  getSiteMode,
  inferSourceClass,
  SOURCE_CLASS_LABELS,
  assertPublicationSafe,
  loadReleaseScope,
  literatureApplicabilityApproved,
};

export interface ReleaseMeta {
  content_version: string;
  as_of: string;
  last_reviewed: string;
  /** Date through which evidence was considered; displayed as “evidence current through”. */
  evidence_current_through: string;
  disclaimer_id: string;
  review_status: string;
  patient_approval: {
    status: string;
    scope?: string;
    date?: string | null;
    notes?: string;
  };
  clinician_review_scope: {
    status: string;
    domains: string[];
    date?: string | null;
    label_must_not_imply_global: boolean;
  };
  base_commit: string;
  allowlist_version: string;
  noindex: boolean;
  ai_models_disclosed?: string[];
}

/** Public analysis changelog (structured; powers /changelog/). */
export interface ChangelogRetirement {
  id: string;
  status: 'retired' | 'superseded';
  replaced_by?: string | null;
  note?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  kind: 'patch' | 'minor' | 'major';
  status: string;
  evidence_current_through: string;
  summary: string;
  added_evidence: string[];
  changed_interpretations: string[];
  strengthened_or_weakened_hypotheses: string[];
  retired_or_superseded: ChangelogRetirement[];
  corrections: string[];
  /** Intent recorded when the entry was written — never an assertion that the tag exists. */
  git_tag_planned?: string | null;
  /** Intent only; does not assert a published Release. */
  github_release_planned?: boolean;
  /** Annotated tag that actually exists on the public remote. */
  git_tag?: string | null;
  /** True only once a GitHub Release for git_tag is published. */
  github_release_published?: boolean;
  notes?: string;
}

export interface ChangelogFile {
  version: string;
  not_medical_advice: boolean;
  retired_or_reserved_ids?: string[];
  entries: ChangelogEntry[];
}

export interface PatientSource {
  source_id: string;
  path: string;
  page_or_lines: string;
  record_date: string;
  source_class: SourceClass;
}

export interface Claim {
  id: string;
  statement: string;
  public_statement: string;
  kind: string;
  verification_status: string;
  medical_domain: string;
  patient_sources: PatientSource[];
  literature_refs: string[];
  interpretation_owner: string;
  public_priority: string;
  public_tier: string;
  public_approved: boolean;
  clinician_review_status: string;
  last_checked: string;
  notes: string;
  triage: string;
  /**
   * Every correction notice attached to this claim — claim-specific first-class matches
   * plus domain-wide notices, in corrections-register order. Kept as the single union so
   * existing surfaces render unchanged.
   */
  corrections: CorrectionRef[];
  /**
   * Corrections that name this claim id directly (CORRECTION_BY_CLAIM).
   * Invariant: corrections_claim_specific ∪ corrections_domain_wide === corrections,
   * and the two are disjoint.
   */
  corrections_claim_specific: CorrectionRef[];
  /**
   * Domain-wide notices stamped on every claim in this medical_domain
   * (CORRECTION_BY_DOMAIN), excluding any that already name this claim.
   */
  corrections_domain_wide: CorrectionRef[];
  /** Default active when omitted in inventory. */
  lifecycle_status: 'active' | 'retired' | 'superseded';
  superseded_by: string | null;
  supersedes: string | null;
  changelog_entry: string | null;
}

export interface CorrectionRef {
  id: string;
  title: string;
  status: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  kind: string;
  confidence: string;
  architecture_confidence: string | null;
  module_confidence: string | null;
  summary: string;
  public_summary: string;
  /** Authored lay-audience title. Falls back to `title` when absent. */
  plain_title: string;
  /** Authored lay-audience summary (~35 words). Falls back to `public_summary`. */
  plain_summary: string;
  explains_claim_ids: string[];
  does_not_explain_claim_ids: string[];
  supporting_literature_ids: string[];
  contradicting_literature_ids: string[];
  open_question_ids: string[];
  review_status: string;
  as_of: string;
  supersedes: string | null;
  what_would_change: WhatWouldChangeItem[];
  what_would_not_change: string[];
}

export interface WhatWouldChangeItem {
  id: string;
  text: string;
}

export interface ClinicianQuestion {
  id: string;
  question: string;
  rationale: string;
  related_claim_ids: string[];
  related_hypothesis_ids: string[];
  literature_refs: string[];
  priority: string;
  dont_miss: boolean;
  medical_domain: string;
  review_status: string;
  as_of: string;
  forbidden_phrasings: string[];
}

export interface UnresolvedQuestion {
  id: string;
  topic: string;
  question: string;
  why_it_matters: string;
  related_claims: string[];
  related_corrections: string[];
  closest_available_record: string;
  status: string;
  owner: string;
  blocks_launch_critical_wording: boolean;
}

export interface LitEntry {
  id: string;
  title: string;
  /** Optional project-friendly scope/subtitle — never replaces identity-verified title. */
  scope_note?: string;
  authors: string[];
  year: number | string;
  journal: string;
  doi: string;
  pmid: string;
  pmcid: string;
  url: string;
  access: string;
  license: string;
  topics: string[];
  relevance: string;
  study_type: string;
  supports: string[];
  contradicts: string[];
  patient_overlap: string[];
  quality_notes: string;
  local_pdf: string;
  canonical_id: string;
  aliased_by: string[];
  _file?: string;
}

export interface SpecialtyChannel {
  pathogen: string;
  signal: { label: string; result: string; note: string };
  reference: { label: string; result: string; note: string };
  verdict: string;
  claim_ids: string[];
}

// ---------------------------------------------------------------------------
// Correction map — must match audits/2026-08-publication-readiness/CORRECTIONS.md
// (ID, short title, status, count). Tests assert exact equality against the register.
// ---------------------------------------------------------------------------

const CORRECTIONS: CorrectionRef[] = [
  { id: 'COR-0001', title: 'Hip BMD change vs LSC: source-attributed, not free-floating “significant”', status: 'logged_in_inventory' },
  { id: 'COR-0002', title: '“Osteoporosis” is WHO-by-T-score language in compiled summary, not a verified clinician diagnosis string', status: 'logged_in_inventory' },
  { id: 'COR-0003', title: '“Catastrophic osteoporosis” internal research language', status: 'applied_to_public_draft' },
  { id: 'COR-0004', title: 'Historical T ~34 ng/dL provenance is incomplete', status: 'logged_in_inventory' },
  { id: 'COR-0005', title: 'KIT “negative” lacks method and LOD', status: 'logged_in_inventory' },
  { id: 'COR-0006', title: 'CTX 616 lacks fasting / time-of-day documentation', status: 'logged_in_inventory' },
  { id: 'COR-0007', title: 'Specialty Babesia/Bartonella must not read as confirmed infection', status: 'logged_in_inventory' },
  { id: 'COR-0008', title: 'SSD reversal scope is documented in mental-health summary', status: 'logged_in_inventory' },
  { id: 'COR-0009', title: 'Gene-panel yield honesty (~9%) must not become “high yield”', status: 'logged_in_inventory' },
  { id: 'COR-0010', title: 'Catalog duplicate works inflate public counts', status: 'identified' },
  { id: 'COR-0011', title: 'Cross-scanner DXA absolute BMD not comparable', status: 'logged_in_inventory' },
  { id: 'COR-0012', title: 'Dry beriberi label is interpretive around documented deficiency + phenotype', status: 'logged_in_inventory' },
  { id: 'COR-0013', title: 'Machine-readable compound probability vocabulary', status: 'deferred' },
  { id: 'COR-0014', title: 'Public medical page generation must not ship raw overstatement surfaces', status: 'logged_in_inventory' },
  { id: 'COR-0015', title: 'ISCD Official Positions near-duplicate cards', status: 'logged_in_inventory' },
  { id: 'COR-0016', title: 'Structured hypothesis and clinician-question instances required', status: 'applied_to_public_draft' },
  { id: 'COR-0017', title: 'Nine literature cards had wrong or dead DOI/PMID identifiers', status: 'applied_to_public_draft' },
  { id: 'COR-0018', title: 'lit-0294 inclusion/exclusion and gene-panel yield figures', status: 'applied_to_public_draft' },
  { id: 'COR-0019', title: 'Source class is independent of verification_status; no primary instrument records in repo', status: 'applied_to_public_draft' },
  { id: 'COR-0020', title: 'Defect-card # Links sections still carried old identifiers after frontmatter fix', status: 'applied_to_public_draft' },
  { id: 'COR-0021', title: 'lit-0104 applicability: uremia review must not support non-CKD patient cytokine inference', status: 'applied_to_public_draft' },
  { id: 'COR-0022', title: 'Nodule biopsy agency reversed (patient was refused, did not refuse)', status: 'logged_in_inventory' },
  { id: 'COR-0023', title: 'CRP/ESR “repeatedly normal” lacked denominator and as-of date', status: 'logged_in_inventory' },
  { id: 'COR-0024', title: 'CLM-0037 missing specialty LDT contested / not-FDA-cleared label', status: 'logged_in_inventory' },
  { id: 'COR-0025', title: 'CLM-0037 / CLM-0038 missing negative ≠ impossible hedge', status: 'logged_in_inventory' },
  { id: 'COR-0026', title: 'CLM-0039 collapsed treatment-response domains', status: 'logged_in_inventory' },
  { id: 'COR-0027', title: 'CLM-0031 typed as observed_fact without genotype instrument', status: 'logged_in_inventory' },
  { id: 'COR-0028', title: 'Same-scanner L3–L4 DXA series missing from claim inventory', status: 'logged_in_inventory' },
  { id: 'COR-0029', title: 'Bare “is rejected” passed public-language gate', status: 'applied_to_public_draft' },
  { id: 'COR-0030', title: 'Unsourced “high VUS rate” / “VUS common” frequency claims removed', status: 'applied_to_public_draft' },
  { id: 'COR-0031', title: 'Printed clinician packet rendered bare literature IDs', status: 'applied_to_public_draft' },
  { id: 'COR-0032', title: 'lit-0206 miscategorized as support on H5', status: 'applied_to_public_draft' },
  { id: 'COR-0033', title: 'Mast-cell ruled-out entry published as a clean negative', status: 'applied_to_public_draft' },
  { id: 'COR-0034', title: 'Autoimmune ruled-out entry dropped its documented denominator and as-of boundary', status: 'applied_to_public_draft' },
  { id: 'COR-0035', title: 'Mold/CIRS patient-reported result presented as objective', status: 'applied_to_public_draft' },
  { id: 'COR-0036', title: 'Psychiatric ruled-out entry asserted the question closed', status: 'applied_to_public_draft' },
  { id: 'COR-0037', title: 'Reported history rendered as documented fact on the landing page', status: 'applied_to_public_draft' },
  { id: 'COR-0038', title: 'Hypothesis plain titles overstated their claim rows', status: 'applied_to_public_draft' },
  { id: 'COR-0039', title: "Ruled-out register bypassed the publication gate and the site's source-trail promise", status: 'applied_to_public_draft' },
  { id: 'COR-0040', title: 'Public documents asserted indexing was disabled while the site shipped indexable', status: 'applied_to_public_draft' },
  { id: 'COR-0041', title: 'Two hormone results were grouped as if one reference-interval artefact explained both', status: 'logged_in_inventory' },
  { id: 'COR-0042', title: 'Published pages described the case as having no stone history when the record documents one stone', status: 'applied_to_public_draft' },
  { id: 'COR-0043', title: 'The public ranking\'s "Confirmed/objective" row carried two items that are not confirmed or objective', status: 'applied_to_public_draft' },
  { id: 'COR-0044', title: 'The tests ledger recorded the post-antibiotic Babesia FISH as never done when its own T047 row contains one', status: 'logged_in_inventory' },
];

/** Domain → correction IDs that should surface on matching records (real COR IDs only). */
const CORRECTION_BY_DOMAIN: Record<string, string[]> = {
  bone: ['COR-0001', 'COR-0002', 'COR-0003', 'COR-0011', 'COR-0028'],
  endocrine: ['COR-0004', 'COR-0041'],
  mast_cell: ['COR-0005', 'COR-0027', 'COR-0033'],
  laboratory: ['COR-0006'],
  infectious_disease: ['COR-0007', 'COR-0024', 'COR-0025', 'COR-0026', 'COR-0044'],
  genetics: ['COR-0009', 'COR-0018', 'COR-0030'],
  metabolic: ['COR-0012'],
  mental_health: ['COR-0008', 'COR-0036'],
  immunology: ['COR-0015', 'COR-0032'],
  rheumatology: ['COR-0023', 'COR-0034'],
  msk: ['COR-0022', 'COR-0037'],
  renal: ['COR-0042'],
  // Compound domains are matched exactly, not split on the underscore, so each one a claim
  // actually uses needs its own key — otherwise the claim silently shows no corrections at all.
  //
  // The reverse also holds and is easy to miss: `laboratory`, `literature` and `publication`
  // below are not the medical_domain of any current claim, so their entries render nowhere.
  // This map is only ever read as CORRECTION_BY_DOMAIN[claim.medical_domain]; listing a
  // correction here does not surface it on a literature card or anywhere outside a claim record.
  renal_bone: ['COR-0042'],
  endocrine_bone: ['COR-0004', 'COR-0001', 'COR-0011'],
  endocrine_mental_health: ['COR-0004', 'COR-0008', 'COR-0036'],
  literature: ['COR-0010', 'COR-0015', 'COR-0017', 'COR-0020', 'COR-0021', 'COR-0030', 'COR-0042'],
  publication: ['COR-0013', 'COR-0014', 'COR-0016', 'COR-0019', 'COR-0029', 'COR-0031', 'COR-0035', 'COR-0038', 'COR-0039', 'COR-0040', 'COR-0043'],
};

const CORRECTION_BY_CLAIM: Record<string, string[]> = {
  'CLM-0003': ['COR-0002', 'COR-0003'],
  'CLM-0006': ['COR-0001', 'COR-0011'],
  'CLM-0009': ['COR-0015', 'COR-0002'],
  'CLM-0010': ['COR-0006'],
  'CLM-0018': ['COR-0004'],
  'CLM-0031': ['COR-0027'],
  'CLM-0032': ['COR-0005'],
  'CLM-0036': ['COR-0007'],
  'CLM-0037': ['COR-0007', 'COR-0024', 'COR-0025'],
  'CLM-0038': ['COR-0025'],
  'CLM-0039': ['COR-0026'],
  'CLM-0043': ['COR-0026'],
  'CLM-0041': ['COR-0022'],
  'CLM-0044': ['COR-0023'],
  'CLM-0023': ['COR-0012'],
  'CLM-0046': ['COR-0008'],
  'CLM-0048': ['COR-0008'],
  'CLM-0077': ['COR-0028'],
};

// ---------------------------------------------------------------------------
// Loaders (cached per process)
// ---------------------------------------------------------------------------

let _release: ReleaseMeta | null = null;
let _changelog: ChangelogFile | null = null;
/** Unfiltered public-draft claims (tier filter only). Mode filter applied in getClaims(). */
let _claimsRaw: Claim[] | null = null;
let _hypothesesRaw: Hypothesis[] | null = null;
let _questionsRaw: ClinicianQuestion[] | null = null;
let _uqs: UnresolvedQuestion[] | null = null;
let _lit: LitEntry[] | null = null;
let _litById: Map<string, LitEntry> | null = null;

/** Test helper: clear loader caches (publication-mode mutation tests). */
export function resetDataCaches(): void {
  _release = null;
  _changelog = null;
  _claimsRaw = null;
  _hypothesesRaw = null;
  _questionsRaw = null;
  _uqs = null;
  _lit = null;
  _litById = null;
  resetReleaseScopeCache();
}

/**
 * Live release metadata. Optional DRIFT0R_RELEASE_YAML (absolute or repo-relative)
 * points at an isolated fixture for tests — never used to rewrite the tracked file.
 */
export function getRelease(): ReleaseMeta {
  if (!_release) {
    const override = (typeof process !== 'undefined' && process.env?.DRIFT0R_RELEASE_YAML
      ? process.env.DRIFT0R_RELEASE_YAML
      : ''
    ).trim();
    if (override) {
      const abs = override.startsWith('/') ? override : join(REPO_ROOT, override);
      _release = loadYamlFile<ReleaseMeta>(abs);
    } else {
      _release = loadSiteYaml<ReleaseMeta>('src/data/release.yaml');
    }
  }
  return _release;
}

/** Analysis version = content_version (current best understanding on the site). */
export function getAnalysisVersion(): string {
  return getRelease().content_version;
}

export function getEvidenceCurrentThrough(): string {
  return getRelease().evidence_current_through;
}

export function getChangelog(): ChangelogFile {
  if (!_changelog) {
    _changelog = loadSiteYaml<ChangelogFile>('src/data/changelog.yaml');
  }
  return _changelog;
}

/** Changelog entries newest-first (file may be stored newest-first already). */
export function getChangelogEntries(): ChangelogEntry[] {
  return getChangelog().entries;
}

export function getChangelogEntryByVersion(version: string): ChangelogEntry | undefined {
  return getChangelogEntries().find((e) => e.version === version);
}

export function getCorrections(): CorrectionRef[] {
  return CORRECTIONS;
}

export function getCorrectionById(id: string): CorrectionRef | undefined {
  return CORRECTIONS.find((c) => c.id === id);
}

/** Corrections attached to a claim, split by why they attach. */
export interface ClaimCorrectionSplit {
  /** Union of claim_specific + domain_wide, in corrections-register order. */
  all: CorrectionRef[];
  /** Corrections that name this claim id. */
  claim_specific: CorrectionRef[];
  /** Domain-wide notices, minus anything already claim-specific (never double-listed). */
  domain_wide: CorrectionRef[];
}

/**
 * Split a claim's corrections into claim-specific and domain-wide buckets.
 * All three lists are filtered from CORRECTIONS, so register order is preserved and
 * an id that is not in the register is dropped from every bucket identically.
 */
function correctionSplitForClaim(c: { id: string; medical_domain: string }): ClaimCorrectionSplit {
  const specificIds = new Set<string>(CORRECTION_BY_CLAIM[c.id] || []);
  const domainIds = new Set<string>(
    (CORRECTION_BY_DOMAIN[c.medical_domain] || []).filter((id) => !specificIds.has(id)),
  );
  return {
    all: CORRECTIONS.filter((x) => specificIds.has(x.id) || domainIds.has(x.id)),
    claim_specific: CORRECTIONS.filter((x) => specificIds.has(x.id)),
    domain_wide: CORRECTIONS.filter((x) => domainIds.has(x.id)),
  };
}

function normalizePatientSource(s: Partial<PatientSource> & { source_id: string; path: string }): PatientSource {
  const inferred = inferSourceClass(s.path);
  // Prefer inventory value when present, but never trust clinician/primary for specialty PDFs.
  let source_class: SourceClass = (s.source_class as SourceClass) || inferred;
  if (
    (source_class === 'clinician_document' || source_class === 'primary_instrument_record') &&
    inferred === 'patient_compiled_summary'
  ) {
    source_class = 'patient_compiled_summary';
  }
  return {
    source_id: s.source_id,
    path: s.path,
    page_or_lines: s.page_or_lines || '',
    record_date: s.record_date || '',
    source_class,
  };
}

type RawClaim = Omit<
  Claim,
  | 'public_statement'
  | 'corrections'
  | 'corrections_claim_specific'
  | 'corrections_domain_wide'
  | 'patient_sources'
  | 'lifecycle_status'
  | 'superseded_by'
  | 'supersedes'
  | 'changelog_entry'
> & {
  patient_sources?: Array<Partial<PatientSource> & { source_id: string; path: string }>;
  lifecycle_status?: 'active' | 'retired' | 'superseded';
  superseded_by?: string | null;
  supersedes?: string | null;
  changelog_entry?: string | null;
};

function loadClaimsRaw(): Claim[] {
  if (_claimsRaw) return _claimsRaw;
  const rel = resolveClaimInventoryRel();
  const inv = rel.startsWith('/')
    ? loadYamlFile<{ claims: RawClaim[] }>(rel)
    : loadRepoYaml<{ claims: RawClaim[] }>(rel);

  _claimsRaw = inv.claims
    .filter((c) => c.public_tier !== 'do_not_publish' && c.triage !== 'Do not publish')
    .map((c) => {
      const split = correctionSplitForClaim(c);
      return {
        ...c,
        public_statement: toPublicLanguage(c.statement),
        patient_sources: (c.patient_sources || []).map(normalizePatientSource),
        literature_refs: c.literature_refs || [],
        corrections: split.all,
        corrections_claim_specific: split.claim_specific,
        corrections_domain_wide: split.domain_wide,
        lifecycle_status: c.lifecycle_status || 'active',
        superseded_by: c.superseded_by ?? null,
        supersedes: c.supersedes ?? null,
        changelog_entry: c.changelog_entry ?? null,
      };
    });
  if (getSiteMode() === 'publication') {
    assertSafePublicLanguage(
      _claimsRaw.map((c) => ({ surface: `claim ${c.id}`, text: c.public_statement })),
      { checkTreatment: true },
    );
  }
  return _claimsRaw;
}

/**
 * Claims for the active site mode.
 * publication: only public_approved===true (empty when none approved — no unapproved leak).
 * preview: all public-draft claims (approval badges remain visible when false).
 * Pages that require medical claims may call assertPublicationSafe() separately to fail the build.
 */
export function getClaims(): Claim[] {
  const mode = getSiteMode();
  const raw = loadClaimsRaw();
  return filterClaimsForMode(raw, mode);
}

/** All public-draft claims ignoring publication mode (tests / admin only). */
export function getClaimsUnfiltered(): Claim[] {
  return loadClaimsRaw();
}

export function getClaimById(id: string): Claim | undefined {
  return getClaims().find((c) => c.id === id);
}

export function getClaimsByKind(kind: string): Claim[] {
  return getClaims().filter((c) => c.kind === kind);
}

function loadUnresolvedQuestionsRaw(): UnresolvedQuestion[] {
  if (_uqs) return _uqs;
  const data = loadRepoYaml<{ questions: UnresolvedQuestion[] }>(
    'audits/2026-08-publication-readiness/02_unresolved_record_questions.yaml',
  );
  _uqs = data.questions.map((q) => ({
    ...q,
    question: toPublicLanguage((q.question || '').trim()),
    why_it_matters: toPublicLanguage((q.why_it_matters || '').trim()),
    closest_available_record: (q.closest_available_record || '').trim(),
  }));
  if (getSiteMode() === 'publication') {
    assertSafePublicLanguage(
      _uqs.flatMap((q) => [
        { surface: `UQ ${q.id} question`, text: q.question },
        { surface: `UQ ${q.id} why`, text: q.why_it_matters },
      ]),
      { checkTreatment: false },
    );
  }
  return _uqs;
}

/**
 * Unresolved questions for active mode.
 * publication: explicit UQ id in release_scope AND related claims approved.
 * Claimless UQs fail closed without their own release-scope id.
 */
export function getUnresolvedQuestions(): UnresolvedQuestion[] {
  const raw = loadUnresolvedQuestionsRaw();
  const mode = getSiteMode();
  if (mode !== 'publication') return raw;
  const approved = new Set(getClaims().map((c) => c.id));
  return filterUqsForMode(raw, approved, mode, loadReleaseScope());
}

export function getUqById(id: string): UnresolvedQuestion | undefined {
  return getUnresolvedQuestions().find((q) => q.id === id);
}

/** Explicit non-change items for residual infection hypothesis (design §4.10). */
const WHAT_WOULD_NOT_CHANGE: Record<string, string[]> = {
  H4: [
    'Repeat standalone specialty IgM testing alone would not independently confirm infection and would not close commercial/PCR discordance.',
  ],
};

function loadHypothesesRaw(): Hypothesis[] {
  if (_hypothesesRaw) return _hypothesesRaw;
  const raw = loadYamlDir<
    Omit<
      Hypothesis,
      'public_summary' | 'plain_title' | 'plain_summary' | 'what_would_change' | 'what_would_not_change'
    > & { plain_title?: string; plain_summary?: string }
  >(join(REPO_ROOT, 'differentials/hypotheses'), 'H');
  const uqs = loadUnresolvedQuestionsRaw();
  _hypothesesRaw = raw
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map((h) => {
      const what_would_change: WhatWouldChangeItem[] = (h.open_question_ids || []).map((uid) => {
        const u = uqs.find((x) => x.id === uid);
        return {
          id: uid,
          text: u ? u.question : `Open question ${uid} (see unresolved-question register).`,
        };
      });
      return {
        ...h,
        explains_claim_ids: h.explains_claim_ids || [],
        does_not_explain_claim_ids: h.does_not_explain_claim_ids || [],
        supporting_literature_ids: h.supporting_literature_ids || [],
        contradicting_literature_ids: h.contradicting_literature_ids || [],
        open_question_ids: h.open_question_ids || [],
        public_summary: toPublicLanguage(h.summary),
        plain_title: h.plain_title || h.title,
        plain_summary: toPublicLanguage(h.plain_summary || h.summary),
        what_would_change: what_would_change.map((w) => ({
          ...w,
          text: toPublicLanguage(w.text),
        })),
        what_would_not_change: WHAT_WOULD_NOT_CHANGE[h.id] || [],
      };
    });
  if (getSiteMode() === 'publication') {
    assertSafePublicLanguage(
      _hypothesesRaw.map((h) => ({ surface: `hypothesis ${h.id}`, text: h.public_summary })),
      { checkTreatment: false },
    );
  }
  return _hypothesesRaw;
}

/**
 * Hypotheses for active mode.
 * publication: explicit hypothesis (or null_model) release-scope approval AND claim refs.
 * Claim public_approved alone never surfaces a hypothesis.
 */
export interface RuledOutEntry {
  suggestion: string;
  /**
   * Rows in the public claim inventory that support this entry. Required — the register
   * is a medical surface and must pass the same approval gate as every other one. In
   * publication mode an entry is dropped unless *all* of its claims are approved.
   */
  claim_ids: string[];
  tested: string;
  when: string;
  result: string;
  still_open: string | null;
  literature_id?: string;
}

export interface RuledOutRegister {
  as_of: string;
  standing_caveat: string;
  entries: RuledOutEntry[];
}

let _ruledOut: RuledOutRegister | null = null;

/**
 * Commonly suggested explanations and what was actually tested.
 *
 * Source file carries test name / date / plain result, and since DEC-0039 (v0.4.0) may
 * also carry a numeric value with its reference interval where the number is what makes
 * the result interpretable. Text is passed through the public-language transform like
 * every other rendered medical surface.
 *
 * Note the separate, still-absolute rule that confidence language is never numeric
 * (see constants.ts CONFIDENCE_VOCAB) — that bars invented probabilities and is
 * unaffected by the lab-value relaxation here.
 *
 * Fails closed like the other derived medical surfaces: in publication mode an entry
 * ships only if it names claim ids AND every one of them is in the approved inventory.
 * Approving `/` as a hardcoded route must not implicitly publish an ungrounded row —
 * that was the gap this filter closes.
 */
export function getRuledOut(): RuledOutRegister {
  if (_ruledOut) return _ruledOut;
  const raw = loadRepoYaml<RuledOutRegister>('evidence/ruled_out.yaml');
  const mode = getSiteMode();
  const approved = mode === 'publication' ? new Set(getClaims().map((c) => c.id)) : null;
  const entries = (raw.entries || []).filter((e) => {
    const ids = e.claim_ids || [];
    if (ids.length === 0) return false;
    return approved === null || ids.every((id) => approved.has(id));
  });
  _ruledOut = {
    as_of: raw.as_of,
    standing_caveat: toPublicLanguage(raw.standing_caveat),
    entries: entries.map((e) => ({
      ...e,
      claim_ids: [...(e.claim_ids || [])],
      suggestion: toPublicLanguage(e.suggestion),
      tested: toPublicLanguage(e.tested),
      result: toPublicLanguage(e.result),
      still_open: e.still_open ? toPublicLanguage(e.still_open) : null,
    })),
  };
  return _ruledOut;
}

export function getHypotheses(): Hypothesis[] {
  const mode = getSiteMode();
  const raw = loadHypothesesRaw();
  if (mode !== 'publication') return raw;
  const approved = new Set(getClaims().map((c) => c.id));
  return filterHypothesesForMode(raw, approved, mode, loadReleaseScope());
}

export function getHypothesisById(id: string): Hypothesis | undefined {
  return getHypotheses().find((h) => h.id === id);
}

function loadQuestionsRaw(): ClinicianQuestion[] {
  if (_questionsRaw) return _questionsRaw;
  const raw = loadYamlDir<ClinicianQuestion>(
    join(REPO_ROOT, 'differentials/clinician_questions'),
    'CQ',
  );
  _questionsRaw = raw
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((q) => ({
      ...q,
      question: toPublicLanguage(q.question || ''),
      rationale: toPublicLanguage(q.rationale || ''),
      related_claim_ids: q.related_claim_ids || [],
      related_hypothesis_ids: q.related_hypothesis_ids || [],
      literature_refs: q.literature_refs || [],
      forbidden_phrasings: q.forbidden_phrasings || [],
      dont_miss: Boolean(q.dont_miss),
    }));
  if (getSiteMode() === 'publication') {
    assertSafePublicLanguage(
      _questionsRaw.flatMap((q) => [
        { surface: `CQ ${q.id} question`, text: q.question },
        { surface: `CQ ${q.id} rationale`, text: q.rationale },
      ]),
      { checkTreatment: false },
    );
  }
  return _questionsRaw;
}

export function getClinicianQuestions(): ClinicianQuestion[] {
  const mode = getSiteMode();
  const raw = loadQuestionsRaw();
  if (mode !== 'publication') return raw;
  const approved = new Set(getClaims().map((c) => c.id));
  return filterQuestionsForMode(raw, approved, mode, loadReleaseScope());
}

export function getLiterature(): LitEntry[] {
  if (_lit) return _lit;
  const cat = loadRepoYaml<{ entries: LitEntry[] }>('literature/catalog.yaml');
  const mode = getSiteMode();
  const scope = loadReleaseScope();
  _lit = cat.entries.map((e) => ({
    ...e,
    quality_notes: toPublicLanguage(e.quality_notes || ''),
    patient_overlap: (e.patient_overlap || []).map((s) => toPublicLanguage(String(s))),
  }));
  // Publication fail-closed on literature fields that actually render applicability.
  if (mode === 'publication') {
    const approved = new Set(scope.approved_literature_applicability_ids);
    const fields: Array<{ surface: string; text: string }> = [];
    for (const e of _lit) {
      if (!approved.has(e.id)) continue;
      if (e.quality_notes) fields.push({ surface: `${e.id} quality_notes`, text: e.quality_notes });
      for (const [i, s] of (e.patient_overlap || []).entries()) {
        fields.push({ surface: `${e.id} patient_overlap[${i}]`, text: s });
      }
    }
    assertSafePublicLanguage(fields, { checkTreatment: true });
  }
  _litById = new Map(_lit.map((e) => [e.id, e]));
  return _lit;
}

export function getLitById(id: string): LitEntry | undefined {
  if (!_litById) getLiterature();
  return _litById!.get(id);
}

/** Literature IDs cited by hypotheses or clinician questions (launch-critical set). */
export function getLaunchLiteratureIds(): string[] {
  const ids = new Set<string>();
  for (const h of getHypotheses()) {
    h.supporting_literature_ids.forEach((id) => ids.add(id));
    h.contradicting_literature_ids.forEach((id) => ids.add(id));
  }
  for (const q of getClinicianQuestions()) {
    q.literature_refs.forEach((id) => ids.add(id));
  }
  return [...ids].sort();
}

export function getLaunchLiterature(): LitEntry[] {
  return getLaunchLiteratureIds()
    .map((id) => getLitById(id))
    .filter((e): e is LitEntry => Boolean(e));
}

/**
 * Identity-attestation status for literature pages (Checkpoint G.2).
 * Bibliographic identity only — never implies semantic or medical verification.
 */
export type LitIdentityStatus =
  | 'identity_verified'
  | 'identity_unverified'
  | 'identity_unresolvable'
  | 'identity_mismatch'
  | 'unknown';

export interface LitIdentityCoverage {
  catalog_card_count: number;
  launch_cited_count: number;
  identity_verified_count: number;
  identity_unverified_count: number;
  identity_unresolvable_count: number;
  identity_mismatch_count: number;
  semantic_verified_count: number;
  identity_only_disclaimer?: string;
  semantic_verification_note?: string;
  identity_verified?: string[];
  identity_unverified?: string[];
  identity_unresolvable?: string[];
  identity_mismatch?: string[];
  launch_cited_unverified?: string[];
}

let _identityCoverage: LitIdentityCoverage | null = null;

/** Load literature/attestations/coverage.yaml (identity-only; semantic always 0). */
export function getLitIdentityCoverage(): LitIdentityCoverage {
  if (_identityCoverage) return _identityCoverage;
  try {
    _identityCoverage = loadRepoYaml<LitIdentityCoverage>(
      'literature/attestations/coverage.yaml',
    );
  } catch {
    _identityCoverage = {
      catalog_card_count: 0,
      launch_cited_count: 0,
      identity_verified_count: 0,
      identity_unverified_count: 0,
      identity_unresolvable_count: 0,
      identity_mismatch_count: 0,
      semantic_verified_count: 0,
    };
  }
  return _identityCoverage;
}

/** Identity status for one card id (canonical preferred). Does not claim medical verification. */
export function getLitIdentityStatus(id: string): LitIdentityStatus {
  const cov = getLitIdentityCoverage();
  const e = getLitById(id);
  const key = e?.canonical_id && e.canonical_id !== e.id ? e.canonical_id : id;
  if ((cov.identity_mismatch || []).includes(key) || (cov.identity_mismatch || []).includes(id)) {
    return 'identity_mismatch';
  }
  if ((cov.identity_verified || []).includes(key) || (cov.identity_verified || []).includes(id)) {
    return 'identity_verified';
  }
  if (
    (cov.identity_unresolvable || []).includes(key) ||
    (cov.identity_unresolvable || []).includes(id)
  ) {
    return 'identity_unresolvable';
  }
  if ((cov.identity_unverified || []).includes(key) || (cov.identity_unverified || []).includes(id)) {
    return 'identity_unverified';
  }
  return 'unknown';
}

/** Public label for identity status — never implies clinical review. */
export function litIdentityStatusLabel(status: LitIdentityStatus): string {
  switch (status) {
    case 'identity_verified':
      return 'Bibliographic identity verified (identifier match only)';
    case 'identity_unverified':
      return 'Bibliographic identity not yet attested offline';
    case 'identity_unresolvable':
      return 'No DOI/PMID/PMCID to attest';
    case 'identity_mismatch':
      return 'Bibliographic identity mismatch (do not treat as verified)';
    default:
      return 'Identity attestation status unknown';
  }
}

export function resolveCanonicalLit(id: string): LitEntry | undefined {
  const e = getLitById(id);
  if (!e) return undefined;
  if (e.canonical_id && e.canonical_id !== e.id) {
    return getLitById(e.canonical_id) || e;
  }
  return e;
}

export function litPublicUrl(e: LitEntry): string | null {
  if (e.doi) return `https://doi.org/${e.doi.replace(/^https?:\/\/doi\.org\//, '')}`;
  if (e.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`;
  if (e.url && !e.url.includes('papers_local') && !e.url.endsWith('.pdf')) return e.url;
  return null;
}

/** Specialty LDT two-channel readouts from audited claims (never merged). */
export function getSpecialtyChannels(): SpecialtyChannel[] {
  const channels: SpecialtyChannel[] = [
    {
      pathogen: 'Babesia',
      signal: {
        label: 'Specialty laboratory-developed test (LDT)',
        result: 'FISH positive on two draws (Jul 2023, Feb 2024)',
        note: 'Whole blood; contested specialty method. Not FDA-cleared as an independent confirmatory standard in this project’s framing.',
      },
      reference: {
        label: 'Independent / commercial molecular channel',
        result: 'Babesia PCR negative (same public summary set)',
        note: 'Method and LOD as transcribed in specialty summary; not a primary instrument printout.',
      },
      verdict: 'NOT INDEPENDENTLY CONFIRMED',
      claim_ids: ['CLM-0036'],
    },
    {
      pathogen: 'Bartonella',
      signal: {
        label: 'Specialty laboratory-developed test (LDT)',
        result: 'Immunoblot IgM genus/species positive Jul 2023; later indeterminate/negative pattern',
        note: 'Specialty IgM contested; must not be collapsed with commercial results.',
      },
      reference: {
        label: 'Independent / commercial molecular channel',
        result: 'Bartonella PCR/FISH negative on whole blood (public summary)',
        note: 'Negative blood PCR/FISH does not exclude all tissue-limited disease; also does not confirm specialty IgM.',
      },
      verdict: 'NOT INDEPENDENTLY CONFIRMED',
      claim_ids: ['CLM-0037'],
    },
  ];
  const mode = getSiteMode();
  if (mode !== 'publication') return channels;
  const approved = new Set(getClaims().map((c) => c.id));
  // Explicit pathogen release-scope + approved claims (claim approval alone is insufficient).
  return filterSpecialtyChannelsForMode(channels, approved, mode, loadReleaseScope());
}

/**
 * Public source-trail path labels must not surface patient handle, identity, or
 * downloadable file names. Repo paths are internal; display only a category + locator.
 */
export function publicSourceLabel(path: string | undefined, sourceId: string): string {
  if (!path) return sourceId;
  const p = path.toLowerCase();
  if (p.includes('bonedensity') || p.includes('bone_density')) return 'specialty summary (bone / DXA)';
  if (p.includes('endocrine')) return 'specialty summary (endocrine)';
  if (p.includes('imaging')) return 'specialty summary (imaging)';
  if (p.includes('infectious')) return 'specialty summary (infectious disease)';
  if (p.includes('rheumatology')) return 'specialty summary (rheumatology labs)';
  if (p.includes('thiamine')) return 'specialty summary (thiamine / metabolic)';
  if (p.includes('urology') || p.includes('nephrology')) return 'specialty summary (urology / nephrology)';
  if (p.includes('mentalhealth') || p.includes('mental_health')) return 'specialty summary (mental health)';
  if (p.includes('medical-psychological') || p.includes('medical_psychological')) {
    return 'specialty summary (medical-psychological history)';
  }
  if (p.includes('transcript') || p.includes('youtube')) return 'public release transcript (not quoted here)';
  if (p.includes('evidence_pack')) return 'evidence pack transcription';
  if (p.includes('tests_ledger')) return 'tests ledger transcription';
  if (p.includes('patient.yaml')) return 'structured patient facts (de-identified fields only)';
  if (p.includes('timeline')) return 'structured timeline facts';
  if (p.endsWith('.pdf')) return 'specialty summary (PDF not published)';
  // Never echo raw repo filenames that may contain a handle
  return `research artifact (${sourceId})`;
}

export function sourceClassLabel(sc: SourceClass | string | undefined): string {
  if (!sc) return SOURCE_CLASS_LABELS.unknown;
  return SOURCE_CLASS_LABELS[sc as SourceClass] || String(sc).replace(/_/g, ' ');
}

export function sourceTrailSteps(
  claim: Claim,
): { label: string; detail: string; source_class?: SourceClass }[] {
  const steps: { label: string; detail: string; source_class?: SourceClass }[] = [];
  steps.push({
    label: claim.id,
    detail: claim.public_statement,
  });
  for (const s of claim.patient_sources.slice(0, 4)) {
    const sc = s.source_class || inferSourceClass(s.path);
    steps.push({
      label: s.source_id,
      source_class: sc,
      detail: [
        publicSourceLabel(s.path, s.source_id),
        `class: ${sourceClassLabel(sc)}`,
        s.page_or_lines ? `locator: ${s.page_or_lines}` : null,
        s.record_date ? `record date: ${s.record_date}` : null,
        'file not published',
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }
  steps.push({
    label: 'Terminal',
    detail: trailTerminal(claim.patient_sources[0]?.path),
  });
  return steps;
}

export function metrics() {
  const claims = getClaims();
  const verifiedPrimary = claims.filter((c) => c.verification_status === 'verified').length;
  return {
    diagnoses: 0,
    clinicianReviews: 0,
    verifiedPrimary,
    claimCount: claims.length,
    openQuestions: getUnresolvedQuestions().length,
    corrections: CORRECTIONS.length,
    literatureCards: loadRepoYaml<{ card_count: number; unique_work_count: number }>(
      'literature/catalog.yaml',
    ).card_count,
    uniqueWorks: loadRepoYaml<{ unique_work_count: number }>('literature/catalog.yaml')
      .unique_work_count,
    hypotheses: getHypotheses().length,
  };
}

export function kindMeta(kind: string) {
  return KIND_LABELS[kind] || { glyph: '·', label: kind, css: 'interp' };
}

export function verificationMeta(status: string) {
  return (
    VERIFICATION_LABELS[status] || {
      label: status,
      ticks: 0,
      border: 'solid' as const,
    }
  );
}

export function reviewMeta(status: string) {
  return REVIEW_LABELS[status] || { glyph: '○', label: status };
}

export function confidenceLabel(c: string | null | undefined): string {
  if (!c) return '—';
  return CONFIDENCE_LABELS[c] || c;
}

/** Dual-track timeline rows from dated claims (documented vs reported). */
export function dualTrackTimeline(): {
  date: string;
  documented: string;
  reported: string;
  claim_ids: string[];
}[] {
  const dated = getClaims().filter((c) =>
    (c.patient_sources || []).some((s) => s.record_date && /^\d{4}/.test(s.record_date)),
  );
  const byYear = new Map<string, Claim[]>();
  for (const c of dated) {
    const d = c.patient_sources.find((s) => s.record_date)?.record_date || '';
    const year = d.slice(0, 4);
    if (!year) continue;
    const arr = byYear.get(year) || [];
    arr.push(c);
    byYear.set(year, arr);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, claims]) => {
      const documented = claims
        .filter((c) => c.kind === 'observed_fact')
        .map((c) => `${c.id}: ${c.public_statement}`)
        .slice(0, 3);
      const reported = claims
        .filter((c) => c.kind === 'reported_history')
        .map((c) => `${c.id}: ${c.public_statement}`)
        .slice(0, 3);
      return {
        date: year,
        documented: documented.join(' ') || '— no record retrieved —',
        reported: reported.join(' ') || '— no record retrieved —',
        claim_ids: claims.map((c) => c.id),
      };
    });
}

/** Atlas table rows: hypothesis × support/contradiction/open questions. */
export function atlasTableRows() {
  return getHypotheses().map((h) => ({
    id: h.id,
    title: h.title,
    kind: h.kind,
    confidence: h.confidence,
    explains: h.explains_claim_ids,
    does_not_explain: h.does_not_explain_claim_ids,
    supporting_lit: h.supporting_literature_ids,
    contradicting_lit: h.contradicting_literature_ids,
    open_questions: h.open_question_ids,
  }));
}

export interface AtlasNode {
  id: string;
  /** findings = documented observed_fact only; hypothesis/history never land there (P0-3). */
  band: 'findings' | 'history' | 'interpretations' | 'hypotheses' | 'contradictions' | 'questions';
  label: string;
}

export interface AtlasEdge {
  from: string;
  to: string;
  verb: string;
}

/**
 * Evidence Atlas P1 graph: real record-ID nodes in bands with verb-labeled undirected edges.
 * Built from loaded hypotheses + claim kinds (no schematic placeholders).
 *
 * Band rules (Checkpoint G P0-3):
 * - kind: observed_fact → findings ("Documented findings")
 * - kind: reported_history → history (distinct band; never findings)
 * - kind: interpretation → interpretations
 * - kind: hypothesis → hypotheses or interpretations; NEVER findings
 * - kind: research_question → questions
 * A hypothesis claim (e.g. H1 thesis restated as CLM-0049) must not appear as a
 * documented finding that "would explain" the same hypothesis (circular self-support).
 */
export function buildEvidenceAtlas(): {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  bands: { key: AtlasNode['band']; label: string }[];
} {
  // Prefer non-null hyps for the middle band; H-NULL is a qualitative baseline, not an atlas node.
  const modelHyps = getHypotheses().filter((h) => h.id !== 'H-NULL');
  const claimMap = new Map(getClaims().map((c) => [c.id, c]));
  const nodes = new Map<string, AtlasNode>();
  const edges: AtlasEdge[] = [];
  const edgeKey = new Set<string>();

  function addNode(n: AtlasNode) {
    if (!nodes.has(n.id)) nodes.set(n.id, n);
  }
  function addEdge(from: string, to: string, verb: string) {
    const a = from < to ? from : to;
    const b = from < to ? to : from;
    const k = `${a}|${b}|${verb}`;
    if (edgeKey.has(k)) return;
    edgeKey.add(k);
    edges.push({ from, to, verb });
  }

  for (const h of modelHyps) {
    addNode({ id: h.id, band: 'hypotheses', label: h.id });

    for (const cid of h.explains_claim_ids) {
      const c = claimMap.get(cid);
      if (!c) continue;
      const kind = c.kind;
      if (kind === 'hypothesis') {
        // Never treat a hypothesis-kind claim as a documented finding (circular self-support).
        addNode({ id: cid, band: 'interpretations', label: cid });
        addEdge(cid, h.id, 'restates architecture');
      } else if (kind === 'reported_history') {
        addNode({ id: cid, band: 'history', label: cid });
        addEdge(cid, h.id, 'would explain');
      } else if (kind === 'interpretation') {
        addNode({ id: cid, band: 'interpretations', label: cid });
        addEdge(cid, h.id, 'interpreted toward');
      } else if (kind === 'research_question') {
        addNode({ id: cid, band: 'questions', label: cid });
        addEdge(h.id, cid, 'leaves open');
      } else {
        // observed_fact and any other documented-fact kinds
        addNode({ id: cid, band: 'findings', label: cid });
        addEdge(cid, h.id, 'would explain');
      }
    }

    for (const cid of h.does_not_explain_claim_ids) {
      const c = claimMap.get(cid);
      if (!c) continue;
      const kind = c.kind;
      // Checkpoint H P1-4: reported_history that a hypothesis fails to explain stays in the
      // history band (with a "does not explain" edge) — never promoted to "Contradicting evidence".
      if (kind === 'reported_history') {
        addNode({ id: `hist-contra-${cid}`, band: 'history', label: cid });
        addEdge(h.id, `hist-contra-${cid}`, 'does not explain');
      } else if (kind === 'hypothesis') {
        addNode({ id: `interp-contra-${cid}`, band: 'interpretations', label: cid });
        addEdge(h.id, `interp-contra-${cid}`, 'does not explain');
      } else if (kind === 'interpretation') {
        addNode({ id: `interp-contra-${cid}`, band: 'interpretations', label: cid });
        addEdge(h.id, `interp-contra-${cid}`, 'does not explain');
      } else if (kind === 'research_question') {
        addNode({ id: `q-contra-${cid}`, band: 'questions', label: cid });
        addEdge(h.id, `q-contra-${cid}`, 'does not explain');
      } else {
        addNode({
          id: `contra-${cid}`,
          band: 'contradictions',
          label: cid,
        });
        addEdge(h.id, `contra-${cid}`, 'does not explain');
      }
    }

    for (const lid of h.contradicting_literature_ids.slice(0, 4)) {
      addNode({ id: lid, band: 'contradictions', label: lid });
      addEdge(h.id, lid, 'contradicted by');
    }

    for (const uid of h.open_question_ids) {
      addNode({ id: uid, band: 'questions', label: uid });
      addEdge(h.id, uid, 'leaves open');
    }
  }

  const allBands: { key: AtlasNode['band']; label: string }[] = [
    { key: 'findings', label: 'Documented findings' },
    { key: 'history', label: 'Patient-reported / history' },
    { key: 'interpretations', label: 'Interpretations' },
    { key: 'hypotheses', label: 'Working hypotheses' },
    { key: 'contradictions', label: 'Contradicting evidence' },
    { key: 'questions', label: 'Open questions (terminal)' },
  ];
  const nodeList = [...nodes.values()];
  // Checkpoint H P1-4: do not render empty labelled bands (false “no history entered” signal).
  const bands = allBands.filter((b) => nodeList.some((n) => n.band === b.key));

  return {
    nodes: nodeList,
    edges,
    bands,
  };
}

/** Finding × hypothesis matrix cells. */
export function matrixCell(
  claimId: string,
  h: Hypothesis,
): '+' | '−' | '·' | '?' {
  if (h.explains_claim_ids.includes(claimId)) return '+';
  if (h.does_not_explain_claim_ids.includes(claimId)) return '−';
  return '·';
}

/**
 * Pre-registered qualitative outcome matrix for top clinician questions.
 * strengthen | weaken | unchanged | reframe — no diagnosis, no test orders.
 */
export interface PredictionCell {
  hypothesis_id: string;
  if_supportive: 'strengthen' | 'weaken' | 'unchanged' | 'reframe';
  if_against: 'strengthen' | 'weaken' | 'unchanged' | 'reframe';
  if_inconclusive: 'strengthen' | 'weaken' | 'unchanged' | 'reframe';
  note?: string;
}

export interface PredictionRow {
  question_id: string;
  question: string;
  cells: PredictionCell[];
}

/**
 * Explicit exceptions: prediction-matrix hypothesis cells that may appear beyond
 * CQ related_hypothesis_ids. Documented only — not silent drift.
 * H-NULL is allowed as a qualitative baseline row when listed here.
 */
export const PREDICTION_MATRIX_EXCEPTIONS: Record<string, string[]> = {
  // Bone-marker / calcium rows may reframe the modular null model without claiming diagnosis.
  'CQ-001': ['H-NULL'],
  'CQ-002': ['H-NULL'],
  'CQ-005': ['H-NULL'],
  'CQ-009': ['H-NULL'],
};

/**
 * Raw static prediction rows (mode-independent).
 * CQ-005 = KIT / mast-cell (H1), not infection (H4).
 * CQ-009 = infection adjudication (H4), not residual non-infection limb (H5).
 */
export function getPredictionMatrixRawRows(): PredictionRow[] {
  const allQs = loadQuestionsRaw();
  const byId = new Map(allQs.map((q) => [q.id, q]));
  return [
    {
      question_id: 'CQ-001',
      question: byId.get('CQ-001')?.question || '',
      cells: [
        { hypothesis_id: 'H3', if_supportive: 'strengthen', if_against: 'weaken', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H2', if_supportive: 'reframe', if_against: 'unchanged', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H-NULL', if_supportive: 'weaken', if_against: 'strengthen', if_inconclusive: 'unchanged' },
      ],
    },
    {
      question_id: 'CQ-002',
      question: byId.get('CQ-002')?.question || '',
      cells: [
        { hypothesis_id: 'H2', if_supportive: 'strengthen', if_against: 'weaken', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H1', if_supportive: 'strengthen', if_against: 'unchanged', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H-NULL', if_supportive: 'weaken', if_against: 'strengthen', if_inconclusive: 'unchanged' },
      ],
    },
    {
      question_id: 'CQ-003',
      question: byId.get('CQ-003')?.question || '',
      cells: [
        { hypothesis_id: 'H3', if_supportive: 'strengthen', if_against: 'weaken', if_inconclusive: 'unchanged' },
      ],
    },
    {
      question_id: 'CQ-005',
      question: byId.get('CQ-005')?.question || '',
      cells: [
        { hypothesis_id: 'H1', if_supportive: 'strengthen', if_against: 'weaken', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H-NULL', if_supportive: 'weaken', if_against: 'strengthen', if_inconclusive: 'unchanged' },
      ],
    },
    {
      question_id: 'CQ-009',
      question: byId.get('CQ-009')?.question || '',
      cells: [
        { hypothesis_id: 'H4', if_supportive: 'strengthen', if_against: 'weaken', if_inconclusive: 'unchanged' },
        { hypothesis_id: 'H-NULL', if_supportive: 'weaken', if_against: 'strengthen', if_inconclusive: 'unchanged' },
      ],
    },
  ];
}

/** Static pre-registered qualitative outcomes for high/don't-miss CQs (mode-filtered). */
export function getPredictionMatrix(): PredictionRow[] {
  const qs = getClinicianQuestions().filter((q) => q.dont_miss || q.priority === 'high');
  const visible = new Set(qs.map((q) => q.id));
  const byId = new Map(loadQuestionsRaw().map((q) => [q.id, q]));

  return getPredictionMatrixRawRows()
    .filter((r) => visible.has(r.question_id))
    .map((r) => {
      const q = byId.get(r.question_id)!;
      const allowed = new Set([
        ...(q.related_hypothesis_ids || []),
        ...(PREDICTION_MATRIX_EXCEPTIONS[r.question_id] || []),
      ]);
      return {
        question_id: r.question_id,
        question: q.question,
        cells: r.cells.filter((c) => allowed.has(c.hypothesis_id)),
      };
    });
}

/**
 * Validate prediction-matrix mappings against related_hypothesis_ids + exceptions.
 * Throws if a cell targets an undeclared hypothesis (used by tests / validate_all).
 */
export function assertPredictionMatrixConsistent(
  questions: ClinicianQuestion[] = loadQuestionsRaw(),
  rows: PredictionRow[] = getPredictionMatrixRawRows(),
): void {
  const byId = new Map(questions.map((q) => [q.id, q]));
  for (const row of rows) {
    const q = byId.get(row.question_id);
    if (!q) {
      throw new Error(`Prediction matrix row ${row.question_id} has no clinician question record`);
    }
    const allowed = new Set([
      ...(q.related_hypothesis_ids || []),
      ...(PREDICTION_MATRIX_EXCEPTIONS[row.question_id] || []),
    ]);
    for (const cell of row.cells) {
      if (!allowed.has(cell.hypothesis_id)) {
        throw new Error(
          `Prediction matrix ${row.question_id} maps to ${cell.hypothesis_id} which is neither ` +
            `in related_hypothesis_ids (${(q.related_hypothesis_ids || []).join(',')}) nor ` +
            `PREDICTION_MATRIX_EXCEPTIONS`,
        );
      }
    }
  }
}
