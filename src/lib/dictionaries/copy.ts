/**
 * One line of copy, with its review state.
 *
 * Shield publishes in eleven locales and language QA is a market go-live
 * gate (14, section 12). So every line carries its own state:
 *
 *   reviewed     — a native speaker signed this line off.
 *   pending      — translated, but nobody native has read it yet.
 *   untranslated — the English source line is still in place.
 *
 * Nothing is silently swapped for English: a line that has not been
 * translated is marked, and the page says so out loud.
 */
export interface Copy {
  /** The text to render. */
  text: string;
  /** True until a native speaker has reviewed this line. */
  pendingNativeReview: boolean;
  /** True when the text is still the English source line. */
  untranslated?: boolean;
}

/** A line that has been reviewed — the English source copy. */
export function reviewed(text: string): Copy {
  return { text, pendingNativeReview: false };
}

/** A translated line that no native speaker has reviewed yet. */
export function pending(text: string): Copy {
  return { text, pendingNativeReview: true };
}

/** A line still carried over from the English source. */
export function untranslated(text: string): Copy {
  return { text, pendingNativeReview: true, untranslated: true };
}
