# fuss dashboard

A responsive admin dashboard for the [fuss](../fuss) backend, built with Svelte 5.
It started as a Svelte recreation of [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)
and keeps that project's shell (sidebar, header, dashboard composition), while the
feature surfaces talk to fuss backend services.

## Stack

- **pnpm** — package management and workspace-friendly scripts.
- **Vite** — development server and production bundling.
- **Svelte 5 + TypeScript** — component UI with runes and strict type checking.
- **Tailwind CSS 4** — utility-first styling with shadcn-style semantic design tokens.
- **shadcn-svelte / bits-ui** — vendored local primitives (`src/lib/components/ui/`) providing keyboard behavior, focus management, portals, and accessible ARIA state.
- **TanStack Query** — server-state fetching and caching through `@tanstack/svelte-query`.
- **Edra (tiptap)** — vendored rich-text editor (`src/lib/edra/`) used for markdown prompt editing.
- **THREE.js** — animated error-page illustrations.
- **Lucide** — interface icons through `@lucide/svelte`.
- **Biome** — the single formatter and linter.

## Included surfaces

- Responsive sidebar with grouped navigation, collapsible icon rail, and mobile drawer.
- Header with breadcrumbs, search affordance, and light/dark theme toggle.
- Dashboard overview cards, revenue chart, recent sales, and activity feed (fixture data).
- **Projects** — fuss agent service: project/session browsing plus agent config editing, with markdown `system_prompt` / `hint_prompt` editing via Edra.
- **Skills** — fuss registry service: skill browsing, detail views, preview, and `.tar` upload.
- Authentication page previews (sign-in, sign-up, forgot password, OTP, Clerk variants).
- Inline error pages (`ErrorPage` component) with THREE.js canvas illustrations; unknown routes fall through to a 404.

## Backend connection

The dashboard calls the fuss backend through Vite dev/preview proxies:

- `/api/agent` → agent service
- `/api/registry` → registry service

Both proxy to `FUSS_API_URL` (default `http://localhost:8080`) with the `/api`
prefix stripped. Set `AGENT_SERVICE_TOKEN` to attach a `Bearer` token to
proxied requests. The dashboard and auth surfaces work without a backend;
projects and skills need one running.

## Commands

```sh
pnpm dev          # start the Vite dev server
pnpm build        # create a production build
pnpm preview      # preview the production build
pnpm check        # svelte-check + TypeScript
pnpm lint         # Biome lint
pnpm format       # format source files with Biome
pnpm format:check # verify formatting without changing files
pnpm quality      # check + Biome check
```

Routes are handled client-side in `src/App.svelte`.
