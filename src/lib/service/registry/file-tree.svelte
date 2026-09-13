<script lang="ts" module>
// A file tree in the spirit of animation-svelte's magic FileTree
// (Lucide variant): recursive folders with open/closed lucide icons,
// slide-animated children, and a hairline indent guide — rebuilt with
// Svelte 5 runes and the dashboard's design tokens.
export type TreeNode =
  | { type: "file"; name: string; path: string }
  | { type: "folder"; name: string; path: string; children: TreeNode[] };

// buildTree folds flat tar paths ("scripts/run.sh") into a nested tree,
// sorting folders before files alphabetically at every level.
export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split("/");
    let level = root;
    let prefix = "";
    for (const [i, part] of parts.entries()) {
      prefix = prefix ? `${prefix}/${part}` : part;
      if (i === parts.length - 1) {
        level.push({ type: "file", name: part, path: prefix });
        continue;
      }
      let folder = level.find(
        (node): node is Extract<TreeNode, { type: "folder" }> =>
          node.type === "folder" && node.name === part,
      );
      if (!folder) {
        folder = { type: "folder", name: part, path: prefix, children: [] };
        level.push(folder);
      }
      level = folder.children;
    }
  }
  const sortLevel = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map((node) =>
        node.type === "folder"
          ? { ...node, children: sortLevel(node.children) }
          : node,
      )
      .sort((a, b) =>
        a.type !== b.type
          ? a.type === "folder"
            ? -1
            : 1
          : a.name.localeCompare(b.name),
      );
  return sortLevel(root);
}
</script>

<script lang="ts">
import { FileCode, Folder, FolderOpen } from "@lucide/svelte";
import { SvelteSet } from "svelte/reactivity";
import { slide } from "svelte/transition";

let {
  files,
  current = null,
  onPick,
}: {
  files: string[];
  current?: string | null;
  onPick: (path: string) => void;
} = $props();

const nodes = $derived(buildTree(files));

// Folders default to expanded; collapsed paths opt out individually.
const collapsed = new SvelteSet<string>();
const toggle = (path: string) => {
  if (collapsed.has(path)) collapsed.delete(path);
  else collapsed.add(path);
};

const rowClass = (active: boolean) =>
  `flex w-full min-w-0 items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-left font-mono text-[11px] transition ${
    active
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  }`;
</script>

{#snippet tree(list: TreeNode[], nested: boolean)}
  <ul
    class={nested
      ? "mt-0.5 ml-2.5 space-y-0.5 border-l border-foreground/10 pl-2"
      : "space-y-0.5 p-2"}
  >
    {#each list as node (node.path)}
      <li>
        {#if node.type === "folder"}
          {@const isOpen = !collapsed.has(node.path)}
          <button
            type="button"
            class={rowClass(false)}
            aria-expanded={isOpen}
            title={node.path}
            onclick={() => toggle(node.path)}
          >
            {#if isOpen}
              <FolderOpen size={13} class="shrink-0" />
            {:else}
              <Folder size={13} class="shrink-0" />
            {/if}
            <span class="min-w-0 truncate">{node.name}</span>
          </button>
          {#if isOpen}
            <div transition:slide={{ duration: 200 }}>
              {@render tree(node.children, true)}
            </div>
          {/if}
        {:else}
          <button
            type="button"
            class={rowClass(current === node.path)}
            title={node.path}
            onclick={() => onPick(node.path)}
          >
            <FileCode size={13} class="shrink-0" />
            <span class="min-w-0 truncate">{node.name}</span>
          </button>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

{@render tree(nodes, false)}
