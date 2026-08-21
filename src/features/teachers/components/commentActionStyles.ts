/**
 * Shared style of the small icon triggers that sit together in a comment's
 * meta line (detail, analysis info, classification editor) and next to the
 * comments panel heading. Keeping it in one place is what makes them read as
 * one row of equal-sized buttons — a trigger that styles itself ends up a few
 * pixels off and breaks the rhythm.
 *
 * Pair it with a `size-3.5` icon.
 *
 * @example
 * <button type="button" className={COMMENT_ACTION_TRIGGER}>
 *   <Info className="size-3.5" aria-hidden="true" />
 * </button>
 */
export const COMMENT_ACTION_TRIGGER =
  'text-muted-foreground/70 hover:text-foreground hover:bg-muted inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full normal-case transition-colors'
