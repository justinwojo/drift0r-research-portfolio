/**
 * Indexing policy helpers — single source of truth is release.yaml:noindex.
 *
 * - HTML <meta name="robots"> and provenance display derive from noindex.
 * - All visitor-facing body copy about indexing must use these helpers (or
 *   remove indexing status from ordinary prose). Hard-coded "noindex" /
 *   "indexing: disabled" in page bodies is a false-polarity defect when
 *   release.noindex is flipped to false.
 * - robots.txt always permits crawling so bots can *read* the noindex meta.
 *   Do not use robots.txt Disallow: / while relying on HTML noindex (crawlers
 *   that never fetch cannot honor the meta directive).
 */

/** Robots meta content driven solely by release.noindex. */
export function robotsMetaContent(noindex: boolean): string {
  return noindex ? 'noindex, nofollow' : 'index, follow';
}

/** Provenance bar indexing label — must agree with robotsMetaContent polarity. */
export function indexingProvenanceLabel(noindex: boolean): string {
  return noindex ? 'disabled (noindex, nofollow)' : 'enabled';
}

/**
 * Compact body label for print meta / snapshot lines ("indexing: …").
 * Must not say "disabled" or "noindex" when indexing is enabled.
 */
export function indexingStatusCompact(noindex: boolean): string {
  return noindex ? 'disabled (noindex)' : 'enabled';
}

/**
 * Short hero/legend fragment (e.g. "Public research preview · noindex").
 * When indexing is enabled, omit the noindex token entirely.
 */
export function indexingPreviewLegend(noindex: boolean): string {
  return noindex ? 'Public research preview · noindex' : 'Public research preview · indexing enabled';
}

/**
 * Homepage lede clause about indexing policy.
 * When noindex is true: explains the hold. When false: states indexing is enabled.
 */
export function indexingLedeClause(noindex: boolean): string {
  return noindex
    ? 'Every route is marked noindex until a separate launch decision enables indexing. Indexed content remains incomplete and open to correction.'
    : 'Search indexing is enabled for this release. Content remains incomplete and open to correction.';
}

/**
 * Approval-status callout sentence about indexing.
 */
export function indexingApprovalSentence(noindex: boolean): string {
  return noindex
    ? 'Indexing remains disabled (noindex).'
    : 'Indexing is enabled for this release.';
}

/**
 * Closing "what this is not" bullet clause about research-preview indexing.
 */
export function indexingPreviewBulletClause(noindex: boolean): string {
  return noindex
    ? 'this remains a noindex research preview, not medical advice or clinician-validated content.'
    : 'this remains a research preview (indexing enabled), not medical advice or clinician-validated content.';
}

/**
 * robots.txt body for the public site artifact.
 * Always allows crawl so agents can fetch HTML and honor robots meta.
 * Does not encode noindex (that lives only in HTML meta + provenance).
 */
export function robotsTxtBody(): string {
  return [
    '# Crawlers may fetch pages so they can honor HTML robots meta (noindex when set).',
    '# Indexing policy is controlled by release.yaml:noindex → HTML <meta name="robots">.',
    '# Do not add Disallow: / here while relying on noindex meta — blocked fetches cannot read it.',
    'User-agent: *',
    'Allow: /',
    '',
  ].join('\n');
}

/**
 * Patterns that must NOT appear in visitor-facing HTML when noindex is false.
 * Used by the publication false-polarity regression (flip noindex → scan dist).
 * Meta robots content and robots.txt comments are checked separately.
 */
export const STUCK_NOINDEX_BODY_PATTERNS: RegExp[] = [
  /indexing:\s*disabled/i,
  /indexing remains disabled/i,
  /remains a noindex research/i,
  /Public research preview\s*·\s*noindex/i,
  /marked\s+noindex\s+until/i,
];
