import { publicKeyPem, signingAvailable } from "@/lib/signing";

/** GET /api — service index for humans and curious auditors. */
export function GET() {
  return Response.json(
    {
      service: "SecureVoice Shield — sandbox API",
      goldenRule: "Shield never calls you first",
      mode: "sandbox · synthetic data · scripted telco answers",
      sandboxMagicNumbers: "0001–0009 are scripted in the sandbox only; production never recognises them",
      endpoints: {
        "POST /api/assess": "number risk check (Idempotency-Key supported; magic numbers 0001–0009)",
        "POST /api/voice-check": "voice-note detector pipeline",
        "POST /api/guardian/session": "start a Guardian session (challenge words are server-picked)",
        "POST /api/guardian/complete": "engine scores the call; the agent never learns the result",
        "GET /api/verified-calls?number=": "was that bank call registered?",
        "GET|POST /api/reports": "scam reports & reputation band",
        "POST /api/appeals": "challenge a label as the number owner (72-hour review)",
        "GET /api/audit": "hash-chained evidence log + full chain recompute",
        "GET /api/audit/segment": "the chain as a verifiable segment, with full hashes and the signing key",
        "GET /api/events": "the pull feed — CloudEvents written with the decision they describe",
        "GET /api/system/mode": "operating modes (NORMAL · SURGE · TELCO_DEGRADED · …)",
        "GET /api/health": "liveness probe",
      },
      evidence: {
        chain: "hash-linked per cell; every entry signed with ES256",
        signatures: signingAvailable() ? "signed" : "unsigned — no signing key configured",
        publicKey: publicKeyPem() ? "/.well-known/shield-signing-key.pem" : null,
        verify: "bun run shield-verify --url <this-host>/api/audit/segment",
      },
      errors: "RFC 9457 application/problem+json",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
