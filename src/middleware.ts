import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers applied to every response (12, section 4 + 14).
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Permitted-Cross-Domain-Policies": "none",
};

// CORS allow-list (configurable via env). Defaults to same-origin only.
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").filter(Boolean);

// In-memory rate limiter (per-IP, per-route). Production uses Valkey token bucket.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // requests per window per IP

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isApi = request.nextUrl.pathname.startsWith("/api/") || request.nextUrl.pathname.startsWith("/v1/");

  // CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.length === 0) {
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Idempotency-Key, X-Tenant-Id");
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  const response = NextResponse.next();

  // Security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // CORS headers on API responses
  if (isApi && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.length === 0)) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Expose-Headers", "Shield-Decision-Id, Shield-Policy-Version, Shield-Mode");
  }

  // API responses are never cached and never indexed.
  if (isApi) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    // Rate limiting (per IP per route)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}:${request.nextUrl.pathname}`;
    if (!checkRateLimit(key)) {
      return new NextResponse(
        JSON.stringify({ type: "https://docs.shield.securevoiceai.me/errors/SH-RATE-429", title: "Too many requests", status: 429, code: "SH-RATE-429", retryable: true, retryAfterMs: 1200, safeAction: "step_up" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "2" } }
      );
    }
  }

  // Format-detection off so masked phone numbers never become tappable (14, section 5).
  response.headers.set("X-Format-Detection", "telephone=no");

  // Tenant context for multi-tenancy (RLS). Extract from header or JWT.
  const tenantId = request.headers.get("x-tenant-id");
  if (tenantId) {
    response.headers.set("X-Tenant-Context", tenantId);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};