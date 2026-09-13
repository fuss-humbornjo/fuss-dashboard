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

## Design conventions

- **The page title should be all uppercase.** `PageHeading`
  (`src/lib/components/PageHeading.svelte`) applies the `uppercase` class to
  its h1 — pass titles in natural case (`Skills`, not `SKILLS`) and let the
  component render them uppercase. Pages without a `PageHeading` apply
  `uppercase` to their title element directly.
