/**
 * GET /.well-known/apple-app-site-association — the iOS Universal Links
 * statement (14, section 10.6).
 *
 * Apple fetches this exact path, with no file extension and no redirect, so
 * the route is served as application/json in place.
 *
 * The statement names the Apple Team ID, which is a deployment fact this
 * repository does not know:
 *
 *   SHIELD_IOS_TEAM_ID="ABCDE12345"
 *
 * Without it the route answers 503 with a plain explanation rather than
 * publishing a made-up team id.
 */

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** The bundle id of the Shield app. */
const IOS_BUNDLE_ID = "me.securevoiceai.shield";

/** Apple Team IDs are ten alphanumeric characters. */
const TEAM_ID_RE = /^[A-Za-z0-9]{10}$/;

export async function GET() {
  const teamId = (process.env.SHIELD_IOS_TEAM_ID ?? "").trim();

  if (!TEAM_ID_RE.test(teamId)) {
    return new Response(
      "The iOS app-link binding is not configured: set SHIELD_IOS_TEAM_ID to the Apple Team ID that owns the published app.\n",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  const appId = `${teamId}.${IOS_BUNDLE_ID}`;

  const statement = {
    applinks: {
      details: [
        {
          appIDs: [appId],
          components: [{ "/": "/open/*", comment: "Deep links into the app" }],
        },
      ],
    },
    webcredentials: {
      apps: [appId],
    },
  };

  return new Response(JSON.stringify(statement, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
