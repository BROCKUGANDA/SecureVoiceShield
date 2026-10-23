"use client";

/**
 * Last-resort boundary: root layout itself failed. Owns <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f4ee",
          color: "#16241e",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
            border: "1px solid #e2ddd0",
            borderRadius: 24,
            padding: 32,
            background: "#ffffff",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto",
              borderRadius: 999,
              border: "2.4px dashed #64716a",
            }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 20 }}>Shield hit an unexpected error</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5c6a62", marginTop: 8 }}>
            The service is degraded, not reassuring. Never share your PIN or any code in the
            meantime.
            {error?.digest ? ` (ref ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: "0 24px",
              borderRadius: 999,
              border: "none",
              background: "#12533f",
              color: "#f0faf5",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
