/**
 * The list of prizes an event can hand out.
 *
 * Kept per event and editable in the admin screens rather than hardcoded here,
 * because "what prizes do we give" is the one thing that genuinely differs
 * between a science fair, a sports day and a staff long-service ceremony --
 * and nobody running one of those should have to wait for a deploy to add
 * "Best Team Effort" to the list.
 *
 * The award is *not* a closed set on the certificate itself: `certificates.award`
 * stays free text. This list drives the suggestions, the bulk-import
 * spell-check and the printed spelling. A one-off award typed straight into
 * the box still works, so the day of the ceremony is never blocked by a
 * settings page.
 */

/**
 * What a brand-new deployment starts with.
 *
 * Deliberately plain and prize-shaped rather than tied to any one kind of
 * event, for the same reason the wording defaults are generic: this text is
 * spoken aloud, and an unproofread default should sound like nothing in
 * particular rather than like somebody else's ceremony.
 */
export const DEFAULT_AWARDS = [
  'First Prize',
  'Second Prize',
  'Third Prize',
  'Special Mention',
  'Certificate of Participation',
] as const;

/** More than this in one event is a data-entry mistake, not a prize list. */
const MAX_AWARDS = 50;

/** Long enough for "Certificate of Participation" and a qualifier, no more. */
const MAX_AWARD_LENGTH = 120;

function key(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Cleans a list of categories coming from the settings form or the database.
 *
 * Runs on the server on every save as well as in the browser: the settings
 * form is a client component, so the array arriving at the action is whatever
 * the caller chose to send.
 */
export function normaliseAwards(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const trimmed = value.replace(/\s+/g, ' ').trim().slice(0, MAX_AWARD_LENGTH);
    if (!trimmed || seen.has(key(trimmed))) continue;
    seen.add(key(trimmed));
    cleaned.push(trimmed);
    if (cleaned.length === MAX_AWARDS) break;
  }

  return cleaned;
}

/**
 * The categories to offer for an event, falling back to the built-in list.
 *
 * An event whose list has been emptied still needs something to suggest, and
 * an empty dropdown reads as a broken screen rather than as a deliberate
 * choice.
 */
export function awardsFor(event: { awards?: string[] | null }): string[] {
  const configured = normaliseAwards(event.awards ?? []);
  return configured.length > 0 ? configured : [...DEFAULT_AWARDS];
}

/**
 * Maps a typed or pasted award onto the event's configured spelling.
 *
 * Case and spacing are ignored, so a spreadsheet column reading "first prize"
 * comes out as "First Prize" on the printed certificate. Returns undefined for
 * anything not on the list -- the caller decides whether that is a problem.
 */
export function matchAward(value: string, awards: readonly string[]): string | undefined {
  const wanted = key(value);
  if (!wanted) return undefined;
  return awards.find((award) => key(award) === wanted);
}
