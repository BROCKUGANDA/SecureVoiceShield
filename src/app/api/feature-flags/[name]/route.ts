import { NextResponse } from "next/server";

// Feature flag values (in production, fetched from GitLab Unleash API).
const FLAGS: Record<string, { enabled: boolean; rolloutPercentage?: number }> = {
  "public.verdicts.floor_inconclusive": { enabled: false },
  "guardian.enabled": { enabled: true },
  "surge_profile_active": { enabled: false },
  "new_payee_tighter_thresholds": { enabled: false },
  "kb_pgvector_search": { enabled: true },
  "onesignal_push": { enabled: false },
  "ab_testing_enabled": { enabled: true },
  "canary_new_model": { enabled: false, rolloutPercentage: 5 },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const flag = FLAGS[name];
  if (!flag) {
    return NextResponse.json({ error: "Unknown flag" }, { status: 404 });
  }
  return NextResponse.json({ name, ...flag });
}