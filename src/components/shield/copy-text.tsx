import type { Copy, Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Renders one line of copy, and says out loud when that line has not been
 * checked by a native speaker (14, section 12).
 *
 * A line still carried over from the English source is marked differently
 * again, so nobody reads an English paragraph on a Kiswahili page and
 * thinks it was translated.
 */
export function CopyText({
  copy,
  review,
  className,
}: {
  copy: Copy;
  review: Dictionary["review"];
  className?: string;
}) {
  if (!copy.pendingNativeReview) {
    return <span className={className}>{copy.text}</span>;
  }
  return (
    <span
      className={cn(
        className,
        "underline decoration-dotted decoration-verdict-caution/80 decoration-2 underline-offset-4",
      )}
      title={copy.untranslated ? review.untranslatedTitle.text : review.pendingTitle.text}
      data-copy-review={copy.untranslated ? "untranslated" : "pending"}
    >
      {copy.text}
    </span>
  );
}
