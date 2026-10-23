/** GET /api — service index for humans and curious auditors. */
export function GET() {
  return Response.json(
    {
      service: "SecureVoice Shield — sandbox API",
      goldenRule: "Shield never calls you first",
      mode: "sandbox · synthetic data · scripted telco answers",
      endpoints: {
        "POST /api/assess": "number risk check (Idempotency-Key supported; magic numbers 0001–0008)",
        "POST /api/voice-check": "voice-note detector pipeline",
        "POST /api/guardian/session": "start a Guardian session (challenge words are server-picked)",
        "POST /api/guardian/complete": "engine scores the call; the agent never learns the result",
        "GET /api/verified-calls?number=": "was that bank call registered?",
        "GET|POST /api/reports": "scam reports & reputation",
        "GET /api/audit": "hash-chained evidence log + full chain recompute",
        "GET /api/system/mode": "operating modes (NORMAL · SURGE · TELCO_DEGRADED · …)",
        "GET /api/health": "liveness probe",
      },
      errors: "RFC 9457 application/problem+json",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
