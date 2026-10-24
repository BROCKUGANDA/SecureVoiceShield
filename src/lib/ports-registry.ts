import {
  channelAdapter,
  clockAdapter,
  detectorAdapter,
  identityAdapter,
  keyAdapter,
  llmAdapter,
  mediaAdapter,
  randomAdapter,
  storageAdapter,
  telcoAdapter,
  tenantAdapter,
  voiceAdapter,
} from "@/lib/adapters";
import type { Ports } from "@/lib/ports";

/**
 * The ports the core uses (10, section 1). The engine never imports an
 * adapter directly — it takes signals — and `bun run check-ports` fails the
 * build if that rule is broken (S-1).
 */
export function getPorts(): Ports {
  return {
    detector: detectorAdapter,
    telco: telcoAdapter,
    clock: clockAdapter,
    random: randomAdapter,
    key: keyAdapter,
    storage: storageAdapter,
    identity: identityAdapter,
    channel: channelAdapter,
    tenant: tenantAdapter,
    llm: llmAdapter,
    voice: voiceAdapter,
    media: mediaAdapter,
  };
}
