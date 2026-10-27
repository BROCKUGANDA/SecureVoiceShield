import type { NextConfig } from "next";

/**
 * Security headers (12, section 4): every response ships the same baseline.
 * - No X-Frame-Options: CSP `frame-ancestors` below is the modern control and
 *   keeps the sandbox preview (a cross-origin host) working.
 * - `unsafe-eval` is dev-only (React refresh); production script-src stays tight.
 */
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self' *.space-z.ai",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["*.space-z.ai"],
  // The locale paths carry a trailing slash (14, section 2): /en-ae/, /sw-tz/
  // and the rest. Trailing slashes are the canonical form, so the canonical
  // link, the hreflang set and the sitemap all point at the URL that is
  // actually served.
  trailingSlash: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Decision evidence is personal — never cached anywhere (12, C1).
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
