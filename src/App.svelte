<script lang="ts">
import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
import { Toaster } from "svelte-sonner";
import AppHeader from "./lib/components/layout/app-header.svelte";
import AppSidebar from "./lib/components/layout/app-sidebar.svelte";
import { navGroups } from "./lib/components/layout/navigation";
import Authentication from "./lib/features/auth/Authentication.svelte";
import Dashboard from "./lib/features/dashboard/Dashboard.svelte";
import ErrorPages from "./lib/features/errors/ErrorPages.svelte";
import Settings from "./lib/features/settings/Settings.svelte";
import Projects from "./lib/service/agent/projects.svelte";
import SkillDetail from "./lib/service/registry/skill-detail.svelte";
import Skills from "./lib/service/registry/skills.svelte";

let path = $state(
  typeof window === "undefined" ? "/" : window.location.pathname,
);
type LayoutMode = "default" | "compact" | "full";
type SidebarCollapseMode = "icon" | "offcanvas";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

let mobileSidebarOpen = $state(false);
let sidebarExpanded = $state(true);
let sidebarCollapseMode = $state<SidebarCollapseMode>("icon");
let dark = $state(true);
// Theme tokens and the tailwind dark: variant are scoped to .dark — put it on
// the root element so portaled overlays (popover/select/dialog) inherit them.
$effect(() => {
  document.documentElement.classList.toggle("dark", dark);
});
const authPaths = [
  "/sign-in",
  "/sign-in-2",
  "/sign-up",
  "/forgot-password",
  "/otp",
  "/clerk/sign-in",
  "/clerk/sign-up",
];
const errorPaths = [
  "/errors/forbidden",
  "/errors/not-found",
  "/errors/internal-server-error",
  "/errors/maintenance-error",
];
const standaloneErrorPaths = ["/403", "/404", "/500", "/503"];
const errorPageTitles: Record<string, string> = {
  "/403": "Forbidden",
  "/404": "Not found",
  "/500": "Internal server error",
  "/503": "Maintenance",
};
const standalone = $derived(
  authPaths.includes(path) || standaloneErrorPaths.includes(path),
);
const isNestedError = $derived(errorPaths.includes(path));
const layout = $derived<LayoutMode>(
  sidebarExpanded
    ? "default"
    : sidebarCollapseMode === "icon"
      ? "compact"
      : "full",
);
const sidebarCollapsed = $derived(
  !sidebarExpanded && sidebarCollapseMode === "icon",
);
const sidebarOffcanvas = $derived(
  !sidebarExpanded && sidebarCollapseMode === "offcanvas",
);
const current = $derived(
  errorPageTitles[path] ??
    navGroups
      .flatMap((group) => group.items)
      .flatMap((item) => [
        { label: item.label, href: item.href },
        ...(item.children ?? []),
      ])
      .find((item) => item.href === path)?.label ??
    (path.startsWith("/projects")
      ? "Projects"
      : path.startsWith("/skills")
        ? "Skills"
        : path.startsWith("/settings")
          ? "Settings"
          : path.startsWith("/errors")
            ? "Error pages"
            : path.startsWith("/clerk")
              ? "Secured by Clerk"
              : authPaths.includes(path)
                ? "Authentication"
                : "Not found"),
);

const navigate = (href: string) => {
  path = href;
  mobileSidebarOpen = false;
  if (typeof window !== "undefined") window.history.pushState({}, "", href);
};
const toggleSidebar = () => {
  sidebarExpanded = !sidebarExpanded;
};
const onPopState = () => {
  path = window.location.pathname;
};
</script>

<svelte:window onpopstate={onPopState} />
<svelte:head
  ><title>{current} · Admin dashboard</title>
  <meta
    name="description"
    content="A responsive shadcn-style admin dashboard."
  ></svelte:head
>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen bg-background text-foreground">
    {#if standalone}
      <main id="main-content" class="h-svh overflow-hidden">
        {#if authPaths.includes(path)}
          <Authentication {path} {dark} onNavigate={navigate} />
        {:else}
          {#key path}
            <ErrorPages {path} onNavigate={navigate} standalone />
          {/key}
        {/if}
      </main>
    {:else}
      <div class="flex h-svh min-h-0 overflow-hidden">
        <AppSidebar
          {path}
          open={mobileSidebarOpen}
          collapsed={sidebarCollapsed}
          offcanvas={sidebarOffcanvas}
          onNavigate={navigate}
          onClose={() => (mobileSidebarOpen = false)}
          onToggleSidebar={toggleSidebar}
        />
        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            {current}
            {path}
            {dark}
            onOpen={() => (mobileSidebarOpen = true)}
            onToggleTheme={() => (dark = !dark)}
            onNavigate={navigate}
          />
          <main
            id="main-content"
            class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6"
          >
            <div
              class={`mx-auto w-full ${layout === "compact" ? "max-w-6xl" : layout === "full" ? "max-w-none" : "max-w-7xl"}`}
            >
              {#if path === "/"}
                <Dashboard />
              {:else if path === "/projects" || path.startsWith("/projects/")}
                {#key path}
                  <Projects {path} onNavigate={navigate} />
                {/key}
              {:else if path === "/skills"}
                <Skills onNavigate={navigate} />
              {:else if path.startsWith("/skills/")}
                {#key path}
                  <SkillDetail {path} onNavigate={navigate} />
                {/key}
              {:else if path.startsWith("/settings")}
                <Settings
                  {path}
                  onNavigate={navigate}
                  onSetDark={(value) => (dark = value)}
                />
              {:else if path === "/auth"}
                <Authentication {path} {dark} onNavigate={navigate} />
              {:else if path === "/errors"}
                {#key path}
                  <ErrorPages {path} onNavigate={navigate} />
                {/key}
              {:else if isNestedError}
                {#key path}
                  <ErrorPages {path} onNavigate={navigate} />
                {/key}
              {:else}
                {#key path}
                  <ErrorPages path="/errors/404" onNavigate={navigate} />
                {/key}
              {/if}
            </div>
          </main>
        </div>
      </div>
    {/if}
  </div>
  <Toaster
    theme={dark ? "dark" : "light"}
    position="top-right"
    offset={{ top: 80 }}
  />
</QueryClientProvider>
