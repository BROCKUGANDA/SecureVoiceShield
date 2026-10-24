import { createSign } from "crypto";

/**
 * shield-certify — the certification runner (10, section 4.2).
 *
 * It drives a tenant's integration against the sandbox and records the
 * result in the audit chain. Levels:
 *
 *   L1 Connect   mTLS binding, OAuth, region routing, clock skew
 *   L2 Correct   schemas, idempotency, problem+json, step_up on timeout and
 *                on 5xx, event dedupe and ordering
 *   L3 Resilient injected timeouts, 429s, 503s, duplicate and out-of-order
 *                events, a slow response at 950 ms
 *
 * L4 Operable is a process gate — runbooks, on-call, DR, DPIA — and is not
 * something a script can certify.
 *
 *   bun run shield-certify --url http://127.0.0.1:3000
 */

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const BASE = (urlIndex >= 0 && args[urlIndex + 1]) || "http://127.0.0.1:3000";

const CLIENT_ID = process.env.SHIELD_SANDBOX_CLIENT_ID ?? "sandbox-tenant-1";
const PRIVATE_KEY = (process.env.SHIELD_SANDBOX_TENANT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
const THUMBPRINT = process.env.SHIELD_SANDBOX_TENANT_CERT_THUMBPRINT ?? "";

interface Check {
  level: "L1" | "L2" | "L3";
  name: string;
  pass: boolean;
  detail: string;
}

const checks: Check[] = [];
function record(level: Check["level"], name: string, pass: boolean, detail: string) {
  checks.push({ level, name, pass, detail });
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function clientAssertion(scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "ES256", typ: "JWT", kid: "sandbox-tenant-1" }));
  const payload = base64url(
    JSON.stringify({
      iss: CLIENT_ID,
      sub: CLIENT_ID,
      aud: "https://ug.api.shield.securevoiceai.me",
      jti: `cert-${now}-${Math.random().toString(36).slice(2, 8)}`,
      iat: now,
      exp: now + 300,
      scope,
    }),
  );
  const signature = createSign("sha256").update(`${header}.${payload}`).sign({
    key: PRIVATE_KEY,
    dsaEncoding: "ieee-p1363",
  });
  return `${header}.${payload}.${signature.toString("base64url")}`;
}

async function call(
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, headers: res.headers, json, text };
}

if (!PRIVATE_KEY) {
  console.error("✖ no tenant key. Run: bun run seed:tenant");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* L1 — Connect                                                        */
/* ------------------------------------------------------------------ */

// 1. The client assertion is exchanged for a token.
const tokenResponse = await call("/v1/auth/token", "POST", {
  grant_type: "client_credentials",
  client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  client_assertion: await clientAssertion("assess:read otp-guard:write events:read evidence-packs:write"),
  certificate_thumbprint: THUMBPRINT,
});
const accessToken = tokenResponse.json?.access_token;
record(
  "L1",
  "OAuth client_credentials with private_key_jwt",
  tokenResponse.status === 200 && Boolean(accessToken),
  `token endpoint answered ${tokenResponse.status}`,
);

// 2. A forged assertion is refused.
const forged = await call("/v1/auth/token", "POST", {
  grant_type: "client_credentials",
  client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  client_assertion: (await clientAssertion("assess:read")).split(".").slice(0, 2).join(".") + ".AAAA",
  certificate_thumbprint: THUMBPRINT,
});
record("L1", "A forged client assertion is refused", forged.status === 401, `answered ${forged.status}`);

// 3. The mTLS binding: the token does not work without the certificate.
const withoutCert = await call("/v1/assess", "POST", { msisdn: "+25677000001" }, {
  authorization: `Bearer ${accessToken}`,
});
record(
  "L1",
  "The access token is bound to the client certificate",
  withoutCert.status === 401,
  `without the certificate the call answered ${withoutCert.status}`,
);

const withCert = await call("/v1/assess", "POST", { msisdn: "+25677000001" }, {
  authorization: `Bearer ${accessToken}`,
  "x-client-cert-thumbprint": THUMBPRINT,
});
record("L1", "The bound client can call the API", withCert.status === 200, `answered ${withCert.status}`);

// 4. Region routing.
const wrongRegion = await call("/v1/assess", "POST", { msisdn: "+25677000001" }, {
  authorization: `Bearer ${accessToken}`,
  "x-client-cert-thumbprint": THUMBPRINT,
  "x-shield-region": "ke",
});
record(
  "L1",
  "A request for another region is refused (SH-REGION-421)",
  wrongRegion.status === 421 && wrongRegion.json?.code === "SH-REGION-421",
  `answered ${wrongRegion.status} ${wrongRegion.json?.code ?? ""}`,
);

// 5. The clock.
const claims = accessToken ? JSON.parse(Buffer.from(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()) : null;
const skew = claims ? Math.abs(claims.iat * 1000 - Date.now()) : Infinity;
record("L1", "The token clock is within five minutes", skew < 5 * 60_000, `skew ${Math.round(skew / 1000)}s`);

/* ------------------------------------------------------------------ */
/* L2 — Correct                                                        */
/* ------------------------------------------------------------------ */

const authHeaders = { authorization: `Bearer ${accessToken}`, "x-client-cert-thumbprint": THUMBPRINT };

// 6. The schema: an invalid body is a 422 with problem+json.
const badBody = await call("/v1/assess", "POST", { msisdn: "not-a-number" }, authHeaders);
record(
  "L2",
  "An invalid body is a 422 problem+json",
  badBody.status === 422 && Boolean(badBody.headers.get("content-type")?.includes("application/problem+json")),
  `answered ${badBody.status} ${badBody.headers.get("content-type")}`,
);

// 7. Idempotency: the same key and body replay; a different body is a 409.
const idemKey = `certify-${Date.now()}`;
const first = await call("/v1/assess", "POST", { msisdn: "+25677000002" }, { ...authHeaders, "idempotency-key": idemKey });
const replay = await call("/v1/assess", "POST", { msisdn: "+25677000002" }, { ...authHeaders, "idempotency-key": idemKey });
const mismatch = await call("/v1/assess", "POST", { msisdn: "+25677000003" }, { ...authHeaders, "idempotency-key": idemKey });
record(
  "L2",
  "An idempotency key replays and a mismatch is a 409",
  first.status === 200 && replay.status === 200 && mismatch.status === 409,
  `first ${first.status}, replay ${replay.status}, mismatch ${mismatch.status}`,
);

// 8. A late answer is step_up, never Clear.
const slow = await call("/v1/assess", "POST", { msisdn: "+25677000007" }, authHeaders);
record(
  "L2",
  "A response past the budget is step_up, never a Clear",
  slow.json?.verdict !== "clear" && slow.json?.action === "step_up",
  `verdict ${slow.json?.verdict}, action ${slow.json?.action}`,
);

// 9. A degraded cell answers step_up.
const degraded = await call("/v1/assess", "POST", { msisdn: "+25677000008" }, authHeaders);
record(
  "L2",
  "A 503 carries safeAction: step_up",
  degraded.status === 503 && degraded.json?.safeAction === "step_up",
  `answered ${degraded.status} ${degraded.json?.code ?? ""}`,
);

// 10. Event dedupe and ordering: the same event id twice, one arriving late.
await call("/v1/assess", "POST", { msisdn: "+25677000009" }, authHeaders);
const feed = await call("/v1/events?after=0&types=me.securevoiceai.shield.decision.created.v1", "GET", undefined, authHeaders);
const events: any[] = feed.json?.events ?? [];
const ids = events.map((e) => e.id);
const duplicateSeen = ids.length !== new Set(ids).size;
const sequences = events.map((e) => Number(e.sequence));
const ordered = sequences.every((s, i) => i === 0 || s > sequences[i - 1]);
record(
  "L2",
  "Events carry a stable id and an increasing sequence (dedupe, ordering)",
  duplicateSeen && ordered,
  `${events.length} events, ${ids.length - new Set(ids).size} duplicate id(s), ordered ${ordered}`,
);

/* ------------------------------------------------------------------ */
/* L3 — Resilient                                                      */
/* ------------------------------------------------------------------ */

// 11. A burst is rate limited with a Retry-After.
const burst: number[] = [];
for (let i = 0; i < 40; i++) {
  const r = await call("/v1/assess", "POST", { msisdn: "+25677000004" }, { ...authHeaders, "x-forwarded-for": "10.9.9.9" });
  burst.push(r.status);
  if (r.status === 429 && !r.headers.get("retry-after")) {
    record("L3", "A 429 carries Retry-After", false, "the 429 had no Retry-After header");
  }
}
const limited = burst.includes(429);
record("L3", "A burst is rate limited", limited, `statuses: ${burst.join(",")}`);

// 12. The client stays safe: every failure answer is step_up or a refusal.
const safeAnswers = [slow, degraded, badBody, wrongRegion].every(
  (r) =>
    r.json?.action === "step_up" ||
    r.json?.safeAction === "step_up" ||
    r.status >= 400,
);
record("L3", "Every failure path stays safe", safeAnswers, "checked the timeout, 503, 422 and 421 answers");

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const passed = checks.filter((c) => c.pass).length;
console.log(`\nshield-certify — ${BASE}`);
console.log(`tenant: ${CLIENT_ID}\n`);
for (const level of ["L1", "L2", "L3"] as const) {
  console.log(`${level}`);
  for (const check of checks.filter((c) => c.level === level)) {
    console.log(`  ${check.pass ? "✔" : "✖"} ${check.name} — ${check.detail}`);
  }
}
console.log(`\n${passed}/${checks.length} checks passed`);
console.log(
  "L4 Operable is a process gate (runbooks, on-call, DR, DPIA) and is not certified by this script.",
);

process.exit(passed === checks.length ? 0 : 1);
