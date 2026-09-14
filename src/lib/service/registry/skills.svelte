<script lang="ts">
import { Plus, Puzzle } from "@lucide/svelte";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import PageHeading from "../../components/layout/page-heading.svelte";
import { ErrorPage } from "../../components/ui/error-page";
import { Input } from "../../components/ui/input";
import { SelectSimple as Select } from "../../components/ui/select/index.js";
import { errorStatus } from "../rpc";
import { listAllSkills, listScopes } from "./api";
import SkillUpload from "./skill-upload.svelte";

let { onNavigate }: { onNavigate: (path: string) => void } = $props();

const queryClient = useQueryClient();

let query = $state("");
let scope = $state("all");
let uploadOpen = $state(false);

const skillsQuery = createQuery(() => ({
  queryKey: ["registry", "skills"],
  queryFn: listAllSkills,
}));

const scopesQuery = createQuery(() => listScopes.queryOptions({}));

const skills = $derived(skillsQuery.data ?? []);
const scopes = $derived(scopesQuery.data?.scopes ?? []);

const scopeOptions = $derived([
  { label: "all", value: "all" },
  ...scopes.map((entry) => ({ label: entry.name, value: entry.name })),
]);

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

<PageHeading title="Skills" />

<div class="mb-4 flex flex-wrap items-center gap-3">
  <div class="w-full sm:max-w-xs">
    <Input
      aria-label="Search skills"
      placeholder="search skills…"
      bind:value={query}
    />
  </div>
  <div class="ml-auto flex items-center gap-2">
    <Select
      ariaLabel="Filter by scope"
      value={scope}
      options={scopeOptions}
      class="w-28"
      triggerClass="font-mono text-[11px]"
      onChange={(value) => (scope = value)}
    />
    <button
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Upload skill"
      onclick={() => (uploadOpen = true)}
    >
      <Plus size={16} />
    </button>
  </div>
</div>

{#if !pending && !loadError}
  <p class="mb-4 font-mono text-[11px] text-muted-foreground">{meta}</p>
{/if}

{#if pending}
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each Array(6) as _, i (i)}
      <div class="flex animate-pulse flex-col rounded-xl border bg-card p-5">
        <div class="flex items-center gap-3">
          <span class="size-9 shrink-0 rounded-md bg-muted"></span>
          <span class="h-4 min-w-0 flex-1 rounded bg-muted"></span>
          <span class="h-5 w-16 shrink-0 rounded bg-muted"></span>
        </div>
        <div class="mt-3 flex-1 space-y-2">
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
  <ErrorPage
    compact
    errcode={errorStatus(loadError)}
    message={message(loadError)}
    onRetry={retry}
  />
{:else if filtered.length}
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each filtered as skill (skill.id)}
      <button
        type="button"
        class="flex flex-col rounded-xl border bg-card p-5 text-left transition hover:bg-muted/40"
        onclick={() =>
          onNavigate(
            `/skills/${encodeURIComponent(skill.scope)}/${encodeURIComponent(skill.name)}`,
          )}
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
        <p class="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
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

{#if uploadOpen}
  <SkillUpload
    {skills}
    onClose={() => (uploadOpen = false)}
    onPublished={() => queryClient.invalidateQueries({ queryKey: ["registry"] })}
  />
{/if}
