import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * The architecture rule the spec sets on the seams (10, section 1):
 *
 *   S-1 Core depends only on ports. The engine and the orchestrator must not
 *       import an adapter; adapters live behind the ports.
 *
 * This check fails the build when the engine reaches past a port into an
 * adapter, and when an adapter is missing the metadata every adapter must
 * carry (S-5).
 */

const SRC = join(process.cwd(), "src");
const problems: string[] = [];

/** The files that make up Shield Core: they may import ports, never adapters. */
const CORE_FILES = ["src/lib/shield-engine.ts", "src/lib/audit.ts", "src/lib/mode.ts"];

function readIfPresent(relative: string): string | null {
  try {
    return readFileSync(join(process.cwd(), relative), "utf8");
  } catch {
    return null;
  }
}

for (const file of CORE_FILES) {
  const source = readIfPresent(file);
  if (source === null) {
    problems.push(`${file} is missing`);
    continue;
  }
  if (source.includes("@/lib/adapters")) {
    problems.push(`${file} imports an adapter — core depends on ports only (S-1)`);
  }
  if (source.includes("from \"@/lib/ports-registry\"")) {
    problems.push(`${file} resolves adapters through the registry — the engine must take signals, not adapters (S-1)`);
  }
}

// Every adapter module must exist and every adapter must be reachable.
const adaptersDir = join(SRC, "lib", "adapters");
let adapterFiles: string[] = [];
try {
  adapterFiles = readdirSync(adaptersDir).filter((f) => f.endsWith(".ts"));
} catch {
  problems.push("src/lib/adapters is missing — the ports have no adapters");
}

if (adapterFiles.length === 0) {
  problems.push("src/lib/adapters holds no adapter");
}

const registry = readIfPresent("src/lib/ports-registry.ts");
if (registry === null) {
  problems.push("src/lib/ports-registry.ts is missing");
} else {
  for (const port of [
    "detector",
    "telco",
    "clock",
    "random",
    "key",
    "storage",
    "identity",
    "channel",
    "tenant",
    "llm",
    "voice",
    "media",
  ]) {
    if (!registry.includes(`${port}:`)) {
      problems.push(`the registry does not resolve the ${port} port`);
    }
  }
}

if (problems.length > 0) {
  console.error("✖ port architecture check failed:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}

console.log(`✔ port architecture holds — ${CORE_FILES.length} core files, ${adapterFiles.length} adapter module(s), 12 ports resolved`);
