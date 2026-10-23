import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** KANGA favicon: the verified-call shield on deep emerald. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#12533f",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4l7.6 3.1a10 10 0 0 1 6.2 9.2v6.2c0 8.5-5.2 15.3-13.8 20.5C15.4 37.8 10.2 31 10.2 22.5v-6.2a10 10 0 0 1 6.2-9.2L24 4Z"
            stroke="#f0faf5"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 23.5l4.6 4.6 8.4-9"
            stroke="#f0faf5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
