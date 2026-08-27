// Draft model for editing mcpx.#Config entries (see fuss package/mcpx/config.cue).
// Managed fields are flattened for form binding; everything else rides
// extra/configExtra so fields the form does not edit survive a save.

import { z } from "zod";

export const MCP_TRANSPORT_TYPES = ["stdio", "sse", "streamable_http"] as const;

export type McpTransportType = (typeof MCP_TRANSPORT_TYPES)[number];

// Loose on purpose: fields added to the fuss schema later must survive a
// save untouched via extra/configExtra, not be stripped at the API boundary.
export const mcpTransportSchema = z.discriminatedUnion("type", [
  z.looseObject({
    type: z.literal("stdio"),
    config: z.looseObject({
      command: z.string(),
      args: z.array(z.string()).optional(),
      env: z.record(z.string(), z.string()).optional(),
      env_vars: z.array(z.string()).optional(),
      cwd: z.string().optional(),
    }),
  }),
  z.looseObject({
    type: z.literal("sse"),
    config: z.looseObject({ endpoint: z.string().regex(/^https?:\/\//) }),
  }),
  z.looseObject({
    type: z.literal("streamable_http"),
    config: z.looseObject({ endpoint: z.string().regex(/^https?:\/\//) }),
  }),
]);

export type McpTransport = z.infer<typeof mcpTransportSchema>;

export const mcpConfigSchema = z.looseObject({
  name: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/),
  enabled: z.boolean().optional(),
  required: z.boolean(),
  transport: mcpTransportSchema,
  enabled_tools: z.array(z.string()).optional(),
  disabled_tools: z.array(z.string()).optional(),
  tool_extensions: z
    .array(
      z.looseObject({
        name: z.string(),
        description_template: z.string().optional(),
      }),
    )
    .optional(),
  http_headers: z.record(z.string(), z.string()).optional(),
  // time.Duration on the wire: a duration string ("10s") or nanoseconds.
  startup_timeout: z.union([z.string(), z.number().positive()]).optional(),
  tool_timeout: z.union([z.string(), z.number().positive()]).optional(),
});

export type McpConfig = z.infer<typeof mcpConfigSchema>;

export interface McpDraft {
  name: string;
  enabled: boolean;
  required: boolean;
  type: McpTransportType;
  /** sse / streamable_http */
  endpoint: string;
  /** stdio */
  command: string;
  args: string[];
  /** stdio env_vars: host variables forwarded to the server process */
  envVars: string[];
  cwd: string;
  enabledTools: string[];
  disabledTools: string[];
  extra: Record<string, unknown>;
  configExtra: Record<string, unknown>;
}

export function toMcpDraft(entry: Partial<McpConfig> = {}): McpDraft {
  const {
    name,
    enabled,
    required,
    transport,
    enabled_tools,
    disabled_tools,
    ...extra
  } = entry;
  const type: McpTransportType = MCP_TRANSPORT_TYPES.includes(
    transport?.type as McpTransportType,
  )
    ? (transport?.type as McpTransportType)
    : "stdio";
  const {
    command,
    args,
    env_vars,
    cwd,
    endpoint,
    ...configExtra
  }: Record<string, unknown> = transport?.config ?? {};
  return {
    name: name ?? "",
    enabled: enabled !== false,
    required: required === true,
    type,
    endpoint: typeof endpoint === "string" ? endpoint : "",
    command: typeof command === "string" ? command : "",
    args: Array.isArray(args) ? (args as string[]) : [],
    envVars: Array.isArray(env_vars) ? (env_vars as string[]) : [],
    cwd: typeof cwd === "string" ? cwd : "",
    enabledTools: enabled_tools ?? [],
    disabledTools: disabled_tools ?? [],
    extra,
    configExtra,
  };
}

export function toMcpWire(draft: McpDraft): McpConfig {
  const transport: McpTransport =
    draft.type === "stdio"
      ? {
          type: "stdio",
          config: {
            ...draft.configExtra,
            command: draft.command.trim(),
            ...(draft.args.length ? { args: draft.args } : {}),
            ...(draft.envVars.length ? { env_vars: draft.envVars } : {}),
            ...(draft.cwd.trim() ? { cwd: draft.cwd.trim() } : {}),
          },
        }
      : {
          type: draft.type,
          config: {
            ...draft.configExtra,
            endpoint: draft.endpoint.trim(),
          },
        };
  return {
    ...draft.extra,
    name: draft.name.trim(),
    ...(draft.enabled ? {} : { enabled: false }),
    required: draft.required,
    transport,
    ...(draft.enabledTools.length ? { enabled_tools: draft.enabledTools } : {}),
    ...(draft.disabledTools.length
      ? { disabled_tools: draft.disabledTools }
      : {}),
  };
}

export function emptyMcpDraft(): McpDraft {
  return toMcpDraft();
}
