/**
 * Public-language transforms for medical copy.
 * Source of truth: audits/2026-08-publication-readiness/03_public_language_guide.md
 * Do not invent medical facts — only rephrase internal research language.
 */

import {
  FORBIDDEN_PHRASES,
  FORBIDDEN_DOSE_PATTERNS,
  FORBIDDEN_CARE_PLAN_PATTERNS,
  CLAUSE_OPENER,
} from './constants';

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
  //
  // DEC-0039 (v0.4.0) additionally permits *historical* dosing: where Drift0r's own documents
  // record what he took, that is publishable as attributed record. The distinction the policy
  // draws is direction, not subject matter — what he took is record, what a reader should take
  // is barred. That distinction is enforced below by isHistoricalRecord/isPrescriptive rather
  // than by a blanket redaction, which makes the policy's framing requirement mechanically
  // load-bearing: text written as attributed past-tense record keeps its figures, and text
  // that is not so written still loses them.
  [
    /\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|ug|IU)\b/gi,
    (match: string, ...args: unknown[]) => {
      // String.replace: (match, p1..., offset, string) — no capture groups → offset, full.
      const offset = typeof args[0] === 'number' ? args[0] : 0;
      const full = typeof args[1] === 'string' ? args[1] : '';
      // 48 chars, so the frequency test below reaches at least as far as FORBIDDEN_DOSE_PATTERNS
      // does (40). A shorter look-ahead here meant "25 mg of compound daily" kept its figure and
      // was then flagged by the gate — fail-closed, but the two layers disagreeing.
      const after = full.slice(offset + match.length, offset + match.length + 48);
      // Measurement denominators: keep lab/threshold values.
      if (/^\s*\/\s*(?:L|mL|ml|dL|24h|kg|day|h|hr|hour)\b/i.test(after)) return match;
      // Fail closed: any prescriptive framing anywhere in the field redacts regardless.
      if (isPrescriptive(full)) return '[dose withheld]';
      // DEC-0039: attributed historical record keeps the figure.
      if (isHistoricalRecord(sentenceAround(full, offset))) return match;
      // Explicit dosing frequency, not framed as history → redact.
      if (
        /\b(?:daily|weekly|bid|tid|qid|prn|when needed|eod|every other day|every \d+ (?:days?|weeks?|hours?))\b/i.test(
          match + ' ' + after.slice(0, 40),
        )
      ) {
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
  // Drug names. Generalising these degrades the record for the clinician audience the site is
  // written for, and DEC-0039 permits naming what the patient actually took when the statement
  // is framed as history. Same gate as the dose rule: historical record keeps the name, anything
  // else keeps the pre-v0.4.0 generalisation.
  // Do not fire mid-hyphenated tokens (e.g. historical-clomiphene-response).
  //
  // A preceding determiner is part of the match on purpose. The generic phrases carry their
  // own article, so replacing the bare drug name inside "over the anastrozole years" produced
  // "over the an aromatase inhibitor years" — reachable public copy. A replacement callback
  // can only rewrite what the pattern matched, so the determiner has to be inside the match
  // for drugNameReplacer to be able to reconcile it. See drugNameReplacer for the rules.
  [
    /(?<![A-Za-z0-9-])(?:(a|an|the)\s+)?clomiphene(?![A-Za-z0-9-])/gi,
    drugNameReplacer('a selective estrogen-receptor modulator'),
  ],
  [
    /(?<![A-Za-z0-9-])(?:(a|an|the)\s+)?anastrozole(?![A-Za-z0-9-])/gi,
    drugNameReplacer('an aromatase inhibitor'),
  ],
];

/**
 * The clause a match sits in.
 *
 * The exemption is scoped to the clause rather than to a character window, because that is
 * the unit the framing requirement actually applies to. A record marker in a *neighbouring*
 * sentence says nothing about how this figure is framed — "Documented finding: X. Benfotiamine
 * 1000 mg daily." is a bare dose with a document word loose in the paragraph, and a character
 * window cannot tell that apart from attribution.
 *
 * Semicolons are boundaries and colons are deliberately NOT, which looks inconsistent and is
 * the whole point. A semicolon joins two *independent* clauses, so an attribution in the first
 * says nothing about the second: in "The summary records fatigue; benfotiamine 1000 mg daily"
 * the document is recording the fatigue, and the dose is as unframed as if it followed a full
 * stop. A colon does the opposite — it introduces the material being attributed, so in "The
 * summary records: benfotiamine 1000 mg daily" the attribution governs everything after it.
 * Breaking on ':' would sever exactly the construction DEC-0039 exists to allow, and would
 * redact the live CLM-0096 regimen, which is written in that shape.
 *
 * This has to stay in step with isPrescriptive's clause-opener set below, minus the colon for
 * the reason above; when the two disagreed about what a clause was, the gate and the transform
 * agreed with each other while both failed open.
 */
function sentenceAround(full: string, offset: number): string {
  const start = Math.max(
    full.lastIndexOf('. ', offset),
    full.lastIndexOf('; ', offset),
    full.lastIndexOf('? ', offset),
    full.lastIndexOf('! ', offset),
    full.lastIndexOf('\n', offset),
  );
  const rest = full.slice(offset);
  const end = rest.search(/[.;!?](?:\s|$)|\n/);
  return full.slice(start + 1, end === -1 ? full.length : offset + end + 1);
}

/**
 * Attributed record language (DEC-0039).
 *
 * The test is whether the sentence *attributes* the material — either by naming a document as
 * doing the recording ("the thiamine summary records…", "the history lists…"), or by saying
 * outright that this is what was taken. Mood words are deliberately NOT markers: "history",
 * "prior", "took", "stopped" and bare calendar years occur throughout ordinary medical prose
 * ("no history of…", "it took weeks"), and treating them as attribution let unframed dosing
 * through both this predicate and the publication gate.
 */
export function isHistoricalRecord(text: string): boolean {
  // A source document is named as carrying the material. The document noun is required, not
  // just the verb: "documents", "records" and "files" are all ordinary words in clinical prose,
  // so a bare verb list let "Imaging documents pars defects and clomiphene 25 mg daily" read as
  // attribution. Requiring the noun is what makes this a statement about provenance rather than
  // a sentence that happens to contain a filing word.
  // The qualifier exclusion covers two different mistakes with one guard. "Family history lists…"
  // and "social history records…" name a *category of fact*, not a document doing the filing —
  // "history" earns its place in this list only because CLM-0097 and CLM-0098 cite an actual
  // medical-psychological history. And "No record lists…" asserts an absence, which is the
  // opposite of attributing the material to a source.
  if (
    /(?<!\b(?:family|social|surgical|sexual|no)\s)\b(?:record|records|summary|summaries|chart|charts|document|documents|note|notes|file|files|report|reports|ledger|inventory|pack|packet|transcript|history|log|entry)\s+(?:records|lists|files|documents|prints|carries)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  // Or the text states directly that this was taken, and is over.
  return /\b(?:(?:was|were|had been)(?:\s+\w+)?\s+prescribed|previously (?:prescribed|taken)|(?:was|were|had been) taking|had taken|reports? having taken|recorded as|documented as|listed under|filed under|per the (?:record|summary|document|chart)|came off|discontinued|tapered off)\b/i.test(
    text,
  );
}

/**
 * Forward-looking / second-person framing. Any hit redacts the whole field's doses, whatever
 * else it says — the prescriptive bar is absolute and is not softened by historical framing
 * appearing elsewhere in the same sentence.
 *
 * Imperatives are included: an instruction does not need a "you" to be an instruction, and
 * "Take 100 mg daily" is the exact shape DEC-0039 bars. A false positive here only redacts a
 * figure that would otherwise print, which is the safe direction to be wrong in.
 */
export function isPrescriptive(text: string): boolean {
  return (
    /\b(?:you should|you must|you can take|should (?:start|stop|take|try|consider|switch|adjust|increase|decrease)|should be (?:on|taking|started on|given)|(?:is|are|was|were) indicated|we (?:recommend|suggest)|recommended dose|suggested dose|start taking|consider taking|consider starting|please take|advisable|advise|for future use|until further notice)\b/i.test(
      text,
    ) ||
    // Bare recommendation words, anywhere. "recommended dose" was too narrow: the advice can
    // attach straight to the drug — "the chart records recommended clomiphene 25 mg daily" —
    // and an attribution verb in the same clause then bought passage for a full drug + dose.
    // Advice does not stop being advice because a document is cited as its source.
    /\b(?:recommend|recommends|recommended|recommending|recommendation|recommendations|suggest|suggests|suggested|suggesting|advises|advised|advising)\b/i.test(
      text,
    ) ||
    // Bare imperative opening a clause: "Take 100 mg…", "Consider starting…", "Start 25 mg…".
    // The opener set is shared with the care-plan gate rather than restated, because restating it
    // is how the comma got into one and not the other. See CLAUSE_OPENER.
    new RegExp(
      `${CLAUSE_OPENER}(?:take|start|stop|try|switch|increase|decrease|reduce|add|continue|consider|suggested)\\b`,
      'i',
    ).test(text)
  );
}

/** The article a generic phrase carries ("an aromatase inhibitor" → "an"). */
const LEADING_ARTICLE = /^(a|an|the)\s+/i;

/**
 * Replace a drug name with its generic description, reconciling determiners.
 *
 * The pattern optionally captures the determiner in front of the drug name, so the callback
 * arguments are (match, article, offset, full) — the article is `undefined` when the group did
 * not participate. Reconciliation rules:
 *
 *  - Keeping the name (attributed historical record, DEC-0039) returns the match verbatim, so a
 *    captured determiner is carried through untouched.
 *  - Generalising with a captured "the" keeps "the" and drops the generic phrase's own article:
 *    "the anastrozole years" → "the aromatase inhibitor years", not "the an aromatase inhibitor
 *    years". A definite article in the source is a deliberate reference to a specific episode
 *    and survives generalisation; the phrase's indefinite article is the part that is wrong
 *    there, so it is the part that goes.
 *  - Generalising with a captured "a"/"an" uses the generic phrase's own article, which is the
 *    one that agrees with the phrase's first sound ("an anastrozole" → "an aromatase inhibitor",
 *    "a anastrozole" → "an aromatase inhibitor").
 *  - Sentence-initial capitalisation of the determiner is preserved.
 */
function drugNameReplacer(generic: string): Replacement {
  return (match: string, ...args: unknown[]) => {
    const article = typeof args[0] === 'string' ? args[0] : '';
    const offset = typeof args[1] === 'number' ? args[1] : 0;
    const full = typeof args[2] === 'string' ? args[2] : '';
    const generalised = withArticle(generic, article);
    if (isPrescriptive(full)) return generalised;
    if (isHistoricalRecord(sentenceAround(full, offset))) return match;
    return generalised;
  };
}

/** `generic` re-articled against the determiner captured from the source, if any. */
function withArticle(generic: string, article: string): string {
  if (!article) return generic;
  const own = generic.match(LEADING_ARTICLE)?.[1] ?? '';
  const determiner = article.toLowerCase() === 'the' ? 'the' : own;
  const bare = generic.replace(LEADING_ARTICLE, '');
  const out = determiner ? `${determiner} ${bare}` : bare;
  // "The anastrozole years began…" must not become "the aromatase inhibitor years began…".
  return article[0] === article[0].toUpperCase() && article[0] !== article[0].toLowerCase()
    ? out[0].toUpperCase() + out.slice(1)
    : out;
}

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

/**
 * Return treatment/dosing pattern sources matched in text.
 *
 * Care-plan constructions are checked unconditionally. Dose figures are checked per match,
 * against the sentence that match sits in — the same scope and the same two predicates the
 * redaction transform uses on the figure itself. Deciding this per match rather than per field
 * is what makes the two layers agree: a field-wide exemption meant one chronology word anywhere
 * in a claim switched the gate off for every figure in it, including figures in sentences the
 * transform had judged unframed.
 */
export function findForbiddenTreatmentPatterns(text: string): string[] {
  if (!text) return [];
  const hits: string[] = [];
  for (const re of FORBIDDEN_CARE_PLAN_PATTERNS) {
    if (re.test(text)) hits.push(re.source);
  }
  const prescriptive = isPrescriptive(text);
  for (const re of FORBIDDEN_DOSE_PATTERNS) {
    const scan = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = scan.exec(text)) !== null) {
      if (m[0] === '') {
        scan.lastIndex += 1;
        continue;
      }
      if (prescriptive || !isHistoricalRecord(sentenceAround(text, m.index))) {
        hits.push(re.source);
        break;
      }
    }
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
