// Shared RPC plumbing for the fuss service APIs. Every operation follows
// the protobuf shape: a single request message in (zod-validated, defaults
// filled), a single response message out (validated at the boundary).
// `defineRpc` binds those messages to their HTTP transport and returns a
// strongly typed callable — `.queryOptions(req)` drops it into tanstack
// query with a canonical [service, rpc, req] key, and the callable itself
// is a ready-made mutationFn for createMutation.

import { queryOptions } from "@tanstack/svelte-query";
import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class SchemaError extends Error {
  constructor(
    message: string,
    public cause: z.ZodError,
  ) {
    super(message);
  }
}

export function errorMessage(status: number): string {
  const messages: Record<number, string> = {
    401: "Authentication failed. Check the dashboard’s service token.",
    403: "Access to this resource was denied.",
    404: "This resource or API endpoint is unavailable.",
    409: "The resource changed or is busy. Refresh and try again.",
  };
  return (
    messages[status] ??
    `Request failed (${status}). Your changes have not been confirmed.`
  );
}

// serverReason extracts the human-readable reason from an error body,
// accepting either {"code","message"} JSON or plain text.
function serverReason(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    const body: unknown = JSON.parse(trimmed);
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string" &&
      body.message
    ) {
      return body.message;
    }
  } catch {
    // Not JSON: fall through to the plain-text body.
  }
  return trimmed;
}

interface RpcOptions<Req extends z.ZodType, Res extends z.ZodType> {
  /** Service name: the /api/<service> prefix and the query key's head. */
  service: "agent" | "registry";
  /** RPC name, e.g. "getSkill" — the query key's second segment. */
  name: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  requestSchema: Req;
  responseSchema: Res;
  /** Path (with query string) built from the validated request message. */
  path: (req: z.output<Req>) => string;
  /** Request body: a plain object goes out as JSON, FormData as multipart. */
  body?: (req: z.output<Req>) => unknown;
  /** Custom error message, e.g. to surface upload-specific reasons. */
  errorMessage?: (status: number, reason?: string) => string;
}

export function defineRpc<Req extends z.ZodType, Res extends z.ZodType>(
  options: RpcOptions<Req, Res>,
) {
  const {
    service,
    name,
    method = "GET",
    requestSchema,
    responseSchema,
    path,
    body: encode,
    errorMessage: onError,
  } = options;

  async function call(request: z.input<Req>): Promise<z.output<Res>> {
    const req = requestSchema.parse(request);
    const body = encode?.(req);
    const form = body instanceof FormData;
    const response = await fetch(`/api/${service}${path(req)}`, {
      method,
      headers:
        body === undefined || form
          ? undefined // the browser sets the multipart boundary itself
          : { "Content-Type": "application/json" },
      body:
        body === undefined
          ? undefined
          : form
            ? (body as FormData)
            : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      const reason = serverReason(text);
      throw new ApiError(
        response.status,
        onError?.(response.status, reason) ??
          reason ??
          errorMessage(response.status),
      );
    }
    // 204 responses carry no body; the empty message parses as {}.
    const parsed = responseSchema.safeParse(
      text.trim() ? JSON.parse(text) : {},
    );
    if (!parsed.success) {
      console.error("Fuss API response failed schema validation", parsed.error);
      throw new SchemaError(
        "The Fuss API returned data in an unexpected format.",
        parsed.error,
      );
    }
    return parsed.data;
  }

  return Object.assign(call, {
    queryOptions: (request: z.input<Req>) =>
      queryOptions({
        queryKey: [service, name, request] as const,
        queryFn: () => call(request),
      }),
  });
}
