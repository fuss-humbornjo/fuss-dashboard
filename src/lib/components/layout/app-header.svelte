<script lang="ts">
import { Aperture, Moon, PanelLeft, Search, Sun } from "@lucide/svelte";
import { withBase } from "../../base";
import * as Breadcrumb from "../ui/breadcrumb/index.js";
import { Button } from "../ui/button/index.js";
import { type Breadcrumb as Crumb, featureCrumbs } from "./breadcrumbs.svelte";
import { navGroups } from "./navigation";

let {
  current,
  path,
  dark,
  onOpen,
  onToggleTheme,
  onNavigate,
}: {
  current: string;
  path: string;
  dark: boolean;
  onOpen: () => void;
  onToggleTheme: () => void;
  onNavigate: (href: string) => void;
} = $props();

let searchOpen = $state(false);
let searchQuery = $state("");

const shortcuts = [{ label: "Dashboard", href: "/", icon: Aperture }];
const filteredShortcuts = $derived(
  shortcuts.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  ),
);

// Breadcrumb mirrors the nav tree: child routes get their parent as a linked
// crumb (unlinked when the parent is an expander like Auth/Errors); dynamic
// tails collapse to the section crumb unless a feature pushes richer crumbs.
const navCrumbs = $derived.by((): Crumb[] => {
  for (const group of navGroups) {
    for (const item of group.items) {
      const child = item.children?.find((c) => c.href === path);
      if (child) {
        return [
          item.href
            ? { label: item.label, href: item.href }
            : { label: item.label },
          { label: child.label },
        ];
      }
      if (item.href === path) return [{ label: item.label }];
      if (item.href && path.startsWith(`${item.href}/`)) {
        return current !== item.label
          ? [{ label: item.label, href: item.href }, { label: current }]
          : [{ label: item.label }];
      }
    }
  }
  return [{ label: current }];
});

const crumbs = $derived(featureCrumbs.current ?? navCrumbs);

const closeSearch = () => {
  searchOpen = false;
  searchQuery = "";
};

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchOpen = !searchOpen;
  }
  if (event.key === "Escape") {
    closeSearch();
  }
};

const go = (href: string) => {
  onNavigate(href);
  closeSearch();
};
</script>

<svelte:window onkeydown={handleKeydown} />

<header
  class="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:gap-4"
>
  <Button
    type="button"
    aria-label="Open navigation"
    variant="outline"
    size="icon"
    class="size-7 max-md:scale-125 lg:hidden"
    onclick={onOpen}
  >
    <PanelLeft class="size-4" />
  </Button>
  <p class="min-w-0 truncate text-sm font-medium sm:hidden">{current}</p>
  <Breadcrumb.Root class="hidden min-w-0 sm:flex">
    <Breadcrumb.List class="flex-nowrap">
      {#each crumbs as crumb, i (crumb.label)}
        {#if i > 0}
          <Breadcrumb.Separator />
        {/if}
        <Breadcrumb.Item class="min-w-0">
          {#if i === crumbs.length - 1}
            <Breadcrumb.Page class="block max-w-40 truncate"
              >{crumb.label}</Breadcrumb.Page
            >
          {:else if crumb.href}
            {@const href = crumb.href}
            <Breadcrumb.Link
              href={withBase(href)}
              class="block max-w-40 truncate"
              onclick={(event: MouseEvent) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.button !== 0
                )
                  return;
                event.preventDefault();
                onNavigate(href);
              }}
              >{crumb.label}</Breadcrumb.Link
            >
          {:else}
            <span class="block max-w-40 truncate">{crumb.label}</span>
          {/if}
        </Breadcrumb.Item>
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>
  <div class="ml-auto flex items-center gap-1">
    <button
      type="button"
      class="hidden h-9 w-48 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-muted lg:flex"
      aria-label="Search"
      onclick={() => (searchOpen = true)}
    >
      <Search size={16} />
      <span>Search</span
      ><kbd
        class="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]"
        >⌘ K</kbd
      >
    </button>
    <button
      type="button"
      class="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      aria-label="Search"
      onclick={() => (searchOpen = true)}
    >
      <Search size={18} />
    </button>
    <button
      type="button"
      class="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
      onclick={onToggleTheme}
    >
      {#if dark}
        <Sun size={18} />
      {:else}
        <Moon size={18} />
      {/if}
    </button>
  </div>
</header>

{#if searchOpen}
  <div class="fixed inset-0 z-50 flex justify-center p-4 pt-[15vh]">
    <button
      type="button"
      class="absolute inset-0 -z-10 bg-slate-950/45"
      aria-label="Close search"
      onclick={closeSearch}
    ></button>
    <div
      class="h-fit w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <label class="flex items-center gap-3 border-b px-4"
        ><Search size={18} class="text-muted-foreground" />
        <span class="sr-only">Search pages</span>
        <input
          class="h-12 min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
          placeholder="Type a command or search..."
          bind:value={searchQuery}
        ></label
      >
      <div class="p-2">
        <p class="px-2 py-1 text-label text-muted-foreground">Suggestions</p>
        {#each filteredShortcuts as item (item.href)}
          {@const Icon = item.icon}
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
            onclick={() => go(item.href)}
          >
            <Icon size={16} />{item.label}
          </button>
        {/each}
        {#if filteredShortcuts.length === 0}
          <p class="px-3 py-6 text-center text-sm text-muted-foreground">
            No pages found.
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
