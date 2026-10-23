import { ImageResponse } from "next/og";

export const alt = "SecureVoice Shield — when a voice lies, Shield answers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Open-graph card in the KANGA system: paper, deep emerald, verdict shapes. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #f6f4ee 0%, #e9f1ea 100%)",
          color: "#16241e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#12533f",
              borderRadius: 20,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4l7.6 3.1a10 10 0 0 1 6.2 9.2v6.2c0 8.5-5.2 15.3-13.8 20.5C15.4 37.8 10.2 31 10.2 22.5v-6.2a10 10 0 0 1 6.2-9.2L24 4Z"
                stroke="#f0faf5"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 23.5l4.6 4.6 8.4-9"
                stroke="#f0faf5"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700 }}>SecureVoice Shield</span>
            <span style={{ fontSize: 19, color: "#5c6a62", letterSpacing: 3, textTransform: "uppercase" }}>
              Is this voice real?
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 74, fontWeight: 800, lineHeight: 1.05, maxWidth: 940 }}>
            <div>When a voice lies,</div>
            <div style={{ color: "#12533f" }}>Shield answers.</div>
          </div>
          <div style={{ fontSize: 28, color: "#5c6a62", maxWidth: 900 }}>
            Scoring suspicious calls, voice notes and OTP asks — in plain language, across UAE · Kenya · Uganda · Tanzania.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 22, color: "#16241e" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="17" stroke="#177a4c" strokeWidth="4" />
            </svg>
            Clear
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <path d="M24 7 L43 40 L5 40 Z" stroke="#b45309" strokeWidth="4" strokeLinejoin="round" />
            </svg>
            Caution
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <path d="M16.2 5h15.6L43 16.2v15.6L31.8 43H16.2L5 31.8V16.2L16.2 5Z" stroke="#b3261e" strokeWidth="4" strokeLinejoin="round" />
            </svg>
            Danger
          </span>
          <span
            style={{
              marginLeft: "auto",
              padding: "10px 22px",
              border: "2px solid #12533f",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
              color: "#12533f",
            }}
          >
            Shield never calls you first
          </span>
        </div>
      </div>
    ),
    size,
  );
}
