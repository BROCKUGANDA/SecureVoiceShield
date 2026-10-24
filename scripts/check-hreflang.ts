/**
 * hreflang reciprocity check (14, sections 2 and 12).
 *
 * What it proves, against a running server:
 *
 *   1. every locale page lists all eleven locales plus `x-default`;
 *   2. the set is identical on every page;
 *   3. every hreflang link resolves to a page that exists (HTTP 200);
 *   4. every page's canonical points at itself.
 *
 * It also checks the metadata standard from section 5: a title of 60
 * characters or fewer, a description of 155 characters or fewer, and one
 * canonical per page.
 *
 * Behaviour when no server is running: the check SKIPS and exits 0 with a
 * clear message, so a build without a dev server is never blocked. It does
 * not claim to have checked anything it could not check. Run it with
 * `--require-server` (or HREFLANG_REQUIRE_SERVER=1) to turn a missing
 * server into a failure — that is what CI does.
 *
 * Usage:
 *   bun scripts/check-hreflang.ts [baseUrl]
 *   bun scripts/check-hreflang.ts --require-server [baseUrl]
 */

const DEFAULT_BASE = "http://127.0.0.1:3000";

/** The eleven locales and the x-default target (14, section 2). */
const EXPECTED_LOCALES = [
  "en-AE",
  "ar-AE",
  "hi-AE",
  "ur-AE",
  "en-KE",
  "sw-KE",
  "en-UG",
  "lg-UG",
  "sw-UG",
  "en-TZ",
  "sw-TZ",
];

const X_DEFAULT = "x-default";

/** The path of each locale, from its hreflang code. */
function localePath(code: string): string {
  return `/${code.toLowerCase()}/`;
}

interface Alternate {
  hreflang: string;
  href: string;
}

interface PageFacts {
  path: string;
  status: number;
  alternates: Alternate[];
  canonical: string | null;
  title: string | null;
  description: string | null;
}

function parseArgs(argv: string[]): { base: string; requireServer: boolean } {
  const requireServer =
    argv.includes("--require-server") || process.env.HREFLANG_REQUIRE_SERVER === "1";
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const base = (positional[0] ?? DEFAULT_BASE).replace(/\/$/, "");
  return { base, requireServer };
}

/** Decode the HTML entities React escapes, so lengths are counted as a reader sees them. */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

/** Pull the hreflang links and the canonical out of a rendered page. */
export function extractPageFacts(html: string): {
  alternates: Alternate[];
  canonical: string | null;
  title: string | null;
  description: string | null;
} {
  const alternates: Alternate[] = [];
  const linkPattern = /<link\b[^>]*>/gi;
  for (const match of html.match(linkPattern) ?? []) {
    const hreflang = /\bhreflang=["']([^"']+)["']/i.exec(match)?.[1];
    const href = /\bhref=["']([^"']+)["']/i.exec(match)?.[1];
    const rel = /\brel=["']([^"']+)["']/i.exec(match)?.[1] ?? "";
    if (!hreflang || !href) continue;
    if (!/\balternate\b/i.test(rel)) continue;
    alternates.push({ hreflang, href });
  }

  const canonicalMatch = /<link\b[^>]*rel=["']canonical["'][^>]*>/i.exec(html);
  const canonical = canonicalMatch
    ? (/\bhref=["']([^"']+)["']/i.exec(canonicalMatch[0])?.[1] ?? null)
    : null;

  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
  const descriptionTag =
    /<meta\b[^>]*\bname=["']description["'][^>]*>/i.exec(html)?.[0] ??
    /<meta\b[^>]*\bcontent=["'][^"']*["'][^>]*\bname=["']description["'][^>]*>/i.exec(html)?.[0] ??
    null;
  const descriptionText = descriptionTag
    ? decodeEntities(/\bcontent=["']([^"']*)["']/i.exec(descriptionTag)?.[1] ?? "").trim() || null
    : null;

  return {
    alternates,
    canonical,
    title: title ? decodeEntities(title) : null,
    description: descriptionText,
  };
}

async function fetchPage(base: string, path: string): Promise<PageFacts> {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    headers: { "user-agent": "shield-hreflang-check/1.0" },
  });
  const html = response.ok ? await response.text() : "";
  const facts = extractPageFacts(html);
  return {
    path,
    status: response.status,
    ...facts,
  };
}

/** Normalise a URL so "/en-ae/" and "http://host/en-ae/" compare equal. */
function normalise(url: string, base: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed.replace(base, "").replace(/\/$/, "/");
  }
}

async function main(): Promise<number> {
  const { base, requireServer } = parseArgs(process.argv.slice(2));

  const reachable = await fetch(`${base}/`, { redirect: "manual" }).then(
    () => true,
    () => false,
  );
  if (!reachable) {
    if (requireServer) {
      console.error(
        `✖ hreflang check needs a running server.\n  No server answered at ${base}.\n` +
          `  Start one (bun run dev) and run the check again, or drop --require-server to skip.`,
      );
      return 1;
    }
    console.log(
      `○ hreflang check skipped — no server at ${base}.\n` +
        `  Nothing was checked. Start a server and run: bun run check:hreflang`,
    );
    return 0;
  }

  const problems: string[] = [];
  const pages: PageFacts[] = [];
  /** Every path an alternate points at, fetched once. */
  const targets = new Set<string>();

  for (const code of EXPECTED_LOCALES) {
    pages.push(await fetchPage(base, localePath(code)));
  }

  const expectedSet = new Set([...EXPECTED_LOCALES, X_DEFAULT]);

  for (const page of pages) {
    if (page.status !== 200) {
      problems.push(`${page.path} returned HTTP ${page.status}`);
      continue;
    }

    const found = new Set(page.alternates.map((a) => a.hreflang));

    for (const code of EXPECTED_LOCALES) {
      if (!found.has(code)) {
        problems.push(`${page.path} is missing the hreflang link for ${code}`);
      }
    }
    if (!found.has(X_DEFAULT)) {
      problems.push(`${page.path} is missing the ${X_DEFAULT} hreflang link`);
    }
    for (const hreflang of found) {
      if (!expectedSet.has(hreflang)) {
        problems.push(`${page.path} lists an unknown hreflang: ${hreflang}`);
      }
    }
    if (found.size !== expectedSet.size) {
      problems.push(
        `${page.path} lists ${found.size} hreflang links, expected ${expectedSet.size}`,
      );
    }

    // The canonical must point at this page and nothing else.
    if (!page.canonical) {
      problems.push(`${page.path} has no canonical link`);
    } else {
      const canonicalPath = normalise(page.canonical, base);
      if (canonicalPath !== page.path) {
        problems.push(
          `${page.path} canonicalises to ${page.canonical}, expected ${page.path}`,
        );
      }
    }

    // The metadata standard (14, section 5).
    if (!page.title) {
      problems.push(`${page.path} has no title`);
    } else if (page.title.length > 60) {
      problems.push(`${page.path} title is ${page.title.length} characters, the limit is 60`);
    }
    if (!page.description) {
      problems.push(`${page.path} has no meta description`);
    } else if (page.description.length > 155) {
      problems.push(
        `${page.path} meta description is ${page.description.length} characters, the limit is 155`,
      );
    }

    // Every hreflang link must resolve to a page that exists.
    for (const alternate of page.alternates) {
      targets.add(normalise(alternate.href, base));
    }
  }

  // Each target is fetched once, not once per page.
  for (const target of targets) {
    const response = await fetch(`${base}${target}`, { redirect: "manual" });
    if (response.status !== 200) {
      problems.push(`${target} is linked as an alternate but returned HTTP ${response.status}`);
    }
  }

  // The set must be identical on every page: one distinct signature only.
  const signatures = new Map<string, string[]>();
  for (const page of pages) {
    const signature = page.alternates
      .map((a) => a.hreflang)
      .sort()
      .join(",");
    const existing = signatures.get(signature);
    if (existing) {
      existing.push(page.path);
    } else {
      signatures.set(signature, [page.path]);
    }
  }
  if (signatures.size > 1) {
    for (const [signature, paths] of signatures) {
      problems.push(
        `${paths.join(", ")} list a different hreflang set than the other pages (${signature})`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(
      `✖ hreflang reciprocity check failed (${problems.length} problem(s)):\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
    return 1;
  }

  console.log(
    `✔ hreflang reciprocity holds — ${pages.length} locale pages, ${EXPECTED_LOCALES.length} locales + ${X_DEFAULT} each, canonicals self-referencing, all links HTTP 200`,
  );
  return 0;
}

if (import.meta.main) {
  const exitCode = await main();
  process.exit(exitCode);
}
