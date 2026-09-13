<script lang="ts">
import {
  ArrowUpToLine,
  Check,
  Copy,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Puzzle,
  Trash2,
  X,
} from "@lucide/svelte";
import { createQuery, useQueryClient } from "@tanstack/svelte-query";
import { untrack } from "svelte";
import { toast } from "svelte-sonner";
import {
  type Breadcrumb,
  featureCrumbs,
} from "../../components/layout/breadcrumbs.svelte";
import { Input } from "../../components/ui/input";
import {
  deleteSkill,
  deleteSkillPackage,
  getSkill,
  listSkillPackages,
  type Skill,
  type SkillPackage,
  updateSkillRef,
} from "./api";
import SkillPreview from "./skill-preview.svelte";
import SkillUpload from "./skill-upload.svelte";

let { path, onNavigate }: { path: string; onNavigate: (href: string) => void } =
  $props();

// App keys this route by pathname, so the parsed segments stay constant per mount.
const parts = untrack(() => path.split("/").filter(Boolean));
const scope = parts[1] ?? "";
const name = parts[2] ?? "";

const queryClient = useQueryClient();

const skillQuery = createQuery(() => getSkill.queryOptions({ scope, name }));
const packagesQuery = createQuery(() =>
  listSkillPackages.queryOptions({ scope, name }),
);

const skill = $derived(skillQuery.data ?? null);
const packages = $derived(packagesQuery.data?.packages ?? []);

// Route crumbs let the header breadcrumb replace any in-page back button.
const crumbs = $derived.by((): Breadcrumb[] => [
  { label: "Skills", href: "/skills" },
  { label: skill?.name ?? name },
]);
$effect(() => {
  featureCrumbs.current = crumbs;
  return () => {
    featureCrumbs.current = null;
  };
});

let copied = $state(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

let editing = $state(false);
let refDraft = $state("");
let saving = $state(false);
let pendingDefault = $state<string | null>(null);
let uploadOpen = $state(false);
let preview = $state<SkillPackage | null>(null);
let confirmingDelete = $state<string | null>(null);
let deletingVersion = $state<string | null>(null);
let deleteOpen = $state(false);
let deletingSkill = $state(false);

const installRef = $derived(
  skill ? `${skill.scope}/${skill.name}@${skill.ref ?? "stable"}` : "",
);
const skillRef = $derived(skill?.ref);

const refPattern = /^([A-Za-z0-9][A-Za-z0-9._-]{0,63}|[0-9a-f]{1,64})$/;
const draftValue = $derived(refDraft.trim());
const draftValid = $derived(draftValue === "" || refPattern.test(draftValue));

const copyInstallRef = async () => {
  await navigator.clipboard.writeText(installRef);
  toast.success("Copied install reference");
  copied = true;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied = false), 1500);
};

const startEdit = () => {
  refDraft = skill?.ref ?? "";
  editing = true;
};

const cancelEdit = () => {
  editing = false;
  refDraft = "";
};

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "Failed to update default ref";

const applyRefUpdate = async (current: Skill, ref: string | null) => {
  await updateSkillRef({ skill: current, ref });
  toast.success("Default ref updated");
  await queryClient.invalidateQueries({ queryKey: ["registry"] });
};

const saveRef = async () => {
  if (!draftValid || saving || !skill) return;
  saving = true;
  try {
    await applyRefUpdate(
      skill,
      draftValue === "" || draftValue === "stable" ? null : draftValue,
    );
    editing = false;
    refDraft = "";
  } catch (cause) {
    toast.error(errorMessage(cause));
  } finally {
    saving = false;
  }
};

const setDefault = async (pkg: SkillPackage) => {
  if (pendingDefault || !skill) return;
  pendingDefault = pkg.version;
  try {
    await applyRefUpdate(skill, pkg.tag ?? pkg.version);
  } catch (cause) {
    toast.error(errorMessage(cause));
  } finally {
    pendingDefault = null;
  }
};

const isDefault = (pkg: SkillPackage) =>
  skillRef !== undefined && (pkg.version === skillRef || pkg.tag === skillRef);

const removeVersion = async (pkg: SkillPackage) => {
  if (deletingVersion) return;
  deletingVersion = pkg.version;
  try {
    await deleteSkillPackage({ scope, name, version: pkg.version });
    toast.success(`Version ${pkg.version} deleted`);
    confirmingDelete = null;
    await queryClient.invalidateQueries({ queryKey: ["registry"] });
  } catch (cause) {
    toast.error(
      cause instanceof Error ? cause.message : "Failed to delete the version",
    );
  } finally {
    deletingVersion = null;
  }
};

const removeSkill = async () => {
  if (deletingSkill) return;
  deletingSkill = true;
  try {
    await deleteSkill({ scope, name });
    toast.success(`Skill ${name} deleted`);
    await queryClient.invalidateQueries({ queryKey: ["registry"] });
    onNavigate("/skills");
  } catch (cause) {
    toast.error(
      cause instanceof Error ? cause.message : "Failed to delete the skill",
    );
    deletingSkill = false;
  }
};

const downloadHref = (pkg: SkillPackage) =>
  `/api/registry/scopes/${encodeURIComponent(scope)}/skills/${encodeURIComponent(name)}/versions/${encodeURIComponent(pkg.version)}/package`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape" && deleteOpen && !deletingSkill) {
      deleteOpen = false;
    }
  }}
/>

{#if skillQuery.isPending}
  <div class="grid gap-4">
    <div class="h-14 animate-pulse rounded-xl bg-muted"></div>
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="h-24 animate-pulse rounded-xl bg-muted"></div>
      <div class="h-24 animate-pulse rounded-xl bg-muted"></div>
    </div>
    <div class="h-64 animate-pulse rounded-xl bg-muted"></div>
  </div>
{:else if skillQuery.isError || !skill}
  <div role="alert" class="rounded-xl border bg-card p-5">
    <p class="text-label text-muted-foreground">Skill unavailable</p>
    <p class="mt-2 text-sm text-destructive">
      {skillQuery.error instanceof Error
        ? skillQuery.error.message
        : "Unable to load the skill."}
    </p>
    <button
      type="button"
      class="mt-4 rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
      onclick={() => skillQuery.refetch()}
    >
      retry
    </button>
  </div>
{:else}
  {@const current = skill}
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <span
        class="mt-1 grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
      >
        <Puzzle size={15} />
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="truncate text-2xl font-bold tracking-tight md:text-3xl">
            {current.name}
          </h1>
          <span
            class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {current.scope}
          </span>
        </div>
        <p class="mt-1.5 font-mono text-xs text-muted-foreground">
          {current.description}
        </p>
      </div>
    </div>
  </div>

  <div class="divide-y rounded-xl border bg-card">
    <div class="grid gap-5 p-5 sm:grid-cols-2 sm:gap-0 sm:divide-x">
      <div class="sm:pr-5">
        <p class="text-label text-muted-foreground">Install</p>
        <div class="mt-3 flex items-center gap-2 rounded-lg bg-inset p-3">
          <code class="min-w-0 flex-1 truncate font-mono text-[11px]">
            {installRef}
          </code>
          <button
            type="button"
            class="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Copy install reference"
            onclick={copyInstallRef}
          >
            {#if copied}
              <Check size={14} class="text-success" />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </div>
      </div>

      <div class="sm:pl-5">
        <p class="text-label text-muted-foreground">Default ref</p>
        {#if editing}
          <div class="mt-3 flex items-center gap-2">
            <Input
              aria-label="Default ref"
              aria-invalid={!draftValid}
              class="h-8 flex-1 text-[11px]"
              placeholder="stable"
              disabled={saving}
              bind:value={refDraft}
              onkeydown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveRef();
              } else if (event.key === "Escape") {
                event.stopPropagation();
                cancelEdit();
              }
            }}
            />
            <button
              type="button"
              class="shrink-0 rounded-md border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={saving || !draftValid}
              onclick={saveRef}
            >
              {saving ? "saving…" : "Save"}
            </button>
            <button
              type="button"
              class="shrink-0 rounded-md border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={saving}
              onclick={cancelEdit}
            >
              Cancel
            </button>
          </div>
          {#if !draftValid}
            <p class="mt-2 font-mono text-[11px] text-destructive">
              tag or version prefix, empty resets to stable
            </p>
          {/if}
        {:else}
          <div class="mt-3 flex items-center gap-2 rounded-lg bg-inset p-3">
            <code class="min-w-0 flex-1 truncate font-mono text-[11px]">
              {current.ref ?? "stable"}
            </code>
            <button
              type="button"
              class="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Edit default ref"
              onclick={startEdit}
            >
              <Pencil size={13} />
            </button>
          </div>
        {/if}
      </div>
    </div>

    <div class="p-5">
      <p class="text-label text-muted-foreground">Metadata</p>
      <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <div>
          <p class="text-label text-muted-foreground">ID</p>
          <p class="mt-1 truncate font-mono text-[11px]" title={current.id}>
            {current.id}
          </p>
        </div>
        <div>
          <p class="text-label text-muted-foreground">Created</p>
          <p class="mt-1 font-mono text-[11px]">
            {formatDate(current.created_at)}
          </p>
        </div>
        <div>
          <p class="text-label text-muted-foreground">Updated</p>
          <p class="mt-1 font-mono text-[11px]">
            {formatDate(current.updated_at)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="font-semibold">Versions</h2>
        <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {packages.length
            ? `${packages.length} published · newest first`
            : "immutable published versions"}
        </p>
      </div>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Upload folder"
        onclick={() => (uploadOpen = true)}
      >
        <Plus size={16} />
      </button>
    </div>
    {#if packagesQuery.isPending}
      <div class="mt-4 space-y-2">
        {#each Array(3) as _, i (i)}
          <div class="h-10 animate-pulse rounded-lg bg-muted"></div>
        {/each}
      </div>
    {:else if packagesQuery.isError}
      <p class="mt-4 font-mono text-[11px] text-muted-foreground">
        versions unavailable
      </p>
    {:else if !packages.length}
      <p class="mt-4 font-mono text-[11px] text-muted-foreground">
        no published versions yet — upload a folder to publish the first one
      </p>
    {:else}
      <ul class="mt-4 divide-y overflow-hidden rounded-lg border bg-card">
        {#each packages as pkg (pkg.version)}
          <li class="flex items-center gap-1 pr-1.5">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left transition hover:bg-muted/40"
              aria-label={`Preview version ${pkg.version}`}
              onclick={() => (preview = pkg)}
            >
              <div class="flex h-6 min-w-0 flex-1 items-center gap-2">
                <code class="shrink-0 font-mono text-[11px]">
                  {pkg.version}
                </code>
                {#if pkg.tag}
                  <span
                    class="truncate rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {pkg.tag}
                  </span>
                {/if}
                {#if isDefault(pkg)}
                  <span
                    class="shrink-0 rounded border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success"
                  >
                    default
                  </span>
                {/if}
              </div>
              <span
                class="shrink-0 font-mono text-[11px] text-muted-foreground"
              >
                {formatSize(pkg.size)}
                · {shortDate(pkg.created_at)}
              </span>
            </button>
            <div class="flex shrink-0 items-center">
              {#if confirmingDelete === pkg.version}
                <span class="px-1.5 font-mono text-[11px] text-destructive">
                  delete?
                </span>
                <button
                  type="button"
                  class="rounded-md p-1.5 text-destructive transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`Confirm delete version ${pkg.version}`}
                  disabled={deletingVersion !== null}
                  onclick={() => removeVersion(pkg)}
                >
                  {#if deletingVersion === pkg.version}
                    <LoaderCircle size={13} class="animate-spin" />
                  {:else}
                    <Check size={13} />
                  {/if}
                </button>
                <button
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Cancel delete"
                  disabled={deletingVersion !== null}
                  onclick={() => (confirmingDelete = null)}
                >
                  <X size={13} />
                </button>
              {:else}
                <button
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`Set ${pkg.tag ?? pkg.version} as default`}
                  disabled={isDefault(pkg) || pendingDefault !== null}
                  onclick={() => setDefault(pkg)}
                >
                  <ArrowUpToLine size={13} />
                </button>
                <a
                  href={downloadHref(pkg)}
                  download
                  class="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label={`Download package ${pkg.version}`}
                >
                  <Download size={13} />
                </a>
                <button
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`Delete version ${pkg.version}`}
                  title={isDefault(pkg)
                      ? "Pinned by the default ref — move the ref first"
                      : undefined}
                  disabled={isDefault(pkg) || deletingVersion !== null}
                  onclick={() => (confirmingDelete = pkg.version)}
                >
                  <Trash2 size={13} />
                </button>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="mt-6 rounded-xl border border-destructive/25 bg-card p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-semibold">Delete this skill</h2>
        <p class="mt-0.5 font-mono text-[11px] text-muted-foreground">
          removes {current.scope}/{current.name}
          and all published versions — this cannot be undone
        </p>
      </div>
      <button
        type="button"
        class="rounded-md border border-destructive/25 px-3 py-1.5 font-mono text-[11px] text-destructive transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
        onclick={() => (deleteOpen = true)}
      >
        Delete skill
      </button>
    </div>
  </div>
{/if}

{#if deleteOpen && skill}
  {@const current = skill}
  <button
    type="button"
    class="fixed inset-0 z-30 bg-slate-950/30"
    aria-label="Cancel delete"
    disabled={deletingSkill}
    onclick={() => (deleteOpen = false)}
  ></button>
  <div
    role="alertdialog"
    aria-modal="true"
    aria-label={`Delete skill ${current.name}`}
    class="fixed inset-0 z-40 m-auto h-fit w-[min(26rem,calc(100vw-2rem))] rounded-xl border bg-card p-5 shadow-lg"
  >
    <h2 class="font-semibold">Delete {current.scope}/{current.name}?</h2>
    <p class="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
      This removes the skill and its {packages.length} published
      {packages.length === 1 ? "version" : "versions"}. This cannot be undone.
    </p>
    <div class="mt-5 flex justify-end gap-2">
      <button
        type="button"
        class="rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={deletingSkill}
        onclick={() => (deleteOpen = false)}
      >
        Cancel
      </button>
      <button
        type="button"
        class="rounded-md border border-destructive/25 px-3 py-1.5 font-mono text-[11px] text-destructive transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
        disabled={deletingSkill}
        onclick={removeSkill}
      >
        {deletingSkill ? "deleting…" : "Delete skill"}
      </button>
    </div>
  </div>
{/if}

{#if uploadOpen && skill}
  <SkillUpload
    skills={[skill]}
    initialSkill={skill}
    onClose={() => (uploadOpen = false)}
    onPublished={() => queryClient.invalidateQueries({ queryKey: ["registry"] })}
  />
{/if}

{#if preview}
  <!-- biome-ignore lint/a11y/noHeaderScope: component prop, not a table attribute -->
  <SkillPreview {scope} {name} pkg={preview} onClose={() => (preview = null)} />
{/if}
