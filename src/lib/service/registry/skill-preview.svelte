<script lang="ts">
import { FileCode, LoaderCircle, X } from "@lucide/svelte";
import { createQuery } from "@tanstack/svelte-query";
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { SkillPackage } from "./api";
import FileTree from "./file-tree.svelte";
import { extractSkillTarball, readEntryText } from "./tar";

// Open registry content in a new tab, never in the dashboard frame.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const isMarkdown = (path: string) => /\.(md|markdown)$/i.test(path);

// Frontmatter is metadata, not content — the dialog header already shows it.
const stripFrontmatter = (text: string) =>
  text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

const renderMarkdown = (text: string) =>
  DOMPurify.sanitize(marked.parse(stripFrontmatter(text), { async: false }));

let {
  scope,
  name,
  pkg,
  onClose,
}: {
  scope: string;
  name: string;
  pkg: SkillPackage;
  onClose: () => void;
} = $props();

// Versioned packages are immutable, so an extracted listing never goes stale.
const filesQuery = createQuery(() => ({
  queryKey: ["registry", "skill-package-files", scope, name, pkg.version],
  staleTime: Number.POSITIVE_INFINITY,
  queryFn: async () => {
    const res = await fetch(
      `/api/registry/scopes/${encodeURIComponent(scope)}/skills/${encodeURIComponent(name)}/versions/${encodeURIComponent(pkg.version)}/package`,
    );
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    return extractSkillTarball(await res.blob());
  },
}));

const files = $derived(filesQuery.data ?? []);
let picked = $state<string | null>(null);

// Default to SKILL.md (the registry requires it), else the first entry.
const current = $derived(
  files.find((file) => file.path === picked) ??
    files.find((file) => file.path === "SKILL.md") ??
    files[0] ??
    null,
);
const currentText = $derived(current ? readEntryText(current) : null);
const currentHtml = $derived(
  current && currentText && isMarkdown(current.path)
    ? renderMarkdown(currentText.text)
    : null,
);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

const errorMessage = $derived(
  filesQuery.error instanceof Error
    ? filesQuery.error.message
    : "Unable to load the package.",
);
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onClose();
  }}
/>

<button
  type="button"
  class="fixed inset-0 z-30 bg-slate-950/30"
  aria-label="Close preview"
  onclick={onClose}
></button>

<div
  role="dialog"
  aria-modal="true"
  aria-label="Preview skill package"
  class="fixed inset-0 z-40 m-auto flex h-[min(44rem,calc(100vh-2rem))] w-[min(64rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-lg"
>
  <div class="flex items-center gap-3 border-b p-5">
    <span
      class="grid size-9 shrink-0 place-items-center rounded-md border border-dashed border-foreground/20 text-muted-foreground"
    >
      <FileCode size={15} />
    </span>
    <div class="min-w-0">
      <p class="truncate font-semibold">{name}</p>
      <p class="truncate font-mono text-[11px] text-muted-foreground">
        {scope}
        ·
        {pkg.version}
        {#if pkg.tag}
          · {pkg.tag}
        {/if}
        ·
        {formatSize(
          pkg.size,
        )}
      </p>
    </div>
    <button
      type="button"
      class="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Close preview"
      onclick={onClose}
    >
      <X size={16} />
    </button>
  </div>

  {#if filesQuery.isPending}
    <div class="grid flex-1 place-items-center">
      <LoaderCircle size={18} class="animate-spin text-muted-foreground" />
    </div>
  {:else if filesQuery.isError}
    <div class="grid flex-1 place-items-center p-5">
      <div class="text-center">
        <p class="font-mono text-[11px] text-destructive">{errorMessage}</p>
        <button
          type="button"
          class="mt-4 rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
          onclick={() => filesQuery.refetch()}
        >
          retry
        </button>
      </div>
    </div>
  {:else}
    <div class="flex min-h-0 flex-1">
      <aside class="scrollbar-overlay w-60 shrink-0 overflow-y-auto border-r">
        <p class="text-label px-3 pt-3 text-muted-foreground">
          Files · {files.length}
        </p>
        <FileTree
          files={files.map((file) => file.path)}
          current={current?.path ?? null}
          onPick={(path) => (picked = path)}
        />
      </aside>
      <div class="scrollbar-overlay min-w-0 flex-1 overflow-y-auto bg-inset">
        {#if current}
          <div
            class="sticky top-0 flex items-center gap-2 border-b bg-inset px-5 py-2.5"
          >
            <code class="min-w-0 flex-1 truncate font-mono text-[11px]">
              {current.path}
            </code>
            <span class="shrink-0 font-mono text-[11px] text-muted-foreground">
              {formatSize(current.size)}
            </span>
          </div>
          {#if currentText}
            {#if currentHtml !== null}
              <div class="markdown p-5">{@html currentHtml}</div>
            {:else}
              <pre
                class="p-5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words"
              >{currentText.text}</pre>
            {/if}
            {#if currentText.truncated}
              <p class="px-5 pb-5 font-mono text-[11px] text-muted-foreground">
                … truncated at 256 KB — download the package for the full file
              </p>
            {/if}
          {:else}
            <p class="p-5 font-mono text-[11px] text-muted-foreground">
              binary file — download the package to inspect it
            </p>
          {/if}
        {:else}
          <p class="p-5 font-mono text-[11px] text-muted-foreground">
            no files in this package
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
/* Rendered markdown in the design's voice: hairlines, inset wells, mono code */
.markdown {
  font-size: 0.8125rem;
  line-height: 1.7;
  color: var(--color-foreground);
}
.markdown > :global(:first-child) {
  margin-top: 0;
}
.markdown > :global(:last-child) {
  margin-bottom: 0;
}
.markdown :global(h1),
.markdown :global(h2),
.markdown :global(h3),
.markdown :global(h4) {
  margin: 1.4em 0 0.6em;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.markdown :global(h1) {
  font-size: 1.3em;
}
.markdown :global(h2) {
  font-size: 1.15em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--color-border);
}
.markdown :global(h3) {
  font-size: 1.05em;
}
.markdown :global(h4) {
  font-size: 1em;
}
.markdown :global(p) {
  margin: 0.7em 0;
}
.markdown :global(a) {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: color-mix(in oklch, currentColor 45%, transparent);
  text-underline-offset: 3px;
}
.markdown :global(a:hover) {
  text-decoration-color: currentColor;
}
.markdown :global(ul),
.markdown :global(ol) {
  margin: 0.7em 0;
  padding-left: 1.4em;
}
.markdown :global(ul) {
  list-style: disc;
}
.markdown :global(ol) {
  list-style: decimal;
}
.markdown :global(li) {
  margin: 0.25em 0;
}
.markdown :global(li > ul),
.markdown :global(li > ol) {
  margin: 0.25em 0;
}
.markdown :global(code) {
  font-family: var(--font-mono);
  font-size: 0.82em;
  background: var(--color-inset);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.1em 0.35em;
}
.markdown :global(pre) {
  margin: 0.9em 0;
  background: var(--color-inset);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75em 1em;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklch, var(--foreground) 25%, transparent)
    transparent;
}
.markdown :global(pre::-webkit-scrollbar) {
  height: 8px;
  background: transparent;
}
.markdown :global(pre::-webkit-scrollbar-thumb) {
  background: color-mix(in oklch, var(--foreground) 25%, transparent);
  border-radius: 999px;
}
.markdown :global(pre code) {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.78rem;
  line-height: 1.6;
}
.markdown :global(blockquote) {
  margin: 0.9em 0;
  border-left: 2px solid var(--color-border);
  padding-left: 1em;
  color: var(--color-muted-foreground);
}
.markdown :global(hr) {
  margin: 1.4em 0;
  border: none;
  border-top: 1px solid var(--color-border);
}
.markdown :global(table) {
  margin: 0.9em 0;
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.markdown :global(th),
.markdown :global(td) {
  border: 1px solid var(--color-border);
  padding: 0.35em 0.7em;
  text-align: left;
}
.markdown :global(th) {
  font-weight: 600;
  background: var(--color-inset);
}
.markdown :global(img) {
  max-width: 100%;
  border-radius: 8px;
}
</style>
