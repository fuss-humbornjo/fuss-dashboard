// API layer for the fuss registry service. It was written against the
// CUE schema at ../fuss/service/registry/schema.cue plus the generated Go
// types in ../fuss/service/registry/cue_types_gen.go, with the behaviour
// verified against the OpenAPI document the backend serves at
// http://localhost:8080/openapi.yaml.
//
// The registry API is name-addressed: scopes live at /scopes/{name},
// skills at /scopes/{scope}/skills/{name}, and packages under that path.
// List responses are wrapped ({scopes|skills|packages, next_page_token})
// — this client fetches a single page at the schema's maximum page_size
// (20 — the CUE schema rejects larger values with 400) and does not chase
// page tokens, which matches dashboard scale.
//
// Every operation follows the protobuf RPC shape: one <op>Request
// message in and one <op>Response message out, both zod-validated at the
// boundary (see ../rpc.ts). The schemas here mirror the service's
// messages exactly: `ref` and `tag` are nullish on the wire, so the
// schemas normalize them to undefined and the SDK deals only in
// optional values.
//
// `ref` is the mutable skill attribute: setting it freezes the skill on
// the pinned package (forever — the stable tag keeps moving without
// it); clearing it (null on the wire) resets the skill back to the
// stable tag. Pinning a ref is therefore permanent in effect but
// reversible by intent; a pinned skill never silently drifts onto newer
// packages, and a reset skill goes back to tracking stable releases.

import { z } from "zod";
import { defineRpc, errorMessage } from "../rpc";

const timestamp = z.iso.datetime({ offset: true });

// --- resource messages -------------------------------------------------

// The backend emits protobuf JSON: zero-valued fields are omitted from
// the wire, so optional message fields arrive nullish and are normalized
// to undefined, and empty strings get schema defaults.
export const scopeSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  created_at: timestamp,
  updated_at: timestamp,
});
export type Scope = z.infer<typeof scopeSchema>;

export const skillSchema = z.object({
  id: z.uuid(),
  scope: z.string(),
  name: z.string(),
  description: z.string(),
  ref: z
    .string()
    .nullish()
    .transform((ref) => ref ?? undefined),
  created_at: timestamp,
  updated_at: timestamp,
});
export type Skill = z.infer<typeof skillSchema>;

// Packages are addressed by the skill resource name in the path plus
// their version — the wire message carries only skill_id, not scope/name.
export const skillPackageSchema = z.object({
  skill_id: z.uuid(),
  version: z.string().regex(/^[0-9a-f]{6}$/),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  tag: z
    .string()
    .nullish()
    .transform((tag) => tag ?? undefined),
  size: z.number().int().nonnegative(),
  created_at: timestamp,
});
export type SkillPackage = z.infer<typeof skillPackageSchema>;

// --- pagination ---------------------------------------------------------

// page_size is CUE-capped at 20 — larger values are rejected with 400.
const pageSize = z.number().int().min(1).max(20).default(20);
const pageToken = z.string().default("");

// --- listScopes ---------------------------------------------------------

export const listScopesRequestSchema = z.object({
  page_size: pageSize,
  page_token: pageToken,
});
export type ListScopesRequest = z.input<typeof listScopesRequestSchema>;
export const listScopesResponseSchema = z.object({
  scopes: z.array(scopeSchema),
  next_page_token: z.string(),
});
export type ListScopesResponse = z.infer<typeof listScopesResponseSchema>;

export const listScopes = defineRpc({
  service: "registry",
  name: "listScopes",
  requestSchema: listScopesRequestSchema,
  responseSchema: listScopesResponseSchema,
  path: (req) =>
    `/scopes?page_size=${req.page_size}&page_token=${encodeURIComponent(req.page_token)}`,
});

// --- createScope --------------------------------------------------------

export const createScopeRequestSchema = z.object({
  name: z.string().min(1),
});
export type CreateScopeRequest = z.input<typeof createScopeRequestSchema>;
export const createScopeResponseSchema = scopeSchema;
export type CreateScopeResponse = z.infer<typeof createScopeResponseSchema>;

export const createScope = defineRpc({
  service: "registry",
  name: "createScope",
  method: "POST",
  requestSchema: createScopeRequestSchema,
  responseSchema: createScopeResponseSchema,
  path: () => "/scopes",
  body: (req) => req,
});

// --- listSkills ---------------------------------------------------------

export const listSkillsRequestSchema = z.object({
  scope: z.string(),
  page_size: pageSize,
  page_token: pageToken,
});
export type ListSkillsRequest = z.input<typeof listSkillsRequestSchema>;
export const listSkillsResponseSchema = z.object({
  skills: z.array(skillSchema),
  next_page_token: z.string(),
});
export type ListSkillsResponse = z.infer<typeof listSkillsResponseSchema>;

export const listSkills = defineRpc({
  service: "registry",
  name: "listSkills",
  requestSchema: listSkillsRequestSchema,
  responseSchema: listSkillsResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills?page_size=${req.page_size}&page_token=${encodeURIComponent(req.page_token)}`,
});

// listAllSkills fans out over scopes — a dashboard convenience, not an RPC.
export async function listAllSkills(): Promise<Skill[]> {
  const { scopes } = await listScopes({});
  const pages = await Promise.all(
    scopes.map((scope) => listSkills({ scope: scope.name })),
  );
  return pages.flatMap((page) => page.skills);
}

// --- getSkill -----------------------------------------------------------

export const getSkillRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
});
export type GetSkillRequest = z.input<typeof getSkillRequestSchema>;
export const getSkillResponseSchema = skillSchema;
export type GetSkillResponse = z.infer<typeof getSkillResponseSchema>;

export const getSkill = defineRpc({
  service: "registry",
  name: "getSkill",
  requestSchema: getSkillRequestSchema,
  responseSchema: getSkillResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}`,
});

// --- registerSkill -------------------------------------------------------

export const registerSkillRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
  description: z.string(),
});
export type RegisterSkillRequest = z.input<typeof registerSkillRequestSchema>;
export const registerSkillResponseSchema = skillSchema;
export type RegisterSkillResponse = z.infer<typeof registerSkillResponseSchema>;

export const registerSkill = defineRpc({
  service: "registry",
  name: "registerSkill",
  method: "POST",
  requestSchema: registerSkillRequestSchema,
  responseSchema: registerSkillResponseSchema,
  path: (req) => `/scopes/${encodeURIComponent(req.scope)}/skills`,
  body: (req) => ({ name: req.name, description: req.description }),
});

// --- listSkillPackages ---------------------------------------------------

export const listSkillPackagesRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
  page_size: pageSize,
  page_token: pageToken,
});
export type ListSkillPackagesRequest = z.input<
  typeof listSkillPackagesRequestSchema
>;
export const listSkillPackagesResponseSchema = z.object({
  packages: z.array(skillPackageSchema),
  next_page_token: z.string(),
});
export type ListSkillPackagesResponse = z.infer<
  typeof listSkillPackagesResponseSchema
>;

export const listSkillPackages = defineRpc({
  service: "registry",
  name: "listSkillPackages",
  requestSchema: listSkillPackagesRequestSchema,
  responseSchema: listSkillPackagesResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}/versions?page_size=${req.page_size}&page_token=${encodeURIComponent(req.page_token)}`,
});

// --- getSkillPackage -----------------------------------------------------

export const getSkillPackageRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
  version: z.string(),
});
export type GetSkillPackageRequest = z.input<
  typeof getSkillPackageRequestSchema
>;
export const getSkillPackageResponseSchema = z.object({
  skill: skillSchema,
  package: skillPackageSchema,
});
export type GetSkillPackageResponse = z.infer<
  typeof getSkillPackageResponseSchema
>;

export const getSkillPackage = defineRpc({
  service: "registry",
  name: "getSkillPackage",
  requestSchema: getSkillPackageRequestSchema,
  responseSchema: getSkillPackageResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}/versions/${encodeURIComponent(req.version)}`,
});

// --- updateSkillRef ------------------------------------------------------

// PATCHes only the default ref: the full skill identity is echoed back
// with the new ref under update_mask ["ref"]. `null` clears the pin
// (reset to stable); see the header comment for the exact semantics.
export const updateSkillRefRequestSchema = z.object({
  skill: skillSchema,
  ref: z.string().nullable(),
});
export type UpdateSkillRefRequest = z.input<typeof updateSkillRefRequestSchema>;
export const updateSkillRefResponseSchema = skillSchema;
export type UpdateSkillRefResponse = z.infer<
  typeof updateSkillRefResponseSchema
>;

export const updateSkillRef = defineRpc({
  service: "registry",
  name: "updateSkillRef",
  method: "PATCH",
  requestSchema: updateSkillRefRequestSchema,
  responseSchema: updateSkillRefResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.skill.scope)}/skills/${encodeURIComponent(req.skill.name)}`,
  body: (req) => ({
    skill: { ...req.skill, ref: req.ref },
    update_mask: ["ref"],
  }),
});

// --- deleteSkill ---------------------------------------------------------

// Removes the skill, cascading every published package (rows and blobs).
// The server answers 204 No Content, so the response message is empty.
export const deleteSkillRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
});
export type DeleteSkillRequest = z.input<typeof deleteSkillRequestSchema>;
export const deleteSkillResponseSchema = z.object({});
export type DeleteSkillResponse = z.infer<typeof deleteSkillResponseSchema>;

export const deleteSkill = defineRpc({
  service: "registry",
  name: "deleteSkill",
  method: "DELETE",
  requestSchema: deleteSkillRequestSchema,
  responseSchema: deleteSkillResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}`,
});

// --- deleteSkillPackage --------------------------------------------------

// Removes one immutable package. The server refuses with 409 when the
// skill's ref currently resolves to that exact package (a stored selector
// that dangles or is ambiguous does not pin it).
export const deleteSkillPackageRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
  version: z.string().regex(/^[0-9a-f]{6}$/),
});
export type DeleteSkillPackageRequest = z.input<
  typeof deleteSkillPackageRequestSchema
>;
export const deleteSkillPackageResponseSchema = z.object({});
export type DeleteSkillPackageResponse = z.infer<
  typeof deleteSkillPackageResponseSchema
>;

export const deleteSkillPackage = defineRpc({
  service: "registry",
  name: "deleteSkillPackage",
  method: "DELETE",
  requestSchema: deleteSkillPackageRequestSchema,
  responseSchema: deleteSkillPackageResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}/versions/${encodeURIComponent(req.version)}`,
  errorMessage: (status, reason) =>
    status === 409
      ? "This version is pinned by the default ref — move the ref first."
      : (reason ?? errorMessage(status)),
});

// --- publishSkillPackage -------------------------------------------------

// Uploads one immutable tar.gz package. The multipart filename must end
// in .tar.gz or the server rejects the upload with 400.
export const publishSkillPackageRequestSchema = z.object({
  scope: z.string(),
  name: z.string(),
  tag: z.string().optional(),
  package: z.instanceof(Blob),
});
export type PublishSkillPackageRequest = z.input<
  typeof publishSkillPackageRequestSchema
>;
export const publishSkillPackageResponseSchema = skillPackageSchema;
export type PublishSkillPackageResponse = z.infer<
  typeof publishSkillPackageResponseSchema
>;

export const publishSkillPackage = defineRpc({
  service: "registry",
  name: "publishSkillPackage",
  method: "POST",
  requestSchema: publishSkillPackageRequestSchema,
  responseSchema: publishSkillPackageResponseSchema,
  path: (req) =>
    `/scopes/${encodeURIComponent(req.scope)}/skills/${encodeURIComponent(req.name)}/versions`,
  body: (req) => {
    const form = new FormData();
    form.set("package", req.package, `${req.name}.tar.gz`);
    if (req.tag !== undefined) form.set("tag", req.tag);
    return form;
  },
  errorMessage: (status, reason) =>
    reason ??
    (status === 413
      ? "The skill package exceeds the 20 MB upload limit."
      : errorMessage(status)),
});
