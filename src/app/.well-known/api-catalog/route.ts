import { SITE_NAME, SITE_URL } from "@/lib/site";
import { GET as apiIndex } from "@/app/api/route";

/**
 * GET /.well-known/api-catalog — the OAuth 2.0 API Catalog (RFC 9727)
 * (14, section 10.9).
 *
 * The catalog links the API, the developer docs and the status page, and
 * lists every endpoint. The OpenAPI 3.1 and AsyncAPI 3.0 documents are
 * generated from the Zod contracts and are not published yet, so the
 * entries below point at the API root and say so — a link to a file that
 * would 404 is worse than an honest "not published yet".
 */

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** The API root this catalog describes. */
const API_BASE = `${SITE_URL}/api`;

/** The hosts derived from the canonical site URL (14, section 2). */
const HOST = new URL(SITE_URL).host;
const DOCS_URL = `https://docs.${HOST}/`;
const STATUS_URL = `https://status.${HOST}/`;

type ApiMethod = {
  name: string;
  description: string;
  method: string;
  uri: string;
};

/** "/api/verified-calls?number=" becomes the URI template "/api/verified-calls{?number}". */
function toUriTemplate(path: string): string {
  const [base, query] = path.split("?");
  if (query === undefined) return base;
  const names = query
    .split("&")
    .map((pair) => pair.split("=")[0])
    .filter((name) => name.length > 0);
  return names.length > 0 ? `${base}{?${names.join(",")}}` : base;
}

/** "GET|POST /api/reports" becomes one method per verb. */
function methodsOf(route: string, description: string): ApiMethod[] {
  const separator = route.indexOf(" ");
  const verbs = (separator === -1 ? route : route.slice(0, separator)).split("|");
  const path = separator === -1 ? "" : route.slice(separator + 1);
  const uri = toUriTemplate(path);
  // The name comes from the path, not from the template, so a query
  // placeholder never leaks into it.
  const name = path
    .split("?")[0]
    .split("/")
    .filter((part) => part.length > 0)
    .slice(1)
    .join("/");

  return verbs.map((verb) => ({
    name,
    description,
    method: verb.trim(),
    uri,
  }));
}

/** The endpoint list, read from the API index so the two cannot disagree. */
async function apiMethods(): Promise<ApiMethod[]> {
  const response = apiIndex();
  const body = (await response.json()) as { endpoints?: Record<string, string> };
  const endpoints = body.endpoints ?? {};

  return Object.entries(endpoints).flatMap(([route, description]) => methodsOf(route, description));
}

export async function GET() {
  const methods = await apiMethods();

  const catalog = {
    catalogs: [
      {
        publisher: {
          name: "SecureVoice",
          url: SITE_URL,
        },
        apis: [
          {
            name: `${SITE_NAME} API`,
            description:
              "Number checks, voice-note checks, Guardian sessions, scam reports and the hash-chained evidence log.",
            documentation: DOCS_URL,
            uri: API_BASE,
            contact: `${SITE_URL}/security/report`,
            apis: [
              {
                name: `${SITE_NAME} API`,
                description:
                  "The Shield API, as implemented by the service index at /api. Every endpoint below is listed by that index.",
                documentation: DOCS_URL,
                uri: API_BASE,
                methods,
              },
            ],
            openapi: {
              status: "not-published",
              url: API_BASE,
              note: "The OpenAPI 3.1 document is generated from the Zod contracts and is not published yet. This entry points at the API root until it exists.",
            },
            asyncapi: {
              status: "not-published",
              url: API_BASE,
              note: "The AsyncAPI 3.0 document is generated from the Zod contracts and is not published yet. This entry points at the API root until it exists.",
            },
            statusPage: {
              url: STATUS_URL,
              description: "Live status of the Shield service.",
            },
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
