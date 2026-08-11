/** Full five-sentence research-only disclaimer (language guide §1). */
export const DISCLAIMER_FULL =
  'AI-assisted research summary for educational purposes only. This site does not provide medical advice, diagnosis, or treatment. Records and interpretations may be incomplete or incorrect. A licensed clinician must verify the underlying records, interpret all findings, and decide whether any testing or treatment is appropriate. Do not start, stop, or change treatment based on this site.';

/** Short restatement for sticky mobile strip and print footers. */
export const DISCLAIMER_SHORT =
  'Research only — not medical advice. A licensed clinician must verify all records.';

/**
 * Persistent compact status on every HTML and printable route (Checkpoint F.1.1).
 * Keep wording stable — automated rendered-output tests match these phrases.
 */
export const PERSISTENT_STATUS_NOTICE =
  'Research preview · Not medical advice · Published with Drift0r’s permission · Permission is not endorsement · Not clinician-reviewed';

/**
 * Compact print-visible notice required on every physical printed page of every
 * printable route (Checkpoint G.1 / P0-2). Not .no-print; not inside .site-footer.
 * Keep phrases stable — print-visible markup tests match these substrings.
 */
export const PRINT_PAGE_DISCLAIMER_COMPACT =
  'Research preview · Not medical advice · Published with Drift0r’s permission · Permission is not endorsement · Not clinician-reviewed · Licensed clinicians must verify underlying records · Do not start, stop, or change treatment based on this material';

/** Landing-page opening line (must remain prominent). */
export const LANDING_OPENING_CAVEAT =
  'Initial research preview — incomplete and open to correction.';

/** Neutral masthead retained as the editorial project name after approval (DEC-0026). */
export const MASTHEAD_NAME = 'Research Evidence Portfolio';

/**
 * Patient-hosted external source folder (not redistributed by this repository).
 * Controlled by Drift0r; contents may change; never copied into the sanitized public tree.
 * Folder is anonymously accessible when the patient elects that; permission to publish
 * this site is not endorsement of folder contents or of any finding.
 */
export const PATIENT_SOURCE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1z_juK9yVdhbzaGJafzzZYZWe3U1cs37e';

/**
 * Public GitHub repository URL for contribution links (build-time configuration).
 *
 * Injected via DRIFT0R_PUBLIC_REPO_URL at Astro build (vite envPrefix includes DRIFT0R_).
 * Empty / placeholder means the contribute page stays policy-only (non-actionable).
 * The publication launch gate certifies the *rendered* contribution HTML — an env
 * override at gate time alone cannot pass if this was empty at build time.
 */
function readBuildTimePublicRepoUrl(): string {
  // Vite/Astro: import.meta.env.DRIFT0R_PUBLIC_REPO_URL when envPrefix includes DRIFT0R_
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const fromVite = (env?.DRIFT0R_PUBLIC_REPO_URL || env?.PUBLIC_REPO_URL || '').trim();
    if (fromVite) return fromVite;
  } catch {
    /* non-vite */
  }
  if (typeof process !== 'undefined' && process.env?.DRIFT0R_PUBLIC_REPO_URL) {
    return process.env.DRIFT0R_PUBLIC_REPO_URL.trim();
  }
  return '';
}

export const PUBLIC_REPO_URL = readBuildTimePublicRepoUrl();

const PLACEHOLDER_RE =
  /example\.invalid|example\.com|localhost|127\.0\.0\.1|\.local\b|0\.0\.0\.0/i;

/**
 * True when URL is a usable non-placeholder **https** public repo root.
 * Rejects empty, placeholder hosts, non-HTTPS, and malformed paths.
 * GitHub: exactly two pathname segments (owner/repo); no query/fragment.
 * Keep aligned with site/scripts/repo-url.mjs validatePublicRepoUrl().
 */
export function isPublicRepoConfigured(url: string = PUBLIC_REPO_URL): boolean {
  const u = (url || '').trim();
  if (!u) return false;
  if (PLACEHOLDER_RE.test(u)) return false;
  if (/\s/.test(u)) return false;
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (!parsed.hostname || !parsed.hostname.includes('.')) return false;
  if (parsed.search || parsed.hash) return false;
  const parts = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
    // Exactly owner/repo — reject /tree, /issues, /wiki, extra segments, username-only.
    if (parts.length !== 2) return false;
    if (!parts[0] || !parts[1]) return false;
  } else if (parts.length < 1) {
    return false;
  }
  return true;
}

/**
 * Normalized public repo root + moderated contribution issue URLs.
 * Returns null when PUBLIC_REPO_URL is empty/placeholder — callers must not invent links.
 * Single source of truth for View on GitHub / issues/new/choose / issues list.
 */
export function getPublicRepoContributionLinks(
  url: string = PUBLIC_REPO_URL,
): {
  repoUrl: string;
  issuesNewChooseUrl: string;
  issuesListUrl: string;
  /** Dedicated template for correction / privacy / removal — never a privacy@ email. */
  privacyCorrectionIssueUrl: string;
} | null {
  if (!isPublicRepoConfigured(url)) return null;
  const repoUrl = url.trim().replace(/\/+$/, '');
  return {
    repoUrl,
    issuesNewChooseUrl: `${repoUrl}/issues/new/choose`,
    issuesListUrl: `${repoUrl}/issues`,
    privacyCorrectionIssueUrl: `${repoUrl}/issues/new?template=privacy_correction_removal.yml`,
  };
}

/**
 * Public URL for a created annotated release tag, or null when the repo URL is not
 * configured at build time. Derived — never store a full GitHub URL in changelog data,
 * so the repo location stays single-sourced from PUBLIC_REPO_URL.
 */
export function getReleaseTagUrl(
  tag: string,
  url: string = PUBLIC_REPO_URL,
): string | null {
  const t = (tag || '').trim();
  if (!t) return null;
  if (!isPublicRepoConfigured(url)) return null;
  return `${url.trim().replace(/\/+$/, '')}/releases/tag/${encodeURIComponent(t)}`;
}

/** Stable contribution CTA lead copy (rendered-output tests match these phrases). */
export const CONTRIBUTION_CTA_LEAD =
  'Found incorrect data, a citation problem, contradictory evidence, new research, or another possible interpretation? Please raise a GitHub issue. Contributions are reviewed before they affect the published research.';

/** GitHub-account + safety note on every contribution CTA. */
export const CONTRIBUTION_CTA_ACCOUNT_NOTE =
  'A GitHub account is currently required to submit an issue. Do not post private medical records, personal identifiers, treatment instructions, or unsupported diagnoses. Use the correction/privacy/removal template for those requests — never paste private records into a public issue.';

/** Primary navigation items (design spec §1.2). */
export const PRIMARY_NAV = [
  { href: '/case/', label: 'Case & evidence' },
  { href: '/working-model/', label: 'Working model' },
  // The unified questions surface is the nav slot; /questions-for-clinicians/ keeps its
  // route, its anchors, and a pointer from here. isCurrent() uses startsWith, and
  // '/questions-for-clinicians/'.startsWith('/questions/') is false — no highlight bleed.
  { href: '/questions/', label: 'Questions' },
  { href: '/literature/', label: 'Literature' },
  { href: '/methods/', label: 'Methods' },
  { href: '/for-clinicians/', label: 'For clinicians' },
] as const;

/** Forbidden medical / sensational phrasing on medical pages (language guide §7). */
export const FORBIDDEN_PHRASES = [
  'cure',
  'proven cause',
  'definitely',
  'undeniable',
  'boss fight',
  'achievement unlocked',
  'you should start',
  'you should stop',
  'confirmed bartonella',
  'confirmed babesia',
  'confirmed infection',
  'confirmed thiamine',
  'confirmed dry beriberi',
  'catastrophic',
  'severe osteoporosis',
  'severe early osteoporosis',
  'severe markedly low bmd',
  'extreme young-adult osteoporosis',
  'dying of',
  'doomed',
  'mystery illness',
  'doctors were stunned',
  'finally explained',
  'cracked the case',
  'order this test now',
  'you must start',
  'self-experiment protocol',
  'needing anabolic therapy',
  'considering teriparatide',
] as const;

/**
 * Dose-figure patterns: a number, a mass unit, and regimen/frequency language around it.
 *
 * Lab measurement contexts (mg/24h, µg/L, mcg/mL, mg/kg, mg/day) are NOT matched — the
 * negative lookahead on the denominator keeps them literal.
 *
 * DEC-0039 (v0.4.0) makes this set *conditional*: where the sentence carrying the figure is
 * written as attributed record, the figure is publishable history and these do not fire.
 * Where it is not so written — or is written prescriptively — they still do.
 *
 * The gate and the redaction transform ask the same two questions (isHistoricalRecord /
 * isPrescriptive in language.ts) about the same sentence, per figure. That is what stops them
 * disagreeing: any figure the transform kept is one the gate also reads as attributed, and any
 * figure it redacted is gone before the gate runs.
 */
export const FORBIDDEN_DOSE_PATTERNS: RegExp[] = [
  // Prescription-style: number + mass unit + dosing frequency (not lab denominators).
  /\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b(?!\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h)\b)\s*(?:daily|weekly|bid|tid|qid|prn|when needed|eod|every)\b/i,
  // Bare patient-regimen dose near drug names (historical leakage pattern).
  /\b(?:regimen|dose|dosing)\b[^.\n]{0,40}\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b/i,
  // "every other day" is spelled out here as well as abbreviated: the first pattern only sees a
  // frequency sitting immediately after the unit, so "25 mg of compound every other day" reached
  // neither pattern and published as a bare prescription-shaped dose.
  /\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b(?!\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h)\b)[^.\n]{0,40}\b(?:regimen|daily|weekly|eod|every other day|every \d+ (?:days?|weeks?|hours?))\b/i,
];

/**
 * Care-plan and recommendation constructions. These are **absolute** and DEC-0039 does not
 * touch them: the decision relaxed publication of what the patient is recorded as having
 * taken, not of what a reader should do. "He took 25 mg daily in 2021" is record;
 * "consider teriparatide" is advice however it is framed, so historical wording must never
 * buy it passage.
 */
// Drugs this project may name. clomiphene/anastrozole are here because DEC-0039 newly permits
// printing them as record — which means the care-plan bar has to cover them too. Before v0.4.0
// they were generalised on every path, so "consider clomiphene" came out as generic wording and
// no care-plan pattern was needed; now that the real name can survive, its absence from this
// list would have been the one drug you could recommend by name.
// The generic class wording toPublicLanguage() substitutes for clomiphene and anastrozole.
// The gate runs on the *output* of that transform, so listing only the real names left a hole:
// "consider clomiphene" was generalised to "consider a selective estrogen-receptor modulator"
// and then read as clean, because the string the pattern was looking for no longer existed.
// Redaction laundered the recommendation instead of blocking it. Teriparatide never had this
// problem only because its real name is kept. Keep these in step with the drugNameReplacer
// generics in language.ts.
const GENERIC_DRUG_CLASSES = 'selective estrogen-receptor modulator|aromatase inhibitor';

const NAMED_DRUGS = `teriparatide|forteo|anabolic|thiazide|clomiphene|clomifene|anastrozole|${GENERIC_DRUG_CLASSES}`;

/**
 * Where a clause can begin, for the purpose of spotting an instruction.
 *
 * Exported and shared rather than written out in each place that needs it. Both this file's
 * care-plan patterns and isPrescriptive() in language.ts have to agree on what an instruction
 * looks like, and twice now they have drifted apart instead: first over the semicolon, then over
 * the comma, and each time the disagreement was invisible because both sides still passed their
 * own tests. A comma is a clause opener here for the same reason a semicolon is a boundary in
 * sentenceAround — "Per the record, start clomiphene 25 mg daily" is an instruction wearing an
 * attribution as a hat, and the attribution does not reach past the comma to license it.
 */
export const CLAUSE_OPENER = '(?:^|[.;:!?]\\s+|,\\s+|[—–]\\s*|\\s-+\\s+|\\n\\s*)';

export const FORBIDDEN_CARE_PLAN_PATTERNS: RegExp[] = [
  // Recommend/suggest sit alongside consider/plan because the transform can now redact its way
  // out of this pattern: "recommended clomiphene 25 mg daily" becomes "recommended a selective
  // estrogen-receptor modulator [dose withheld] daily", which loses the figure but still reads as
  // a recommendation of a drug class. Withholding the number is not the same as not advising.
  new RegExp(
    `\\b(needing|considering|consider|plan|planning|recommend|recommends|recommended|recommending|suggest|suggests|suggested|suggesting)\\s+(?:(?:to|starting|start|adding|add)\\s+)?(?:an?\\s+|the\\s+)?[a-z0-9/-]*\\s*(therapy|${NAMED_DRUGS})\\b`,
    'i',
  ),
  // Sequenced care-plan arrow constructions naming bone-building drugs.
  new RegExp(`→\\s*consider\\s+(?:an?\\s+)?[a-z0-9/-]*\\s*(${NAMED_DRUGS})`, 'i'),
  // Bare imperative naming a drug, with no dose attached. isPrescriptive() catches the shape,
  // but the gate only ever consulted it while walking dose matches — so "Take teriparatide."
  // was prescriptive, unredacted and unflagged all at once, because it had no figure to walk.
  // Anchored to a clause opening so ordinary past-tense prose ("taking at the time was …",
  // the one collocation of this kind in the published corpus) is not swept up.
  new RegExp(
    `${CLAUSE_OPENER}(?:take|start|stop|switch to|add|continue|try)\\s+(?:an?\\s+|the\\s+)?[a-z0-9/-]*\\s*(therapy|${NAMED_DRUGS})\\b`,
    'i',
  ),
  /\bstart\/stop\b/i,
  /\byou should (start|stop)\b/i,
];

/**
 * Treatment / dosing patterns forbidden in public medical fields (especially patient_overlap).
 * Matched case-insensitively; publication build fails if any remain after language transform.
 *
 * The union of both sets above. Callers that need DEC-0039's historical exemption must go
 * through findForbiddenTreatmentPatterns() rather than testing this array directly.
 */
export const FORBIDDEN_TREATMENT_PATTERNS: RegExp[] = [
  ...FORBIDDEN_DOSE_PATTERNS,
  ...FORBIDDEN_CARE_PLAN_PATTERNS,
];

/** Evidence-type public labels (language guide §3). */
export const KIND_LABELS: Record<string, { glyph: string; label: string; css: string }> = {
  observed_fact: { glyph: '▣', label: 'Documented finding', css: 'fact' },
  reported_history: { glyph: '❝', label: 'Patient-reported / history', css: 'reported' },
  interpretation: { glyph: '◇', label: 'Interpretation', css: 'interp' },
  hypothesis: { glyph: '⬡', label: 'Working hypothesis', css: 'hyp' },
  research_question: { glyph: '?', label: 'Research-question claim', css: 'q' },
};

/** Verification public labels. */
export const VERIFICATION_LABELS: Record<
  string,
  { label: string; ticks: number; border: 'solid' | 'dashed' | 'dotted' | 'hatched' }
> = {
  verified: { label: 'Verified against primary instrument record', ticks: 5, border: 'solid' },
  partially_verified: {
    label: 'Matches public specialty summary / pack transcription',
    ticks: 3,
    border: 'dashed',
  },
  contested: { label: 'Discordant sources or specialty vs commercial conflict', ticks: 2, border: 'dotted' },
  not_verified: { label: 'Not checked against a closer primary', ticks: 1, border: 'solid' },
  unsupported: { label: 'No adequate source', ticks: 0, border: 'hatched' },
};

/** Review-status public labels. */
export const REVIEW_LABELS: Record<string, { glyph: string; label: string }> = {
  not_reviewed: { glyph: '○', label: 'Not reviewed' },
  source_audited: { glyph: '●', label: 'Source audited' },
  patient_reviewed: { glyph: '●●', label: 'Patient reviewed' },
  clinician_reviewed: { glyph: '●●●', label: 'Clinician reviewed' },
  rejected: { glyph: '⊘', label: 'Rejected' },
};

/** Confidence vocabulary — five words only; never numeric. */
export const CONFIDENCE_ORDER = [
  'not_supported',
  'speculative',
  'low',
  'medium',
  'high',
] as const;

export const CONFIDENCE_LABELS: Record<string, string> = {
  not_supported: 'not supported',
  speculative: 'speculative',
  low: 'low',
  medium: 'medium',
  high: 'high',
};
