"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Clipboard button with a quiet confirmation state. Never throws — clipboard
 * permissions fail silently and the button simply stays a copy button.
 */
export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string | (() => string);
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const value = typeof text === "function" ? text() : text;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (permissions/insecure context): no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
      aria-live="polite"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}
