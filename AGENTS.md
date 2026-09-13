# AGENTS.md

Working agreements for agentic work in this repo.

## Folder structure

`src/lib/` mirrors the [fuss repo](../fuss) layout:

- **Service APIs live under `service/$service/`** — one directory per fuss
  backend service (e.g. `service/agent`, `service/registry`), holding the
  service's API client (`api.ts`) plus the feature UI that talks to it (e.g.
  `service/registry/skills.svelte`). A new backend service gets a new
  `service/$service/` directory.
- **Package concepts live under `package/$package/`** — one directory per
  fuss package (e.g. `package/agent`, `package/mcpx`, `package/skillx`),
  for UI that edits or renders a package-level concept rather than a service
  endpoint.

Supporting directories:

- `assets/` — static assets (logos, error illustrations) imported through
  Vite as `$lib/assets/...`; the single-file build inlines them as data URIs.
- `components/layout/` — the app shell: sidebar, header, page heading, user
  menu, and the nav config (`navigation.ts`). Kebab-case filenames.
- `components/ui/` — vendored shadcn-svelte primitives, one directory per
  component with an `index.ts` barrel, plus local composites like
  `error-page/` and `cloaked-text/`.
- `features/` — fixture-backed demo pages (`dashboard`, `auth`) that do not
  talk to a backend service.
- `edra/` — vendored [Edra](https://github.com/Tsuzat/Edra) rich-text editor.
  Excluded from Biome (`biome.json`); patch minimally and in place.
- `shims/` — shims for SvelteKit-only imports that vendored code expects
  (e.g. `$app/environment`).
- `utils.ts` — `cn()` and the bits-ui prop helper types; import as
  `$lib/utils.js`.

## Aliases

Configured in both `vite.config.ts` and the tsconfig `paths`:

- `$lib` → `src/lib`
- `$components` → `src/lib/components`
- `$app/environment` → `src/lib/shims/app-environment.ts`

## Design conventions

- **The page title should be all uppercase.** `PageHeading`
  (`src/lib/components/layout/page-heading.svelte`) applies the `uppercase`
  class to its h1 — pass titles in natural case (`Skills`, not `SKILLS`) and
  let the component render them uppercase. Pages without a `PageHeading`
  apply `uppercase` to their title element directly.

## Checks

Before finishing work: `pnpm check` (0 errors expected) and
`npx biome check --write <touched files>`. The vendored `edra/` tree is
excluded from Biome — do not reformat it.
