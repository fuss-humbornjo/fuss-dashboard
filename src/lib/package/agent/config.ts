// Zod schema for agent.#Config (see fuss package/agent/config.cue), composed
// from the mcpx/skillx package schemas the same way the CUE definition is.

import { z } from "zod";
import { mcpConfigSchema } from "../mcpx/config";
import { skillConfigSchema } from "../skillx/config";

// Loose on purpose: fields added to the fuss schema later must survive a
// save untouched via spread, not be stripped at the API boundary.
export const agentConfigSchema = z.looseObject({
  hint_prompt: z.string(),
  system_prompt: z.string(),
  storage_key: z.string().optional(),
  envs: z.array(z.string()).optional(),
  mcps: z.array(mcpConfigSchema).optional(),
  skills: z.array(skillConfigSchema).optional(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
