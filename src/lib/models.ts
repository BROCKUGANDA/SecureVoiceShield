/**
 * Model registry (13, section 7).
 *
 * The inventory lives in `models/registry.json` so it can be read by the
 * build check, the API and the auditors without a build step. Every entry
 * names the code constant that carries its version, so a version in the
 * registry can always be traced back to a line in the source.
 *
 * `scripts/check-model-registry.ts` fails the build when the registry and
 * the code disagree, so this module never has to guess which version is live.
 */

import registryJson from "../../models/registry.json";

export type ModelKind = "detector" | "policy" | "scoring" | "classifier" | "agent";
export type ModelTier = "high" | "medium";
export type DataClass = "C1" | "C2" | "C3" | "C4" | "C5";

/** Where a version comes from: a constant in a source file. */
export interface ModelVersionSource {
  /** Path of the file that defines the constant, relative to the repo root. */
  file: string;
  /** The constant itself, e.g. `MODEL_VERSIONS.d3InHouse` or `RULE_PACK_VERSION`. */
  constant: string;
  /** Why this constant is the version of this model. */
  note?: string;
}

/** A full model card, including the internal fields. */
export interface ModelEntry {
  id: string;
  kind: ModelKind;
  purpose: string;
  tier: ModelTier;
  /** A role, never a person's name (13, section 1.2). */
  owner: string;
  version: string;
  versionSource: ModelVersionSource;
  intendedUse: string;
  knownLimits: string[];
  /** What has actually been done. Not what should have been done. */
  validation: string;
  monitoringThreshold: string;
  fallback: string;
  retirementPlan: string;
  dataClass: DataClass;
  notToBeUsedFor: string[];
}

/** The public card: the fields the model-card catalogue publishes. */
export type ModelCard = Omit<ModelEntry, "owner" | "validation" | "versionSource">;

export const MODEL_REGISTRY: ModelEntry[] = registryJson.models as ModelEntry[];

/** Every model id in the registry. */
export const MODEL_IDS: readonly string[] = MODEL_REGISTRY.map((model) => model.id);

/** Look a model up by id. */
export function modelById(id: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

/**
 * The public card for a model: everything an auditor or a developer needs to
 * know, minus the owner role and the internal validation notes.
 */
export function modelCard(model: ModelEntry): ModelCard {
  const { owner: _owner, validation: _validation, versionSource: _versionSource, ...card } = model;
  return card;
}

/** The public card for a model id, or undefined when the id is unknown. */
export function modelCardById(id: string): ModelCard | undefined {
  const model = modelById(id);
  return model ? modelCard(model) : undefined;
}
