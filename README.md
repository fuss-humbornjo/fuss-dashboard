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

The dashboard calls the fuss backend at its root-mounted routes (`/agent`,
`/registry`). In dev, Vite proxies those paths to `FUSS_API_URL` (default
`http://localhost:8080`); set `AGENT_SERVICE_TOKEN` to attach a `Bearer`
token to proxied requests. The dashboard and auth surfaces work without a
backend; projects and skills need one running.

## Embedded in fuss

This repo is a git submodule of [fuss](../fuss) at `web/`. With `FUSS_WEB`
set, fuss's `make build` / `make run` build the dashboard
(`pnpm --dir web build`) and compile it in (`-tags web`): `main_web.go`
embeds the single-file `dist/index.html` and serves every GET under `/ui`.
The production build uses `base: "/ui/"`; `pnpm dev` keeps serving at the
root (`http://127.0.0.1:5173/`) for local development — the router and
anchors derive the base from `import.meta.env.BASE_URL` (see
`src/lib/base.ts`), so both work unchanged.

fuss protects its API with a bearer token, and the embedded build has no
proxy to inject one — open `/ui/?token=$AGENT_SERVICE_TOKEN` once. The
token is stored in `localStorage` (`fuss.token`), stripped from the URL,
and sent as a `Bearer` header on every API call (see `src/lib/auth.ts`).

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
