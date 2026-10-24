import { SITE_NAME } from "@/lib/site";

/**
 * GET /manifest.webmanifest — the web app manifest (14, section 10.1).
 *
 * The icons are real files, generated from public/logo.svg by
 * scripts/generate-icons.ts. An icon URL that 404s breaks the install
 * prompt, so the generator is the reproducible source of all three PNGs.
 *
 * The colours come from the KANGA palette (01): warm paper for the
 * background, deep emerald for the theme. They are the same values as
 * src/app/globals.css — the manifest is not allowed to invent a colour the
 * site does not use.
 */

const BACKGROUND_COLOR = "#f6f4ee"; // --background (warm paper)
const THEME_COLOR = "#12533f"; // --primary (deep emerald)

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  const manifest = {
    id: "/",
    name: SITE_NAME,
    short_name: "Shield",
    description: "Check calls, numbers and voice notes for scams.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    categories: ["security", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Check a number",
        short_name: "Check number",
        description: "Check whether a number is a verified bank call.",
        url: "/check/number?source=shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Check a voice note",
        short_name: "Check voice",
        description: "Check a voice note for cloning or synthesis.",
        url: "/check/voice?source=shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Report a scam",
        short_name: "Report scam",
        description: "Report a scam call, number or message.",
        url: "/report?source=shortcut",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    share_target: {
      action: "/share-target/",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          {
            name: "audio",
            accept: ["audio/*"],
          },
        ],
      },
    },
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
