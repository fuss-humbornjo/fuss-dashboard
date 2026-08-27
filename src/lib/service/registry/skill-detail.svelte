<script lang="ts">
import { Check, Copy, Puzzle, X } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { getSkillVersion, type SkillInfo } from "./api";

let { skill, onClose }: { skill: SkillInfo; onClose: () => void } = $props();

let copied = $state(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const installRef = $derived(
  `${skill.scope}/${skill.name}@${skill.ref ?? "stable"}`,
);
const pinned = $derived(/^[0-9a-f]{64}$/.test(skill.ref ?? ""));

const versionQuery = createQuery(() => ({
  queryKey: ["registry", "skill-version", skill.scope, skill.id, skill.ref],
  queryFn: () => getSkillVersion(skill.scope, skill.id, skill.ref ?? ""),
  enabled: pinned,
}));

const copyInstallRef = async () => {
  await navigator.clipboard.writeText(installRef);
  toast.success("Copied install reference");
  copied = true;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copied = false), 1500);
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onClose();
  }}
/>

<button
  type="button"
  class="fixed inset-0 z-30 bg-slate-950/30"
  aria-label="Close skill details"
  onclick={onClose}
></button>

<aside
  class="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-card"
>
  <div class="flex shrink-0 items-center gap-3 border-b p-5">
    <span
      class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
    >
      <Puzzle size={15} />
    </span>
    <p class="min-w-0 truncate font-semibold">{skill.name}</p>
    <span
      class="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
    >
      {skill.scope}
    </span>
    <button
      type="button"
      class="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Close skill details"
      onclick={onClose}
    >
      <X size={16} />
    </button>
  </div>

  <div class="min-h-0 flex-1 divide-y overflow-y-auto">
    <div class="p-5">
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

    <div class="p-5">
      <p class="text-label text-muted-foreground">Description</p>
      <p class="mt-3 text-sm text-muted-foreground">{skill.description}</p>
    </div>

    <div class="p-5">
      <p class="text-label text-muted-foreground">Metadata</p>
      <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <p class="text-label text-muted-foreground">ID</p>
          <p class="mt-1 truncate font-mono text-[11px]" title={skill.id}>
            {skill.id}
          </p>
        </div>
        <div>
          <p class="text-label text-muted-foreground">Ref</p>
          <p class="mt-1 truncate font-mono text-[11px]">
            {skill.ref ?? "stable"}
          </p>
        </div>
        <div>
          <p class="text-label text-muted-foreground">Created</p>
          <p class="mt-1 font-mono text-[11px]">
            {formatDate(skill.created_at)}
          </p>
        </div>
        <div>
          <p class="text-label text-muted-foreground">Updated</p>
          <p class="mt-1 font-mono text-[11px]">
            {formatDate(skill.updated_at)}
          </p>
        </div>
      </div>
    </div>

    <div class="p-5">
      <p class="text-label text-muted-foreground">Version</p>
      {#if pinned}
        {#if versionQuery.isPending}
          <div class="mt-3 h-24 animate-pulse rounded-lg bg-muted"></div>
        {:else if versionQuery.isError}
          <p class="mt-3 font-mono text-[11px] text-muted-foreground">
            version details unavailable
          </p>
        {:else if versionQuery.data}
          <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p class="text-label text-muted-foreground">Version</p>
              <p
                class="mt-1 truncate font-mono text-[11px]"
                title={versionQuery.data.version}
              >
                {versionQuery.data.version.slice(0, 12)}
              </p>
            </div>
            {#if versionQuery.data.tag}
              <div>
                <p class="text-label text-muted-foreground">Tag</p>
                <p class="mt-1 truncate font-mono text-[11px]">
                  {versionQuery.data.tag}
                </p>
              </div>
            {/if}
            <div>
              <p class="text-label text-muted-foreground">Size</p>
              <p class="mt-1 font-mono text-[11px]">
                {formatSize(versionQuery.data.size)}
              </p>
            </div>
            <div>
              <p class="text-label text-muted-foreground">Published</p>
              <p class="mt-1 font-mono text-[11px]">
                {formatDate(versionQuery.data.created_at)}
              </p>
            </div>
          </div>
        {/if}
      {:else}
        <p class="mt-3 font-mono text-[11px] text-muted-foreground">
          resolves to the latest published version
        </p>
      {/if}
    </div>
  </div>
</aside>
