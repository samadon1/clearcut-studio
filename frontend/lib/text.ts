/**
 * Strip em/en dashes from any text we display (including AI-generated copy),
 * replacing them with plain punctuation so the platform never shows a dash.
 */
export function noDash(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/\s*[—–]\s*/g, ', ') // em/en dash between words -> comma
    .replace(/,\s*,/g, ',')       // collapse any accidental double commas
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** The leading title portion of an AI summary, dash-free. */
export function titleOf(summary?: string | null): string {
  if (!summary) return '';
  const head = summary.split(/[—–]/)[0];
  return noDash(head).trim();
}
