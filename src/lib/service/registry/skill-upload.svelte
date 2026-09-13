<script lang="ts">
import { FolderUp, LoaderCircle, X } from "@lucide/svelte";
import { untrack } from "svelte";
import { toast } from "svelte-sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SelectSimple as Select } from "../../components/ui/select";
import { publishSkillPackage, type Skill, type SkillPackage } from "./api";
import {
  createSkillTarball,
  readSkillFrontmatterName,
  type TarballResult,
} from "./tar";

let {
  skills,
  initialSkill = null,
  onClose,
  onPublished,
}: {
  skills: Skill[];
  initialSkill?: Skill | null;
  onClose: () => void;
  onPublished?: (pkg: SkillPackage) => void;
} = $props();

// Mount = open, so the initial prop values are the right starting state.
let scope = $state(untrack(() => initialSkill?.scope ?? ""));
let skillName = $state(untrack(() => initialSkill?.name ?? ""));
let tag = $state("");

let fileInput = $state<HTMLInputElement | null>(null);
let pickedFolder = $state("");
let archive = $state<TarballResult | null>(null);
let picking = $state(false);
let pickError = $state("");
let frontmatterName = $state<string | null>(null);
let publishing = $state(false);
let pickToken = 0;

// Tag = ResourceSegment minus the reserved "stable" (openapi.yaml).
const TAG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

const scopes = $derived(
  [...new Set(skills.map((skill) => skill.scope))].sort(),
);
const scopeOptions = $derived(
  scopes.map((name) => ({ label: name, value: name })),
);
const skillOptions = $derived(
  skills
    .filter((skill) => skill.scope === scope)
    .map((skill) => ({ label: skill.name, value: skill.name })),
);

const target = $derived(
  initialSkill ??
    skills.find((skill) => skill.scope === scope && skill.name === skillName) ??
    null,
);

const tagError = $derived.by(() => {
  const value = tag.trim();
  if (!value) return "";
  if (value === "stable") return `"stable" is reserved`;
  if (!TAG_PATTERN.test(value))
    return "start with a letter or digit, then letters, digits, . _ - (max 64 chars)";
  return "";
});

const nameMismatch = $derived(
  frontmatterName !== null &&
    target !== null &&
    frontmatterName !== target.name,
);

const canPublish = $derived(
  !!target &&
    !!archive &&
    !picking &&
    !nameMismatch &&
    !tagError &&
    !publishing,
);

const strippedPath = (file: File) =>
  (file.webkitRelativePath || file.name).split("/").slice(1).join("/");

const fileCount = (n: number) => `${n} file${n === 1 ? "" : "s"}`;

// Build the tarball eagerly on pick so the well can show file counts,
// skipped junk, and prevalidation errors before publish.
async function handleFiles(list: FileList | null) {
  if (!list?.length) return;
  const files = Array.from(list);
  const token = ++pickToken;
  archive = null;
  pickError = "";
  frontmatterName = null;
  pickedFolder = files[0].webkitRelativePath.split("/")[0] || "folder";
  picking = true;
  try {
    const result = await createSkillTarball(files);
    if (token !== pickToken) return;
    archive = result;
    const skillMd = files.find((file) => strippedPath(file) === "SKILL.md");
    if (skillMd) frontmatterName = await readSkillFrontmatterName(skillMd);
  } catch (cause) {
    if (token !== pickToken) return;
    pickError =
      cause instanceof Error ? cause.message : "Could not read that folder.";
  } finally {
    if (token === pickToken) picking = false;
  }
}

async function publish() {
  if (!canPublish || !target || !archive) return;
  publishing = true;
  try {
    const pkg = await publishSkillPackage({
      scope: target.scope,
      name: target.name,
      package: archive.blob,
      tag: tag.trim() || undefined,
    });
    toast.success(`Published ${target.name}@${pkg.version}`);
    onPublished?.(pkg);
    onClose();
  } catch (cause) {
    toast.error(cause instanceof Error ? cause.message : "Publish failed.");
  } finally {
    publishing = false;
  }
}
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onClose();
  }}
/>

<button
  type="button"
  class="fixed inset-0 z-30 bg-slate-950/30"
  aria-label="Close publish dialog"
  onclick={onClose}
></button>

<div
  role="dialog"
  aria-modal="true"
  aria-label="Publish skill version"
  class="fixed inset-0 z-40 m-auto size-fit max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border bg-card shadow-lg"
>
  <div class="flex items-center gap-3 border-b p-5">
    <span
      class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
    >
      <FolderUp size={15} />
    </span>
    <div class="min-w-0">
      <p class="truncate font-semibold">Publish version</p>
      <p class="truncate text-sm text-muted-foreground">
        Upload a local skill folder as an immutable package.
      </p>
    </div>
    <button
      type="button"
      class="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Close publish dialog"
      onclick={onClose}
    >
      <X size={16} />
    </button>
  </div>

  <div class="space-y-5 p-5">
    <div>
      <p class="text-label text-muted-foreground">Skill</p>
      {#if initialSkill}
        <div class="mt-3 rounded-lg bg-inset p-3">
          <code class="font-mono text-[11px]">
            {initialSkill.scope}/{initialSkill.name}
          </code>
        </div>
      {:else}
        <div class="mt-3 grid grid-cols-2 gap-3">
          <Select
            ariaLabel="Scope"
            value={scope}
            options={scopeOptions}
            placeholder="scope"
            onChange={(value) => {
              scope = value;
              skillName = "";
            }}
          />
          <Select
            ariaLabel="Skill"
            value={skillName}
            options={skillOptions}
            placeholder="skill"
            disabled={!scope}
            onChange={(value) => (skillName = value)}
          />
        </div>
      {/if}
    </div>

    <div>
      <p class="text-label text-muted-foreground">Package</p>
      <button
        type="button"
        class="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-foreground/20 p-5 text-left transition hover:bg-muted/40"
        onclick={() => fileInput?.click()}
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
        >
          <FolderUp size={15} />
        </span>
        {#if pickedFolder}
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">
              {pickedFolder}
            </span>
            <span
              class="mt-0.5 block font-mono text-[11px] text-muted-foreground"
            >
              {#if picking}
                reading…
              {:else if archive}
                {fileCount(archive.fileCount)}
                {#if archive.skipped.length}
                  · {archive.skipped.length} skipped
                {/if}
              {:else}
                pick another folder
              {/if}
            </span>
          </span>
        {:else}
          <span class="min-w-0">
            <span class="block text-sm font-medium">Choose a skill folder</span>
            <span
              class="mt-0.5 block font-mono text-[11px] text-muted-foreground"
            >
              must contain a root SKILL.md
            </span>
          </span>
        {/if}
      </button>
      {#if pickError}
        <p class="mt-2 font-mono text-[11px] text-destructive">{pickError}</p>
      {/if}
      {#if nameMismatch && target}
        <p class="mt-2 font-mono text-[11px] text-destructive">
          frontmatter name is "{frontmatterName}", want "{target.name}"
        </p>
      {/if}
    </div>

    <div>
      <p class="text-label text-muted-foreground">Tag</p>
      <Input
        class="mt-3 font-mono text-[11px]"
        placeholder="tag (optional, e.g. v1.2.0)"
        aria-invalid={!!tagError}
        bind:value={tag}
      />
      {#if tagError}
        <p class="mt-2 font-mono text-[11px] text-destructive">{tagError}</p>
      {/if}
    </div>
  </div>

  <div class="flex items-center justify-end gap-2 border-t p-5">
    <Button variant="outline" onclick={onClose}>Cancel</Button>
    <Button disabled={!canPublish} onclick={publish}>
      {#if publishing}
        <LoaderCircle class="animate-spin" />
        publishing…
      {:else}
        Publish
      {/if}
    </Button>
  </div>

  <input
    bind:this={fileInput}
    type="file"
    class="hidden"
    webkitdirectory
    onchange={(event) => {
      handleFiles(event.currentTarget.files);
      event.currentTarget.value = "";
    }}
  >
</div>
