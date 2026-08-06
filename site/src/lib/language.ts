/**
 * Public-language transforms for medical copy.
 * Source of truth: audits/2026-08-publication-readiness/03_public_language_guide.md
 * Do not invent medical facts — only rephrase internal research language.
 */

import { FORBIDDEN_PHRASES, FORBIDDEN_TREATMENT_PATTERNS } from './constants';

/**
 * Ordered replacements applied to all rendered medical text paths.
 * Longer / more specific patterns first so they win over shorter siblings.
 */
type Replacement = string | ((match: string, ...args: unknown[]) => string);

export const REPLACEMENTS: Array<[RegExp, Replacement]> = [
  [/\bcatastrophic early osteoporosis\b/gi, 'markedly low BMD for age'],
  [/\bcatastrophic osteoporosis\b/gi, 'markedly low BMD'],
  // Interleaved severity forms (must precede the shorter "early/severe osteoporosis" rules).
  [/\bsevere early osteoporosis\b/gi, 'markedly low BMD for age'],
  [/\bearly severe osteoporosis\b/gi, 'markedly low BMD for age'],
  [/\bsevere osteoporosis\b/gi, 'markedly low BMD for age'],
  [/\bearly osteoporosis\b/gi, 'markedly low BMD for age'],
  [/\balmost certainly\b/gi, 'current working model favors'],
  [/\bhard reject(ed)?\b/gi, 'not supported by the presently available record'],
  // Bare research "is rejected" (CLM-0033/CLM-0051); do not match lone "rejected" confidence tokens.
  [/\bis rejected\b/gi, 'is not supported by the presently available record'],
  [/\bdangerous if missed\b/gi, 'clinician review priority'],
  [/\btop diagnostic tests\b/gi, 'questions to discuss with licensed clinicians'],
  [/\bconfirmed dry beriberi\b/gi, 'documented thiamine deficiency with beriberi-spectrum symptoms (interpretive label)'],
  [/\bconfirmed thiamine\b/gi, 'documented thiamine'],
  [/\bconfirmed infection\b/gi, 'infection independently established by an appropriate method'],
  [/\bconfirmed bartonella\b/gi, 'specialty Bartonella signal (not independently confirmed)'],
  [/\bconfirmed babesia\b/gi, 'specialty Babesia signal (not independently confirmed)'],
  [/\bmulti-model agreement proves\b/gi, 'multi-model research agreement does not clinically validate'],
  [/\btreatment response proves\b/gi, 'treatment response does not by itself prove'],
  [/\bneeding anabolic therapy\b/gi, 'possible consideration of bone-building therapy (clinician decision only)'],
  [/\bconsidering teriparatide\b/gi, 'teriparatide may be discussed with a licensed clinician'],
  [/\banabolic-therapy-before-fusion\b/gi, 'bone-building therapy timing relative to surgery (clinician decision)'],
  [/\bconsideration of thiazide for hypercalciuria\b/gi, 'thiazide may be discussed with a licensed clinician for hypercalciuria'],
  // Prescription-style doses only. Lab measurement contexts (mg/24h, µg/L, mcg/mL, mg/kg, mg/day)
  // must remain literal — labeling them "[dose withheld]" is a false statement (Checkpoint H P0-1).
  [
    /\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|IU)\b/gi,
    (match: string, ...args: unknown[]) => {
      // String.replace: (match, p1..., offset, string) — no capture groups → offset, full.
      const offset = typeof args[0] === 'number' ? args[0] : 0;
      const full = typeof args[1] === 'string' ? args[1] : '';
      const after = full.slice(offset + match.length, offset + match.length + 16);
      // Measurement denominators: keep lab/threshold values.
      if (/^\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h|hr|hour)\b/i.test(after)) return match;
      // Explicit dosing frequency → redact.
      if (/\b(?:daily|weekly|bid|tid|qid|prn|when needed|eod)\b/i.test(match + ' ' + after.slice(0, 24))) {
        return '[dose withheld]';
      }
      // Bare "N mg" near drug/regimen language → redact (patient dose leakage).
      const window = full.slice(Math.max(0, offset - 48), Math.min(full.length, offset + match.length + 48));
      if (
        /\b(clomiphene|anastrozole|teriparatide|forteo|regimen|dose|dosing|prescription|tablet|capsule)\b/i.test(
          window,
        )
      ) {
        return '[dose withheld]';
      }
      // Otherwise keep (urine calcium 333 mg, tryptase thresholds expressed as mg, etc.).
      return match;
    },
  ],
  // Do not fire mid-hyphenated tokens (e.g. historical-clomiphene-response).
  [/(?<![A-Za-z0-9-])clomiphene(?![A-Za-z0-9-])/gi, 'a selective estrogen-receptor modulator'],
  [/(?<![A-Za-z0-9-])anastrozole(?![A-Za-z0-9-])/gi, 'an aromatase inhibitor'],
];

/**
 * Apply public-language replacements without inventing new medical content.
 * Applied to claim statements, hypothesis summaries, CQ text, UQs, and literature notes.
 *
 * Post-transform guard: never emit "[dose withheld]" adjacent to a lab unit denominator
 * (signature of the Checkpoint H P0-1 over-redaction bug).
 */
export function toPublicLanguage(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [re, rep] of REPLACEMENTS) {
    if (typeof rep === 'function') {
      out = out.replace(re, rep as (match: string, ...args: string[]) => string);
    } else {
      out = out.replace(re, rep);
    }
  }
  if (/\[dose withheld\]\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h)\b/i.test(out)) {
    throw new Error(
      'toPublicLanguage produced measurement-adjacent [dose withheld] (lab value destroyed)',
    );
  }
  return out;
}

/** Return forbidden phrases found in text (case-insensitive). */
export function findForbiddenPhrases(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return FORBIDDEN_PHRASES.filter((p) => lower.includes(p.toLowerCase()));
}

/** True if text contains any forbidden medical/sensational phrasing. */
export function hasForbiddenPhrasing(text: string): boolean {
  return findForbiddenPhrases(text).length > 0;
}

/** Return treatment/dosing pattern sources matched in text. */
export function findForbiddenTreatmentPatterns(text: string): string[] {
  if (!text) return [];
  const hits: string[] = [];
  for (const re of FORBIDDEN_TREATMENT_PATTERNS) {
    if (re.test(text)) hits.push(re.source);
  }
  return hits;
}

/** True if text still carries treatment/dosing constructions after transform. */
export function hasForbiddenTreatmentPhrasing(text: string): boolean {
  return findForbiddenTreatmentPatterns(text).length > 0;
}

/**
 * Publication-mode gate: throw if any medical field still has forbidden language.
 * Call from data loaders after toPublicLanguage.
 */
export function assertSafePublicLanguage(
  fields: Array<{ surface: string; text: string }>,
  options: { checkTreatment?: boolean } = {},
): void {
  const checkTreatment = options.checkTreatment !== false;
  const problems: string[] = [];
  for (const { surface, text } of fields) {
    const phrases = findForbiddenPhrases(text);
    if (phrases.length) {
      problems.push(`${surface}: forbidden phrase(s) ${phrases.join(', ')}`);
    }
    if (checkTreatment) {
      const treatments = findForbiddenTreatmentPatterns(text);
      if (treatments.length) {
        problems.push(`${surface}: treatment/dosing pattern(s) ${treatments.join(', ')}`);
      }
    }
  }
  if (problems.length) {
    throw new Error(
      `Unsafe public language remaining after transform (publication fail-closed):\n` +
        problems.slice(0, 20).join('\n') +
        (problems.length > 20 ? `\n…and ${problems.length - 20} more` : ''),
    );
  }
}

/**
 * Hypothesis support/contradiction polarity from structured fields.
 * Returns + for support, − for contradiction, · for neither listed.
 */
export function polarityForClaim(
  claimId: string,
  explains: string[],
  doesNotExplain: string[],
): '+' | '−' | '·' {
  if (explains.includes(claimId)) return '+';
  if (doesNotExplain.includes(claimId)) return '−';
  return '·';
}

/**
 * Trail terminal statements — mandatory on every source trail (design §4.5).
 * Never links to private PDFs.
 */
export function trailTerminal(sourcePath: string | undefined): string {
  if (!sourcePath) {
    return 'Trail ends at recollection — no document behind it.';
  }
  if (sourcePath.includes('swarm-runs') || sourcePath.includes('synthesis')) {
    return 'Trail ends at a research synthesis — not a clinical record.';
  }
  if (sourcePath.includes('evidence/sources/') && sourcePath.endsWith('.pdf')) {
    return 'Primary instrument record not obtained — specialty summary transcribed; source PDF not published.';
  }
  if (sourcePath.includes('evidence_pack') || sourcePath.includes('tests_ledger')) {
    return 'Trail ends at a patient-compiled research pack transcription — not a facility instrument printout.';
  }
  return 'Trail ends at a public research artifact — primary instrument record not published.';
}
