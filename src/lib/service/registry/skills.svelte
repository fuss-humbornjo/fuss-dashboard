<script lang="ts">
import { Puzzle } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import PageHeading from "../../components/PageHeading.svelte";
import { Input } from "../../components/ui/input";
import { listAllSkills, listScopes, type SkillInfo } from "./api";
import SkillDetail from "./skill-detail.svelte";

let query = $state("");
let scope = $state("all");
let selected = $state<SkillInfo | null>(null);

const skillsQuery = createQuery(() => ({
  queryKey: ["registry", "skills"],
  queryFn: listAllSkills,
}));

const scopesQuery = createQuery(() => ({
  queryKey: ["registry", "scopes"],
  queryFn: listScopes,
}));

const skills = $derived(skillsQuery.data ?? []);
const scopes = $derived(scopesQuery.data ?? []);

const chips = $derived.by(() => {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    counts.set(skill.scope, (counts.get(skill.scope) ?? 0) + 1);
  }
  return [
    { name: "all", count: skills.length },
    ...scopes.map((entry) => ({
      name: entry.name,
      count: counts.get(entry.name) ?? 0,
    })),
  ];
});

const filtered = $derived.by(() => {
  const needle = query.trim().toLowerCase();
  return skills.filter((skill) => {
    if (scope !== "all" && skill.scope !== scope) return false;
    if (!needle) return true;
    return `${skill.name} ${skill.description} ${skill.scope}`
      .toLowerCase()
      .includes(needle);
  });
});

const filteredScopes = $derived(
  new Set(filtered.map((skill) => skill.scope)).size,
);

const pending = $derived(skillsQuery.isPending || scopesQuery.isPending);
const loadError = $derived(skillsQuery.error ?? scopesQuery.error);

const meta = $derived.by(() => {
  const needle = query.trim();
  if (needle && filtered.length === 0) return `no matches for "${needle}"`;
  return `${count(filtered.length, "skill")} · ${count(filteredScopes, "scope")}`;
});

const emptyMessage = $derived.by(() => {
  const needle = query.trim();
  if (needle) return `no skills match "${needle}"`;
  if (!skills.length) return "no skills registered";
  return `no skills in scope "${scope}"`;
});

const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Unable to reach the registry.";
const shortDate = (value: string) =>
  value ? new Date(value).toLocaleDateString() : "—";

function retry() {
  skillsQuery.refetch();
  scopesQuery.refetch();
}
</script>

<PageHeading
  title="Skills"
  description="Search the skill registry across all scopes."
/>

<div class="mb-4 flex flex-wrap items-center gap-3">
  <div class="w-full sm:max-w-xs">
    <Input
      aria-label="Search skills"
      placeholder="search skills…"
      bind:value={query}
    />
  </div>
  <div
    class="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-lg border bg-inset p-1"
  >
    {#each chips as chip (chip.name)}
      <button
        type="button"
        class={`rounded-md px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition ${scope === chip.name ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        onclick={() => (scope = chip.name)}
      >
        {chip.name}
        ({chip.count})
      </button>
    {/each}
  </div>
</div>

{#if !pending && !loadError}
  <p class="mb-4 font-mono text-[11px] text-muted-foreground">{meta}</p>
{/if}

{#if pending}
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each Array(6) as _, i (i)}
      <div class="animate-pulse rounded-xl border bg-card p-5">
        <div class="flex items-center gap-3">
          <span class="size-9 shrink-0 rounded-md bg-muted"></span>
          <span class="h-4 min-w-0 flex-1 rounded bg-muted"></span>
          <span class="h-5 w-16 shrink-0 rounded bg-muted"></span>
        </div>
        <div class="mt-3 space-y-2">
          <span class="block h-3.5 w-full rounded bg-muted"></span>
          <span class="block h-3.5 w-2/3 rounded bg-muted"></span>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <span class="h-3 w-24 rounded bg-muted"></span>
          <span class="h-3 w-14 rounded bg-muted"></span>
        </div>
      </div>
    {/each}
  </div>
{:else if loadError}
  <div role="alert" class="rounded-xl border bg-card p-5">
    <p class="text-label text-muted-foreground">Registry unavailable</p>
    <p class="mt-2 text-sm text-destructive">{message(loadError)}</p>
    <button
      type="button"
      class="mt-4 rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
      onclick={retry}
    >
      retry
    </button>
  </div>
{:else if filtered.length}
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each filtered as skill (skill.id)}
      <button
        type="button"
        class="rounded-xl border bg-card p-5 text-left transition hover:bg-muted/40"
        onclick={() => (selected = skill)}
      >
        <div class="flex items-center gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
          >
            <Puzzle size={15} />
          </span>
          <p class="min-w-0 flex-1 truncate text-sm font-medium">
            {skill.name}
          </p>
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {skill.scope}
          </span>
        </div>
        <p class="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {skill.description}
        </p>
        <div class="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <span class="truncate font-mono text-[11px]">
            {skill.ref || "stable"}
          </span>
          <span class="shrink-0 font-mono text-[11px] text-muted-foreground">
            {shortDate(skill.updated_at)}
          </span>
        </div>
      </button>
    {/each}
  </div>
{:else}
  <p
    class="rounded-xl border bg-card py-16 text-center font-mono text-[11px] text-muted-foreground"
  >
    {emptyMessage}
  </p>
{/if}

{#if selected}
  <SkillDetail skill={selected} onClose={() => (selected = null)} />
{/if}
