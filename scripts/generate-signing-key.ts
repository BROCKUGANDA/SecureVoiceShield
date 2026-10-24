import { generateKeyPairSync } from "crypto";
import { appendFileSync, readFileSync, writeFileSync } from "fs";

/**
 * Generate the ES256 key pair used to sign audit entries and the
 * official-channels list (13, section 6.2; 14, section 10.8).
 *
 *   bun run keygen            # writes the private key into .env
 *   bun run keygen --print    # prints the PEMs instead
 */
const print = process.argv.includes("--print");
const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const escaped = privateKey.replace(/\n/g, "\\n");

if (print) {
  console.log(privateKey);
  console.log(publicKey);
} else {
  const env = readFileSync(".env", "utf8");
  const stripped = env.replace(/\n?# Audit-chain signing key[\s\S]*$/, "\n");
  appendFileSync(
    ".env",
    `\n# Audit-chain signing key (ES256). Local sandbox key — never commit a real one.\nSHIELD_SIGNING_KEY="${escaped}"\n`,
  );
  console.log("Private key appended to .env (never commit it).");
  console.log("Public key:\n" + publicKey);
}

// Keep .env.example in step with the keys the app expects.
const example = readFileSync(".env.example", "utf8");
if (!example.includes("SHIELD_SIGNING_KEY")) {
  writeFileSync(
    ".env.example",
    example.replace(
      "SHIELD_CELL_PEPPER=shield-ug-sandbox-pepper",
      `SHIELD_CELL_PEPPER=shield-ug-sandbox-pepper

# ES256 private key (PKCS#8 PEM, newlines escaped) that signs audit entries and
# the official-channels list. Generate one with: bun run keygen
SHIELD_SIGNING_KEY="<paste the generated PEM here>"`,
    ),
  );
}
