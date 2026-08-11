/**
 * Record-preview payloads for accessible tooltips (CLM, H, UQ, COR, lit).
 * Excerpts are deterministic truncations of approved public fields — never AI-rewritten.
 * Never expose private / unapproved fields in preview payloads.
 */
import { KIND_LABELS } from './constants';
import {
  getClaims,
  getCorrections,
  getHypotheses,
  getLaunchLiterature,
  getUnresolvedQuestions,
  type Claim,
  type CorrectionRef,
  type Hypothesis,
  type LitEntry,
  type UnresolvedQuestion,
} from './data';
import { withBase } from './paths';

export type RecordPreviewType =
  | 'claim'
  | 'hypothesis'
  | 'unresolved_question'
  | 'correction'
  | 'literature';

/** Generic record preview for tooltip runtime (CLM + H + UQ). */
export interface RecordPreview {
  id: string;
  record_type: RecordPreviewType;
  /** Deterministic truncation of an approved public field. */
  excerpt: string;
  /** Human-readable type banner shown in the tooltip. */
  type_label: string;
  /** Optional navigation href (null = focusable chip only, no invented route). */
  href: string | null;
  // Claim-specific (public fields only)
  kind?: string;
  kind_label?: string;
  medical_domain?: string;
  // Hypothesis-specific (public fields only)
  title?: string;
  hypothesis_kind?: string;
  confidence?: string;
  // UQ-specific (public fields only) — `status` is shared with COR previews.
  status?: string;
  category?: string;
  related_hypothesis_ids?: string[];
  // Literature-specific (public fields only — both already render on /literature/<id>/)
  year?: string;
  study_type?: string;
}

/** @deprecated Prefer RecordPreview — kept for call-site clarity on CLM-only helpers. */
export type ClaimPreview = RecordPreview;

/** Word-boundary truncate of an approved public string (no paraphrase). */
export function claimExcerpt(publicStatement: string, maxLen = 160): string {
  const t = String(publicStatement || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const sp = cut.lastIndexOf(' ');
  const base = (sp > Math.floor(maxLen * 0.4) ? cut.slice(0, sp) : cut).trimEnd();
  return `${base}…`;
}

/** Alias — same deterministic truncate for any approved public field. */
export const recordExcerpt = claimExcerpt;

export function claimKindLabel(kind: string): string {
  return KIND_LABELS[kind]?.label || kind || 'claim';
}

export function isClaimId(id: string | null | undefined): boolean {
  return Boolean(id && /^CLM-\d{4}$/.test(id));
}

export function isHypothesisId(id: string | null | undefined): boolean {
  return Boolean(id && (/^H\d+$/.test(id) || id === 'H-NULL'));
}

export function isUqId(id: string | null | undefined): boolean {
  return Boolean(id && /^UQ-\d{4}$/.test(id));
}

export function isCorrectionId(id: string | null | undefined): boolean {
  return Boolean(id && /^COR-\d{4}$/.test(id));
}

export function isLitId(id: string | null | undefined): boolean {
  return Boolean(id && /^lit-\d{4}$/.test(id));
}

export function claimPreviewFromClaim(c: Claim): RecordPreview {
  return {
    id: c.id,
    record_type: 'claim',
    type_label: 'Approved public claim statement',
    excerpt: claimExcerpt(c.public_statement || ''),
    href: withBase(`/case/#${c.id}`),
    kind: c.kind || '',
    kind_label: claimKindLabel(c.kind || ''),
    medical_domain: (c.medical_domain || 'unspecified').replace(/_/g, ' '),
  };
}

export function hypothesisPreviewFromHypothesis(h: Hypothesis): RecordPreview {
  return {
    id: h.id,
    record_type: 'hypothesis',
    type_label: 'Working research hypothesis — not a diagnosis.',
    excerpt: claimExcerpt(h.public_summary || '', 180),
    href: withBase(`/working-model/#${h.id}`),
    title: h.title || '',
    hypothesis_kind: (h.kind || '').replace(/_/g, ' '),
    confidence: h.confidence || '',
  };
}

/**
 * Hypotheses that list this UQ in open_question_ids (approved surface only).
 * Derived linkage — not a free-text AI summary.
 */
export function relatedHypothesisIdsForUq(uqId: string): string[] {
  return getHypotheses()
    .filter((h) => (h.open_question_ids || []).includes(uqId))
    .map((h) => h.id);
}

export function uqPreviewFromUq(q: UnresolvedQuestion): RecordPreview {
  // No stable public UQ fragment route — chip is focusable without inventing a destination.
  return {
    id: q.id,
    record_type: 'unresolved_question',
    type_label: 'Open research question — not a test order or treatment recommendation.',
    excerpt: claimExcerpt(q.question || '', 180),
    href: null,
    status: (q.status || '').replace(/_/g, ' '),
    category: (q.topic || '').replace(/_/g, ' '),
    related_hypothesis_ids: relatedHypothesisIdsForUq(q.id),
  };
}

/**
 * Correction / supersession notice preview.
 * Every field here is already public on /changelog/ (register + per-entry list) and on
 * /case/ correction badges: the COR id, its short title, and its status. Nothing else
 * is exposed.
 *
 * The title is surfaced verbatim (deterministic truncation only) and is deliberately NOT
 * run through toPublicLanguage. A correction record's job is to name the wording that was
 * corrected — e.g. COR-0003 quotes “Catastrophic osteoporosis” as the internal phrasing it
 * retired. Rewriting that quotation would both make the record incoherent and silently edit
 * a published correction, which is the exact thing the notice promises never happens. This
 * matches how the same titles already render on /changelog/ and in the /case/ correction
 * badges; it does not relax any gate, because assertSafePublicLanguage has never been
 * applied to the corrections register.
 */
export function correctionPreviewFromCorrection(c: CorrectionRef): RecordPreview {
  return {
    id: c.id,
    record_type: 'correction',
    type_label: 'Correction / supersession notice — recorded publicly, never silently edited.',
    excerpt: recordExcerpt(c.title || '', 180),
    href: withBase(`/changelog/#${c.id}`),
    status: (c.status || '').replace(/_/g, ' '),
  };
}

/**
 * Literature (bibliographic card) preview.
 *
 * Every field here already renders on the public literature routes: the lit id and title in
 * the `/literature/<id>/` hero, the year in the byline line beneath it, and the study design
 * in that page's badge row (`study design: …`). Nothing else is exposed — in particular
 * `quality_notes` and `patient_overlap` are applicability text gated behind
 * `literatureApplicabilityApproved()` per site mode, and `local_pdf` / `_file` are repository
 * paths that are never linked. All four are listed in PREVIEW_FORBIDDEN_PAYLOAD_KEYS.
 *
 * The title is surfaced verbatim (deterministic truncation only) and deliberately NOT run
 * through toPublicLanguage, matching how the same titles already render on /literature/ and
 * /literature/<id>/: a bibliographic title is the identity of a published work, and rewriting
 * it would misattribute the source. This relaxes no gate — assertSafePublicLanguage has never
 * been applied to catalog titles, only to the applicability fields above.
 *
 * `study_type` keeps its catalog spelling (`case-series`, `basic-science`, …) because that is
 * the exact string the badge row shows; a preview must not read differently from the record.
 */
export function litPreviewFromEntry(e: LitEntry): RecordPreview {
  return {
    id: e.id,
    record_type: 'literature',
    type_label: 'Published literature card — a bibliographic reference, not patient data.',
    excerpt: recordExcerpt(e.title || '', 180),
    href: withBase(`/literature/${e.id}/`),
    year: e.year === 0 || e.year ? String(e.year) : '',
    study_type: e.study_type || '',
  };
}

/** Map of public-approved claim IDs → preview payload (CLM only). */
export function getClaimPreviewMap(): Record<string, RecordPreview> {
  const out: Record<string, RecordPreview> = {};
  for (const c of getClaims()) {
    if (!c?.id?.startsWith('CLM-')) continue;
    out[c.id] = claimPreviewFromClaim(c);
  }
  return out;
}

/**
 * Map of literature IDs → preview payload, restricted to the launch-critical set.
 *
 * Only the launch subset gets `/literature/<id>/` routes (see getStaticPaths in
 * `pages/literature/[id].astro`), so restricting the map is what keeps every preview `href`
 * a route that actually exists in dist. It also keeps the runtime payload — inlined on every
 * page by BaseLayout — from carrying all 339 catalog cards.
 */
export function getLiteraturePreviewMap(): Record<string, RecordPreview> {
  const out: Record<string, RecordPreview> = {};
  for (const e of getLaunchLiterature()) {
    if (!isLitId(e.id)) continue;
    out[e.id] = litPreviewFromEntry(e);
  }
  return out;
}

/**
 * Unified map of approved public CLM + H + UQ + COR + lit records for the tooltip runtime.
 * Keys are record IDs only — private/unapproved entities are never included.
 */
export function getRecordPreviewMap(): Record<string, RecordPreview> {
  const out: Record<string, RecordPreview> = { ...getClaimPreviewMap() };
  for (const h of getHypotheses()) {
    if (!isHypothesisId(h.id)) continue;
    out[h.id] = hypothesisPreviewFromHypothesis(h);
  }
  for (const q of getUnresolvedQuestions()) {
    if (!isUqId(q.id)) continue;
    out[q.id] = uqPreviewFromUq(q);
  }
  for (const c of getCorrections()) {
    if (!isCorrectionId(c.id)) continue;
    out[c.id] = correctionPreviewFromCorrection(c);
  }
  Object.assign(out, getLiteraturePreviewMap());
  return out;
}

/** Forbidden keys that must never appear in serialized preview JSON. */
export const PREVIEW_FORBIDDEN_PAYLOAD_KEYS = [
  'owner',
  'closest_available_record',
  'related_corrections',
  'blocks_launch_critical_wording',
  'why_it_matters',
  'summary', // private raw hypothesis summary — only public_summary via excerpt
  'public_statement', // full statement not needed; excerpt only
  'public_summary',
  'what_would_change',
  'what_would_not_change',
  'explains_claim_ids',
  'does_not_explain_claim_ids',
  // LitEntry fields that must never reach a preview payload.
  'quality_notes', // applicability prose, gated per site mode by literatureApplicabilityApproved()
  'patient_overlap', // same gate — reads this record onto the patient
  'local_pdf', // local research PDF path; never hosted or linked
  '_file', // repository path of the catalog entry
] as const;

/**
 * Build progressive-enhancement data attributes for a preview target.
 * Uses data-record-preview (unified) and keeps data-claim-preview for CLM back-compat.
 */
export function recordPreviewDataAttrs(
  preview: RecordPreview | null | undefined,
): Record<string, string> {
  if (!preview?.id || !preview.excerpt) return {};
  const attrs: Record<string, string> = {
    'data-record-preview': preview.id,
    'data-record-type': preview.record_type,
    'data-record-excerpt': preview.excerpt,
    'data-record-type-label': preview.type_label,
  };
  if (preview.record_type === 'claim') {
    attrs['data-claim-preview'] = preview.id;
    if (preview.kind) attrs['data-claim-kind'] = preview.kind;
    if (preview.kind_label) attrs['data-claim-kind-label'] = preview.kind_label;
    if (preview.medical_domain) attrs['data-claim-domain'] = preview.medical_domain;
    attrs['data-claim-excerpt'] = preview.excerpt;
  }
  if (preview.record_type === 'hypothesis') {
    if (preview.title) attrs['data-record-title'] = preview.title;
    if (preview.hypothesis_kind) attrs['data-record-kind'] = preview.hypothesis_kind;
    if (preview.confidence) attrs['data-record-confidence'] = preview.confidence;
  }
  if (preview.record_type === 'unresolved_question') {
    if (preview.status) attrs['data-record-status'] = preview.status;
    if (preview.category) attrs['data-record-category'] = preview.category;
    if (preview.related_hypothesis_ids?.length) {
      attrs['data-record-related-h'] = preview.related_hypothesis_ids.join(',');
    }
  }
  if (preview.record_type === 'correction') {
    if (preview.status) attrs['data-record-status'] = preview.status;
  }
  if (preview.record_type === 'literature') {
    if (preview.year) attrs['data-record-year'] = preview.year;
    if (preview.study_type) attrs['data-record-study-type'] = preview.study_type;
  }
  return attrs;
}
