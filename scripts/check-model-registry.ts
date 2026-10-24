import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Model registry check (13, section 7).
 *
 * A model card is only worth something if it is true, so the build fails when
 * the registry and the code disagree. Three failures are caught:
 *
 *   1. a registry entry is missing a required field (absent or empty);
 *   2. a model the code names has no registry entry;
 *   3. a registry entry names a version the code does not use.
 *
 * The engine is parsed, not imported, so the check runs before a build and
 * without one: no transpiler, no bundler, no database.
 */

const ROOT = process.cwd();
const REGISTRY_PATH = join(ROOT, "models", "registry.json");
const ENGINE_PATH = join(ROOT, "src", "lib", "shield-engine.ts");

const KINDS = ["detector", "policy", "scoring", "classifier", "agent"];
const TIERS = ["high", "medium"];
const DATA_CLASSES = ["C1", "C2", "C3", "C4", "C5"];

/** Fields every model card must carry. */
const REQUIRED_FIELDS = [
  "id",
  "kind",
  "purpose",
  "tier",
  "owner",
  "version",
  "versionSource",
  "intendedUse",
  "knownLimits",
  "validation",
  "monitoringThreshold",
  "fallback",
  "retirementPlan",
  "dataClass",
  "notToBeUsedFor",
];

const problems: string[] = [];

function fail(message: string): void {
  problems.push(message);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve a constant such as `RULE_PACK_VERSION` or
 * `MODEL_VERSIONS.d3InHouse` in a source file, by parsing the file.
 * Returns undefined when the file, the constant or the key does not exist.
 */
function resolveConstant(file: string, constantPath: string): string | undefined {
  if (!existsSync(file)) return undefined;
  const source = readFileSync(file, "utf8");
  const [name, key] = constantPath.split(".");
  const declaration = new RegExp(
    `(?:export\\s+)?const\\s+${escapeRegExp(name)}\\b[^=]*=\\s*`,
  ).exec(source);
  if (!declaration) return undefined;

  const rest = source.slice(declaration.index + declaration[0].length);

  // An object constant: `const NAME = { key: "value" }`.
  if (rest.startsWith("{")) {
    if (!key) return undefined;
    const end = rest.indexOf("}");
    const body = end === -1 ? rest : rest.slice(0, end);
    const entry = new RegExp(
      `(?:^|[,{\\s])${escapeRegExp(key)}\\s*:\\s*"([^"]*)"`,
    ).exec(body);
    return entry ? entry[1] : undefined;
  }

  // A string constant: `const NAME = "value"`.
  const literal = /^"([^"]*)"/.exec(rest);
  if (!literal) return undefined;
  return key ? undefined : literal[1];
}

/** Parse `MODEL_VERSIONS` out of the engine without importing it. */
function readModelVersions(): Record<string, string> {
  const source = readFileSync(ENGINE_PATH, "utf8");
  const block = /MODEL_VERSIONS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(source);
  const versions: Record<string, string> = {};
  if (!block) return versions;
  for (const match of block[1].matchAll(/([A-Za-z0-9_]+)\s*:\s*"([^"]*)"/g)) {
    versions[match[1]] = match[2];
  }
  return versions;
}

/** Parse `RULE_PACK_VERSION` out of the engine without importing it. */
function readRulePackVersion(): string | undefined {
  const source = readFileSync(ENGINE_PATH, "utf8");
  const match = /RULE_PACK_VERSION\s*=\s*"([^"]*)"/.exec(source);
  return match ? match[1] : undefined;
}

// --- The registry ----------------------------------------------------------

if (!existsSync(REGISTRY_PATH)) {
  console.error(`✖ model registry check failed:\n  - ${REGISTRY_PATH} does not exist`);
  process.exit(1);
}

let registry: { models?: Record<string, unknown>[] };
try {
  registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as { models?: Record<string, unknown>[] };
} catch (error) {
  console.error(
    `✖ model registry check failed:\n  - ${REGISTRY_PATH} is not valid JSON (${(error as Error).message})`,
  );
  process.exit(1);
}

const models = registry.models;
if (!Array.isArray(models) || models.length === 0) {
  console.error("✖ model registry check failed:\n  - models/registry.json has no models");
  process.exit(1);
}

// --- The code --------------------------------------------------------------

const modelVersions = readModelVersions();
const rulePackVersion = readRulePackVersion();

if (!rulePackVersion) {
  fail("src/lib/shield-engine.ts does not declare RULE_PACK_VERSION");
}
if (Object.keys(modelVersions).length === 0) {
  fail("src/lib/shield-engine.ts does not declare MODEL_VERSIONS");
}

// The engine must agree with itself: MODEL_VERSIONS.rulePack is the pack.
if (rulePackVersion && modelVersions.rulePack && modelVersions.rulePack !== rulePackVersion) {
  fail(
    `src/lib/shield-engine.ts is inconsistent: MODEL_VERSIONS.rulePack is ${modelVersions.rulePack} but RULE_PACK_VERSION is ${rulePackVersion}`,
  );
}

// --- 1. every entry is complete -------------------------------------------

const seenIds = new Set<string>();

for (const model of models) {
  const id = typeof model.id === "string" && model.id.trim() ? model.id : "(no id)";
  if (seenIds.has(id)) fail(`model ${id} is listed more than once in the registry`);
  seenIds.add(id);

  for (const field of REQUIRED_FIELDS) {
    const value = model[field];
    if (value === undefined || value === null) {
      fail(`model ${id} has no ${field}`);
      continue;
    }
    if (typeof value === "string" && value.trim() === "") {
      fail(`model ${id} has an empty ${field}`);
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        fail(`model ${id} has an empty ${field}`);
        continue;
      }
      for (const item of value) {
        if (typeof item !== "string" || item.trim() === "") {
          fail(`model ${id} has an empty item in ${field}`);
        }
      }
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      const source = value as Record<string, unknown>;
      for (const key of ["file", "constant"]) {
        if (typeof source[key] !== "string" || (source[key] as string).trim() === "") {
          fail(`model ${id} has no versionSource.${key}`);
        }
      }
    }
  }

  if (typeof model.kind === "string" && !KINDS.includes(model.kind)) {
    fail(`model ${id} has an unknown kind "${model.kind}"`);
  }
  if (typeof model.tier === "string" && !TIERS.includes(model.tier)) {
    fail(`model ${id} has an unknown tier "${model.tier}"`);
  }
  if (typeof model.dataClass === "string" && !DATA_CLASSES.includes(model.dataClass)) {
    fail(`model ${id} has an unknown data class "${model.dataClass}"`);
  }
  if (typeof model.owner === "string" && /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(model.owner)) {
    fail(`model ${id} names a person in owner ("${model.owner}"); use a role`);
  }
}

// --- 2. every model the code names is in the registry ----------------------

/** Ids whose version was already reported as wrong, so it is reported once. */
const versionReported = new Set<string>();

for (const [codeId, version] of Object.entries(modelVersions)) {
  const entry = models.find((model) => model.id === codeId);
  if (!entry) {
    fail(`the code runs model "${codeId}" (version ${version}) but the registry has no entry for it`);
    continue;
  }
  if (entry.version !== version) {
    versionReported.add(codeId);
    fail(
      `model ${codeId} names version ${String(entry.version)} but src/lib/shield-engine.ts uses ${version}`,
    );
  }
  // A code-named model must take its version from its own constant, so a card
  // cannot borrow a version that happens to exist somewhere else.
  const constant = (entry.versionSource as { constant?: string } | undefined)?.constant;
  const allowed = [`MODEL_VERSIONS.${codeId}`];
  if (codeId === "rulePack") allowed.push("RULE_PACK_VERSION");
  if (typeof constant === "string" && !allowed.includes(constant)) {
    fail(
      `model ${codeId} must take its version from ${allowed.join(" or ")}, not from ${constant}`,
    );
  }
}

// --- 3. every version the registry names is one the code uses -------------

for (const model of models) {
  const id = typeof model.id === "string" ? model.id : "(no id)";
  if (versionReported.has(id)) continue; // already reported above
  const source = model.versionSource as Record<string, unknown> | undefined;
  if (!source || typeof source.file !== "string" || typeof source.constant !== "string") {
    continue; // already reported by the field check
  }
  const file = join(ROOT, source.file);
  if (!existsSync(file)) {
    fail(`model ${id} names version source ${source.file}, which does not exist`);
    continue;
  }
  const resolved = resolveConstant(file, source.constant);
  if (resolved === undefined) {
    fail(
      `model ${id} names version source ${source.constant} in ${source.file}, which the code does not declare`,
    );
    continue;
  }
  if (resolved !== model.version) {
    fail(
      `model ${id} names version ${String(model.version)} but ${source.file} ${source.constant} is ${resolved}`,
    );
  }
}

// --- Report ----------------------------------------------------------------

if (problems.length > 0) {
  console.error(
    `✖ model registry check failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n` +
      problems.map((problem) => `  - ${problem}`).join("\n"),
  );
  process.exit(1);
}

const table: string[][] = [["ID", "KIND", "TIER", "VERSION", "DATA", "VERSION SOURCE"]];
for (const model of models) {
  const source = model.versionSource as { file: string; constant: string };
  table.push([
    String(model.id),
    String(model.kind),
    String(model.tier),
    String(model.version),
    String(model.dataClass),
    `${source.file} · ${source.constant}`,
  ]);
}

const widths = table[0].map((_, column) =>
  Math.max(...table.map((row) => row[column].length)),
);

console.log(`✔ model registry is consistent — ${models.length} models\n`);
for (const row of table) {
  const line = row
    .map((cell, column) => (column === row.length - 1 ? cell : cell.padEnd(widths[column] + 2)))
    .join("");
  console.log("  " + line.trimEnd());
}
process.exit(0);
