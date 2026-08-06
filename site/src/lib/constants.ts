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
  { href: '/questions-for-clinicians/', label: 'Questions for clinicians' },
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
 * Treatment / dosing patterns forbidden in public medical fields (especially patient_overlap).
 * Matched case-insensitively; publication build fails if any remain after language transform.
 *
 * Lab measurement contexts (mg/24h, µg/L, mcg/mL, mg/kg, mg/day) are NOT forbidden — only
 * prescription-style dose/frequency and care-plan sequencing language.
 */
export const FORBIDDEN_TREATMENT_PATTERNS: RegExp[] = [
  // Prescription-style: number + mass unit + dosing frequency (not lab denominators).
  /\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b(?!\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h)\b)\s*(?:daily|weekly|bid|tid|qid|prn|when needed|eod|every)\b/i,
  // Bare patient-regimen dose near drug names (historical leakage pattern).
  /\b(?:regimen|dose|dosing)\b[^.\n]{0,40}\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b/i,
  /\d+(?:\.\d+)?\s*(mg|mcg|µg|ug|iu)\b(?!\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h)\b)[^.\n]{0,40}\b(?:regimen|daily|weekly)\b/i,
  /\b(needing|considering|consider|plan)\s+[a-z0-9/-]*(therapy|teriparatide|forteo|anabolic|thiazide)\b/i,
  // Sequenced care-plan arrow constructions naming bone-building drugs.
  /→\s*consider\s+[a-z0-9/-]*(teriparatide|forteo|anabolic)/i,
  /\bstart\/stop\b/i,
  /\byou should (start|stop)\b/i,
];

/** Evidence-type public labels (language guide §3). */
export const KIND_LABELS: Record<string, { glyph: string; label: string; css: string }> = {
  observed_fact: { glyph: '▣', label: 'Documented finding', css: 'fact' },
  reported_history: { glyph: '❝', label: 'Patient-reported / history', css: 'reported' },
  interpretation: { glyph: '◇', label: 'Interpretation', css: 'interp' },
  hypothesis: { glyph: '⬡', label: 'Working hypothesis', css: 'hyp' },
  research_question: { glyph: '?', label: 'Question for clinicians', css: 'q' },
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
