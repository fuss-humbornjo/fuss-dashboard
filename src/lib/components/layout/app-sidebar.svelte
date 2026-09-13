<script lang="ts">
import { ChevronRight, ChevronsUpDown, PanelLeft } from "@lucide/svelte";
import fussSvg from "$lib/assets/fuss.svg";
import fussDarkSvg from "$lib/assets/fuss-dark.svg";
import { Separator } from "../ui/separator";
import { type NavItem, navGroups } from "./navigation";
import UserMenu from "./user-menu.svelte";

let {
  path,
  open,
  collapsed,
  offcanvas,
  onNavigate,
  onClose,
  onToggleSidebar,
}: {
  path: string;
  open: boolean;
  collapsed: boolean;
  offcanvas: boolean;
  onNavigate: (href: string) => void;
  onClose: () => void;
  onToggleSidebar: () => void;
} = $props();

let expanded = $state<Record<string, boolean>>({});
const team = { name: "Fuss", plan: "Dashboard" };

const isActive = (item: NavItem) =>
  (item.href === "/projects" && path.startsWith("/projects/")) ||
  item.href === path ||
  item.children?.some((child) => child.href === path);

const isExpanded = (item: NavItem) =>
  expanded[item.label] ??
  item.children?.some((child) => child.href === path) ??
  false;

const activate = (item: NavItem) => {
  if (item.children) {
    expanded[item.label] = !isExpanded(item);
  } else if (item.href) {
    onNavigate(item.href);
  }
};
</script>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
    aria-label="Close navigation"
    onclick={onClose}
  ></button>
{/if}

<aside
  class:translate-x-0={open}
  class={`fixed inset-y-0 left-0 z-40 flex h-svh min-h-0 min-w-0 w-64 shrink-0 -translate-x-full flex-col overflow-x-hidden border-r bg-sidebar transition-[width,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0 lg:p-2 ${offcanvas ? "lg:w-0 lg:overflow-hidden" : collapsed ? "lg:w-16" : "lg:w-64"}`}
>
  <div class="h-16 shrink-0 p-2">
    <button
      type="button"
      class={`pointer-events-none flex h-12 w-full items-center gap-2 rounded-md p-2 transition-[width,height,padding,margin,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-sidebar-accent lg:pointer-events-auto ${collapsed ? "lg:size-8 lg:p-0" : "lg:-mt-2"}`}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onclick={onToggleSidebar}
    >
      <div
        class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
      >
        <img
          src={fussSvg}
          alt=""
          class="size-8 rounded-lg object-cover dark:hidden"
        >
        <img
          src={fussDarkSvg}
          alt=""
          class="hidden size-8 rounded-lg object-cover dark:block"
        >
      </div>
      <div
        class={`grid min-w-0 flex-1 overflow-hidden text-left leading-tight transition-[max-width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:max-w-0 lg:opacity-0 lg:delay-0" : "lg:max-w-[15rem] lg:delay-75"}`}
      >
        <span class="truncate text-sm font-semibold">{team.name}</span>
        <span class="truncate font-mono text-[11px] text-muted-foreground"
          >{team.plan}</span
        >
      </div>
      <PanelLeft
        size={16}
        class={`ml-auto shrink-0 text-muted-foreground transition-[width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:w-0 lg:overflow-hidden lg:opacity-0 lg:delay-0" : "lg:w-4 lg:delay-75"}`}
      />
    </button>
  </div>

  <div
    class="nav-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-4"
  >
    {#each navGroups as group, i (group.title)}
      <div
        class={`mb-7 transition-[margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:mb-0" : ""}`}
      >
        <p
          class={`mb-2 max-h-6 overflow-hidden px-2 text-label text-muted-foreground transition-[max-height,opacity,margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:mb-0 lg:max-h-0 lg:opacity-0 lg:delay-0" : "lg:delay-75"}`}
        >
          {group.title}
        </p>
        {#if i > 0}
          <div
            class={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:my-2 lg:max-h-4 lg:opacity-100 lg:delay-75" : "max-h-0 opacity-0"}`}
          >
            <Separator />
          </div>
        {/if}
        <nav class="space-y-1" aria-label={group.title}>
          {#each group.items as item (item.label)}
            {@const Icon = item.icon}
            <button
              type="button"
              class={`flex h-8 w-full items-center gap-2 overflow-hidden rounded-md px-2 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${isActive(item) ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              title={collapsed ? item.label : undefined}
              aria-expanded={item.children ? isExpanded(item) : undefined}
              onclick={() => activate(item)}
            >
              <Icon size={16} strokeWidth={1.8} class="shrink-0" />
              <span
                class={`flex min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:max-w-0 lg:opacity-0 lg:delay-0" : "lg:max-w-[15rem] lg:delay-75"}`}
                >{item.label}</span
              >
              {#if item.badge}
                <span
                  class={`max-w-8 overflow-hidden whitespace-nowrap rounded border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success transition-[max-width,opacity,padding] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:max-w-0 lg:border-0 lg:px-0 lg:opacity-0 lg:delay-0" : "lg:delay-75"}`}
                  >{item.badge}</span
                >
              {/if}
              {#if item.children}
                <ChevronRight
                  size={15}
                  class={`shrink-0 transition-[width,opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded(item) ? "rotate-90" : ""} ${collapsed ? "lg:w-0 lg:overflow-hidden lg:opacity-0 lg:delay-0" : "lg:w-4 lg:delay-75"}`}
                />
              {/if}
            </button>
            {#if item.children && isExpanded(item)}
              <div
                class={`ml-4 mt-1 space-y-1 border-l pl-2 ${collapsed ? "lg:hidden" : ""}`}
              >
                {#each item.children as child (child.href)}
                  <button
                    type="button"
                    class={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-left font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${child.href === path ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
                    onclick={() => onNavigate(child.href)}
                  >
                    {#if child.icon}
                      {@const ChildIcon = child.icon}
                      <ChildIcon size={16} strokeWidth={1.8} />
                    {/if}
                    <span class="truncate">{child.label}</span>
                  </button>
                {/each}
              </div>
            {/if}
          {/each}
        </nav>
      </div>
    {/each}
  </div>

  <div class="flex h-16 shrink-0 items-center border-t p-2 lg:pb-0">
    <UserMenu side="top" align="start">
      {#snippet trigger(open, toggle)}
        <button
          type="button"
          class={`flex h-12 w-full items-center gap-2 rounded-md p-2 text-left transition-[width,height,padding,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-sidebar-accent ${collapsed ? "lg:size-8 lg:p-0" : ""}`}
          aria-label="Open account menu"
          aria-expanded={open}
          onclick={toggle}
        >
          <div
            class="grid size-8 shrink-0 place-items-center rounded-md bg-primary font-mono text-xs font-semibold text-primary-foreground"
          >
            SN
          </div>
          <div
            class={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:max-w-0 lg:opacity-0 lg:delay-0" : "lg:max-w-[15rem] lg:delay-75"}`}
          >
            <p class="truncate text-sm font-medium">satnaing</p>
            <p class="truncate text-xs text-muted-foreground">
              satnaingdev@gmail.com
            </p>
          </div>
          <ChevronsUpDown
            class={`ml-auto shrink-0 text-muted-foreground transition-[width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? "lg:w-0 lg:overflow-hidden lg:opacity-0 lg:delay-0" : "lg:w-4 lg:delay-75"}`}
            size={16}
          />
        </button>
      {/snippet}
    </UserMenu>
  </div>
</aside>

<style>
.nav-scroll {
  scrollbar-width: none;
}
.nav-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
