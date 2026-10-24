import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { SCHEMA_REGISTRY } from "../src/lib/schemas";

/**
 * Classification as code (12, section 9.3): a field without a data class
 * fails the build. This checks the schema registry and refuses inline
 * schemas in the API routes, so a new field cannot slip in unclassified.
 */

const API_DIR = join(process.cwd(), "src", "app", "api");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const problems: string[] = [];
const rows: string[] = [];

type Field = { meta?: () => unknown; def?: { innerType?: Field } };

/** The class lives on the field itself; an optional wrapper holds it inside. */
function readMeta(field: Field): Record<string, unknown> | undefined {
  const own = typeof field.meta === "function" ? (field.meta() as Record<string, unknown> | undefined) : undefined;
  if (own) return own;
  const inner = field.def?.innerType;
  if (inner && typeof inner.meta === "function") {
    return inner.meta() as Record<string, unknown> | undefined;
  }
  return undefined;
}

for (const [name, schema] of Object.entries(SCHEMA_REGISTRY)) {
  const shape = (schema as unknown as { def: { shape: Record<string, Field> } }).def.shape;
  for (const [field, definition] of Object.entries(shape)) {
    const meta = readMeta(definition);
    if (!meta || !meta.dataClass) {
      problems.push(`${name}.${field} has no dataClass`);
      continue;
    }
    rows.push(`${name}.${field} → ${meta.dataClass} (log: ${meta.log ?? "value"})`);
  }
}

// A route must not define its own object schema: that is how unclassified
// fields get in.
for (const file of walk(API_DIR)) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    if (/z\.object\(\s*\{/.test(line)) {
      problems.push(`${file.replace(process.cwd() + "\\", "")}:${index + 1} defines an inline z.object — use src/lib/schemas.ts`);
    }
  });
}

if (problems.length > 0) {
  console.error("✖ data classification failed:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}

console.log(`✔ ${rows.length} request fields classified`);
for (const row of rows) console.log("  " + row);
