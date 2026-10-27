import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * `next build` with `output: "standalone"` emits a server bundle that does
 * not contain the static assets or the public folder. The shell copy step is
 * done here instead of with `cp -r`: the package script runs under bun's
 * shell on Windows, where `cp` rejects the `-r` flag.
 */
const root = process.cwd();
const standaloneRoot = join(root, ".next", "standalone");

if (!existsSync(standaloneRoot)) {
  console.error("? .next/standalone is missing - did `next build` run?");
  process.exit(1);
}

// Next.js places server.js in a subfolder mirroring the project path on some
// hosts (e.g. .next/standalone/Desktop/SecureVoiceShield). Find it.
function findServerDir(dir) {
  if (existsSync(join(dir, "server.js"))) return dir;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory() && name !== "node_modules") {
      const r = findServerDir(p);
      if (r) return r;
    }
  }
  return null;
}
const standalone = findServerDir(standaloneRoot) || standaloneRoot;

for (const [from, to] of [
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
  [join(root, "public"), join(standalone, "public")],
]) {
  if (!existsSync(from)) {
    console.error(`? missing source: ${from}`);
    process.exit(1);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`? copied ${from} -> ${to}`);
}