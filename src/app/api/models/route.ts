import { ok } from "@/lib/api";
import { MODEL_REGISTRY, modelCard } from "@/lib/models";

export const dynamic = "force-dynamic";

/**
 * GET /api/models — the model-card catalogue (13, section 7, OB-15).
 *
 * Public card fields only: the owner role and the internal validation notes
 * are not published. The cards are generated from models/registry.json, the
 * same file the build check enforces against the code.
 */
export async function GET() {
  return ok({
    service: "SecureVoice Shield — model registry",
    generatedAt: new Date().toISOString(),
    models: MODEL_REGISTRY.map((model) => modelCard(model)),
  });
}
