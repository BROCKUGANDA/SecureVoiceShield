import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * `next build` with `output: "standalone"` emits a server bundle that does
 * not contain the static assets or the public folder. The shell copy step is
 * done here instead of with `cp -r`: the package script runs under bun's
 * shell on Windows, where `cp` rejects the `-r` flag.
 */
const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error("✖ .next/standalone is missing — did `next build` run?");
  process.exit(1);
}

for (const [from, to] of [
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
  [join(root, "public"), join(standalone, "public")],
]) {
  if (!existsSync(from)) {
    console.error(`✖ missing source: ${from}`);
    process.exit(1);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`✔ copied ${from} → ${to}`);
}
