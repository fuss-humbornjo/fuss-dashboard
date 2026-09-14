<script lang="ts">
import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
import { Toaster } from "svelte-sonner";
import { stripBase, withBase } from "./lib/base";
import AppHeader from "./lib/components/layout/app-header.svelte";
import AppSidebar from "./lib/components/layout/app-sidebar.svelte";
import { navGroups } from "./lib/components/layout/navigation";
import { ErrorPage } from "./lib/components/ui/error-page";
import Authentication from "./lib/features/auth/Authentication.svelte";
import Dashboard from "./lib/features/dashboard/Dashboard.svelte";
import Projects from "./lib/service/agent/projects.svelte";
import SkillDetail from "./lib/service/registry/skill-detail.svelte";
import Skills from "./lib/service/registry/skills.svelte";

let path = $state(
  typeof window === "undefined" ? "/" : stripBase(window.location.pathname),
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
// Theme tokens and the tailwind dark: variant are scoped to .dark — it lives
// on the root element (set statically in index.html) so portaled overlays
// (popover/select/dialog) inherit it; the toggle handler flips it.
const authPaths = [
  "/sign-in",
  "/sign-in-2",
  "/sign-up",
  "/forgot-password",
  "/otp",
  "/clerk/sign-in",
  "/clerk/sign-up",
];
const standalone = $derived(authPaths.includes(path));
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
        : path.startsWith("/clerk")
          ? "Secured by Clerk"
          : authPaths.includes(path)
            ? "Authentication"
            : "Not found"),
);

const navigate = (href: string) => {
  path = href;
  mobileSidebarOpen = false;
  if (typeof window !== "undefined")
    window.history.pushState({}, "", withBase(href));
};
const toggleSidebar = () => {
  sidebarExpanded = !sidebarExpanded;
};
const toggleTheme = () => {
  dark = !dark;
  document.documentElement.classList.toggle("dark", dark);
};
const onPopState = () => {
  path = stripBase(window.location.pathname);
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
        <Authentication {path} {dark} onNavigate={navigate} />
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
            onToggleTheme={toggleTheme}
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
              {:else if path === "/auth"}
                <Authentication {path} {dark} onNavigate={navigate} />
              {:else}
                {#key path}
                  <ErrorPage
                    errcode={404}
                    message="It seems like the page you're looking for does not exist or might have been removed."
                  />
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
