// API layer for the fuss registry service. Schemas are derived from the live
// OpenAPI document (`GET /openapi.yaml`, registry paths under
// /registry/scopes) and its CUE sources in fuss/service/registry/schema/v1.
//
// Responses are validated at the boundary. `ref` is nullable on the wire
// (SkillRef: "stable", a full hash, or a tag) and is normalized to
// `undefined` so consumers handle one empty shape.

import { z } from "zod";
import { ApiError, SchemaError } from "../agent/api";

const timestamp = z.iso.datetime({ offset: true });

const hashSchema = z.string().regex(/^[0-9a-f]{64}$/);

export const scopeSchema = z.object({
  name: z.string(),
  created_at: timestamp,
  updated_at: timestamp,
});

export type Scope = z.infer<typeof scopeSchema>;

export const skillInfoSchema = z.object({
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

export type SkillInfo = z.infer<typeof skillInfoSchema>;

export const skillVersionSchema = z.object({
  skill_id: z.uuid(),
  version: hashSchema,
  tag: z.string().optional(),
  sha256: hashSchema,
  size: z.number().int().nonnegative(),
  created_at: timestamp,
});

export type SkillVersion = z.infer<typeof skillVersionSchema>;

async function request<S extends z.ZodType>(
  path: string,
  schema: S,
): Promise<z.output<S>> {
  const response = await fetch(`/api/registry${path}`);
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Authentication failed. Check the dashboard’s service token.",
      403: "Access to this resource was denied.",
      404: "This resource or API endpoint is unavailable.",
      409: "The resource changed or is busy. Refresh and try again.",
    };
    throw new ApiError(
      response.status,
      messages[response.status] ??
        `Request failed (${response.status}). Your changes have not been confirmed.`,
    );
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("Fuss API response failed schema validation", parsed.error);
    throw new SchemaError(
      "The Fuss API returned data in an unexpected format.",
      parsed.error,
    );
  }
  return parsed.data;
}

export function listScopes(): Promise<Scope[]> {
  return request("/scopes", z.array(scopeSchema));
}

export function listSkills(scope: string): Promise<SkillInfo[]> {
  return request(
    `/scopes/${encodeURIComponent(scope)}/skills`,
    z.array(skillInfoSchema),
  );
}

export function getSkillInfo(
  scope: string,
  skillId: string,
): Promise<SkillInfo> {
  return request(
    `/scopes/${encodeURIComponent(scope)}/skills/${encodeURIComponent(skillId)}`,
    skillInfoSchema,
  );
}

export async function listAllSkills(): Promise<SkillInfo[]> {
  const scopes = await listScopes();
  const skills = await Promise.all(
    scopes.map((scope) => listSkills(scope.name)),
  );
  return skills.flat();
}

export function getSkillVersion(
  scope: string,
  skillId: string,
  version: string,
): Promise<SkillVersion> {
  return request(
    `/scopes/${encodeURIComponent(scope)}/skills/${encodeURIComponent(skillId)}/versions/${encodeURIComponent(version)}`,
    skillVersionSchema,
  );
}
