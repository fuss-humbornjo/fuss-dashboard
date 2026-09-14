# AGENTS.md

Working agreements for agentic work in this repo.

## Folder structure

`src/lib/` mirrors the [fuss repo](https://github.com/fuss-humbornjo/fuss) layout:

- **Service APIs live under `service/$service/`** — one directory per fuss backend service (e.g. `service/agent`, `service/registry`), holding the service's API client (`api.ts`) plus the feature UI that talks to it (e.g. `service/registry/skills.svelte`). A new backend service gets a new `service/$service/` directory.
- **Package concepts live under `package/$package/`** — one directory per fuss package (e.g. `package/agent`, `package/mcpx`, `package/skillx`), for UI that edits or renders a package-level concept rather than a service endpoint.

Supporting directories:

- `assets/` — static assets (logos, error illustrations) imported through Vite as `$lib/assets/...`; the single-file build inlines them as data URIs.
- `components/layout/` — the app shell: sidebar, header, page heading, user menu, and the nav config (`navigation.ts`). Kebab-case filenames.
- `components/ui/` — vendored shadcn-svelte primitives, one directory per component with an `index.ts` barrel, plus local composites like `error-page/` and `cloaked-text/`.
- `features/` — fixture-backed demo pages (`dashboard`, `auth`) that do not talk to a backend service.
- `edra/` — vendored [Edra](https://github.com/Tsuzat/Edra) rich-text editor. Excluded from Biome (`biome.json`); patch minimally and in place.
- `shims/` — shims for SvelteKit-only imports that vendored code expects (e.g. `$app/environment`).
- `base.ts` — URL base helpers for the embedded mount: production builds use `base: "/ui/"` (served by fuss at `/ui`), while `pnpm dev` serves at the root. The router strips the base (`stripBase`); real `<a>` hrefs prefix it (`withBase`) so open-in-new-tab works. Paths handed to `onNavigate` stay base-less.
- `auth.ts` — API bearer auth for the embedded build: `?token=` bootstrap into `localStorage` (`fuss.token`) plus `authHeaders()`; every fetch to `/agent` or `/registry` must spread `authHeaders()` (anchors can't set headers; download via fetch → blob → object URL).
- `utils.ts` — `cn()` and the bits-ui prop helper types; import as `$lib/utils.js`.

## Service API conventions

`service/$service/api.ts` is the typed client for one fuss backend service. Derive its schemas from the backend's own definitions: the live OpenAPI document (`GET :8080/openapi.yaml`), the CUE schemas, and the generated Go types under `fuss/service/$service/` and `fuss/package/*/`. Record what you verified against in the file's header comment.

- **Protobuf RPC shape** — one `<op>Request` message in, one `<op>Response` message out, both zod-validated at the boundary through `defineRpc` (`service/rpc.ts`). One `--- <opName> ---` section per operation: request schema, request type, response schema, response type, then the `defineRpc` call.
- **Requests are `z.input`, responses are `z.infer`** — parsing fills schema defaults (pagination fields, omitted zero values), so callers may leave them out.
- **The schema normalizes the wire** — the backend emits protobuf JSON, which omits zero-valued fields: optional fields arrive nullish and get `.nullish().transform((v) => v ?? undefined)`, empty strings get `.default("")`. Config objects are `z.looseObject` so unknown fields survive the draft/wire editing round trip.
- **`defineRpc` is both query and mutation** — `.queryOptions(req)` drops into `createQuery` with the canonical `[service, rpc, req]` key; the callable itself is the `mutationFn` for `createMutation`.
- **Paths come from the validated request** — `encodeURIComponent` every path variable; GETs put parameters in the query string; writes return a plain object (sent as JSON) or `FormData` (multipart, browser-set boundary) from `body:`.
- **PATCHes send the full resource plus `update_masks`** — build masks with helpers like `configChanges` (one `config.<key>` per changed field).
- **Errors are `ApiError`s carrying the server status** — the server's reason (`{"message"}` JSON or a plain-text body) beats the `errorMessage(status)` fallback; an op may supply its own `errorMessage:` for known statuses (e.g. 409 on `deleteSkillPackage`). A 204 parses as `{}`, so model empty responses as `z.object({})`.
- **Render failures with `ErrorPage` and `errorStatus(cause)`** — an `ApiError`'s status becomes the errcode (401 renders as the 403 page); network and schema errors read as 500.
- **Dashboard conveniences are plain functions, not RPCs** — cross-operation helpers (`findProject`, `listAllSkills`) compose the exported RPCs and skip `defineRpc`.

## Aliases

Configured in both `vite.config.ts` and the tsconfig `paths`:

- `$lib` → `src/lib`
- `$components` → `src/lib/components`
- `$app/environment` → `src/lib/shims/app-environment.ts`

## Design conventions

- **The page title should be all uppercase.** `PageHeading` (`src/lib/components/layout/page-heading.svelte`) applies the `uppercase` class to its h1: pass titles in natural case (`Skills`, not `SKILLS`) and let the component render them uppercase. Pages without a `PageHeading` apply `uppercase` to their title element directly.

## Checks

Before finishing work: `pnpm check` (0 errors expected) and `npx biome check --write <touched files>`. The vendored `edra/` tree is excluded from Biome. Do not reformat it.
