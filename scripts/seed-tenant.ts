import { createHash, createPublicKey, generateKeyPairSync } from "crypto";
import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

/**
 * Register the sandbox tenant for the business API.
 *
 * The tenant's key pair lives in .env (never in the repo); the cell keeps
 * the public key and the mTLS certificate thumbprint. Run it once:
 *
 *   bun run seed:tenant
 */

const db = new PrismaClient();

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

// A stand-in for the client's mTLS certificate: the thumbprint binds the
// access token to the client, the way RFC 8705 does.
const certificate = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const certificatePem = certificate.publicKey.export({ type: "spki", format: "pem" }).toString();
const thumbprint = createHash("sha256").update(certificatePem).digest("base64url");

const jwk = createPublicKey(publicKey).export({ format: "jwk" }) as { x: string; y: string };
const jwks = JSON.stringify({
  keys: [{ kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, kid: "sandbox-tenant-1" }],
});

const clientId = "sandbox-tenant-1";
await db.tenant.upsert({
  where: { clientId },
  update: { jwks, certificateThumbprint: thumbprint, status: "active" },
  create: {
    name: "Sandbox Bank (demo tenant)",
    clientId,
    jwks,
    certificateThumbprint: thumbprint,
    scopes: "assess:read,otp-guard:write,verified-calls:read,verified-calls:write,outcomes:write,events:read,evidence-packs:write",
    policyVersion: "ug-banking-2026.10.1",
  },
});

const escaped = privateKey.replace(/\n/g, "\\n");
const env = readFileSync(".env", "utf8");
if (!env.includes("SHIELD_SANDBOX_TENANT_PRIVATE_KEY")) {
  appendFileSync(
    ".env",
    `\n# The sandbox business tenant's private key (never commit it).\nSHIELD_SANDBOX_TENANT_PRIVATE_KEY="${escaped}"\nSHIELD_SANDBOX_TENANT_CERT_THUMBPRINT="${thumbprint}"\n`,
  );
  console.log("Tenant private key appended to .env.");
} else {
  console.log("Tenant private key already in .env — update it by deleting the line and re-running.");
}

const example = readFileSync(".env.example", "utf8");
if (!example.includes("SHIELD_SANDBOX_TENANT_PRIVATE_KEY")) {
  writeFileSync(
    ".env.example",
    example.replace(
      'SHIELD_SIGNING_KEY="<paste the generated PEM here>"',
      `SHIELD_SIGNING_KEY="<paste the generated PEM here>"

# The sandbox business tenant's private key and mTLS thumbprint. Generate both
# with: bun run seed:tenant
SHIELD_SANDBOX_TENANT_PRIVATE_KEY="<paste the generated PEM here>"
SHIELD_SANDBOX_TENANT_CERT_THUMBPRINT="<the registered thumbprint>"`,
    ),
  );
}

console.log(`✔ tenant ${clientId} registered; mTLS thumbprint ${thumbprint.slice(0, 12)}…`);
await db.$disconnect();
