// Draft model for editing skillx.#Config entries (see fuss package/skillx/config.cue).
// Managed fields are flattened for form binding; anything else rides
// `extra` so fields the form does not edit survive a save.

import { z } from "zod";

// Loose on purpose: fields added to the fuss schema later must survive a
// save untouched via `extra`, not be stripped at the API boundary.
export const skillConfigSchema = z.looseObject({
  name: z.string().min(1),
  scope: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  envs: z.array(z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/)).optional(),
});

export type SkillConfig = z.infer<typeof skillConfigSchema>;

export interface SkillDraft {
  name: string;
  scope: string;
  version: string;
  enabled: boolean;
  /** envs: host environment variable names the skill requires */
  envs: string[];
  extra: Record<string, unknown>;
}

export function toSkillDraft(entry: Partial<SkillConfig> = {}): SkillDraft {
  const { name, scope, version, enabled, envs, ...extra } = entry;
  return {
    name: name ?? "",
    scope: scope ?? "",
    version: version ?? "",
    enabled: enabled !== false,
    envs: envs ?? [],
    extra,
  };
}

export function toSkillWire(draft: SkillDraft): SkillConfig {
  return {
    ...draft.extra,
    name: draft.name.trim(),
    ...(draft.scope.trim() ? { scope: draft.scope.trim() } : {}),
    ...(draft.version.trim() ? { version: draft.version.trim() } : {}),
    ...(draft.enabled ? {} : { enabled: false }),
    ...(draft.envs.length ? { envs: draft.envs } : {}),
  };
}

export function emptySkillDraft(): SkillDraft {
  return toSkillDraft();
}
