# Shadcn Admin Dashboard

A responsive admin dashboard UI recreated from [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), rewritten in Svelte while preserving the reference project's navigation, dashboard composition, data views, settings, authentication, and error-page surfaces.

## Stack

- **pnpm** — package management and workspace-friendly scripts.
- **Vite** — development server and production bundling.
- **Svelte 5 + TypeScript** — component UI with runes and strict type checking.
- **Tailwind CSS 4** — utility-first styling with shadcn-style semantic design tokens.
- **shadcn-svelte components** — downloaded local primitives for Select, Calendar, Popover, Checkbox, and Button, then adapted to the reference dashboard’s Svelte markup and visual geometry.
- **TanStack Table** — headless task and user data tables through `@tanstack/svelte-table`.
- **Lucide** — interface icons through `@lucide/svelte`.
- **Biome** — the single formatter and linter.

The UI uses shadcn-svelte’s headless component layer rather than replacing source
controls with native-only equivalents. Feature components own the source-faithful
layout and styling, while the generated local primitives provide keyboard behavior,
focus management, portals, and accessible ARIA state.

## Included surfaces

- Responsive sidebar with grouped navigation and mobile drawer behavior.
- Header search affordance, notifications affordance, breadcrumb, and light/dark theme toggle.
- Dashboard overview cards, revenue chart, recent sales, and activity feed.
- Filterable Tasks and Users tables powered by TanStack Table.
- Apps catalog, Chats inbox, Settings sections, Authentication previews, and Error pages.

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

The UI is currently fixture-backed so the reference dashboard can be explored without a backend. Routes are handled client-side for the included dashboard surfaces.
